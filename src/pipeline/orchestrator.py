"""Main pipeline orchestrator: NPR + Segmentation + LLM → structured report."""

import asyncio
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from ..api.schemas import ReportResponse

_executor = ThreadPoolExecutor(max_workers=2)

# Paths relative to this file
_PROJECT_ROOT = Path(__file__).resolve().parents[2]  # Medical_agent/
_NPR_DIR = _PROJECT_ROOT / "src" / "npr"
_XLSX_PATH = _PROJECT_ROOT / "ExamensUnboxed.xlsx"
_DATA_DIR = _PROJECT_ROOT / "data"


async def generate_report(patient_id: str, language: str, mode: str = "radiologist") -> ReportResponse:
    """Full pipeline: NPR + Segmentation (parallel) → LLM prompt → parse → ReportResponse."""
    loop = asyncio.get_event_loop()
    warnings: list[str] = []

    # Run both streams in parallel
    npr_future = loop.run_in_executor(_executor, run_npr_stream, patient_id)
    seg_future = loop.run_in_executor(_executor, run_segmentation_stream, patient_id)

    npr_text = await npr_future

    try:
        seg_text = await seg_future
    except Exception as e:
        seg_text = ""
        warnings.append(f"Segmentation unavailable: {e}")

    if not npr_text:
        raise ValueError(f"No clinical reports found for patient {patient_id}")

    # Build prompt and call LLM
    from .prompt_builder import build_final_prompt
    prompt = build_final_prompt(npr_text, seg_text, language, mode=mode)

    from .llm_caller import call_llm
    raw_response = await loop.run_in_executor(_executor, call_llm, prompt)

    # Parse response based on mode
    from .response_parser import parse_report_response, parse_patient_response
    if mode == "patient":
        parsed = parse_patient_response(raw_response, patient_id)
    else:
        parsed = parse_report_response(raw_response, patient_id)
    parsed.warnings = warnings
    parsed.segmentation_available = bool(seg_text)

    # Evaluate the generated report with LLM-as-a-Judge
    source_data = f"{npr_text}\n\n{seg_text}"
    from ..onco_veto.evaluate import evaluate_generation_with_judge
    try:
        eval_result = await loop.run_in_executor(
            _executor,
            evaluate_generation_with_judge,
            source_data,
            raw_response
        )
        parsed.generation_evaluation = eval_result
        print(f"[pipeline] Judge evaluation result (first 200 chars): {eval_result[:200] if eval_result else 'EMPTY'}")
    except Exception as e:
        print(f"[pipeline] Judge evaluation failed: {e}")
        parsed.generation_evaluation = ""

    return parsed


def run_npr_stream(patient_id: str) -> str:
    """Run the NPR pipeline and return concatenated cleaned clinical text."""
    # Ensure NPR modules are importable
    if str(_NPR_DIR) not in sys.path:
        sys.path.insert(0, str(_NPR_DIR))

    from npr import load_xlsx, filter_by_pid, process_dataframe, REPORT_COLUMN
    from mistral_call import MISTRAL_DEFAULT_MODEL
    from ollama_call import MODEL as OLLAMA_DEFAULT_MODEL

    # Read excel password
    excel_key_path = _NPR_DIR / "excel_key.txt"
    password = None
    if excel_key_path.exists():
        password = excel_key_path.read_text().strip()

    df = load_xlsx(str(_XLSX_PATH), password=password)
    df_patient = filter_by_pid(df, patient_id)

    if df_patient.empty:
        return ""

    df_clean = process_dataframe(df_patient, MISTRAL_DEFAULT_MODEL, OLLAMA_DEFAULT_MODEL)

    # Concatenate all cleaned reports
    parts = []
    for _, row in df_clean.iterrows():
        study_date = row.get("StudyDate", row.get("AccessionNumber", "unknown"))
        # Format date if it's a Timestamp / datetime
        if hasattr(study_date, "strftime"):
            study_date = study_date.strftime("%Y-%m-%d")
        # Format YYYYMMDD string dates to YYYY-MM-DD
        elif isinstance(study_date, str) and len(study_date) == 8 and study_date.isdigit():
            study_date = f"{study_date[:4]}-{study_date[4:6]}-{study_date[6:8]}"
        report_text = str(row[REPORT_COLUMN])
        parts.append(f"[ExamDate: {study_date}]\n{report_text}")

    return "\n\n---\n\n".join(parts)


def run_segmentation_stream(patient_id: str) -> str:
    """Run CT segmentation and return nodule text."""
    # Ensure project root is importable for process_patient
    root_str = str(_PROJECT_ROOT)
    if root_str not in sys.path:
        sys.path.insert(0, root_str)

    from process_patient import process_patient
    return process_patient(patient_id, output_dir=str(_PROJECT_ROOT / "results"), data_dir=str(_DATA_DIR))
