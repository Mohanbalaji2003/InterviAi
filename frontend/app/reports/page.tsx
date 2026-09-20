import { Target, TrendingUp } from "lucide-react";

import { ClaimVerification } from "@/components/reports/ClaimVerification";
import { IntelligenceScore } from "@/components/reports/IntelligenceScore";
import { RiskSignals } from "@/components/reports/RiskSignals";
import { ReadinessSimulator } from "@/components/reports/ReadinessSimulator";
import { Strengths } from "@/components/reports/Strengths";
import { Card } from "@/components/ui/Card";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <IntelligenceScore title="Overall role readiness" value={86} subtitle="Strong overall fit for senior full-stack execution with a few gaps in architecture trade-off depth." />

        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Key metrics</p>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between"><span>Technical knowledge</span><span className="font-medium text-white">89</span></div>
            <div className="flex items-center justify-between"><span>Applied reasoning</span><span className="font-medium text-white">84</span></div>
            <div className="flex items-center justify-between"><span>Project understanding</span><span className="font-medium text-white">82</span></div>
            <div className="flex items-center justify-between"><span>Technical communication</span><span className="font-medium text-white">76</span></div>
            <div className="flex items-center justify-between"><span>Resume evidence</span><span className="font-medium text-white">81</span></div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Strengths items={[
          "Consistent understanding of system trade-offs and API design patterns.",
          "Strong ownership of end-to-end delivery across frontend, backend, and deployment workflows.",
          "Clear evidence of production-minded engineering and pragmatic communication.",
        ]} />

        <RiskSignals items={[
          { label: "Architecture depth", detail: "Recent responses show a need for deeper reasoning around scalability, consistency, and operational trade-offs." },
          { label: "Observability rigor", detail: "There is room to strengthen instrumentation and incident-response thinking in complex systems." },
        ]} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Recommended focus</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-3">
              <div className="flex items-center gap-2 text-violet-200"><Target size={16} /> Architecture trade-offs</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">Practice explaining event-driven versus synchronous design decisions under live production constraints.</p>
            </div>
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 text-amber-200"><TrendingUp size={16} /> Operational maturity</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">Add more concrete examples around monitoring, reliability, and incident response.</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Project defense</p>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-3"><span>Overall understanding</span><span className="font-medium text-white">82%</span></div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-3"><span>Important project areas</span><span className="font-medium text-white">7/9</span></div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-3"><span>Evidence-backed insights</span><span className="font-medium text-white">High</span></div>
          </div>
        </Card>
      </div>

      <ReadinessSimulator />

      <ClaimVerification items={[
        { label: 'Supported', value: '5', tone: 'green' },
        { label: 'Partially supported', value: '2', tone: 'amber' },
        { label: 'Unverified', value: '1', tone: 'slate' },
      ]} />
    </div>
  );
}
