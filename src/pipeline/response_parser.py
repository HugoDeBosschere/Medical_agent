import json
import re
from datetime import datetime

from ..api.schemas import ReportResponse, ExamEntry, LesionEntry, DiscordanceEntry, EvolutionCategory


# Regex to match standalone YYYYMMDD with valid month (01-12) and day (01-31)
_YYYYMMDD_RE = re.compile(r'\b(\d{4})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\b')


def _format_date(date_str: str) -> str:
    """Convert YYYYMMDD to YYYY-MM-DD. Pass through other formats unchanged."""
    s = date_str.strip()
    if len(s) == 8 and s.isdigit():
        return f"{s[:4]}-{s[4:6]}-{s[6:8]}"
    return s


def _postprocess_dates(text: str) -> str:
    """Replace any remaining YYYYMMDD occurrences with YYYY-MM-DD in free text."""
    return _YYYYMMDD_RE.sub(r'\1-\2-\3', text)


def _date_sort_key(date_str: str) -> str:
    """Return a sortable date string (YYYY-MM-DD) for anti-chronological ordering."""
    s = _format_date(date_str)
    # Already YYYY-MM-DD → use directly; anything else sorts to the end
    if len(s) == 10 and s[4] == "-" and s[7] == "-":
        return s
    return "0000-00-00"


def _format_final_synthesis(value) -> str:
    """Format final_synthesis: if it's a dict with DR keys, render as labeled sentences.
    Hypothesis keys are explicitly excluded."""
    if isinstance(value, dict):
        labels = {
            "Diagnosis": "Diagnostic",
            "Recommendation": "Recommandation",
            "diagnostic": "Diagnostic",
            "recommendation": "Recommandation",
        }
        # Keys to exclude from the synthesis
        excluded = {"Hypothesis", "hypothesis", "Hypothèse", "hypothèse"}
        parts = []
        for k, v in value.items():
            if k in excluded:
                continue
            label = labels.get(k, k)
            parts.append(f"{label} : {v}")
        return "\n".join(parts) if parts else "N/A"
    return str(value) if value else "N/A"

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
                date=_format_date(str(e.get("date", ""))),
                exam_type=str(e.get("exam_type", "")),
                modality=str(e.get("modality", "")),
                injected=str(e.get("injected", "")),
            ))
    # Sort exams anti-chronologically (latest first)
    exams.sort(key=lambda x: _date_sort_key(x.date), reverse=True)

    # Parse lesion_summary list safely
    lesions = []
    for l in data.get("lesion_summary", []):
        if isinstance(l, dict):
            lesions.append(LesionEntry(
                date=_format_date(str(l.get("date", ""))),
                modality=str(l.get("modality", "")),
                injected=str(l.get("injected", "")),
                anomaly=str(l.get("anomaly", "")),
                position=str(l.get("position", "")),
                size=str(l.get("size", "")),
                nature=str(l.get("nature", "")),
                observations=str(l.get("observations", "")),
            ))
    # Sort lesion_summary anti-chronologically (latest first)
    lesions.sort(key=lambda x: _date_sort_key(x.date), reverse=True)

    # Parse evolution as structured categories
    evo_raw = data.get("evolution", {})
    if isinstance(evo_raw, dict):
        evolution = EvolutionCategory(
            pulmonary=str(evo_raw.get("pulmonary", "")),
            nodes=str(evo_raw.get("nodes", "")),
            metastasis_extra_pulmonary=str(evo_raw.get("metastasis_extra_pulmonary", "")),
        )
    else:
        # Backwards compatibility: if LLM returns a plain string
        evolution = EvolutionCategory(pulmonary=str(evo_raw))

    # Parse attention_points as structured discordance entries
    attn_raw = data.get("attention_points", [])
    if isinstance(attn_raw, list):
        attention_points = []
        for a in attn_raw:
            if isinstance(a, dict):
                attention_points.append(DiscordanceEntry(
                    description=str(a.get("description", "")),
                    exam_source=str(a.get("exam_source", "")),
                    ct_reference=str(a.get("ct_reference", "")),
                ))
    else:
        # Backwards compatibility: if LLM returns a plain string
        attention_points = str(attn_raw)

    response = ReportResponse(
        patient_id=patient_id,
        generation_date=datetime.now().isoformat(),
        indication=str(data.get("indication", "")),
        exams=exams,
        lesion_summary=lesions,
        evolution=evolution,
        attention_points=attention_points,
        final_synthesis=_format_final_synthesis(data.get("final_synthesis", "")),
        tnm_stage=str(data.get("tnm_stage", "")),
        segmentation_available=False,
        warnings=[],
    )
    return _postprocess_response_dates(response)


def _postprocess_response_dates(resp: ReportResponse) -> ReportResponse:
    """Apply YYYYMMDD → YYYY-MM-DD post-processing to every text field in the response."""
    resp.indication = _postprocess_dates(resp.indication)
    resp.final_synthesis = _postprocess_dates(resp.final_synthesis)
    resp.tnm_stage = _postprocess_dates(resp.tnm_stage)

    # Exam entries
    for exam in resp.exams:
        exam.date = _postprocess_dates(exam.date)
        exam.exam_type = _postprocess_dates(exam.exam_type)
        exam.modality = _postprocess_dates(exam.modality)

    # Lesion entries
    for lesion in resp.lesion_summary:
        lesion.date = _postprocess_dates(lesion.date)
        lesion.observations = _postprocess_dates(lesion.observations)

    # Evolution
    resp.evolution.pulmonary = _postprocess_dates(resp.evolution.pulmonary)
    resp.evolution.nodes = _postprocess_dates(resp.evolution.nodes)
    resp.evolution.metastasis_extra_pulmonary = _postprocess_dates(
        resp.evolution.metastasis_extra_pulmonary
    )

    # Attention points (may be list of DiscordanceEntry or plain string)
    if isinstance(resp.attention_points, list):
        for a in resp.attention_points:
            a.description = _postprocess_dates(a.description)
            a.exam_source = _postprocess_dates(a.exam_source)
            a.ct_reference = _postprocess_dates(a.ct_reference)
    elif isinstance(resp.attention_points, str):
        resp.attention_points = _postprocess_dates(resp.attention_points)

    return resp


def _fallback_response(raw: str, patient_id: str) -> ReportResponse:
    """When JSON parsing completely fails, wrap raw text."""
    response = ReportResponse(
        patient_id=patient_id,
        generation_date=datetime.now().isoformat(),
        indication="",
        exams=[],
        lesion_summary=[],
        evolution=EvolutionCategory(),
        attention_points=[],
        final_synthesis=raw,
        tnm_stage="Not enough information to determine robustly",
        segmentation_available=False,
        warnings=["LLM response was not valid JSON. Raw text placed in final synthesis."],
    )
    return _postprocess_response_dates(response)
