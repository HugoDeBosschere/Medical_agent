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
    patientTitle: "PATIENT SUMMARY",
    patientConfidential: "Confidential Patient Document",
    patientSummarySection: "YOUR RESULTS EXPLAINED",
    patientDisclaimer: "IMPORTANT NOTICE",
    patientDisclaimerText:
      "This summary is provided for informational purposes only. It is based on your medical imaging reports and is not a substitute for a consultation with your doctor. Please discuss these results with your healthcare provider for a complete understanding of your condition and next steps.",
    generationScore: "GENERATION QUALITY SCORE",
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
    patientTitle: "RESUME PATIENT",
    patientConfidential: "Document Patient Confidentiel",
    patientSummarySection: "VOS RESULTATS EXPLIQUES",
    patientDisclaimer: "AVIS IMPORTANT",
    patientDisclaimerText:
      "Ce resume est fourni a titre informatif uniquement. Il est base sur vos comptes rendus d'imagerie medicale et ne remplace pas une consultation avec votre medecin. Veuillez discuter de ces resultats avec votre professionnel de sante pour une comprehension complete de votre situation et des prochaines etapes.",
    generationScore: "SCORE DE QUALITE DE GENERATION",
  },
};

function t(lang: ReportLanguage, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

/** Safely coerce any value to a string – prevents jsPDF "t2.split is not a function" crash */
function safeStr(v: unknown): string {
  if (v === null || v === undefined) return "N/A";
  return String(v);
}

/** Strip markdown formatting markers that would appear literally in the PDF.
 *  This is a client-side safety net complementing the backend stripping. */
function stripMarkdown(text: string): string {
  if (!text) return text;
  // Remove bold: **text**
  let result = text.replace(/\*\*(.+?)\*\*/g, "$1");
  // Remove bold: __text__
  result = result.replace(/__(.+?)__/g, "$1");
  // Remove heading markers: ## text → text
  result = result.replace(/^#{1,6}\s+/gm, "");
  return result;
}

/** Convert YYYYMMDD to YYYY-MM-DD. Pass through other formats unchanged. */
function formatDate(dateStr: string): string {
  const s = dateStr.trim();
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return s;
}

/** Return a sortable key for anti-chronological ordering (YYYY-MM-DD). */
function dateSortKey(dateStr: string): string {
  const s = formatDate(dateStr);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "0000-00-00";
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
  doc.text(safeStr(label), 22, y);
  doc.setFont("helvetica", "normal");
  doc.text(stripMarkdown(safeStr(value)), 72, y);
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
  const lines = doc.splitTextToSize(stripMarkdown(safeStr(sanitizeDictString(text))), 165);
  for (const line of lines) {
    y = checkPage(doc, y, 8);
    doc.text(line, 22, y);
    y += 5;
  }
  return y + 2;
}

/**
 * Detect Python-style dict strings like {'key': 'value'} and convert them
 * to human-readable "key: value" lines. This is a client-side safety net
 * for any dict structures that slip through backend sanitization.
 */
function sanitizeDictString(text: string): string {
  if (!text || !text.includes("{")) return text;

  // Try to parse the entire string as a dict
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const parsed = tryParseDict(trimmed);
    if (parsed) return formatDictToText(parsed);
  }

  // Replace inline dict substrings
  return text.replace(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, (match) => {
    const parsed = tryParseDict(match);
    if (parsed) return formatDictToText(parsed);
    return match;
  });
}

function tryParseDict(s: string): Record<string, unknown> | null {
  // Try JSON
  try {
    const obj = JSON.parse(s);
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) return obj;
  } catch { /* noop */ }
  // Try with single→double quote conversion
  try {
    const obj = JSON.parse(s.replace(/'/g, '"'));
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) return obj;
  } catch { /* noop */ }
  return null;
}

function formatDictToText(obj: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const inner = Object.entries(v as Record<string, unknown>)
        .filter(([, iv]) => iv)
        .map(([ik, iv]) => `${ik}: ${String(iv)}`)
        .join("; ");
      parts.push(`${k}: ${inner}`);
    } else if (v) {
      parts.push(`${k}: ${String(v)}`);
    }
  }
  return parts.join("\n");
}

/** Render final_synthesis – handle dict-like strings, newline-delimited text, or plain text */
function addFormattedSynthesis(doc: jsPDF, text: string, y: number, lang: ReportLanguage): number {
  const s = safeStr(text).trim();

  // Attempt to parse as JSON if it looks like a dict/object
  if (s.startsWith("{")) {
    try {
      // Handle Python-style single quotes by converting to double quotes
      const jsonStr = s.replace(/'/g, '"');
      const obj = JSON.parse(jsonStr);
      if (typeof obj === "object" && obj !== null) {
        const labelMap: Record<string, Record<string, string>> = {
          en: { Diagnosis: "Diagnosis", Recommendation: "Recommendation" },
          fr: { Diagnosis: "Diagnostic", Recommendation: "Recommandation" },
        };
        const excluded = new Set(["Hypothesis", "hypothesis", "Hypothèse", "hypothèse"]);
        const labels = labelMap[lang] ?? labelMap.en;
        for (const [key, val] of Object.entries(obj)) {
          if (val && !excluded.has(key)) {
            y = checkPage(doc, y, 14);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            const label = labels[key] ?? key;
            doc.text(`${label} :`, 22, y);
            y += 6;
            y = addWrappedText(doc, String(val), y);
          }
        }
        return y;
      }
    } catch {
      // Not valid JSON, fall through to text handling
    }
  }

  // Handle newline-delimited text (from backend formatting)
  if (s.includes("\n")) {
    for (const line of s.split("\n")) {
      if (line.trim()) {
        y = addWrappedText(doc, line.trim(), y);
      }
    }
    return y;
  }

  // Plain text fallback
  return addWrappedText(doc, s, y);
}

/** Render tnm_stage – handle dict-like strings with T/N/M keys, or plain text */
function addFormattedTNM(doc: jsPDF, text: string, y: number, lang: ReportLanguage): number {
  const s = safeStr(text).trim();

  // If it looks like a dict/object, try to parse and format it
  if (s.startsWith("{")) {
    const parsed = tryParseDict(s);
    if (parsed) {
      const labelMap: Record<string, string> = {
        T: "T", N: "N", M: "M",
        stage_grouping: "Classification",
        note: "Note",
      };
      const keyOrder = ["T", "N", "M", "stage_grouping", "note"];
      const rendered = new Set<string>();
      for (const key of keyOrder) {
        const val = parsed[key];
        if (val) {
          y = checkPage(doc, y, 14);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(30, 41, 59);
          doc.text(`${labelMap[key] ?? key} :`, 22, y);
          y += 6;
          y = addWrappedText(doc, String(val), y);
          rendered.add(key);
        }
      }
      // Render any extra keys
      for (const [key, val] of Object.entries(parsed)) {
        if (!rendered.has(key) && val) {
          y = checkPage(doc, y, 14);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(30, 41, 59);
          doc.text(`${key} :`, 22, y);
          y += 6;
          y = addWrappedText(doc, String(val), y);
        }
      }
      return y;
    }
  }

  // Handle newline-delimited text (from backend formatting)
  if (s.includes("\n")) {
    for (const line of s.split("\n")) {
      if (line.trim()) {
        // Check if line has a label prefix like "T : ..."
        const colonIdx = line.indexOf(" : ");
        if (colonIdx > 0 && colonIdx < 20) {
          y = checkPage(doc, y, 14);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(30, 41, 59);
          doc.text(line.substring(0, colonIdx + 3), 22, y);
          y += 6;
          y = addWrappedText(doc, line.substring(colonIdx + 3).trim(), y);
        } else {
          y = addWrappedText(doc, line.trim(), y);
        }
      }
    }
    return y;
  }

  // Plain text fallback
  return addWrappedText(doc, s, y);
}

/** Compute a red→yellow→green color from a 0–100 score. */
function scoreToColor(score: number): [number, number, number] {
  const s = Math.max(0, Math.min(100, score));
  // 0 = red (220,53,69) → 50 = yellow (255,193,7) → 100 = green (40,167,69)
  if (s <= 50) {
    const t = s / 50;
    return [
      Math.round(220 + (255 - 220) * t),
      Math.round(53 + (193 - 53) * t),
      Math.round(69 + (7 - 69) * t),
    ];
  }
  const t2 = (s - 50) / 50;
  return [
    Math.round(255 + (40 - 255) * t2),
    Math.round(193 + (167 - 193) * t2),
    Math.round(7 + (69 - 7) * t2),
  ];
}

/** Recursively search a JSON object for a numeric field by name. */
function findJsonValue(obj: unknown, keys: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    if (key in record) return record[key];
  }
  // Search one level deeper
  for (const val of Object.values(record)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const found = findJsonValue(val, keys);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** Collect all error strings from a JSON evaluation object (any nesting depth). */
function collectJsonErrors(obj: unknown): string[] {
  const errors: string[] = [];
  if (!obj || typeof obj !== "object") return errors;
  const record = obj as Record<string, unknown>;
  if (Array.isArray(record.errors)) {
    for (const e of record.errors) {
      if (typeof e === "string" && e.trim()) errors.push(e.trim());
    }
  }
  for (const val of Object.values(record)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      errors.push(...collectJsonErrors(val));
    }
  }
  return errors;
}

/** Build a short summary of the judge evaluation for display. */
function buildJudgeSummary(obj: Record<string, unknown>): string {
  // Flatten to the evaluation object if wrapped
  const eval_obj = (obj.evaluation && typeof obj.evaluation === "object" ? obj.evaluation : obj) as Record<string, unknown>;

  // Count section statuses
  const statuses: Record<string, string[]> = { Correct: [], Incomplete: [], Incorrect: [], "Not valid": [] };
  for (const [key, val] of Object.entries(eval_obj)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const section = val as Record<string, unknown>;
      const status = String(section.status ?? section.evaluation ?? "").trim();
      const label = key.replace(/_/g, " ");
      if (status in statuses) {
        statuses[status].push(label);
      }
    }
  }

  const parts: string[] = [];
  if (statuses["Incorrect"].length > 0) {
    parts.push(`Incorrect: ${statuses["Incorrect"].join(", ")}`);
  }
  if (statuses["Not valid"].length > 0) {
    parts.push(`Not valid: ${statuses["Not valid"].join(", ")}`);
  }
  if (statuses["Incomplete"].length > 0) {
    parts.push(`Incomplete: ${statuses["Incomplete"].join(", ")}`);
  }
  if (parts.length === 0 && statuses["Correct"].length > 0) {
    parts.push("All sections correct");
  }

  // Add top error if we have room
  const errors = collectJsonErrors(eval_obj);
  if (errors.length > 0 && parts.join(". ").length < 100) {
    parts.push(errors[0]);
  }

  let summary = parts.join(". ");
  if (summary.length > 200) {
    summary = summary.substring(0, 197) + "...";
  }
  return summary;
}

/** Extract score, verdict, and explanation from the judge output (JSON or free-form text). */
function parseJudgeEvaluation(evaluationText: string): {
  score: number; verdict: string; explanation: string;
} | null {
  // Try JSON parsing first — the LLM returns structured JSON
  try {
    const trimmed = evaluationText.trim();
    const jsonStr = trimmed.startsWith("{") ? trimmed : trimmed.match(/\{[\s\S]*\}/)?.[0];
    if (jsonStr) {
      const obj = JSON.parse(jsonStr);

      // Recursively find score — handles both obj.global_score and obj.evaluation.global_score
      const rawScore = findJsonValue(obj, ["global_score", "globalScore", "score"]);
      const numScore = typeof rawScore === "number" ? rawScore
        : typeof rawScore === "string" ? parseInt(rawScore, 10)
        : null;

      if (numScore !== null && !isNaN(numScore) && numScore >= 0 && numScore <= 100) {
        // Recursively find verdict
        const rawVerdict = findJsonValue(obj, ["final_verdict", "finalVerdict", "verdict"]);
        const verdict = String(rawVerdict ?? "").toUpperCase().includes("PASS") ? "PASS"
          : String(rawVerdict ?? "").toUpperCase().includes("FAIL") ? "FAIL" : "";

        const explanation = buildJudgeSummary(obj);
        return { score: numScore, verdict, explanation };
      }
    }
  } catch { /* Not valid JSON, fall through */ }

  // Fallback: regex-based extraction for free-form text
  const scorePatterns = [
    /(?:global\s*score|score\s*global)[^0-9]*(\d{1,3})/i,
    /score[^0-9]*(\d{1,3})\s*(?:\/\s*100|%)/i,
    /(\d{1,3})\s*\/\s*100/,
  ];
  let score: number | null = null;
  for (const pat of scorePatterns) {
    const m = evaluationText.match(pat);
    if (m) {
      const val = parseInt(m[1], 10);
      if (val >= 0 && val <= 100) { score = val; break; }
    }
  }
  if (score === null) return null;

  const verdictMatch = evaluationText.match(/(?:final\s*)?verdict[^A-Z]*(PASS|FAIL)/i)
    ?? evaluationText.match(/\b(PASS|FAIL)\b/);
  const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : "";

  let explanation = "";
  const lines = evaluationText.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    if (line.length > 10 && !line.match(/score/i) && !line.match(/verdict/i)) {
      explanation = line.trim();
    }
  }
  if (explanation.length > 200) {
    explanation = explanation.substring(0, 197) + "...";
  }

  return { score, verdict, explanation };
}

/** Parse the judge output and render a colored score badge section. */
function addGenerationScoreBadge(
  doc: jsPDF,
  evaluationText: string,
  y: number,
  lang: ReportLanguage
): number {
  if (!evaluationText) return y;

  console.log("[LLM-as-Judge] generation_evaluation received:", evaluationText.substring(0, 300));

  const parsed = parseJudgeEvaluation(evaluationText);
  if (!parsed) {
    console.log("[LLM-as-Judge] Could not extract score from evaluation text");
    return y;
  }

  const { score, verdict, explanation } = parsed;

  // Render section
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "generationScore"), y);

  // Draw colored badge (rounded rect)
  const [r, g, b] = scoreToColor(score);
  const badgeText = verdict ? `${score}/100 — ${verdict}` : `${score}/100`;
  doc.setFontSize(10);
  const badgeWidth = doc.getTextWidth(badgeText) + 12;
  const badgeHeight = 8;
  const badgeX = 22;
  const badgeY = y - 5.5;

  doc.setFillColor(r, g, b);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(badgeText, badgeX + 6, y);
  y += 10;

  // Explanation text
  if (explanation) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const expLines = doc.splitTextToSize(stripMarkdown(explanation), 165);
    for (const line of expLines) {
      y = checkPage(doc, y, 6);
      doc.text(line, 22, y);
      y += 4;
    }
    y += 2;
  }

  // Reset text color
  doc.setTextColor(30, 41, 59);
  return y;
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

  // ── A. CLINICAL CONTEXT ──────────────────────────────────────────────
  // Section 1: Patient ID + Date
  y = addSection(doc, t(lang, "patientInfo"), y);
  y = addField(doc, t(lang, "patientId"), data.patient_id, y);
  y = addField(doc, t(lang, "dateOfRedaction"), dateStr, y);

  // ── B. BOTTOM LINE UP FRONT (BLUF) ──────────────────────────────────
  // Section 2: Synthèse finale (most important — at the top)
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "finalSynthesis"), y);
  y = addFormattedSynthesis(doc, data.final_synthesis, y, lang);

  // Section 3: Indication globale
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "globalIndication"), y);
  y = addWrappedText(doc, data.indication, y);

  // Section 4: TNM Stage (grouped with synthesis)
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "tnmStage"), y);
  y = addFormattedTNM(doc, data.tnm_stage, y, lang);

  // Section 5: Évolution (disease trajectory — second most important)
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "evolutionTitle"), y);
  if (typeof data.evolution === "object" && data.evolution) {
    const evoLabels: Record<string, string> = {
      pulmonary: lang === "fr" ? "Pulmonaire" : "Pulmonary",
      nodes: lang === "fr" ? "Ganglions" : "Lymph Nodes",
      metastasis_extra_pulmonary: lang === "fr" ? "Métastases extra-pulmonaires" : "Extra-pulmonary Metastases",
    };
    for (const [key, val] of Object.entries(data.evolution)) {
      if (val) {
        y = checkPage(doc, y, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text(evoLabels[key] ?? key, 22, y);
        y += 6;
        // Sanitize any remaining dict strings in the evolution sub-field
        const cleanVal = sanitizeDictString(String(val));
        // If the sanitized text contains newlines (formatted from dict), render each line
        if (cleanVal.includes("\n")) {
          for (const line of cleanVal.split("\n")) {
            if (line.trim()) {
              y = addWrappedText(doc, line.trim(), y);
            }
          }
        } else {
          y = addWrappedText(doc, cleanVal, y);
        }
      }
    }
  } else {
    y = addWrappedText(doc, safeStr(data.evolution), y);
  }

  // ── C. TECHNICAL DETAILS & RAW DATA ──────────────────────────────────
  // Section 6: Examens analysés (dates formatted, anti-chronological)
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "examInfo"), y);
  const exams = [...(data.exams ?? [])].sort(
    (a, b) => dateSortKey(b.date).localeCompare(dateSortKey(a.date))
  );
  if (exams.length > 0) {
    exams.forEach((exam) => {
      y = checkPage(doc, y, 12);
      y = addField(doc, formatDate(safeStr(exam.date)), safeStr(exam.exam_type), y);
    });
  } else {
    y = addWrappedText(doc, "N/A", y);
  }

  // Section 7: Synthèse des lésions (dates formatted, anti-chronological)
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "lesionSummary"), y);
  const lesions = [...(data.lesion_summary ?? [])].sort(
    (a, b) => dateSortKey(b.date).localeCompare(dateSortKey(a.date))
  );
  if (lesions.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    lesions.forEach((lesion) => {
      y = checkPage(doc, y, 15);
      // Build a composite description from the structured fields
      const parts = [
        stripMarkdown(safeStr(lesion.anomaly)),
        lesion.position ? stripMarkdown(safeStr(lesion.position)) : "",
        lesion.size ? `(${stripMarkdown(safeStr(lesion.size))})` : "",
        lesion.nature ? stripMarkdown(safeStr(lesion.nature)) : "",
        lesion.observations ? stripMarkdown(safeStr(lesion.observations)) : "",
      ].filter(Boolean).join(" – ");
      const label = parts || "N/A";
      const lines = doc.splitTextToSize(
        `• [${formatDate(safeStr(lesion.date))}] ${label}`,
        165
      );
      doc.text(lines, 22, y);
      y += lines.length * 5 + 3;
    });
  } else {
    y = addWrappedText(doc, "N/A", y);
  }

  // ── D. META-DATA & DISCLAIMERS ───────────────────────────────────────
  // Section 8: Points d'attention / Discordances
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "attentionPoints"), y);
  if (Array.isArray(data.attention_points)) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    data.attention_points.forEach((pt) => {
      y = checkPage(doc, y, 15);
      const desc = typeof pt === "object"
        ? `• ${stripMarkdown(safeStr(pt.description))} (Source: ${stripMarkdown(safeStr(pt.exam_source))}, Ref: ${stripMarkdown(safeStr(pt.ct_reference))})`
        : `• ${stripMarkdown(safeStr(pt))}`;
      const lines = doc.splitTextToSize(desc, 165);
      doc.text(lines, 22, y);
      y += lines.length * 5 + 3;
    });
    if (data.attention_points.length === 0) {
      y = addWrappedText(doc, "N/A", y);
    }
  } else {
    y = addWrappedText(doc, safeStr(data.attention_points), y);
  }

  // Section 9: Warnings (if any)
  const warnings = data.warnings ?? [];
  if (warnings.length > 0) {
    y += 4;
    y = checkPage(doc, y, 30);
    y = addSection(doc, t(lang, "warningsTitle"), y);
    doc.setTextColor(200, 80, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    warnings.forEach((w) => {
      y = checkPage(doc, y, 10);
      const lines = doc.splitTextToSize(`/!\\ ${safeStr(w)}`, 165);
      doc.text(lines, 22, y);
      y += lines.length * 4.5 + 3;
    });
    doc.setTextColor(30, 41, 59);
  }

  // Generation Quality Score badge
  if (data.generation_evaluation) {
    y = addGenerationScoreBadge(doc, data.generation_evaluation, y, lang);
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

export function generatePatientReport(
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

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(56, 189, 176);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(t(lang, "patientTitle"), 105, 18, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(t(lang, "patientConfidential"), 105, 28, { align: "center" });

  let y = 55;

  // Section 1: Patient ID + Date
  y = addSection(doc, t(lang, "patientInfo"), y);
  y = addField(doc, t(lang, "patientId"), data.patient_id, y);
  y = addField(doc, t(lang, "dateOfRedaction"), dateStr, y);

  // Section 2: Patient Summary
  y += 4;
  y = checkPage(doc, y, 40);
  y = addSection(doc, t(lang, "patientSummarySection"), y);
  y = addWrappedText(doc, stripMarkdown(data.patient_summary || "N/A"), y);

  // Section 3: Disclaimer
  y += 8;
  y = checkPage(doc, y, 50);
  y = addSection(doc, t(lang, "patientDisclaimer"), y);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const disclaimerLines = doc.splitTextToSize(
    t(lang, "patientDisclaimerText"),
    165
  );
  for (const line of disclaimerLines) {
    y = checkPage(doc, y, 8);
    doc.text(line, 22, y);
    y += 5;
  }

  // Generation Quality Score badge
  if (data.generation_evaluation) {
    y = addGenerationScoreBadge(doc, data.generation_evaluation, y, lang);
  }

  // Footer: RGPD
  y += 10;
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
