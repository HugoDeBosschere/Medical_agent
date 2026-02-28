import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface McqOption {
  label: string;
  text: string;
}

interface McqQuestion {
  question: string;
  options: McqOption[];
  correctAnswer: string;
  explanation: string;
}

const questions: McqQuestion[] = [
  {
    question:
      "What is the primary advantage of using MRI over CT scans for brain imaging?",
    options: [
      { label: "A", text: "Faster imaging time" },
      { label: "B", text: "Better visualization of soft tissues without ionizing radiation" },
      { label: "C", text: "Lower cost" },
      { label: "D", text: "Ability to image bones more clearly" },
    ],
    correctAnswer: "B",
    explanation:
      "MRI uses magnetic fields and radio waves, providing superior soft tissue contrast without the risks associated with ionizing radiation from CT scans.",
  },
];

const RadiologyMcq = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const q = questions[0];
  const isCorrect = selected === q.correctAnswer;
  const answered = selected !== null;

  return (
    <div className="w-full max-w-lg animate-slide-up">
      <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2">
        While you wait — Test your knowledge
      </p>
      <div className="rounded-xl border border-border bg-card p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-sm font-semibold text-foreground leading-relaxed">
          {q.question}
        </h3>

        <div className="space-y-2">
          {q.options.map((opt) => {
            const isThis = selected === opt.label;
            const isRight = opt.label === q.correctAnswer;
            let borderClass = "border-border hover:border-primary/40";
            if (answered && isRight) borderClass = "border-primary bg-primary/10";
            else if (answered && isThis && !isRight) borderClass = "border-destructive bg-destructive/10";

            return (
              <button
                key={opt.label}
                disabled={answered}
                onClick={() => setSelected(opt.label)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-sm transition-all ${borderClass} ${answered ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}`}
              >
                <span
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                    answered && isRight
                      ? "bg-primary text-primary-foreground"
                      : answered && isThis
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </span>
                <span className="text-foreground/90">{opt.text}</span>
                {answered && isRight && (
                  <CheckCircle2 className="ml-auto h-4 w-4 text-primary shrink-0" />
                )}
                {answered && isThis && !isRight && (
                  <XCircle className="ml-auto h-4 w-4 text-destructive shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`rounded-lg p-4 text-xs leading-relaxed animate-slide-up ${
              isCorrect
                ? "bg-primary/5 border border-primary/20 text-accent-foreground"
                : "bg-destructive/5 border border-destructive/20 text-foreground/80"
            }`}
          >
            <span className="font-semibold">{isCorrect ? "Correct!" : "Incorrect."}</span>{" "}
            {q.explanation}
          </div>
        )}
      </div>
    </div>
  );
};

export default RadiologyMcq;
