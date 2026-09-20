import { CheckCircle2, MessageSquareText } from "lucide-react";

import { Card } from "@/components/ui/Card";

export function AnswerPanel({
  mode,
  answer,
  setAnswer,
  options,
}: {
  mode: "mcq" | "descriptive";
  answer: string;
  setAnswer: (value: string) => void;
  options?: string[];
}) {
  if (mode === "mcq") {
    return (
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
          <MessageSquareText size={14} className="text-violet-300" />
          Multiple choice
        </div>

        <div className="space-y-3">
          {options?.map((option) => {
            const selected = answer === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setAnswer(option)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selected
                    ? "border-violet-400/40 bg-violet-500/10 text-violet-100"
                    : "border-white/10 bg-slate-950/40 text-slate-200 hover:border-violet-400/20 hover:bg-white/[0.02]"
                }`}
              >
                <span>{option}</span>
                {selected ? <CheckCircle2 size={16} className="text-violet-300" /> : null}
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
        <MessageSquareText size={14} className="text-violet-300" />
        Written response
      </div>

      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Describe your reasoning and trade-offs."
        className="min-h-[220px] w-full resize-none rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-400/30 focus:outline-none"
      />
    </Card>
  );
}
