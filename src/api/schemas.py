from pydantic import BaseModel, Field


class ReportRequest(BaseModel):
    patient_id: str = Field(..., pattern=r"^[A-Z0-9]{8}$")
    language: str = Field(default="fr")


class LesionEntry(BaseModel):
    date: str
    modality: str = ""
    injected: str = ""
    anomaly: str = ""
    position: str = ""
    size: str = ""
    nature: str = ""
    observations: str = ""


class ExamEntry(BaseModel):
    date: str
    exam_type: str
    modality: str = ""
    injected: str = ""


class DiscordanceEntry(BaseModel):
    description: str
    exam_source: str = ""
    ct_reference: str = ""


class EvolutionCategory(BaseModel):
    pulmonary: str = ""
    nodes: str = ""
    metastasis_extra_pulmonary: str = ""


class ReportResponse(BaseModel):
    patient_id: str
    generation_date: str
    indication: str
    exams: list[ExamEntry]
    lesion_summary: list[LesionEntry]
    evolution: EvolutionCategory
    attention_points: list[DiscordanceEntry] | str = ""
    final_synthesis: str
    tnm_stage: str
    segmentation_available: bool
    warnings: list[str] = []
