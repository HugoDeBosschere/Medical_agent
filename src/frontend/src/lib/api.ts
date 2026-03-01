export interface LesionEntry {
  date: string;
  modality: string;
  injected: string;
  anomaly: string;
  position: string;
  size: string;
  nature: string;
  observations: string;
}

export interface ExamEntry {
  date: string;
  exam_type: string;
}

export interface EvolutionCategory {
  pulmonary: string;
  nodes: string;
  metastasis_extra_pulmonary: string;
}

export interface DiscordanceEntry {
  description: string;
  exam_source: string;
  ct_reference: string;
}

export interface ReportData {
  patient_id: string;
  generation_date: string;
  indication: string;
  exams: ExamEntry[];
  lesion_summary: LesionEntry[];
  evolution: EvolutionCategory;
  attention_points: DiscordanceEntry[] | string;
  final_synthesis: string;
  tnm_stage: string;
  segmentation_available: boolean;
  warnings: string[];
}

export async function fetchReport(
  patientId: string,
  language: string
): Promise<ReportData> {
  const resp = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient_id: patientId, language }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${resp.status}`);
  }

  return resp.json();
}
