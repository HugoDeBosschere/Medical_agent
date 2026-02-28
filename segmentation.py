from dcm_seg_nodules import extract_seg
import pydicom, numpy as np, matplotlib.pyplot as plt
import SimpleITK as sitk
import os

def list_nodules(patiend_id: str,study_folder_name: str,ct_folder_name: str, output_dir: str):

    ct_path = f"./data/{patiend_id} {patiend_id}/{study_folder_name}/{ct_folder_name}"
    seg_path = extract_seg(ct_path, output_dir=output_dir)
    txt_lesions = "Number of nodules and their diameters: "+ seg_path[1][206:]
    ls_dcm = os.listdir(ct_path)
    nb_dcm = len(ls_dcm)
    ds = pydicom.dcmread(ct_path + "/" + ls_dcm[0])
    x_spacing = getattr(ds,'PixelSpacing','N/A')[0]
    y_spacing = getattr(ds,'PixelSpacing','N/A')[1]
    z_spacing = getattr(ds,'SliceThickness','N/A')
    seg_path = f"{output_dir}/{ct_folder_name}/output-seg.dcm"
    seg = sitk.ReadImage(seg_path)
    segment_array = sitk.GetArrayFromImage(seg)

    nb_nodules = int(segment_array.shape[0]/nb_dcm)
    txt_lesions += "\n\nVolume of each nodule: \n"
    for i in range(nb_nodules):
        nodule_array = segment_array[i*nb_dcm:(i+1)*nb_dcm]
        nb_voxels = np.count_nonzero(nodule_array == 255)
        volume = nb_voxels * x_spacing * y_spacing * z_spacing
        txt_lesions += f"- Finding{i+1}: Volume {volume:.2f} mm³\n"
        

    return txt_lesions
if __name__ == "__main__":
    patient_id = "17A76C2A"
    study_folder_name = "26721665 TC TRAX"
    ct_folder_name = "CT 1.25mm Pulmn"
    output_dir = "results"
    txt = list_nodules(patient_id, study_folder_name, ct_folder_name, output_dir)
    print(txt)
