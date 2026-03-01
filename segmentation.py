from dcm_seg_nodules import extract_seg
from dcm_seg_nodules.registry import lookup, lookup_info
import pydicom
import numpy as np
import SimpleITK as sitk
import os
import math
import re
from scipy import ndimage


def _parse_model_diameters(info_text: str) -> list[tuple[str, float]]:
    """Parse 'Finding<N>: diameter <X>mm' lines from info_text."""
    if not info_text:
        return []
    pattern = re.compile(r"(Finding\s*\d+):\s*diameter\s+([\d.]+)\s*mm", re.IGNORECASE)
    return [(m.group(1), float(m.group(2))) for m in pattern.finditer(info_text)]


def _parse_info_metadata(info_text: str) -> dict:
    """Parse key metadata fields from the registry info text."""
    meta = {}
    if not info_text:
        return meta
    for line in info_text.split("\n"):
        if ":" in line:
            key, _, val = line.partition(":")
            meta[key.strip()] = val.strip()
    return meta


def _read_ct_metadata(ct_path: str) -> tuple[str, float | None, float | None, float | None]:
    """
    Read basic metadata from the first DICOM file in a CT folder.
    Returns (study_date, x_spacing, y_spacing, z_spacing).
    """
    ls_dcm = [f for f in os.listdir(ct_path) if f.lower().endswith(".dcm")]
    if not ls_dcm:
        return "N/A", None, None, None

    ds = pydicom.dcmread(os.path.join(ct_path, ls_dcm[0]), stop_before_pixels=True)

    pixel_spacing = getattr(ds, "PixelSpacing", None)
    slice_thickness = getattr(ds, "SliceThickness", None)
    study_date = getattr(ds, "StudyDate", "N/A")

    # Format date as YYYY-MM-DD
    if study_date and study_date != "N/A" and len(study_date) == 8:
        study_date = f"{study_date[:4]}-{study_date[4:6]}-{study_date[6:8]}"

    x_sp = float(pixel_spacing[0]) if pixel_spacing else None
    y_sp = float(pixel_spacing[1]) if pixel_spacing else None
    z_sp = float(slice_thickness) if slice_thickness else None

    return study_date, x_sp, y_sp, z_sp


def _compute_volumes_from_seg(seg_file_path: str, x_spacing: float, y_spacing: float,
                               z_spacing: float) -> tuple[str, list[tuple[float, float, float]]]:
    """
    Read a SEG DICOM file, compute volumes via connected-component analysis.
    Returns (text_output, list_of_(volume, d_eq, max_extent)).
    """
    seg = sitk.ReadImage(str(seg_file_path))
    segment_array = sitk.GetArrayFromImage(seg)
    os.remove(str(seg_file_path))

    binary_mask = (segment_array > 0).astype(np.uint8)
    structure = np.ones((3, 3, 3), dtype=np.int32)
    labeled_array, nb_nodules = ndimage.label(binary_mask, structure=structure)

    voxel_volume = x_spacing * y_spacing * z_spacing
    slices_list = ndimage.find_objects(labeled_array)

    txt = "\nMeasurements per nodule (from segmentation mask):\n"
    finding_number = 0
    measurements = []

    for i in range(1, nb_nodules + 1):
        voxel_count = int(np.sum(labeled_array == i))
        volume = voxel_count * voxel_volume
        if volume <= 0:
            continue

        finding_number += 1

        # Equivalent spherical diameter: d = (6V / pi)^(1/3)
        d_eq = (6.0 * volume / math.pi) ** (1.0 / 3.0)

        # Max bounding-box extent in mm
        obj_slices = slices_list[i - 1]
        extent_z = (obj_slices[0].stop - obj_slices[0].start) * z_spacing
        extent_y = (obj_slices[1].stop - obj_slices[1].start) * y_spacing
        extent_x = (obj_slices[2].stop - obj_slices[2].start) * x_spacing
        max_extent = max(extent_z, extent_y, extent_x)

        measurements.append((volume, d_eq, max_extent))

        txt += (
            f"- Finding{finding_number}: "
            f"Volume {volume:.2f} mm3, "
            f"Eq. spherical diameter {d_eq:.1f}mm, "
            f"Max extent {max_extent:.1f}mm\n"
        )

    return txt, measurements


def _cross_validate(info_text: str, finding_count: int,
                    measurements: list[tuple[float, float, float]]) -> str:
    """Cross-validate model-reported diameters vs mask-derived measurements."""
    model_diameters = _parse_model_diameters(info_text)
    if not model_diameters or not measurements:
        return ""

    txt = "\nCross-validation (model-reported vs. mask-derived):\n"

    if len(model_diameters) != finding_count:
        txt += (
            f"  WARNING: Model reports {len(model_diameters)} nodule(s) "
            f"but mask contains {finding_count} connected component(s).\n"
        )

    n_compare = min(len(model_diameters), finding_count)
    for j in range(n_compare):
        label, model_d = model_diameters[j]
        vol_j, d_eq_j, extent_j = measurements[j]

        if d_eq_j > 0:
            pct_diff = abs(model_d - d_eq_j) / d_eq_j * 100.0
        else:
            pct_diff = float('inf')

        if pct_diff > 20.0:
            txt += (
                f"  WARNING {label}: Model diameter {model_d:.1f}mm vs. "
                f"mask eq. diameter {d_eq_j:.1f}mm "
                f"(difference {pct_diff:.0f}%). "
                f"Volumes and diameters may be inconsistent.\n"
            )
        else:
            txt += (
                f"  OK {label}: Model diameter {model_d:.1f}mm ~ "
                f"mask eq. diameter {d_eq_j:.1f}mm "
                f"(difference {pct_diff:.0f}%)\n"
            )

    return txt


def list_nodules(patient_id: str, study_folder_name: str, ct_folder_name: str,
                 output_dir: str, data_dir: str = "./data",
                 registry_uid: str | None = None):
    """
    Run segmentation on a CT series and return a text summary of nodule volumes.

    Parameters
    ----------
    patient_id : str
        Patient identifier (e.g. "063F6BB9").
    study_folder_name : str
        Study-level folder name (e.g. "12995507 TC TRAX TC ABDOMEN").
    ct_folder_name : str
        Series-level folder name (e.g. "CT CEV torax").
    output_dir : str
        Directory for segmentation artefacts and result text files.
    data_dir : str
        Root data directory containing patient folders.
    registry_uid : str | None
        If provided, the SeriesInstanceUID to use for registry lookup.
        This allows using a sibling series' SEG when the current folder's
        UID is not registered. If None, falls back to direct extract_seg().

    Returns
    -------
    str
        Text summary with study date, nodule diameters and volumes.
    """
    ct_path = os.path.join(data_dir, f"{patient_id} {patient_id}",
                           study_folder_name, ct_folder_name)

    # --- Read metadata from CT folder ---
    study_date, x_sp, y_sp, z_sp = _read_ct_metadata(ct_path)

    txt_lesions = f"\nStudy date: {study_date}\n"

    # --- Try to get SEG + info via three strategies ---
    seg_file_path = None
    info_text = None
    seg_source = None  # track where we got the data from

    # Strategy 1: Direct extract_seg() on this folder
    try:
        result = extract_seg(ct_path, output_dir=output_dir)
        seg_file_path = result[0]
        info_text = result[1]
        seg_source = "direct"
    except FileNotFoundError:
        pass

    # Strategy 2: Use the registry_uid provided by process_patient (sibling match)
    if seg_file_path is None and registry_uid:
        seg_path = lookup(registry_uid)
        info_text = lookup_info(registry_uid)
        if seg_path and seg_path.exists():
            # Copy SEG to output dir so we can work with it
            import shutil
            dest_dir = os.path.join(output_dir, ct_folder_name)
            os.makedirs(dest_dir, exist_ok=True)
            dest_file = os.path.join(dest_dir, "output-seg.dcm")
            shutil.copy2(str(seg_path), dest_file)
            seg_file_path = dest_file
            seg_source = f"sibling registry match ({registry_uid[:30]}...)"
        elif info_text:
            seg_source = "registry info only (no SEG file on disk)"

    # --- Parse model-reported nodule summary from info text ---
    nodule_summary = ""
    if info_text:
        if "Summary:" in info_text:
            nodule_summary = info_text.split("Summary:", 1)[1].strip()
        else:
            parts = info_text.split("\n\n", 1)
            nodule_summary = parts[1].strip() if len(parts) > 1 else info_text

    if seg_source:
        txt_lesions += f"Data source: {seg_source}\n"
    txt_lesions += f"Model-reported diameters:\n{nodule_summary}\n"

    # --- Compute volumes from SEG mask if available ---
    if seg_file_path and x_sp and y_sp and z_sp:
        try:
            vol_txt, measurements = _compute_volumes_from_seg(
                seg_file_path, x_sp, y_sp, z_sp
            )
            txt_lesions += vol_txt

            # Cross-validate model diameters vs mask
            xval_txt = _cross_validate(info_text, len(measurements), measurements)
            txt_lesions += xval_txt
        except Exception as e:
            txt_lesions += f"\nWARNING: Could not compute volumes from SEG: {e}\n"
            # Still have model diameters above — those are preserved

    elif seg_file_path and (x_sp is None or y_sp is None or z_sp is None):
        txt_lesions += (
            "\nWARNING: Missing spacing metadata (PixelSpacing or SliceThickness). "
            "Cannot compute volumes from segmentation mask.\n"
        )
        # Clean up the copied SEG file
        try:
            os.remove(str(seg_file_path))
        except OSError:
            pass

    elif not seg_file_path and info_text:
        txt_lesions += (
            "\nNote: No segmentation mask available for this series. "
            "Showing model-reported diameters only.\n"
        )

    elif not seg_file_path and not info_text:
        txt_lesions += (
            "\nWARNING: No segmentation data and no registry info found for this study. "
            "No nodule measurements available.\n"
        )

    # --- Write results to file ---
    safe_study = study_folder_name.replace("/", "_").replace("\\", "_")
    output_file = os.path.join(output_dir, f"{patient_id}_{safe_study}_nodules.txt")
    os.makedirs(output_dir, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(txt_lesions)

    return txt_lesions


if __name__ == "__main__":
    patient_id = "063F6BB9"
    study_folder_name = "12995507 TC TRAX TC ABDOMEN"
    ct_folder_name = "CT CEV torax"
    output_dir = "results"
    txt = list_nodules(patient_id, study_folder_name, ct_folder_name, output_dir)
    print(txt)
