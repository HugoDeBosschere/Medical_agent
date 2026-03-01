LANGUAGE_MAP = {
    "fr": "French",
    "en": "English",
}

PATIENT_PROMPT_TEMPLATE = """You are a medical assistant writing directly for a patient. Your task is to explain only the information that concerns the lungs and nearby areas in a clear, simple, and reassuring way. Focus exclusively on findings related to the lungs, lung nodules or masses, lymph nodes in the chest, and any mention of possible spread to other organs such as the brain, liver, adrenal glands, or bones when discussed in a cancer context. Clearly explain what was found, mention the size if provided using simple language, and indicate whether the findings are stable, increasing, decreasing, or new compared to previous scans. Use plain, everyday language and avoid medical terminology such as staging systems or technical classifications. Do not speculate, do not interpret beyond what is written, and do not include unrelated findings. Maintain a calm, neutral, and reassuring tone throughout, and return only the explanation intended for the patient.

=== SOURCE A: CLINICAL REPORTS (NPR) ===
{npr_text}

=== SOURCE B: CT SEGMENTATION DATA ===
{seg_text}

=== INSTRUCTIONS ===
Based on the sources above, generate a clear patient-facing summary.

CRITICAL RULES:
1. NO HALLUCINATION: If information is missing, say so plainly.
2. NO MEDICAL JARGON: Avoid TNM staging, technical classifications, or abbreviations.
3. EXACT JSON ONLY: Respond ONLY with a valid JSON object matching the exact structure below.

Respond ONLY with valid JSON in this exact structure:
{{
  "patient_summary": "Your clear, reassuring explanation for the patient goes here. Write in full sentences and paragraphs."
}}

{language_instruction}"""

REPORT_PROMPT_TEMPLATE = """You are an expert oncology radiologist assistant. You will generate a structured follow-up report for an oncology patient based on two data sources provided below.

=== SOURCE A: CLINICAL REPORTS (NPR) ===
{npr_text}

=== SOURCE B: CT SEGMENTATION DATA ===
{seg_text}

=== TNM CLASSIFICATION GUIDELINES ===
Apply the following precise TNM definitions for staging:
Primary Tumor (T)
TX    Primary tumor cannot be assessed, or tumor proven by the presence of malignant cells in broncho-pulmonary secretions (sputum or washings) but not visualized by imaging or bronchoscopy.
T0    No evidence of primary tumor.
Tis   Carcinoma in situ.
T1    Tumor 3 cm or less in greatest dimension, surrounded by lung or visceral pleura, without bronchoscopic evidence of invasion more proximal than the lobar bronchus (i.e., not in the main bronchus).
T1a(mi): Minimally invasive adenocarcinoma.
T1a:  Tumor 1 cm or less in greatest dimension.
T1b:  Tumor more than 1 cm but not more than 2 cm in greatest dimension.
T1c:  Tumor more than 2 cm but not more than 3 cm in greatest dimension.
T2    Tumor more than 3 cm but 5 cm or less in greatest dimension; or tumor with any of the following features:
   -involves main bronchus regardless of distance to the carina, but without involvement of the carina,
   -invades visceral pleura,
   -associated with atelectasis or obstructive pneumonitis that extends to the hilar region (involving part or all of the lung).
T2a:  Tumor more than 3 cm but not more than 4 cm in greatest dimension.
T2b:  Tumor more than 4 cm but not more than 5 cm in greatest dimension.
T3    Tumor more than 5 cm but 7 cm or less in greatest dimension, or associated with separate tumor nodule(s) in the same lobe, or having any of the following invasive features:
   -invades chest wall (including superior sulcus tumors),
   -invades phrenic nerve,
   -invades parietal pleura or pericardium.
T4    Tumor more than 7 cm or associated with separate tumor nodule(s) in a different ipsilateral lobe, or invades any of the following: mediastinum, heart, great vessels, trachea, diaphragm, recurrent laryngeal nerve, esophagus, vertebral body, carina.

Regional Lymph Nodes (N)
NX    Regional lymph nodes cannot be assessed.
N0    No regional lymph node metastasis.
N1    Metastasis in ipsilateral peribronchial and/or ipsilateral hilar lymph nodes, including involvement by direct extension.
N2    Metastasis in ipsilateral mediastinal and/or subcarinal lymph node(s).
N3    Metastasis in contralateral mediastinal, contralateral hilar, ipsilateral or contralateral scalene, or supraclavicular lymph node(s).
 
Distant Metastasis (M)
MX    Unknown.
M0    No distant metastasis.
M1    Distant metastasis present:
M1a:  Separate tumor nodule(s) in a contralateral lobe; tumor with pleural nodules or malignant pleural effusion or malignant pericardial effusion.
M1b:  Single metastasis in a single metastatic site.
M1c:  Multiple metastases in a single organ or in multiple organs.

The stages are grouped as follows: 
Stage 0 = Tis N0 M0; 
Stage I = T1–T2a N0 M0; 
Stage II = T2b–T3 N0 or T1–T2 N1 or T1 N2a; 
Stage III = any N2b or N3 or T4 involvement without metastasis; 
Stage IV = any M1 (a, b, or c) situation.

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


def build_final_prompt(npr_text: str, seg_text: str, language: str, mode: str = "radiologist") -> str:
    lang_name = LANGUAGE_MAP.get(language, "English")

    if not seg_text:
        seg_text = "[No CT segmentation data available for this patient. Base the report solely on clinical reports.]"

    language_instruction = ""
    if language != "en":
        language_instruction = (
            f"IMPORTANT: Generate ALL text content in {lang_name}. "
            f"All section values in the JSON must be written in {lang_name}."
        )

    template = PATIENT_PROMPT_TEMPLATE if mode == "patient" else REPORT_PROMPT_TEMPLATE

    return template.format(
        npr_text=npr_text,
        seg_text=seg_text,
        language_instruction=language_instruction,
    )