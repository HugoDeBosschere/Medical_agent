from pydantic import BaseModel, Field


class ReportRequest(BaseModel):
    patient_id: str = Field(..., pattern=r"^[A-Z0-9]{8}$")
    language: str = Field(default="fr")


class LesionEntry(BaseModel):
    date: str
    description: str


class ExamEntry(BaseModel):
    date: str
    exam_type: str
    accession_number: str = ""


class ReportResponse(BaseModel):
    patient_id: str
    generation_date: str
    indication: str
    exams: list[ExamEntry]
    lesion_summary: list[LesionEntry]
    evolution: str
    attention_points: str
    final_synthesis: str
    tnm_stage: str
    segmentation_available: bool
    warnings: list[str] = []
