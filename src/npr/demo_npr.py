"""
Demo script — runs the npr pipeline on a single patient from the real xlsx.

Usage (from the Medical_agent directory):
    uv run python src/npr/demo_npr.py
"""

import sys
from pathlib import Path

# Ensure the npr package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent))

from npr import load_xlsx, filter_by_pid, process_dataframe, save_xlsx, REPORT_COLUMN
from mistral_call import MISTRAL_DEFAULT_MODEL
from ollama_call import MODEL as OLLAMA_DEFAULT_MODEL

XLSX_PATH = Path(__file__).resolve().parents[3] / "Liste examen UNBOXED finaliseģe v2 (avec mesures).xlsx"
DEMO_PID = "0301B7D6"  # first patient in the spreadsheet
OUTPUT_PATH = Path(__file__).resolve().parent / "demo_clean.xlsx"


def main():
    print(f"[demo] Loading {XLSX_PATH.name} ...")
    df = load_xlsx(str(XLSX_PATH))
    print(f"[demo] Loaded {len(df)} rows, columns: {list(df.columns)}\n")

    # Filter to a single patient so the demo stays fast
    df_pid = filter_by_pid(df, DEMO_PID)
    print(f"[demo] {len(df_pid)} row(s) for PatientID={DEMO_PID}\n")

    if df_pid.empty:
        print("[demo] No rows matched — check the PID. Exiting.")
        sys.exit(1)

    # Show the original reports before processing
    print("=" * 60)
    print("BEFORE (original report text)")
    print("=" * 60)
    for i, (_, row) in enumerate(df_pid.iterrows()):
        preview = str(row[REPORT_COLUMN])[:300]
        print(f"\n--- row {i} (Accession {row['AccessionNumber']}) ---")
        print(preview, "..." if len(str(row[REPORT_COLUMN])) > 300 else "")

    # Run the LLM pipeline
    print("\n" + "=" * 60)
    print("PROCESSING ...")
    print("=" * 60)
    df_clean = process_dataframe(df_pid, MISTRAL_DEFAULT_MODEL, OLLAMA_DEFAULT_MODEL)

    # Show the cleaned reports
    print("\n" + "=" * 60)
    print("AFTER (pulmonary-only text)")
    print("=" * 60)
    for i, (_, row) in enumerate(df_clean.iterrows()):
        preview = str(row[REPORT_COLUMN])[:300]
        print(f"\n--- row {i} (Accession {row['AccessionNumber']}) ---")
        print(preview, "..." if len(str(row[REPORT_COLUMN])) > 300 else "")

    # Save the result
    save_xlsx(df_clean, str(OUTPUT_PATH))
    print(f"\n[demo] Done. Check {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
