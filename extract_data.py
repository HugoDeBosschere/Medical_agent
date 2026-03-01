"""Extract all study ZIPs from data/orthanc/ into data/, merging by patient folder."""

import zipfile
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
ORTHANC_DIR = PROJECT_ROOT / "data" / "orthanc"
DATA_DIR = PROJECT_ROOT / "data"


def extract_all():
    """Extract all study ZIPs into data/, grouping studies under patient folders."""
    zip_files = sorted(ORTHANC_DIR.glob("*.zip"))
    print(f"Found {len(zip_files)} ZIP file(s) in {ORTHANC_DIR}")

    extracted = 0
    skipped = 0

    for zip_path in zip_files:
        print(f"\nProcessing: {zip_path.name}")
        try:
            with zipfile.ZipFile(zip_path, "r") as zf:
                bad_file = zf.testzip()
                if bad_file is not None:
                    print(f"  WARNING: Corrupt entry '{bad_file}', skipping.")
                    skipped += 1
                    continue

                zf.extractall(DATA_DIR)
                print(f"  OK: extracted {len(zf.namelist())} entries")
                extracted += 1

        except zipfile.BadZipFile:
            print(f"  ERROR: {zip_path.name} is not a valid ZIP. Skipping.")
            skipped += 1
        except Exception as e:
            print(f"  ERROR: {zip_path.name}: {e}. Skipping.")
            skipped += 1

    # Summary
    print(f"\n{'='*60}")
    print(f"Extraction complete: {extracted} extracted, {skipped} skipped")

    patient_dirs = [
        d for d in DATA_DIR.iterdir()
        if d.is_dir() and d.name not in ("orthanc", "pseudo_reports")
    ]
    print(f"{len(patient_dirs)} patient folder(s):")
    for d in sorted(patient_dirs):
        study_count = sum(1 for s in d.iterdir() if s.is_dir())
        print(f"  {d.name}: {study_count} study folder(s)")


if __name__ == "__main__":
    extract_all()
