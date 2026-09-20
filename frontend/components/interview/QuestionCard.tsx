import { Card } from "@/components/ui/Card";

export function QuestionCard({
  index,
  total,
  difficulty,
  question,
}: {
  index: number;
  total: number;
  difficulty: string;
  question: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
          <span>Question {index}</span>
          <span className="text-slate-600">/</span>
          <span>{total}</span>
        </div>
        <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-violet-200">
          {difficulty}
        </span>
      </div>

      <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">{question}</h2>
    </Card>
  );
}
