import type { ReportLanguage } from "@/lib/mockReport";

const LOADING_TEXT: Record<ReportLanguage, string> = {
  en: "Generating report…",
  fr: "Génération du rapport…",
  es: "Generando informe…",
  de: "Bericht wird erstellt…",
  it: "Generazione referto…",
  pt: "Gerando relatório…",
  ar: "جارٍ إنشاء التقرير…",
  zh: "正在生成报告…",
  ja: "レポートを生成中…",
  ru: "Генерация отчёта…",
};

interface EcgAnimationProps {
  language?: ReportLanguage;
}

const EcgAnimation = ({ language = "en" }: EcgAnimationProps) => {
  return (
    <div className="flex flex-col items-center gap-6">
      <svg
        viewBox="0 0 600 120"
        className="w-full max-w-lg h-24"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {Array.from({ length: 13 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * 50}
            y1={0}
            x2={i * 50}
            y2={120}
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * 30}
            x2={600}
            y2={i * 30}
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}

        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="reveal">
            <rect x="0" y="0" width="600" height="120">
              <animate
                attributeName="width"
                from="0"
                to="600"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </rect>
          </clipPath>
        </defs>

        <polyline
          points="0,60 40,60 60,60 80,60 95,60 100,58 105,62 110,55 115,65 120,45 125,80 130,15 135,105 140,30 145,60 150,58 155,62 160,60 200,60 240,60 260,60 280,60 295,60 300,58 305,62 310,55 315,65 320,45 325,80 330,15 335,105 340,30 345,60 350,58 355,62 360,60 400,60 440,60 460,60 480,60 495,60 500,58 505,62 510,55 515,65 520,45 525,80 530,15 535,105 540,30 545,60 550,58 555,62 560,60 600,60"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          clipPath="url(#reveal)"
          opacity="0.6"
        />

        <polyline
          points="0,60 40,60 60,60 80,60 95,60 100,58 105,62 110,55 115,65 120,45 125,80 130,15 135,105 140,30 145,60 150,58 155,62 160,60 200,60 240,60 260,60 280,60 295,60 300,58 305,62 310,55 315,65 320,45 325,80 330,15 335,105 340,30 345,60 350,58 355,62 360,60 400,60 440,60 460,60 480,60 495,60 500,58 505,62 510,55 515,65 520,45 525,80 530,15 535,105 540,30 545,60 550,58 555,62 560,60 600,60"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#reveal)"
        />

        <circle r="4" fill="hsl(var(--primary))">
          <animateMotion
            dur="2.4s"
            repeatCount="indefinite"
            path="M0,60 L40,60 60,60 80,60 95,60 100,58 105,62 110,55 115,65 120,45 125,80 130,15 135,105 140,30 145,60 150,58 155,62 160,60 200,60 240,60 260,60 280,60 295,60 300,58 305,62 310,55 315,65 320,45 325,80 330,15 335,105 340,30 345,60 350,58 355,62 360,60 400,60 440,60 460,60 480,60 495,60 500,58 505,62 510,55 515,65 520,45 525,80 530,15 535,105 540,30 545,60 550,58 555,62 560,60 600,60"
          />
        </circle>
        <circle r="8" fill="hsl(var(--primary))" opacity="0.3">
          <animateMotion
            dur="2.4s"
            repeatCount="indefinite"
            path="M0,60 L40,60 60,60 80,60 95,60 100,58 105,62 110,55 115,65 120,45 125,80 130,15 135,105 140,30 145,60 150,58 155,62 160,60 200,60 240,60 260,60 280,60 295,60 300,58 305,62 310,55 315,65 320,45 325,80 330,15 335,105 340,30 345,60 350,58 355,62 360,60 400,60 440,60 460,60 480,60 495,60 500,58 505,62 510,55 515,65 520,45 525,80 530,15 535,105 540,30 545,60 550,58 555,62 560,60 600,60"
          />
        </circle>
      </svg>

      <p className="text-sm text-muted-foreground tracking-wide animate-pulse-glow">
        {LOADING_TEXT[language]}
      </p>
    </div>
  );
};

export default EcgAnimation;
