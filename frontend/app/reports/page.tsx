"use client";

import { AlertTriangle, ArrowRight, LoaderCircle, Sparkles, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { IntelligenceScore } from "@/components/reports/IntelligenceScore";
import { RiskSignals } from "@/components/reports/RiskSignals";
import { Strengths } from "@/components/reports/Strengths";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchLatestReport } from "@/lib/api";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchLatestReport();
        setReportData(data);
      } catch {
        setReportData({ has_report: false });
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <LoaderCircle size={32} className="animate-spin text-violet-400" />
        <p className="text-sm text-slate-300">Loading Candidate Intelligence Report...</p>
      </div>
    );
  }

  const hasReport = Boolean(reportData?.has_report && reportData?.report);
  const r = reportData?.report;
  const interview = reportData?.interview;
  const components = r?.components || {};

  if (!hasReport) {
    return (
      <Card className="p-8 text-center space-y-4 max-w-2xl mx-auto">
        <Sparkles size={36} className="mx-auto text-violet-400" />
        <h2 className="text-2xl font-semibold text-white">No Candidate Intelligence Report Yet</h2>
        <p className="text-sm text-slate-400">
          Complete an adaptive technical interview to generate your personalized evidence-based readiness report.
        </p>
        <Link href="/interview">
          <Button type="button" size="lg">
            Start New Assessment <ArrowRight size={16} />
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <IntelligenceScore
          title={`Overall role readiness (${interview?.job_role || 'Target Role'})`}
          value={Math.round(r.overall_readiness || 0)}
          subtitle={`Performance level: ${r.performance_level || 'Evaluated'}`}
        />

        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Component Scores</p>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Technical knowledge</span>
              <span className="font-medium text-white">{components["Technical Knowledge"] ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Applied reasoning</span>
              <span className="font-medium text-white">{components["Applied Reasoning"] ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Project understanding</span>
              <span className="font-medium text-white">{components["Project Understanding"] ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Technical communication</span>
              <span className="font-medium text-white">{components["Technical Communication"] ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Resume evidence confidence</span>
              <span className="font-medium text-white">{components["Resume Evidence Confidence"] ?? "—"}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Strengths items={r.strengths || ["Completed technical interview session."]} />

        <RiskSignals
          items={(r.risk_signals || []).map((risk: string) => ({
            label: "Risk Signal",
            detail: risk,
          }))}
        />
      </div>

      <Card className="p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Recommended focus</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(r.recommended_focus || []).map((focus: string, idx: number) => (
            <div key={idx} className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-3">
              <div className="flex items-center gap-2 text-violet-200">
                <Target size={16} /> Focus Area {idx + 1}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{focus}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
