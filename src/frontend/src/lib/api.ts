export interface LesionEntry {
  date: string;
  description: string;
}

export interface ExamEntry {
  date: string;
  exam_type: string;
  accession_number: string;
}

export interface ReportData {
  patient_id: string;
  generation_date: string;
  indication: string;
  exams: ExamEntry[];
  lesion_summary: LesionEntry[];
  evolution: string;
  attention_points: string;
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
