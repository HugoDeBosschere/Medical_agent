import jsPDF from "jspdf";

export type ReportLanguage = "en" | "fr" | "es" | "de" | "it" | "pt" | "ar" | "zh" | "ja" | "ru";

export const LANGUAGE_LABELS: Record<ReportLanguage, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ar: "العربية",
  zh: "中文",
  ja: "日本語",
  ru: "Русский",
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
  },
  es: {
    title: "INFORME RADIOLÓGICO",
    confidential: "Documento Médico Confidencial",
    patientInfo: "IDENTIFICACIÓN DEL PACIENTE",
    patientId: "N° Paciente:",
    lastName: "Apellido:",
    firstName: "Nombre:",
    dob: "Fecha de nacimiento:",
    examInfo: "DETALLES DEL EXAMEN",
    examDate: "Fecha del examen:",
    examType: "Tipo de examen:",
    areasExplored: "Zonas exploradas:",
    modalities: "Modalidades:",
    incidents: "Incidentes:",
    referringPhysician: "MÉDICO PRESCRIPTOR",
    physicianName: "Nombre:",
    physicianContact: "Contacto:",
    radiologist: "RADIÓLOGO",
    radiologistName: "Nombre:",
    radiologistSignature: "Firma digital:",
    technicalDesc: "DESCRIPCIÓN TÉCNICA",
    findings: "HALLAZGOS DESCRIPTIVOS",
    interpretation: "INTERPRETACIÓN Y CONCLUSIÓN",
    reportDate: "FECHA DEL INFORME",
    dateOfRedaction: "Fecha de redacción:",
    imageConservation: "CONSERVACIÓN DE IMÁGENES",
    conservationText: "Las imágenes médicas se almacenan en PACS en formato DICOM durante un período mínimo de 20 años, conforme a la normativa sanitaria vigente. El acceso está restringido al personal médico autorizado.",
    privacyTitle: "AVISO DE PRIVACIDAD Y PROTECCIÓN DE DATOS",
    privacy1: "Este informe ha sido generado en cumplimiento con el Reglamento General de Protección de Datos (RGPD – Reglamento UE 2016/679).",
    privacy2: "Los datos del paciente han sido tratados exclusivamente con fines de diagnóstico médico.",
    privacy3: "No se han compartido datos personales con terceros no autorizados.",
    validWithout: "Este documento fue generado electrónicamente y es válido sin firma manuscrita.",
    noIncidents: "Sin incidentes durante el examen.",
  },
  de: {
    title: "RADIOLOGISCHER BEFUND",
    confidential: "Vertrauliches medizinisches Dokument",
    patientInfo: "PATIENTENDATEN",
    patientId: "Patienten-ID:",
    lastName: "Nachname:",
    firstName: "Vorname:",
    dob: "Geburtsdatum:",
    examInfo: "UNTERSUCHUNGSDETAILS",
    examDate: "Untersuchungsdatum:",
    examType: "Untersuchungstyp:",
    areasExplored: "Untersuchte Bereiche:",
    modalities: "Modalitäten:",
    incidents: "Zwischenfälle:",
    referringPhysician: "ÜBERWEISENDER ARZT",
    physicianName: "Name:",
    physicianContact: "Kontakt:",
    radiologist: "RADIOLOGE",
    radiologistName: "Name:",
    radiologistSignature: "Digitale Unterschrift:",
    technicalDesc: "TECHNISCHE BESCHREIBUNG",
    findings: "BESCHREIBENDER BEFUND",
    interpretation: "INTERPRETATION UND SCHLUSSFOLGERUNG",
    reportDate: "BERICHTSDATUM",
    dateOfRedaction: "Erstellungsdatum:",
    imageConservation: "BILDARCHIVIERUNG",
    conservationText: "Medizinische Bilder werden im PACS im DICOM-Format für mindestens 20 Jahre aufbewahrt. Der Zugriff ist auf autorisiertes medizinisches Personal beschränkt.",
    privacyTitle: "DATENSCHUTZHINWEIS",
    privacy1: "Dieser Bericht wurde in Übereinstimmung mit der DSGVO (EU-Verordnung 2016/679) erstellt.",
    privacy2: "Patientendaten wurden ausschließlich zum Zweck der medizinischen Diagnostik verarbeitet.",
    privacy3: "Es wurden keine personenbezogenen Daten an unbefugte Dritte weitergegeben.",
    validWithout: "Dieses Dokument wurde elektronisch erstellt und ist ohne handschriftliche Unterschrift gültig.",
    noIncidents: "Keine Zwischenfälle während der Untersuchung.",
  },
  it: {
    title: "REFERTO RADIOLOGICO",
    confidential: "Documento Medico Riservato",
    patientInfo: "DATI DEL PAZIENTE",
    patientId: "ID Paziente:",
    lastName: "Cognome:",
    firstName: "Nome:",
    dob: "Data di nascita:",
    examInfo: "DETTAGLI DELL'ESAME",
    examDate: "Data dell'esame:",
    examType: "Tipo di esame:",
    areasExplored: "Zone esplorate:",
    modalities: "Modalità:",
    incidents: "Incidenti:",
    referringPhysician: "MEDICO RICHIEDENTE",
    physicianName: "Nome:",
    physicianContact: "Contatto:",
    radiologist: "RADIOLOGO",
    radiologistName: "Nome:",
    radiologistSignature: "Firma digitale:",
    technicalDesc: "DESCRIZIONE TECNICA",
    findings: "DESCRIZIONE DEI REPERTI",
    interpretation: "INTERPRETAZIONE E CONCLUSIONE",
    reportDate: "DATA DEL REFERTO",
    dateOfRedaction: "Data di redazione:",
    imageConservation: "CONSERVAZIONE DELLE IMMAGINI",
    conservationText: "Le immagini mediche sono conservate nel sistema PACS in formato DICOM per un periodo minimo di 20 anni. L'accesso è riservato al personale medico autorizzato.",
    privacyTitle: "INFORMATIVA SULLA PRIVACY",
    privacy1: "Questo referto è stato generato in conformità con il GDPR (Regolamento UE 2016/679).",
    privacy2: "I dati del paziente sono stati trattati esclusivamente a fini diagnostici.",
    privacy3: "Nessun dato personale è stato condiviso con terze parti non autorizzate.",
    validWithout: "Questo documento è stato generato elettronicamente ed è valido senza firma autografa.",
    noIncidents: "Nessun incidente durante l'esame.",
  },
  pt: {
    title: "RELATÓRIO RADIOLÓGICO",
    confidential: "Documento Médico Confidencial",
    patientInfo: "IDENTIFICAÇÃO DO PACIENTE",
    patientId: "N° Paciente:",
    lastName: "Sobrenome:",
    firstName: "Nome:",
    dob: "Data de nascimento:",
    examInfo: "DETALHES DO EXAME",
    examDate: "Data do exame:",
    examType: "Tipo de exame:",
    areasExplored: "Áreas exploradas:",
    modalities: "Modalidades:",
    incidents: "Incidentes:",
    referringPhysician: "MÉDICO SOLICITANTE",
    physicianName: "Nome:",
    physicianContact: "Contato:",
    radiologist: "RADIOLOGISTA",
    radiologistName: "Nome:",
    radiologistSignature: "Assinatura digital:",
    technicalDesc: "DESCRIÇÃO TÉCNICA",
    findings: "ACHADOS DESCRITIVOS",
    interpretation: "INTERPRETAÇÃO E CONCLUSÃO",
    reportDate: "DATA DO RELATÓRIO",
    dateOfRedaction: "Data de redação:",
    imageConservation: "CONSERVAÇÃO DAS IMAGENS",
    conservationText: "As imagens médicas são armazenadas no PACS em formato DICOM por um período mínimo de 20 anos. O acesso é restrito ao pessoal médico autorizado.",
    privacyTitle: "AVISO DE PRIVACIDADE E PROTEÇÃO DE DADOS",
    privacy1: "Este relatório foi gerado em conformidade com o RGPD (Regulamento UE 2016/679).",
    privacy2: "Os dados do paciente foram tratados exclusivamente para fins de diagnóstico médico.",
    privacy3: "Nenhum dado pessoal foi compartilhado com terceiros não autorizados.",
    validWithout: "Este documento foi gerado eletronicamente e é válido sem assinatura manuscrita.",
    noIncidents: "Sem incidentes durante o exame.",
  },
  ar: {
    title: "تقرير الأشعة",
    confidential: "وثيقة طبية سرية",
    patientInfo: "بيانات المريض",
    patientId: "رقم المريض:",
    lastName: "اللقب:",
    firstName: "الاسم:",
    dob: "تاريخ الميلاد:",
    examInfo: "تفاصيل الفحص",
    examDate: "تاريخ الفحص:",
    examType: "نوع الفحص:",
    areasExplored: "المناطق المفحوصة:",
    modalities: "الطرائق:",
    incidents: "الحوادث:",
    referringPhysician: "الطبيب المحيل",
    physicianName: "الاسم:",
    physicianContact: "الاتصال:",
    radiologist: "أخصائي الأشعة",
    radiologistName: "الاسم:",
    radiologistSignature: "التوقيع الرقمي:",
    technicalDesc: "الوصف التقني",
    findings: "النتائج الوصفية",
    interpretation: "التفسير والاستنتاج",
    reportDate: "تاريخ التقرير",
    dateOfRedaction: "تاريخ التحرير:",
    imageConservation: "حفظ الصور",
    conservationText: "يتم تخزين الصور الطبية في نظام PACS بتنسيق DICOM لمدة لا تقل عن 20 عامًا. الوصول مقصور على الموظفين الطبيين المصرح لهم.",
    privacyTitle: "إشعار الخصوصية وحماية البيانات",
    privacy1: "تم إنشاء هذا التقرير وفقًا للائحة العامة لحماية البيانات (GDPR – اللائحة الأوروبية 2016/679).",
    privacy2: "تمت معالجة بيانات المريض فقط لأغراض التشخيص الطبي.",
    privacy3: "لم تتم مشاركة أي بيانات شخصية مع أطراف ثالثة غير مصرح لها.",
    validWithout: "تم إنشاء هذا المستند إلكترونيًا وهو صالح بدون توقيع مكتوب بخط اليد.",
    noIncidents: "لا حوادث أثناء الفحص.",
  },
  zh: {
    title: "放射科报告",
    confidential: "机密医疗文件",
    patientInfo: "患者信息",
    patientId: "患者编号：",
    lastName: "姓：",
    firstName: "名：",
    dob: "出生日期：",
    examInfo: "检查详情",
    examDate: "检查日期：",
    examType: "检查类型：",
    areasExplored: "检查部位：",
    modalities: "检查方式：",
    incidents: "异常情况：",
    referringPhysician: "开单医生",
    physicianName: "姓名：",
    physicianContact: "联系方式：",
    radiologist: "放射科医师",
    radiologistName: "姓名：",
    radiologistSignature: "电子签名：",
    technicalDesc: "技术描述",
    findings: "影像描述",
    interpretation: "诊断意见与结论",
    reportDate: "报告日期",
    dateOfRedaction: "撰写日期：",
    imageConservation: "影像保存",
    conservationText: "医学影像以DICOM格式存储于PACS系统中，最低保存期限为20年。仅授权医务人员可访问。",
    privacyTitle: "隐私与数据保护声明",
    privacy1: "本报告依据《通用数据保护条例》（GDPR – 欧盟法规2016/679）生成。",
    privacy2: "患者数据仅用于医学诊断目的。",
    privacy3: "未向未授权第三方共享任何个人数据。",
    validWithout: "本文件为电子生成，无需手写签名即为有效。",
    noIncidents: "检查期间无异常情况。",
  },
  ja: {
    title: "放射線科レポート",
    confidential: "機密医療文書",
    patientInfo: "患者情報",
    patientId: "患者ID：",
    lastName: "姓：",
    firstName: "名：",
    dob: "生年月日：",
    examInfo: "検査詳細",
    examDate: "検査日：",
    examType: "検査種別：",
    areasExplored: "検査部位：",
    modalities: "モダリティ：",
    incidents: "インシデント：",
    referringPhysician: "紹介医",
    physicianName: "氏名：",
    physicianContact: "連絡先：",
    radiologist: "放射線科医",
    radiologistName: "氏名：",
    radiologistSignature: "電子署名：",
    technicalDesc: "技術的記述",
    findings: "画像所見",
    interpretation: "読影結果・結論",
    reportDate: "レポート日付",
    dateOfRedaction: "作成日：",
    imageConservation: "画像保存",
    conservationText: "医用画像はPACSにDICOM形式で最低20年間保存されます。アクセスは認定された医療従事者に限定されます。",
    privacyTitle: "プライバシーおよびデータ保護に関する通知",
    privacy1: "本レポートはGDPR（EU規則2016/679）に準拠して作成されました。",
    privacy2: "患者データは医療診断目的のみに使用されています。",
    privacy3: "個人データは未承認の第三者と共有されていません。",
    validWithout: "本文書は電子的に作成されており、手書き署名なしで有効です。",
    noIncidents: "検査中にインシデントなし。",
  },
  ru: {
    title: "РАДИОЛОГИЧЕСКИЙ ОТЧЁТ",
    confidential: "Конфиденциальный медицинский документ",
    patientInfo: "ДАННЫЕ ПАЦИЕНТА",
    patientId: "ID Пациента:",
    lastName: "Фамилия:",
    firstName: "Имя:",
    dob: "Дата рождения:",
    examInfo: "ДЕТАЛИ ОБСЛЕДОВАНИЯ",
    examDate: "Дата обследования:",
    examType: "Тип обследования:",
    areasExplored: "Исследуемые области:",
    modalities: "Модальности:",
    incidents: "Инциденты:",
    referringPhysician: "НАПРАВЛЯЮЩИЙ ВРАЧ",
    physicianName: "Имя:",
    physicianContact: "Контакт:",
    radiologist: "РАДИОЛОГ",
    radiologistName: "Имя:",
    radiologistSignature: "Цифровая подпись:",
    technicalDesc: "ТЕХНИЧЕСКОЕ ОПИСАНИЕ",
    findings: "ОПИСАТЕЛЬНЫЕ РЕЗУЛЬТАТЫ",
    interpretation: "ИНТЕРПРЕТАЦИЯ И ЗАКЛЮЧЕНИЕ",
    reportDate: "ДАТА ОТЧЁТА",
    dateOfRedaction: "Дата составления:",
    imageConservation: "ХРАНЕНИЕ ИЗОБРАЖЕНИЙ",
    conservationText: "Медицинские изображения хранятся в системе PACS в формате DICOM не менее 20 лет. Доступ ограничен уполномоченным медицинским персоналом.",
    privacyTitle: "УВЕДОМЛЕНИЕ О КОНФИДЕНЦИАЛЬНОСТИ",
    privacy1: "Данный отчёт создан в соответствии с GDPR (Регламент ЕС 2016/679).",
    privacy2: "Данные пациента обработаны исключительно в целях медицинской диагностики.",
    privacy3: "Персональные данные не были переданы неуполномоченным третьим лицам.",
    validWithout: "Документ создан в электронном виде и действителен без рукописной подписи.",
    noIncidents: "Без инцидентов во время обследования.",
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
