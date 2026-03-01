import { useState, useCallback, useEffect } from "react";
import { Activity, Globe, Stethoscope, User, Volume2, VolumeX } from "lucide-react";
import PatientIdInput from "@/components/PatientIdInput";
import ReportViewer from "@/components/ReportViewer";
import EcgAnimation from "@/components/EcgAnimation";
import TumorGame from "@/components/TumorGame";
import { generateReportFromData, generatePatientReport, LANGUAGE_LABELS, type ReportLanguage } from "@/lib/mockReport";
import { fetchReport, type ReportMode } from "@/lib/api";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UI_STRINGS: Record<ReportLanguage, { subtitle: string; footer: string; radiologistLabel: string; patientLabel: string }> = {
  en: { subtitle: "Enter a valid patient identifier to retrieve and preview the diagnostic report.", footer: "The Loumavia · For authorized medical personnel only", radiologistLabel: "Radiologist", patientLabel: "Patient" },
  fr: { subtitle: "Entrez un identifiant patient valide pour récupérer et prévisualiser le compte rendu.", footer: "The Loumavia · Réservé au personnel médical autorisé", radiologistLabel: "Radiologue", patientLabel: "Patient" },
};

const Index = () => {
  const [report, setReport] = useState<{ blob: Blob; patientId: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<ReportLanguage>("fr");
  const [mode, setMode] = useState<ReportMode>("radiologist");
  const [musicOn, setMusicOn] = useState(false);

  const strings = UI_STRINGS[language];

  const handleGenerateReport = useCallback(async (patientId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReport(patientId, language, mode);
      const blob = data.mode === "patient"
        ? generatePatientReport(data, language)
        : generateReportFromData(data, language);
      setReport({ blob, patientId });
    } catch (err) {
      console.error("API error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [language, mode]);

  useEffect(() => {
    setReport(null);
  }, [mode]);

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

          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => { if (v) setMode(v as ReportMode); }}
            variant="outline"
            size="sm"
            className="border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm p-0.5"
          >
            <ToggleGroupItem
              value="radiologist"
              aria-label={strings.radiologistLabel}
              className="flex items-center gap-1.5 px-3 text-xs data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              {strings.radiologistLabel}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="patient"
              aria-label={strings.patientLabel}
              className="flex items-center gap-1.5 px-3 text-xs data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
            >
              <User className="h-3.5 w-3.5" />
              {strings.patientLabel}
            </ToggleGroupItem>
          </ToggleGroup>

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
            <TumorGame language={language} />
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
            {error && (
              <div className="w-full max-w-sm rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                <p className="text-sm font-medium text-destructive">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {language === "fr" ? "Fermer" : "Dismiss"}
                </button>
              </div>
            )}
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
