import { CheckCircle2, Clock3, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function AssessmentCard({
  role,
  score,
  questions,
  readiness,
  status,
  timestamp,
}: {
  role: string;
  score: string;
  questions: string;
  readiness: string;
  status: string;
  timestamp: string;
}) {
  return (
    <Card className="h-full p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Recent assessment</p>
          <h3 className="mt-3 text-xl font-semibold text-white">{role}</h3>
        </div>
        <Badge tone={status === "Completed" ? "emerald" : "amber"}>{status}</Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Score</p>
          <p className="mt-2 text-2xl font-semibold text-white">{score}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Questions</p>
          <p className="mt-2 text-2xl font-semibold text-white">{questions}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Readiness</p>
          <p className="mt-2 text-2xl font-semibold text-white">{readiness}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 text-sm text-slate-300">
        <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-300" /> Completed</span>
        <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-slate-400" /> {timestamp}</span>
        <span className="inline-flex items-center gap-2"><Sparkles size={15} className="text-violet-300" /> Adaptive flow</span>
      </div>
    </Card>
  );
}
