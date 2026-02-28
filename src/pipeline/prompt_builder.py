LANGUAGE_MAP = {
    "fr": "French",
    "en": "English",
}

REPORT_PROMPT_TEMPLATE = """You are an expert oncology radiologist assistant. You will generate a structured follow-up report for a lung cancer patient based on two data sources provided below.

=== SOURCE A: CLINICAL REPORTS (NPR) ===
These are cleaned clinical reports containing pulmonary/thoracic findings extracted from radiology reports across multiple examinations:

{npr_text}

=== SOURCE B: CT SEGMENTATION DATA ===
These are automated measurements of pulmonary nodules extracted from CT DICOM scans, including volumes and diameters:

{seg_text}

=== INSTRUCTIONS ===
Generate a structured oncology follow-up report with exactly these 7 sections. Use the JSON format specified below. Cross-reference findings from both sources when possible. If segmentation data is unavailable, base the report solely on clinical reports.

Respond ONLY with valid JSON in this exact structure (no markdown, no code fences):
{{"indication": "General clinical context and reason for follow-up", "exams": [{{"date": "YYYY-MM-DD or original date string", "exam_type": "Type of scan", "accession_number": "AccessionNumber if available"}}], "lesion_summary": [{{"date": "date of finding", "description": "lesion description with measurements"}}], "evolution": "Temporal evolution of lesions across examinations - progression, stability, or regression. Include quantitative comparisons of measurements when available from both sources.", "attention_points": "Discordances between clinical reports and segmentation, unexpected findings, missing data, or areas requiring clinical attention", "final_synthesis": "Comprehensive summary integrating all findings from both sources", "tnm_stage": "Proposed TNM classification based on available data, with reasoning. State clearly this is a computational suggestion requiring clinical validation."}}

{language_instruction}"""


def build_final_prompt(npr_text: str, seg_text: str, language: str) -> str:
    lang_name = LANGUAGE_MAP.get(language, "English")

    if not seg_text:
        seg_text = "[No CT segmentation data available for this patient. Base the report solely on clinical reports.]"

    language_instruction = ""
    if language != "en":
        language_instruction = (
            f"IMPORTANT: Generate ALL text content in {lang_name}. "
            f"All section values in the JSON must be written in {lang_name}."
        )

    return REPORT_PROMPT_TEMPLATE.format(
        npr_text=npr_text,
        seg_text=seg_text,
        language_instruction=language_instruction,
    )
