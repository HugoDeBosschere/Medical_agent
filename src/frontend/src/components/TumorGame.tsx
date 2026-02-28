import { useState, useEffect, useCallback, useRef } from "react";
import { Crosshair } from "lucide-react";
import type { ReportLanguage } from "@/lib/mockReport";

interface Tumor {
  id: number;
  x: number;
  y: number;
  size: number;
  growing: boolean;
  opacity: number;
}

let tumorIdCounter = 0;

const LUNG_PATH_LEFT =
  "M 90 60 Q 50 70 40 120 Q 30 180 50 230 Q 65 260 90 270 Q 110 275 120 260 Q 135 240 130 200 Q 128 160 125 120 Q 122 90 110 70 Z";
const LUNG_PATH_RIGHT =
  "M 210 60 Q 250 70 260 120 Q 270 180 250 230 Q 235 260 210 270 Q 190 275 180 260 Q 165 240 170 200 Q 172 160 175 120 Q 178 90 190 70 Z";

const GAME_TEXT: Record<ReportLanguage, string> = {
  en: "While you wait — Kill the tumors!",
  fr: "En attendant — Éliminez les tumeurs !",
  es: "Mientras esperas — ¡Elimina los tumores!",
  de: "Während Sie warten — Tumore beseitigen!",
  it: "Nell'attesa — Elimina i tumori!",
  pt: "Enquanto espera — Elimine os tumores!",
  ar: "أثناء الانتظار — اقضِ على الأورام!",
  zh: "等待期间——消灭肿瘤！",
  ja: "お待ちの間に — 腫瘍を退治！",
  ru: "Пока ждёте — уничтожьте опухоли!",
};

interface TumorGameProps {
  language?: ReportLanguage;
}

const TumorGame = ({ language = "en" }: TumorGameProps) => {
  const [tumors, setTumors] = useState<Tumor[]>([]);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const spawnTumor = useCallback(() => {
    const isLeft = Math.random() > 0.5;
    const cx = isLeft ? 60 + Math.random() * 60 : 185 + Math.random() * 60;
    const cy = 100 + Math.random() * 140;

    const newTumor: Tumor = {
      id: ++tumorIdCounter,
      x: cx,
      y: cy,
      size: 6,
      growing: true,
      opacity: 0.7,
    };
    setTumors((prev) => [...prev, newTumor]);
  }, []);

  // Spawn tumors periodically
  useEffect(() => {
    intervalRef.current = setInterval(spawnTumor, 2200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [spawnTumor]);

  // Grow tumors
  useEffect(() => {
    const growInterval = setInterval(() => {
      setTumors((prev) =>
        prev
          .map((t) => {
            if (!t.growing) return t;
            const newSize = t.size + 0.4;
            if (newSize > 28) {
              setMissed((m) => m + 1);
              return null;
            }
            return { ...t, size: newSize, opacity: Math.min(1, t.opacity + 0.01) };
          })
          .filter(Boolean) as Tumor[]
      );
    }, 80);
    return () => clearInterval(growInterval);
  }, []);

  const killTumor = (id: number) => {
    setTumors((prev) => prev.filter((t) => t.id !== id));
    setScore((s) => s + 1);
  };

  return (
    <div className="w-full max-w-xs mx-auto animate-slide-up select-none">
      <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2 text-center">
        {GAME_TEXT[language]}
      </p>
      <div
        className="relative rounded-xl border border-border bg-card overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)", aspectRatio: "1 / 1" }}
      >
        <svg viewBox="0 0 300 330" className="w-full h-full">
          {/* Trachea */}
          <rect x="143" y="20" width="14" height="50" rx="6" className="fill-primary/15 stroke-primary/30" strokeWidth="1" />

          {/* Bronchi */}
          <path d="M 150 65 Q 130 85 110 75" className="stroke-primary/30 fill-none" strokeWidth="2" />
          <path d="M 150 65 Q 170 85 190 75" className="stroke-primary/30 fill-none" strokeWidth="2" />

          {/* Left lung */}
          <path d={LUNG_PATH_LEFT} className="fill-primary/8 stroke-primary/25" strokeWidth="1.5" />
          {/* Right lung */}
          <path d={LUNG_PATH_RIGHT} className="fill-primary/8 stroke-primary/25" strokeWidth="1.5" />

          {/* Tumors */}
          {tumors.map((t) => (
            <g key={t.id} onClick={() => killTumor(t.id)} className="cursor-crosshair">
              <circle
                cx={t.x}
                cy={t.y}
                r={t.size}
                fill={`hsl(0 70% 50% / ${t.opacity})`}
                stroke="hsl(0 60% 40% / 0.6)"
                strokeWidth="1"
                className="transition-all duration-100"
              />
              <circle
                cx={t.x}
                cy={t.y}
                r={t.size + 4}
                fill="transparent"
              />
            </g>
          ))}
        </svg>

        {/* Score overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-mono">
          <Crosshair className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground/80">{score}</span>
          <span className="text-muted-foreground/40 mx-1">|</span>
          <span className="text-destructive/70">✕ {missed}</span>
        </div>
      </div>
    </div>
  );
};

export default TumorGame;
