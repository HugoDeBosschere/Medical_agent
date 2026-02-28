import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReportLanguage } from "@/lib/mockReport";

const PATIENT_ID_REGEX = /^[A-Z0-9]{8}$/;

const UI_TRANSLATIONS: Record<ReportLanguage, { label: string; placeholder: string; chars: string; error: string; invalidFormat: string; button: string }> = {
  en: { label: "Patient Identifier", placeholder: "e.g. A1B2C3D4", chars: "characters", error: "Must be exactly 8 alphanumeric characters (A-Z, 0-9)", invalidFormat: "Invalid format", button: "Generate Report" },
  fr: { label: "Identifiant Patient", placeholder: "ex. A1B2C3D4", chars: "caractères", error: "Doit contenir exactement 8 caractères alphanumériques (A-Z, 0-9)", invalidFormat: "Format invalide", button: "Générer le rapport" },
  es: { label: "Identificador del Paciente", placeholder: "ej. A1B2C3D4", chars: "caracteres", error: "Debe tener exactamente 8 caracteres alfanuméricos (A-Z, 0-9)", invalidFormat: "Formato inválido", button: "Generar informe" },
  de: { label: "Patienten-ID", placeholder: "z.B. A1B2C3D4", chars: "Zeichen", error: "Genau 8 alphanumerische Zeichen erforderlich (A-Z, 0-9)", invalidFormat: "Ungültiges Format", button: "Bericht erstellen" },
  it: { label: "Identificativo Paziente", placeholder: "es. A1B2C3D4", chars: "caratteri", error: "Deve contenere esattamente 8 caratteri alfanumerici (A-Z, 0-9)", invalidFormat: "Formato non valido", button: "Genera referto" },
  pt: { label: "Identificador do Paciente", placeholder: "ex. A1B2C3D4", chars: "caracteres", error: "Deve conter exatamente 8 caracteres alfanuméricos (A-Z, 0-9)", invalidFormat: "Formato inválido", button: "Gerar relatório" },
  ar: { label: "معرّف المريض", placeholder: "مثال A1B2C3D4", chars: "أحرف", error: "يجب أن يحتوي على 8 أحرف أبجدية رقمية بالضبط (A-Z, 0-9)", invalidFormat: "تنسيق غير صالح", button: "إنشاء التقرير" },
  zh: { label: "患者编号", placeholder: "例如 A1B2C3D4", chars: "个字符", error: "必须恰好为8个字母数字字符 (A-Z, 0-9)", invalidFormat: "格式无效", button: "生成报告" },
  ja: { label: "患者ID", placeholder: "例 A1B2C3D4", chars: "文字", error: "8文字の英数字が必要です (A-Z, 0-9)", invalidFormat: "無効な形式", button: "レポート生成" },
  ru: { label: "ID Пациента", placeholder: "напр. A1B2C3D4", chars: "символов", error: "Необходимо ровно 8 буквенно-цифровых символов (A-Z, 0-9)", invalidFormat: "Неверный формат", button: "Создать отчёт" },
};

interface PatientIdInputProps {
  onValidId: (id: string) => void;
  language?: ReportLanguage;
}

const PatientIdInput = ({ onValidId, language = "en" }: PatientIdInputProps) => {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const tr = UI_TRANSLATIONS[language];

  const isValid = PATIENT_ID_REGEX.test(value);
  const showError = touched && !isValid && value.length > 0;
  const showSuccess = isValid;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
      setValue(upper);
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTouched(true);
      if (isValid) onValidId(value);
    },
    [isValid, value, onValidId]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="patient-id" className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
          {tr.label}
        </Label>
        <div className="relative">
          <Input
            id="patient-id"
            value={value}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
            placeholder={tr.placeholder}
            maxLength={8}
            className="h-14 text-xl font-mono tracking-[0.3em] text-center bg-secondary border-border focus:border-primary focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 placeholder:tracking-[0.3em]"
            autoComplete="off"
            spellCheck={false}
          />
          {showSuccess && (
            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-slide-up" />
          )}
          {showError && (
            <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive animate-slide-up" />
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-xs transition-colors ${showError ? "text-destructive" : "text-muted-foreground/60"}`}>
            {showError
              ? tr.error
              : `${value.length}/8 ${tr.chars}`}
          </p>
          {value.length === 8 && !isValid && (
            <p className="text-xs text-destructive">{tr.invalidFormat}</p>
          )}
        </div>
      </div>
      <button
        type="submit"
        disabled={!isValid}
        className="w-full h-12 rounded-lg font-semibold text-sm tracking-wide uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] glow-border"
      >
        {tr.button}
      </button>
    </form>
  );
};

export default PatientIdInput;
