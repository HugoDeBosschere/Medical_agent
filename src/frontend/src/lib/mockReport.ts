import jsPDF from "jspdf";
import type { ReportData } from "./api";

export type ReportLanguage = "en" | "fr";

export const LANGUAGE_LABELS: Record<ReportLanguage, string> = {
  en: "English",
  fr: "Français",
};

const translations: Record<ReportLanguage, Record<string, string>> = {
  en: {
    title: "RADIOLOGY REPORT",
    confidential: "Confidential Medical Document",
    patientInfo: "PATIENT INFORMATION",
    patientId: "Patient ID:",
    lastName: "Last Name:",
    firstName: "First Name:",
    dob: "Date of Birth:",
    examInfo: "EXAMINATION DETAILS",
    examDate: "Exam Date:",
    examType: "Exam Type:",
    areasExplored: "Areas Explored:",
    modalities: "Modalities:",
    incidents: "Incidents:",
    referringPhysician: "REFERRING PHYSICIAN",
    physicianName: "Name:",
    physicianContact: "Contact:",
    radiologist: "RADIOLOGIST",
    radiologistName: "Name:",
    radiologistSignature: "Digital Signature:",
    technicalDesc: "TECHNICAL DESCRIPTION",
    findings: "DESCRIPTIVE FINDINGS",
    interpretation: "INTERPRETATION & CONCLUSION",
    reportDate: "REPORT DATE",
    dateOfRedaction: "Date of Redaction:",
    imageConservation: "IMAGE CONSERVATION",
    conservationText: "Medical images are stored on PACS (Picture Archiving and Communication System) in DICOM format for a minimum retention period of 20 years, in compliance with applicable healthcare regulations. Access is restricted to authorized medical personnel.",
    privacyTitle: "PRIVACY & DATA PROTECTION NOTICE",
    privacy1: "This report was generated in full compliance with the General Data Protection Regulation (GDPR/RGPD – EU Regulation 2016/679).",
    privacy2: "Patient data has been processed solely for the purpose of medical diagnosis and is protected under applicable healthcare privacy laws.",
    privacy3: "No personal data was shared with unauthorized third parties. Data retention and processing adhere to institutional privacy policies.",
    validWithout: "This report was generated electronically and is valid without signature.",
    noIncidents: "No incidents during the examination.",
    globalIndication: "GLOBAL INDICATION",
    lesionSummary: "LESION SUMMARY",
    evolutionTitle: "EVOLUTION",
    attentionPoints: "ATTENTION POINTS / DISCORDANCES",
    finalSynthesis: "FINAL SYNTHESIS",
    tnmStage: "PROPOSED TNM STAGE",
    warningsTitle: "WARNINGS",
  },
  fr: {
    title: "COMPTE RENDU RADIOLOGIQUE",
    confidential: "Document Médical Confidentiel",
    patientInfo: "IDENTITÉ DU PATIENT",
    patientId: "N° Patient :",
    lastName: "Nom :",
    firstName: "Prénom :",
    dob: "Date de naissance :",
    examInfo: "DÉTAILS DE L'EXAMEN",
    examDate: "Date de l'examen :",
    examType: "Type d'examen :",
    areasExplored: "Zones explorées :",
    modalities: "Modalités :",
    incidents: "Incidents :",
    referringPhysician: "MÉDECIN PRESCRIPTEUR",
    physicianName: "Nom :",
    physicianContact: "Coordonnées :",
    radiologist: "RADIOLOGUE",
    radiologistName: "Nom :",
    radiologistSignature: "Signature numérique :",
    technicalDesc: "DESCRIPTION TECHNIQUE",
    findings: "COMPTE RENDU DESCRIPTIF",
    interpretation: "INTERPRÉTATION ET CONCLUSION",
    reportDate: "DATE DU COMPTE RENDU",
    dateOfRedaction: "Date de rédaction :",
    imageConservation: "CONSERVATION DES IMAGES",
    conservationText: "Les images médicales sont conservées sur le système PACS au format DICOM pour une durée minimale de 20 ans, conformément à la réglementation en vigueur. L'accès est réservé au personnel médical autorisé.",
    privacyTitle: "MENTION RGPD / PROTECTION DES DONNÉES",
    privacy1: "Ce compte rendu a été généré en conformité avec le Règlement Général sur la Protection des Données (RGPD – Règlement UE 2016/679).",
    privacy2: "Les données patient ont été traitées uniquement à des fins de diagnostic médical et sont protégées par les lois applicables en matière de confidentialité.",
    privacy3: "Aucune donnée personnelle n'a été partagée avec des tiers non autorisés. La conservation et le traitement des données respectent les politiques de confidentialité de l'établissement.",
    validWithout: "Ce document a été généré électroniquement et est valide sans signature manuscrite.",
    noIncidents: "Aucun incident durant l'examen.",
    globalIndication: "INDICATION GLOBALE",
    lesionSummary: "SYNTHÈSE DES LÉSIONS",
    evolutionTitle: "ÉVOLUTION",
    attentionPoints: "POINTS D'ATTENTION / DISCORDANCES",
    finalSynthesis: "SYNTHÈSE FINALE",
    tnmStage: "SUPPOSITION DE STADE TNM",
    warningsTitle: "AVERTISSEMENTS",
  },
};

function t(lang: ReportLanguage, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

function addSection(doc: jsPDF, title: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 20, y);
  doc.setDrawColor(56, 189, 176);
  doc.setLineWidth(0.5);
  doc.line(20, y + 2, 190, y + 2);
  return y + 10;
}

function addField(doc: jsPDF, label: string, value: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(label, 22, y);
  doc.setFont("helvetica", "normal");
  doc.text(value, 72, y);
  return y + 7;
}

function checkPage(doc: jsPDF, y: number, needed: number = 30): number {
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function generateMockReport(patientId: string, lang: ReportLanguage = "en"): Blob {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleDateString(lang === "en" ? "en-US" : lang, {
    year: "numeric", month: "long", day: "numeric",
  });

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(56, 189, 176);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(t(lang, "title"), 105, 18, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(t(lang, "confidential"), 105, 28, { align: "center" });

  let y = 55;

  // 1. Patient Information
  y = addSection(doc, t(lang, "patientInfo"), y);
  y = addField(doc, t(lang, "patientId"), patientId, y);
  y = addField(doc, t(lang, "lastName"), "Dupont", y);
  y = addField(doc, t(lang, "firstName"), "Marie", y);
  y = addField(doc, t(lang, "dob"), "15/03/1985", y);

  // 2. Examination Details
  y += 4;
  y = checkPage(doc, y, 50);
  y = addSection(doc, t(lang, "examInfo"), y);
  y = addField(doc, t(lang, "examDate"), dateStr, y);
  y = addField(doc, t(lang, "examType"), "CT Scan (Scanner)", y);
  y = addField(doc, t(lang, "areasExplored"), "Thorax – Chest", y);
  y = addField(doc, t(lang, "modalities"), "Helical CT, contrast-enhanced", y);
  y = addField(doc, t(lang, "incidents"), t(lang, "noIncidents"), y);

  // 3. Referring Physician
  y += 4;
  y = checkPage(doc, y, 30);
  y = addSection(doc, t(lang, "referringPhysician"), y);
  y = addField(doc, t(lang, "physicianName"), "Dr. Sarah Mitchell", y);
  y = addField(doc, t(lang, "physicianContact"), "s.mitchell@hospital.org · +33 1 42 00 00 00", y);

  // 4. Radiologist
  y += 4;
  y = checkPage(doc, y, 30);
  y = addSection(doc, t(lang, "radiologist"), y);
  y = addField(doc, t(lang, "radiologistName"), "Dr. James Chen, MD", y);
  y = addField(doc, t(lang, "radiologistSignature"), "CHEN-J-" + Date.now().toString(36).toUpperCase(), y);

  // 5. Technical Description
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "technicalDesc"), y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const techText = "Helical CT acquisition of the chest with IV contrast (Iomeron 350, 80 mL). Slice thickness: 1.25 mm. Reconstructions in axial, coronal, and sagittal planes. Lung and mediastinal windows reviewed.";
  const techLines = doc.splitTextToSize(techText, 165);
  doc.text(techLines, 22, y);
  y += techLines.length * 5 + 4;

  // 6. Descriptive Findings
  y = checkPage(doc, y, 60);
  y = addSection(doc, t(lang, "findings"), y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const findings = [
    "Lungs: Clear bilateral lung fields. No focal consolidation, mass, or pleural effusion identified.",
    "Heart: Normal cardiac silhouette. No pericardial effusion.",
    "Mediastinum: No significant lymphadenopathy. Normal great vessels.",
    "Bones: No acute osseous abnormality. Degenerative changes of the thoracic spine.",
    "Soft tissues: Unremarkable.",
  ];
  findings.forEach((f) => {
    y = checkPage(doc, y, 15);
    const lines = doc.splitTextToSize(`• ${f}`, 165);
    doc.text(lines, 22, y);
    y += lines.length * 5 + 3;
  });

  // 7. Interpretation & Conclusion
  y += 2;
  y = checkPage(doc, y, 30);
  y = addSection(doc, t(lang, "interpretation"), y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("1. No acute cardiopulmonary findings.", 22, y);
  y += 6;
  doc.text("2. Normal CT chest examination.", 22, y);
  y += 6;
  doc.text("3. Clinical correlation recommended if symptoms persist.", 22, y);

  // 8. Report Date
  y += 10;
  y = checkPage(doc, y, 20);
  y = addSection(doc, t(lang, "reportDate"), y);
  y = addField(doc, t(lang, "dateOfRedaction"), dateStr, y);

  // 9. Image Conservation
  y += 4;
  y = checkPage(doc, y, 30);
  y = addSection(doc, t(lang, "imageConservation"), y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 70, 80);
  const consLines = doc.splitTextToSize(t(lang, "conservationText"), 165);
  doc.text(consLines, 22, y);
  y += consLines.length * 4.5 + 4;

  // Footer – electronic validity
  y += 6;
  y = checkPage(doc, y, 40);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 190, y);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(t(lang, "validWithout"), 105, y, { align: "center" });
  doc.text(`Report ID: RPT-${patientId}-${Date.now().toString(36).toUpperCase()}`, 105, y + 5, { align: "center" });

  // Privacy / RGPD
  y += 14;
  y = checkPage(doc, y, 40);
  doc.setDrawColor(56, 189, 176);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);
  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(120, 140, 160);
  doc.setFont("helvetica", "bold");
  doc.text(t(lang, "privacyTitle"), 105, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  [t(lang, "privacy1"), t(lang, "privacy2"), t(lang, "privacy3")].forEach((line) => {
    const wrapped = doc.splitTextToSize(line, 165);
    doc.text(wrapped, 105, y, { align: "center" });
    y += wrapped.length * 3.5 + 1.5;
  });

  return doc.output("blob");
}

function addWrappedText(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const lines = doc.splitTextToSize(text || "N/A", 165);
  for (const line of lines) {
    y = checkPage(doc, y, 8);
    doc.text(line, 22, y);
    y += 5;
  }
  return y + 2;
}

export function generateReportFromData(
  data: ReportData,
  lang: ReportLanguage = "en"
): Blob {
  const doc = new jsPDF();
  const now = new Date(data.generation_date);
  const dateStr = now.toLocaleDateString(lang === "en" ? "en-US" : lang, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Header (same styling as mock)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(56, 189, 176);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(t(lang, "title"), 105, 18, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(t(lang, "confidential"), 105, 28, { align: "center" });

  let y = 55;

  // Section 1: Patient ID + Date
  y = addSection(doc, t(lang, "patientInfo"), y);
  y = addField(doc, t(lang, "patientId"), data.patient_id, y);
  y = addField(doc, t(lang, "dateOfRedaction"), dateStr, y);

  // Section 3: Indication globale
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "globalIndication"), y);
  y = addWrappedText(doc, data.indication, y);

  // Section 4: Examens analysés
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "examInfo"), y);
  if (data.exams.length > 0) {
    data.exams.forEach((exam) => {
      y = checkPage(doc, y, 12);
      const label = exam.accession_number
        ? `${exam.exam_type} (${exam.accession_number})`
        : exam.exam_type;
      y = addField(doc, exam.date, label, y);
    });
  } else {
    y = addWrappedText(doc, "N/A", y);
  }

  // Section 5: Synthèse des lésions
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "lesionSummary"), y);
  if (data.lesion_summary.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    data.lesion_summary.forEach((lesion) => {
      y = checkPage(doc, y, 15);
      const lines = doc.splitTextToSize(
        `• [${lesion.date}] ${lesion.description}`,
        165
      );
      doc.text(lines, 22, y);
      y += lines.length * 5 + 3;
    });
  } else {
    y = addWrappedText(doc, "N/A", y);
  }

  // Section 6: Évolution
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "evolutionTitle"), y);
  y = addWrappedText(doc, data.evolution, y);

  // Section 7: Points d'attention / Discordances
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "attentionPoints"), y);
  y = addWrappedText(doc, data.attention_points, y);

  // Section 8: Synthèse finale
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "finalSynthesis"), y);
  y = addWrappedText(doc, data.final_synthesis, y);

  // Section 9: TNM Stage
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "tnmStage"), y);
  y = addWrappedText(doc, data.tnm_stage, y);

  // Warnings if any
  if (data.warnings.length > 0) {
    y += 4;
    y = checkPage(doc, y, 30);
    y = addSection(doc, t(lang, "warningsTitle"), y);
    doc.setTextColor(200, 80, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    data.warnings.forEach((w) => {
      y = checkPage(doc, y, 10);
      const lines = doc.splitTextToSize(`⚠ ${w}`, 165);
      doc.text(lines, 22, y);
      y += lines.length * 4.5 + 3;
    });
    doc.setTextColor(30, 41, 59);
  }

  // Footer
  y += 6;
  y = checkPage(doc, y, 40);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 190, y);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(t(lang, "validWithout"), 105, y, { align: "center" });
  doc.text(
    `Report ID: RPT-${data.patient_id}-${Date.now().toString(36).toUpperCase()}`,
    105,
    y + 5,
    { align: "center" }
  );

  // Privacy / RGPD
  y += 14;
  y = checkPage(doc, y, 40);
  doc.setDrawColor(56, 189, 176);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);
  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(120, 140, 160);
  doc.setFont("helvetica", "bold");
  doc.text(t(lang, "privacyTitle"), 105, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  [t(lang, "privacy1"), t(lang, "privacy2"), t(lang, "privacy3")].forEach(
    (line) => {
      const wrapped = doc.splitTextToSize(line, 165);
      doc.text(wrapped, 105, y, { align: "center" });
      y += wrapped.length * 3.5 + 1.5;
    }
  );

  return doc.output("blob");
}
