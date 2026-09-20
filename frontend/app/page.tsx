"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AssessmentCard } from "@/components/dashboard/AssessmentCard";
import { FocusCard } from "@/components/dashboard/FocusCard";
import { Hero } from "@/components/dashboard/Hero";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { fallbackDashboardData, fetchDashboardData, type DashboardData } from "@/lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const result = await fetchDashboardData();
        if (!isMounted) return;
        setData(result);
        setError(null);
      } catch {
        if (!isMounted) return;
        setData(fallbackDashboardData);
        setError("FastAPI is unavailable. Showing preview assessment data for a live demo.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const candidateName = data?.candidate.name ?? "Mohan";
  const role = data?.candidate.target_role ?? data?.interview.job_role ?? "Senior Full-Stack Engineer";
  const readiness = data?.interview.readiness_score ?? 86;
  const technical = data?.interview.overall_score != null ? Math.round(data.interview.overall_score * 10) : 82;
  const project = Math.round(data?.interview.project_understanding ?? 81);
  const evidence = Math.round(data?.claim_summary.verification_confidence ?? 78);

  const focusAreas = useMemo(
    () => [
      { label: "System design", detail: "Needs stronger trade-off framing" },
      { label: "API reliability", detail: "Improve failure handling" },
      { label: "Data modeling", detail: "Add normalization depth" },
    ],
    [],
  );

  const recentActivity = [
    { label: "Adaptive technical interview", detail: "Completed 10 questions • 86% readiness", tone: "violet" },
    { label: "Project defense review", detail: "Evidence-backed understanding: 82%", tone: "emerald" },
    { label: "Resume verification", detail: "5 supported claims • 2 partially supported", tone: "amber" },
  ];

  return (
    <div className="space-y-6">
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <Hero
        greeting="Good evening, Mohan."
        headline="Understand your readiness before the interviewer does."
        subheadline="Run adaptive technical interviews, defend your projects, and turn every assessment into evidence-based candidate intelligence."
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Role Readiness" value={`${Math.round(readiness)}%`} progress={readiness} tone="violet" subtitle="Latest assessment" />
          <MetricCard label="Technical Knowledge" value={`${technical}%`} progress={technical} tone="emerald" subtitle="Interview performance" />
          <MetricCard label="Project Understanding" value={`${project}%`} progress={project} tone="amber" subtitle="Defense evidence" />
          <MetricCard label="Resume Evidence" value={`${evidence}%`} progress={evidence} tone="slate" subtitle={data?.claim_summary.total ? `${data.claim_summary.total} claims reviewed` : "No claims yet"} />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <AssessmentCard
          role={role}
          score={data?.interview.overall_score != null ? `${data.interview.overall_score.toFixed(1)}/10` : "8.6/10"}
          questions={`${data?.interview.questions_answered ?? 10}/${data?.interview.total_questions ?? 10}`}
          readiness={`${Math.round(readiness)}%`}
          status={data?.interview.status === "completed" ? "Completed" : "Ready"}
          timestamp={data?.interview.created_at ? new Date(data.interview.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 19, 2026'}
        />

        <FocusCard title="Recommended focus" items={focusAreas} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr,0.9fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Recent activity</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Assessment timeline</h3>
            </div>
            <Badge tone="violet">Live</Badge>
          </div>

          <div className="mt-5 space-y-4">
            {recentActivity.map((entry) => (
              <div key={entry.label} className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <div className={`mt-1 h-2.5 w-2.5 rounded-full ${entry.tone === 'violet' ? 'bg-violet-400' : entry.tone === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100">{entry.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{entry.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Candidate profile</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-base font-semibold text-white">
              {candidateName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{candidateName}</p>
              <p className="text-sm text-slate-400">{role}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Skills mapped</span>
              <span className="text-slate-100">{(data?.candidate.skills ?? ['Python', 'TypeScript', 'FastAPI']).length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data?.candidate.skills ?? ['Python', 'TypeScript', 'FastAPI', 'Next.js', 'PostgreSQL']).map((skill) => (
                <span key={skill} className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[11px] text-slate-200">{skill}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-300">Verification status</span>
              <CheckCircle2 size={15} className="text-emerald-300" />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{evidence}% of claims are supported or partially supported in the latest resume review.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
