import { useState, useCallback } from "react";
import { Activity, Globe, Crosshair, Monitor, Volume2, VolumeX } from "lucide-react";
import PatientIdInput from "@/components/PatientIdInput";
import ReportViewer from "@/components/ReportViewer";
import EcgAnimation from "@/components/EcgAnimation";
import TumorGame from "@/components/TumorGame";
import { generateMockReport, LANGUAGE_LABELS, type ReportLanguage } from "@/lib/mockReport";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UI_STRINGS: Record<ReportLanguage, { subtitle: string; footer: string }> = {
  en: { subtitle: "Enter a valid patient identifier to retrieve and preview the diagnostic report.", footer: "The Augmented Radiologist · For authorized medical personnel only" },
  fr: { subtitle: "Entrez un identifiant patient valide pour récupérer et prévisualiser le compte rendu.", footer: "The Augmented Radiologist · Réservé au personnel médical autorisé" },
  es: { subtitle: "Ingrese un identificador de paciente válido para recuperar y previsualizar el informe.", footer: "The Augmented Radiologist · Solo para personal médico autorizado" },
  de: { subtitle: "Geben Sie eine gültige Patienten-ID ein, um den Befund abzurufen und anzuzeigen.", footer: "The Augmented Radiologist · Nur für autorisiertes medizinisches Personal" },
  it: { subtitle: "Inserisci un identificativo paziente valido per recuperare e visualizzare il referto.", footer: "The Augmented Radiologist · Solo per personale medico autorizzato" },
  pt: { subtitle: "Insira um identificador de paciente válido para recuperar e visualizar o relatório.", footer: "The Augmented Radiologist · Apenas para pessoal médico autorizado" },
  ar: { subtitle: "أدخل معرّف مريض صالحًا لاسترداد التقرير التشخيصي ومعاينته.", footer: "The Augmented Radiologist · للطاقم الطبي المصرح له فقط" },
  zh: { subtitle: "输入有效的患者编号以检索和预览诊断报告。", footer: "The Augmented Radiologist · 仅限授权医务人员使用" },
  ja: { subtitle: "有効な患者IDを入力して診断レポートを取得・プレビューしてください。", footer: "The Augmented Radiologist · 認定医療従事者専用" },
  ru: { subtitle: "Введите действительный идентификатор пациента для получения и просмотра отчёта.", footer: "The Augmented Radiologist · Только для авторизованного медицинского персонала" },
};

const Index = () => {
  const [report, setReport] = useState<{ blob: Blob; patientId: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<ReportLanguage>("fr");
  const [waitingMode, setWaitingMode] = useState<"ecg" | "game">("ecg");
  const [musicOn, setMusicOn] = useState(false);

  const strings = UI_STRINGS[language];

  const handleGenerateReport = useCallback(async (patientId: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 15000));
    const blob = generateMockReport(patientId, language);
    setReport({ blob, patientId });
    setLoading(false);
  }, [language]);

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-background overflow-hidden">
      <div className="absolute inset-0 surface-glow pointer-events-none" />

      <header className="relative z-10 w-full flex items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center glow-border">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl tracking-tight">
            <span className="font-light text-muted-foreground/70">Augmented</span>{" "}
            <span className="font-bold text-gradient">Radiologist</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Waiting mode toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-0.5">
            <button
              onClick={() => setWaitingMode("ecg")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
                waitingMode === "ecg"
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              ECG
            </button>
            <button
              onClick={() => setWaitingMode("game")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
                waitingMode === "game"
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Crosshair className="h-3.5 w-3.5" />
              Game
            </button>
          </div>

          {/* Music toggle */}
          <button
            onClick={() => setMusicOn((v) => !v)}
            className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all ${
              musicOn
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/50 bg-card/50 text-muted-foreground hover:text-foreground"
            }`}
            title={musicOn ? "Music On" : "Music Off"}
          >
            {musicOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select value={language} onValueChange={(v) => setLanguage(v as ReportLanguage)}>
            <SelectTrigger className="w-[140px] h-9 text-sm border-border/50 bg-card/50 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                <SelectItem key={code} value={code}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center px-4 pb-16">
        {loading ? (
          <div className="flex flex-col items-center gap-8 w-full max-w-lg">
            <EcgAnimation language={language} />
            {waitingMode === "game" && <TumorGame language={language} />}
          </div>
        ) : report ? (
          <ReportViewer
            pdfBlob={report.blob}
            patientId={report.patientId}
            onClose={() => setReport(null)}
          />
        ) : (
          <div className="flex flex-col items-center gap-8 animate-slide-up">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">
                <span className="text-muted-foreground/60 font-light">Augmented</span>{" "}
                <span className="text-gradient">Radiologist</span>
              </h2>
              <p className="text-muted-foreground max-w-sm">
                {strings.subtitle}
              </p>
            </div>
            <PatientIdInput onValidId={handleGenerateReport} language={language} />
          </div>
        )}
      </main>

      <footer className="relative z-10 py-4 text-center">
        <p className="text-xs text-muted-foreground/40">
          {strings.footer}
        </p>
      </footer>
    </div>
  );
};

export default Index;
