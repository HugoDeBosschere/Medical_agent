import os
import pydicom
from segmentation import list_nodules
from dcm_seg_nodules.registry import lookup, lookup_info, list_entries


def _get_series_uid(ct_path: str) -> str | None:
    """Read SeriesInstanceUID from the first DICOM file in a CT folder."""
    try:
        dcm_files = [f for f in os.listdir(ct_path) if f.lower().endswith(".dcm")]
        if dcm_files:
            ds = pydicom.dcmread(os.path.join(ct_path, dcm_files[0]),
                                 stop_before_pixels=True)
            return getattr(ds, "SeriesInstanceUID", None)
    except Exception:
        pass
    return None


def _get_study_date(data_dir: str, patient_id: str,
                    study_folder_name: str, ct_folder_name: str) -> str:
    """Read StudyDate from the first DICOM in a CT folder (for sorting)."""
    ct_path = os.path.join(data_dir, f"{patient_id} {patient_id}",
                           study_folder_name, ct_folder_name)
    try:
        dcm_files = [f for f in os.listdir(ct_path) if f.lower().endswith(".dcm")]
        if dcm_files:
            ds = pydicom.dcmread(os.path.join(ct_path, dcm_files[0]),
                                 stop_before_pixels=True)
            return getattr(ds, "StudyDate", "99999999")
    except Exception:
        pass
    return "99999999"


def _find_registered_uid_in_study(study_path: str) -> tuple[str | None, str | None]:
    """
    Scan ALL subdirectories of a study folder and return the first
    (folder_name, series_uid) pair whose UID is in the registry.
    Returns (None, None) if no registered series is found.
    """
    registered_uids = set(list_entries().keys())
    for entry in os.scandir(study_path):
        if not entry.is_dir():
            continue
        uid = _get_series_uid(entry.path)
        if uid and str(uid) in registered_uids:
            return entry.name, str(uid)
    return None, None


def find_ct_folders(patient_id: str, data_dir: str = "./data"):
    """
    Find all CT folders for lungs or thorax for a given patient ID.
    
    For each study, we pick the BEST folder:
      1. If one of the keyword-matching folders has a registered SEG → use it.
      2. Otherwise, scan all folders in the study for a registered sibling → 
         use the keyword-matching folder but pass the sibling's registry UID.
      3. If nothing is registered → keep the first keyword match anyway
         (will produce metadata-only output).

    Results are sorted chronologically by StudyDate.

    Returns
    -------
    list of tuples: [(study_folder_name, ct_folder_name, registry_uid_or_None), ...]
        registry_uid is the SeriesInstanceUID to use for SEG/info lookup.
        It may differ from the folder's own UID (sibling match).
    """
    KEYWORDS = ["pulmn", "torax", "lung"]

    def matches_keywords(name: str) -> bool:
        lower = name.lower()
        return any(kw in lower for kw in KEYWORDS)

    patient_path = os.path.join(data_dir, f"{patient_id} {patient_id}")

    if not os.path.exists(patient_path):
        raise ValueError(f"Patient folder not found: {patient_path}")

    # Group keyword-matching CT folders by study
    # study_folder_name -> [(ct_folder_name, series_uid), ...]
    studies: dict[str, list[tuple[str, str | None]]] = {}

    for study_folder in os.scandir(patient_path):
        if not study_folder.is_dir():
            continue

        study_folder_name = study_folder.name
        matched = []

        for ct_folder in os.scandir(study_folder.path):
            if not ct_folder.is_dir():
                continue
            if matches_keywords(ct_folder.name):
                uid = _get_series_uid(ct_folder.path)
                matched.append((ct_folder.name, str(uid) if uid else None))

        if matched:
            studies[study_folder_name] = matched

    # Now select the best folder per study
    registered_uids = set(list_entries().keys())
    ct_folders = []

    for study_folder_name, candidates in studies.items():
        study_path = os.path.join(patient_path, study_folder_name)
        
        # Strategy 1: check if any keyword-matching folder is itself registered
        best = None
        for ct_name, uid in candidates:
            if uid and uid in registered_uids:
                best = (study_folder_name, ct_name, uid)
                break

        if best is None:
            # Strategy 2: find a registered sibling (any folder in the study)
            sibling_name, sibling_uid = _find_registered_uid_in_study(study_path)

            # Use the first keyword-matching folder but with sibling registry UID
            ct_name = candidates[0][0]
            best = (study_folder_name, ct_name, sibling_uid)  # sibling_uid may be None

        ct_folders.append(best)

    # Sort chronologically by DICOM StudyDate
    ct_folders.sort(
        key=lambda t: _get_study_date(data_dir, patient_id, t[0], t[1])
    )

    return ct_folders


def process_patient(patient_id: str, output_dir: str = "results", data_dir: str = "./data"):
    """
    Process all lung/thorax CT folders for a given patient and concatenate results.
    
    Parameters
    ----------
    patient_id : str
        The patient ID to process
    output_dir : str
        Directory to save segmentation outputs (default: "results")
    data_dir : str
        The root data directory (default: "./data")
    
    Returns
    -------
    str: Concatenated text results from all CT folder analyses
    """
    ct_folders = find_ct_folders(patient_id, data_dir)
    
    if not ct_folders:
        return f"No lung/thorax CT folders found for patient {patient_id}"
    
    all_results = []
    all_results.append(f"=== Patient ID: {patient_id} ===\n")
    all_results.append(f"Found {len(ct_folders)} CT study/studies to process:\n")
    
    for idx, (study_folder_name, ct_folder_name, registry_uid) in enumerate(ct_folders, 1):
        all_results.append(f"\n{'='*60}")
        all_results.append(f"\nCT Folder {idx}/{len(ct_folders)}: {ct_folder_name}")
        all_results.append(f"Study: {study_folder_name}")
        if registry_uid:
            all_results.append(f"Registry match: {registry_uid[:40]}...")
        else:
            all_results.append(f"Registry match: NONE (metadata only)")
        all_results.append(f"\n{'-'*60}\n")
        
        try:
            result = list_nodules(patient_id, study_folder_name, ct_folder_name,
                                  output_dir, data_dir=data_dir,
                                  registry_uid=registry_uid)
            all_results.append(result)
        except Exception as e:
            error_msg = f"Error processing {ct_folder_name}: {str(e)}\n"
            all_results.append(error_msg)
            print(f"Warning: {error_msg}")
    
    all_results.append(f"\n{'='*60}\n")
    all_results.append("=== End of Report ===\n")
    
    return "\n".join(all_results)


if __name__ == "__main__":
    patient_id = "0301B7D6"  # 063F6BB9 17A76C2A 0301B7D6
    output_dir = "results"
    
    result = process_patient(patient_id, output_dir)
    print(result)
