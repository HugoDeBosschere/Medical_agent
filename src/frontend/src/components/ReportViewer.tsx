import { useState, useEffect } from "react";
import { Download, FileText, X } from "lucide-react";

interface ReportViewerProps {
  pdfBlob: Blob;
  patientId: string;
  onClose: () => void;
}

const ReportViewer = ({ pdfBlob, patientId, onClose }: ReportViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pdfBlob]);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `radiology-report-${patientId}.pdf`;
    a.click();
  };

  return (
    <div className="w-full max-w-4xl animate-slide-up">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-4 rounded-t-xl bg-card border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Radiology Report</h3>
            <p className="text-xs text-muted-foreground font-mono">Patient {patientId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all active:scale-95"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="rounded-b-xl border border-t-0 border-border overflow-hidden bg-secondary" style={{ boxShadow: "var(--shadow-card)" }}>
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-[70vh] bg-secondary"
            title="PDF Report Preview"
          />
        ) : (
          <div className="w-full h-[70vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportViewer;
