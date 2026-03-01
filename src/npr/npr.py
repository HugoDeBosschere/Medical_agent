import sys
from pathlib import Path
import argparse

import pandas as pd

PATH_FILE = Path(__file__).resolve()
PARENT_FOLDER = PATH_FILE.parent

sys.path.append(str(PARENT_FOLDER))

from mistral_call import call_mistral_generate, MISTRAL_DEFAULT_MODEL
from ollama_call import call_ollama_generate, ensure_ollama_ready, MODEL as OLLAMA_DEFAULT_MODEL

# PROMPT = """You are a strict medical text extractor. You will receive a single clinical text entry corresponding to one spreadsheet cell. Your task is to extract and return only the parts that explicitly describe pulmonary or thoracic findings. Keep only text segments that directly refer to the lungs, pulmonary parenchyma, pulmonary nodules, masses, lesions, pleura, bronchi, airways, thoracic CT findings involving lung structures, or lesion measurements (for example, size in mm) when clearly describing a lung lesion. Remove all other content, including findings related to other organs (brain, liver, kidney, heart, abdomen, spine, etc.), general non-specific statements, and any contextual or administrative information.
# Do not summarize, rephrase, or interpret the text. Preserve the exact original wording and all numerical values. If the entry contains mixed information, return only the pulmonary-related segments exactly as written and delete the rest. If there is no explicit pulmonary information, return an empty string. Return only the extracted pulmonary text, with no additional commentary."""

# PROMPT = """You are a strict medical text extractor. You will receive a single clinical text entry corresponding to one spreadsheet cell. Your task is to extract and return only the parts that explicitly describe pulmonary or thoracic findings.
# Keep only text segments that directly refer to the lungs, pulmonary parenchyma, pulmonary nodules, masses, lesions, pleura, bronchi, airways, mediastinum, mediastinal lymph nodes, or thoracic CT findings involving these structures. Keep lesion measurements (for example, size in mm) only when they clearly describe a thoracic or pulmonary finding.
# Remove all other content, including findings related to non-thoracic organs (brain, liver, kidney, heart, abdomen, adrenal glands, spine, musculoskeletal structures, etc.), general non-specific statements, and any contextual or administrative information.
# Do not summarize, rephrase, or interpret the text. Preserve the exact original wording and all numerical values. If the entry contains mixed information, return only the thoracic/pulmonary segments exactly as written and delete the rest. If there is no explicit thoracic or pulmonary information, return an empty string. Return only the extracted text, with no additional commentary."""

PROMPT = """You are a strict rule-based medical text extractor operating in deterministic mode. You will receive a single clinical text entry corresponding to one spreadsheet cell. Your task is to extract and return only the text segments that are strictly relevant to pulmonary or thoracic findings and to lung cancer diagnosis or staging.

Retain only segments that explicitly describe pulmonary or thoracic structures, including lungs, pulmonary parenchyma, nodules, masses, lesions, consolidations, pleura, bronchi, airways, mediastinum, and hilar structures. Also retain any information describing lymph node involvement (mediastinal, hilar, supraclavicular, axillary, or other regional nodes) and any distant metastases (brain, liver, adrenal glands, bone, or other organs) when described in a cancer context. Keep tumor size (mm or cm), local invasion, and extension to adjacent structures.

Preserve the exact original wording and all numerical values. Do not summarize, rephrase, interpret, or assign a stage. If no strictly relevant pulmonary or cancer-related information is present, return an empty string. Return only the extracted text, with no additional commentary."""

REPORT_COLUMN = "Clinical information data (Pseudo reports)"


def load_xlsx(path: str, password: str | None = None) -> pd.DataFrame:
    """Load an xlsx spreadsheet into a DataFrame.

    If *password* is provided the file is decrypted in-memory first
    (requires the ``msoffcrypto-tool`` package).
    """
    if password is not None:
        from utils import read_encrypted_xlsx_as_dataframe

        return read_encrypted_xlsx_as_dataframe(path, password)
    return pd.read_excel(path, engine="openpyxl")


def filter_by_pid(df: pd.DataFrame, pid: str) -> pd.DataFrame:
    """Return only rows where PatientID matches *pid*."""
    return df[df["PatientID"].astype(str) == pid]


def generate(prompt: str, mistral_model: str, ollama_model: str) -> str:
    """Try Mistral first, fall back to Ollama on failure."""
    try:
        print("[npr] Trying Mistral API ...")
        return call_mistral_generate(prompt, mistral_model)
    except Exception as e:
        print(f"[npr] Mistral failed ({e}). Falling back to Ollama ...")

    ensure_ollama_ready()
    return call_ollama_generate(prompt, ollama_model)


def process_dataframe(
    df: pd.DataFrame,
    mistral_model: str,
    ollama_model: str,
) -> pd.DataFrame:
    """Iterate over rows, send the report column to the LLM, and replace it with the response."""
    df = df.copy()
    total = len(df)
    for idx, (i, row) in enumerate(df.iterrows(), start=1):
        report_text = str(row[REPORT_COLUMN])
        print(f"\n[npr] Processing row {idx}/{total} (PatientID={row.get('PatientID', '?')}) ...")
        prompt = PROMPT + f"\n{report_text}"
        response = generate(prompt, mistral_model, ollama_model)
        df.at[i, REPORT_COLUMN] = response
    return df


def save_xlsx(df: pd.DataFrame, output_path: str) -> None:
    """Write the DataFrame to an xlsx file."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    df.to_excel(output_path, index=False, engine="openpyxl")
    print(f"[npr] Output written to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Remove non-pulmonary information from clinical reports in an xlsx spreadsheet."
    )
    parser.add_argument("--xlsx", type=str, required=True, help="Path to the input xlsx spreadsheet.")
    parser.add_argument("--pid", type=str, default=None, help="PatientID to filter on (optional; processes all rows if omitted).")
    parser.add_argument("--mistral-model", type=str, default=MISTRAL_DEFAULT_MODEL)
    parser.add_argument("--ollama-model", type=str, default=OLLAMA_DEFAULT_MODEL)
    parser.add_argument("--output", type=str, default="./clean.xlsx", help="Path for the output xlsx file.")

    args = parser.parse_args()

    df = load_xlsx(args.xlsx)

    if args.pid:
        df = filter_by_pid(df, args.pid)
        if df.empty:
            print(f"[npr] No rows found for PatientID={args.pid}. Exiting.")
            sys.exit(0)
        print(f"[npr] Filtered to {len(df)} row(s) for PatientID={args.pid}.")
    else:
        print(f"[npr] Processing all {len(df)} rows (no --pid filter).")

    df = process_dataframe(df, args.mistral_model, args.ollama_model)
    save_xlsx(df, args.output)
