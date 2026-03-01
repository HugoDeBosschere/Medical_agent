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


def _strip_markdown(text: str) -> str:
    """Remove common markdown formatting markers that would appear literally in PDFs."""
    if not text:
        return text
    # Remove bold: **text**
    result = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    # Remove bold: __text__
    result = re.sub(r'__(.+?)__', r'\1', result)
    # Remove heading markers: ## text → text
    result = re.sub(r'^#{1,6}\s+', '', result, flags=re.MULTILINE)
    return result


def _try_parse_dict(text: str) -> dict | None:
    """Try to parse a string as a JSON or Python-style dict. Returns None if not a dict."""
    s = text.strip()
    if not (s.startswith("{") and s.endswith("}")):
        return None
    # Try JSON first
    try:
        obj = json.loads(s)
        if isinstance(obj, dict):
            return obj
    except (json.JSONDecodeError, ValueError):
        pass
    # Try Python-style single quotes → double quotes (handle apostrophes via ast.literal_eval)
    try:
        import ast
        obj = ast.literal_eval(s)
        if isinstance(obj, dict):
            return obj
    except (ValueError, SyntaxError):
        pass
    return None


def _dict_to_readable(obj: dict, labels: dict[str, str] | None = None) -> str:
    """Convert a dict to human-readable 'key : value' lines.
    Handles nested dicts by flattening them into sub-entries."""
    parts: list[str] = []
    for k, v in obj.items():
        label = labels.get(k, k) if labels else k
        if isinstance(v, dict):
            # Flatten nested dict into "key: sub_key: sub_value; ..."
            inner = "; ".join(f"{sk}: {sv}" for sk, sv in v.items() if sv)
            parts.append(f"{label} : {inner}")
        elif v:
            parts.append(f"{label} : {v}")
    return "\n".join(parts) if parts else ""


def _sanitize_dict_string(text: str) -> str:
    """Detect Python/JSON dict strings and convert to readable text.
    Applied as a safety net to ALL text fields before they reach the PDF."""
    if not text or "{" not in text:
        return text
    s = text.strip()
    # If the entire string is a dict, convert it
    if s.startswith("{") and s.endswith("}"):
        parsed = _try_parse_dict(s)
        if parsed:
            return _dict_to_readable(parsed)
    # Replace inline dict substrings
    def _replace_inline(match: re.Match) -> str:
        parsed = _try_parse_dict(match.group())
        if parsed:
            return _dict_to_readable(parsed)
        return match.group()
    return re.sub(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', _replace_inline, text)


def _format_tnm_stage(value) -> str:
    """Format tnm_stage: if dict with T/N/M keys, render as labeled lines.
    Also handles string-encoded dicts (e.g. Python repr from str())."""
    labels = {
        "T": "T", "N": "N", "M": "M",
        "stage_grouping": "Classification",
        "note": "Note",
    }
    key_order = ["T", "N", "M", "stage_grouping", "note"]

    obj = value
    # If it's a string, try to parse it as a dict
    if isinstance(value, str):
        parsed = _try_parse_dict(value)
        if parsed:
            obj = parsed
        else:
            return value if value else "N/A"

    if isinstance(obj, dict):
        parts: list[str] = []
        rendered: set[str] = set()
        for key in key_order:
            v = obj.get(key)
            if v:
                label = labels.get(key, key)
                parts.append(f"{label} : {v}")
                rendered.add(key)
        for k, v in obj.items():
            if k not in rendered and v:
                label = labels.get(k, k)
                parts.append(f"{label} : {v}")
        return "\n".join(parts) if parts else "N/A"
    return str(value) if value else "N/A"


def _format_evolution_value(value) -> str:
    """Format an evolution sub-category value.
    Handles nested dicts and string-encoded dicts."""
    obj = value
    # If it's a string, try to parse it as a dict
    if isinstance(value, str):
        parsed = _try_parse_dict(value)
        if parsed:
            obj = parsed
        else:
            return value if value else ""

    if isinstance(obj, dict):
        parts: list[str] = []
        for lesion_name, details in obj.items():
            name = lesion_name.replace('_', ' ').strip().capitalize()
            if isinstance(details, dict):
                desc = details.get("description", "")
                evo = details.get("evolution", "")
                comp = details.get("comparaison", "")
                line_parts = [name]
                if desc:
                    line_parts.append(f": {desc}")
                if evo:
                    line_parts.append(f" ({evo})")
                if comp:
                    line_parts.append(f" — {comp}")
                parts.append("".join(line_parts))
            else:
                parts.append(f"{name}: {details}")
        return "\n".join(parts) if parts else ""
    return str(value) if value else ""


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
            pulmonary=_format_evolution_value(evo_raw.get("pulmonary", "")),
            nodes=_format_evolution_value(evo_raw.get("nodes", "")),
            metastasis_extra_pulmonary=_format_evolution_value(evo_raw.get("metastasis_extra_pulmonary", "")),
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
        tnm_stage=_format_tnm_stage(data.get("tnm_stage", "")),
        segmentation_available=False,
        warnings=[],
    )
    return _postprocess_response_dates(response)


def _clean_text(text: str) -> str:
    """Apply date formatting, markdown stripping, and dict-string sanitization."""
    result = _postprocess_dates(text)
    result = _strip_markdown(result)
    result = _sanitize_dict_string(result)
    return result


def _postprocess_response_dates(resp: ReportResponse) -> ReportResponse:
    """Apply YYYYMMDD → YYYY-MM-DD and markdown stripping to every text field."""
    resp.indication = _clean_text(resp.indication)
    resp.final_synthesis = _clean_text(resp.final_synthesis)
    resp.tnm_stage = _clean_text(resp.tnm_stage)

    # Exam entries
    for exam in resp.exams:
        exam.date = _postprocess_dates(exam.date)
        exam.exam_type = _clean_text(exam.exam_type)
        exam.modality = _clean_text(exam.modality)

    # Lesion entries
    for lesion in resp.lesion_summary:
        lesion.date = _postprocess_dates(lesion.date)
        lesion.anomaly = _clean_text(lesion.anomaly)
        lesion.position = _clean_text(lesion.position)
        lesion.size = _clean_text(lesion.size)
        lesion.nature = _clean_text(lesion.nature)
        lesion.observations = _clean_text(lesion.observations)

    # Evolution
    resp.evolution.pulmonary = _clean_text(resp.evolution.pulmonary)
    resp.evolution.nodes = _clean_text(resp.evolution.nodes)
    resp.evolution.metastasis_extra_pulmonary = _clean_text(
        resp.evolution.metastasis_extra_pulmonary
    )

    # Attention points (may be list of DiscordanceEntry or plain string)
    if isinstance(resp.attention_points, list):
        for a in resp.attention_points:
            a.description = _clean_text(a.description)
            a.exam_source = _clean_text(a.exam_source)
            a.ct_reference = _clean_text(a.ct_reference)
    elif isinstance(resp.attention_points, str):
        resp.attention_points = _clean_text(resp.attention_points)

    return resp


def parse_patient_response(raw: str, patient_id: str) -> ReportResponse:
    """Parse LLM JSON response for patient mode into a simplified ReportResponse."""
    try:
        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        data = None
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", cleaned)
            if match:
                try:
                    data = json.loads(match.group())
                except json.JSONDecodeError:
                    pass

        if data is None:
            return ReportResponse(
                patient_id=patient_id,
                generation_date=datetime.now().isoformat(),
                mode="patient",
                patient_summary=_clean_text(raw),
                warnings=["LLM response was not valid JSON. Raw text placed in patient summary."],
            )

        summary = str(data.get("patient_summary", ""))
        summary = _clean_text(summary)

        return ReportResponse(
            patient_id=patient_id,
            generation_date=datetime.now().isoformat(),
            mode="patient",
            patient_summary=summary,
        )
    except Exception as e:
        # Defensive: never let parsing crash the server
        return ReportResponse(
            patient_id=patient_id,
            generation_date=datetime.now().isoformat(),
            mode="patient",
            patient_summary=str(raw) if raw else "Error generating patient summary.",
            warnings=[f"Patient response parsing error: {e}"],
        )


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
