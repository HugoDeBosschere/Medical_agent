import os
from segmentation import list_nodules

def find_ct_folders(patient_id: str, data_dir: str = "./data"):
    """
    Find all CT folders for lungs or thorax for a given patient ID.
    
    Parameters:
    -----------
    patient_id : str
        The patient ID to search for
    data_dir : str
        The root data directory (default: "./data")
    
    Returns:
    --------
    list of tuples: [(study_folder_name, ct_folder_name), ...]
    """
    KEYWORDS = ["pulmn", "torax"] #
    
    def matches_keywords(name: str) -> bool:
        lower = name.lower()
        return any(kw in lower for kw in KEYWORDS)
    
    patient_path = os.path.join(data_dir, f"{patient_id} {patient_id}")
    
    if not os.path.exists(patient_path):
        raise ValueError(f"Patient folder not found: {patient_path}")
    
    ct_folders = []
    
    # Scan all study folders (level 2)
    for study_folder in os.scandir(patient_path):
        if not study_folder.is_dir():
            continue
        
        study_folder_name = study_folder.name
        
        # Scan all CT folders (level 3)
        for ct_folder in os.scandir(study_folder.path):
            if not ct_folder.is_dir():
                continue
            
            ct_folder_name = ct_folder.name
            
            # Check if folder name matches keywords
            if matches_keywords(ct_folder_name):
                ct_folders.append((study_folder_name, ct_folder_name))
    
    return ct_folders


def process_patient(patient_id: str, output_dir: str = "results", data_dir: str = "./data"):
    """
    Process all lung/thorax CT folders for a given patient and concatenate results.
    
    Parameters:
    -----------
    patient_id : str
        The patient ID to process
    output_dir : str
        Directory to save segmentation outputs (default: "results")
    data_dir : str
        The root data directory (default: "./data")
    
    Returns:
    --------
    str: Concatenated text results from all CT folder analyses
    """
    # Find all matching CT folders
    ct_folders = find_ct_folders(patient_id, data_dir)
    
    if not ct_folders:
        return f"No lung/thorax CT folders found for patient {patient_id}"
    
    # Process each CT folder and collect results
    all_results = []
    all_results.append(f"=== Patient ID: {patient_id} ===\n")
    all_results.append(f"Found {len(ct_folders)} CT folder(s) to process:\n")
    
    for idx, (study_folder_name, ct_folder_name) in enumerate(ct_folders, 1):
        all_results.append(f"\n{'='*60}")
        all_results.append(f"\nCT Folder {idx}/{len(ct_folders)}: {ct_folder_name}")
        all_results.append(f"Study: {study_folder_name}\n")
        all_results.append(f"{'-'*60}\n")
        
        try:
            result = list_nodules(patient_id, study_folder_name, ct_folder_name, output_dir)
            all_results.append(result)
        except Exception as e:
            error_msg = f"Error processing {ct_folder_name}: {str(e)}\n"
            all_results.append(error_msg)
            print(f"Warning: {error_msg}")
    
    all_results.append(f"\n{'='*60}\n")
    all_results.append("=== End of Report ===\n")
    
    return "\n".join(all_results)


if __name__ == "__main__":
    # Example usage
    patient_id = "063F6BB9" #063F6BB9 17A76C2A 0301B7D6 
    output_dir = "results"
    
    result = process_patient(patient_id, output_dir)
    print(result)
