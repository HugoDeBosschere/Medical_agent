import json
import re
from datetime import datetime

from ..api.schemas import ReportResponse, ExamEntry, LesionEntry


def parse_report_response(raw: str, patient_id: str) -> ReportResponse:
    """Parse LLM JSON response into ReportResponse with graceful fallbacks."""
    cleaned = raw.strip()
    # Strip markdown code fences if present
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    data = None
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to extract JSON block from the response
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            try:
                data = json.loads(match.group())
            except json.JSONDecodeError:
                pass

    if data is None:
        return _fallback_response(raw, patient_id)

    # Parse exams list safely
    exams = []
    for e in data.get("exams", []):
        if isinstance(e, dict):
            exams.append(ExamEntry(
                date=str(e.get("date", "")),
                exam_type=str(e.get("exam_type", "")),
                accession_number=str(e.get("accession_number", "")),
            ))

    # Parse lesion_summary list safely
    lesions = []
    for l in data.get("lesion_summary", []):
        if isinstance(l, dict):
            lesions.append(LesionEntry(
                date=str(l.get("date", "")),
                description=str(l.get("description", "")),
            ))

    return ReportResponse(
        patient_id=patient_id,
        generation_date=datetime.now().isoformat(),
        indication=str(data.get("indication", "")),
        exams=exams,
        lesion_summary=lesions,
        evolution=str(data.get("evolution", "")),
        attention_points=str(data.get("attention_points", "")),
        final_synthesis=str(data.get("final_synthesis", "")),
        tnm_stage=str(data.get("tnm_stage", "")),
        segmentation_available=False,
        warnings=[],
    )


def _fallback_response(raw: str, patient_id: str) -> ReportResponse:
    """When JSON parsing completely fails, wrap raw text."""
    return ReportResponse(
        patient_id=patient_id,
        generation_date=datetime.now().isoformat(),
        indication="",
        exams=[],
        lesion_summary=[],
        evolution="",
        attention_points="",
        final_synthesis=raw,
        tnm_stage="Unable to determine - see final synthesis",
        segmentation_available=False,
        warnings=["LLM response was not valid JSON. Raw text placed in final synthesis."],
    )
