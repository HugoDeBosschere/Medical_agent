LANGUAGE_MAP = {
    "fr": "French",
    "en": "English",
}

REPORT_PROMPT_TEMPLATE = """You are an expert oncology radiologist assistant. You will generate a structured follow-up report for an oncology patient based on two data sources provided below.

=== SOURCE A: CLINICAL REPORTS (NPR) ===
{npr_text}

=== SOURCE B: CT SEGMENTATION DATA ===
{seg_text}

=== TNM CLASSIFICATION GUIDELINES ===
Apply the following precise TNM definitions for staging:

Primary Tumor (T):
- Tis: Carcinoma in situ: intraepithelial or invasion of the lamina propria (intramucosal) without extension to the submucosa through the muscularis mucosae.
- T1: Tumor invades the submucosa but not beyond.
- T2: Tumor invades the muscularis propria but not beyond.
- T3: Tumor invades through the muscularis propria into the subserosa (without involvement of the mesothelial lining) and non-peritonealized pericolic or perirectal tissue.
- T4: Tumor perforates the visceral peritoneum and/or invades adjacent organs.

Regional Lymph Nodes (N):
- Minimum number of nodes examined: 12.
- [If the examined lymph nodes are negative, but the usually resected number is not reached, classify as pN0].
- N0: No regional lymph node metastasis.
- N1: 1 to 3 regional lymph node metastases.
- N2: 4 or more regional lymph node metastases.
- Nx: Regional lymph nodes cannot be assessed.

Distant Metastasis (M):
- M0: No distant metastasis.
- M1: Distant metastasis (involvement of external iliac or common iliac nodes is considered M1).
- Mx: Metastatic status unknown.

=== INSTRUCTIONS ===
Generate a structured oncology follow-up report. Cross-reference findings from both sources. If segmentation data is unavailable, base the report solely on clinical reports.

CRITICAL RULES:
1. NO HALLUCINATION: If information is missing, explicitly state "Not enough information to determine robustly".
2. NO SPACING ARTIFACTS: Clean up any OCR errors from the source text. Do NOT include arbitrary spaces in numbers or dates (e.g., write "2020-11-25", NEVER "2 0 2 0 - 1 1 - 2 5").
3. EXACT JSON ONLY: Respond ONLY with a valid JSON object matching the exact structure below.

JSON SCHEMA INSTRUCTIONS:
- **evolution**: Must contain exactly three keys: `pulmonary`, `nodes`, `metastasis_extra_pulmonary`. The value for each must be a JSON object where the keys are the specific names of the lesions (e.g., "masse_parahilaire_droite") and the values are objects containing "description", "evolution", and "comparaison".
- **final_synthesis**: Must be a JSON object with keys "Diagnosis" and "Recommendation".
- **tnm_stage**: Must be a JSON object with keys "T", "N", "M", "stage_grouping", and "note". 

Respond ONLY with valid JSON in this exact structure:
{{
  "indication": "General clinical context and reason for follow-up",
  "exams": [
    {{
      "date": "YYYY-MM-DD",
      "exam_type": "Type of scan",
      "modality": "Detailed modality",
      "injected": "yes/no/unknown"
    }}
  ],
  "lesion_summary": [
    {{
      "date": "YYYY-MM-DD",
      "modality": "modality",
      "injected": "yes/no/unknown",
      "anomaly": "type",
      "position": "precise position",
      "size": "exact measurements",
      "nature": "solid/mixed/etc",
      "observations": "additional details"
    }}
  ],
  "evolution": {{
    "pulmonary": {{
      "name_of_lesion_1": {{
        "description": "Brief description",
        "evolution": "Increase / Decrease / Stabilization / New / Disappeared",
        "comparaison": "Quantitative comparison (e.g., 2020-11-25: 55mm -> 2020-10-24: 44mm (-20%))"
      }}
    }},
    "nodes": {{}},
    "metastasis_extra_pulmonary": {{}}
  }},
  "attention_points": [
    {{
      "description": "Discordance description",
      "exam_source": "Source reporting the finding",
      "ct_reference": "Contradicting CT/Segmentation"
    }}
  ],
  "final_synthesis": {{
    "Diagnosis": "Current diagnostic assessment",
    "Recommendation": "Suggested next steps"
  }},
  "tnm_stage": {{
    "T": "Tx",
    "N": "Nx",
    "M": "Mx",
    "stage_grouping": "Stage X",
    "note": "Per-component justification or 'Not enough information' statement"
  }}
}}

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