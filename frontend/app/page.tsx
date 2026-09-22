"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, FileText, FolderPlus, Sparkles, UserCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AssessmentCard } from "@/components/dashboard/AssessmentCard";
import { FocusCard } from "@/components/dashboard/FocusCard";
import { Hero } from "@/components/dashboard/Hero";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchCurrentUser, type AuthUser } from "@/lib/auth";
import { fetchDashboardData, type DashboardData } from "@/lib/api";

export default function DashboardPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [user, dash] = await Promise.all([
          fetchCurrentUser(),
          fetchDashboardData().catch(() => null),
        ]);

        if (!isMounted) return;
        setAuthUser(user);
        setData(dash);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard state.");
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

  const userName = authUser?.name ?? data?.candidate.name ?? "Candidate";
  const userRole = data?.candidate.target_role ?? "Target Role Not Selected";
  const hasInterview = Boolean(data?.has_interview && data?.interview);

  const readiness = data?.interview?.readiness_score;
  const technical = data?.interview?.overall_score != null ? Math.round(data.interview.overall_score * 10) : null;
  const project = data?.interview?.project_understanding != null ? Math.round(data.interview.project_understanding) : null;
  const evidence = data?.claim_summary?.verification_confidence != null ? Math.round(data.claim_summary.verification_confidence) : null;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <Hero
        greeting={`Welcome back, ${userName}.`}
        headline="Understand your role readiness before the interviewer does."
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
          <MetricCard
            label="Role Readiness"
            value={readiness != null ? `${Math.round(readiness)}%` : "—"}
            progress={readiness ?? 0}
            tone="violet"
            subtitle={hasInterview ? "Latest assessment" : "No assessment completed yet"}
          />
          <MetricCard
            label="Technical Knowledge"
            value={technical != null ? `${technical}%` : "—"}
            progress={technical ?? 0}
            tone="emerald"
            subtitle={hasInterview ? "Interview score" : "Awaiting assessment"}
          />
          <MetricCard
            label="Project Understanding"
            value={project != null ? `${project}%` : "—"}
            progress={project ?? 0}
            tone="amber"
            subtitle={data?.active_project?.has_project ? data.active_project.name ?? "Project uploaded" : "No project uploaded"}
          />
          <MetricCard
            label="Resume Evidence"
            value={evidence != null ? `${evidence}%` : "—"}
            progress={evidence ?? 0}
            tone="slate"
            subtitle={data?.claim_summary?.total ? `${data.claim_summary.total} claims reviewed` : "No claims verified"}
          />
        </div>
      )}

      {!loading && !hasInterview ? (
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                <Sparkles size={14} /> Clean Candidate Workspace
              </div>
              <h3 className="text-2xl font-semibold text-white">Get Started with InterviAI</h3>
              <p className="text-sm text-slate-400">
                Upload your resume and project report, then run your first adaptive interview to generate isolated candidate intelligence.
              </p>
            </div>
            <Link href="/interview">
              <Button type="button" size="lg" className="whitespace-nowrap">
                Start New Assessment <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className={`rounded-2xl border p-4 ${data?.active_resume?.has_resume ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-dashed border-white/15 bg-slate-950/40'}`}>
              <div className="flex items-center gap-3 text-slate-200">
                <FileText size={18} className={data?.active_resume?.has_resume ? 'text-emerald-300' : 'text-violet-300'} />
                <span className="font-semibold text-white">1. Candidate Resume</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {data?.active_resume?.has_resume ? `Active: ${data.active_resume.filename}` : "Upload your PDF resume to detect skills and verify claims."}
              </p>
              {!data?.active_resume?.has_resume && (
                <Link href="/resume" className="mt-3 inline-block text-xs font-medium text-violet-400 hover:underline">
                  Upload Resume →
                </Link>
              )}
            </div>

            <div className={`rounded-2xl border p-4 ${data?.active_project?.has_project ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-dashed border-white/15 bg-slate-950/40'}`}>
              <div className="flex items-center gap-3 text-slate-200">
                <FolderPlus size={18} className={data?.active_project?.has_project ? 'text-emerald-300' : 'text-amber-300'} />
                <span className="font-semibold text-white">2. Project Defense</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {data?.active_project?.has_project ? `Active: ${data.active_project.name}` : "Upload a project report or README to ground interview questions."}
              </p>
              {!data?.active_project?.has_project && (
                <Link href="/projects" className="mt-3 inline-block text-xs font-medium text-amber-400 hover:underline">
                  Upload Project →
                </Link>
              )}
            </div>

            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-4">
              <div className="flex items-center gap-3 text-slate-200">
                <UserCheck size={18} className="text-violet-300" />
                <span className="font-semibold text-white">3. Adaptive Assessment</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Choose your job role and start live adaptive questioning grounded in your work.
              </p>
              <Link href="/interview" className="mt-3 inline-block text-xs font-medium text-violet-400 hover:underline">
                Configure Interview →
              </Link>
            </div>
          </div>
        </Card>
      ) : null}

      {hasInterview ? (
        <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
          <AssessmentCard
            role={data?.interview?.job_role ?? userRole}
            score={data?.interview?.overall_score != null ? `${data.interview.overall_score.toFixed(1)}/10` : "—"}
            questions={`${data?.interview?.questions_answered ?? 0}/${data?.interview?.total_questions ?? 10}`}
            readiness={readiness != null ? `${Math.round(readiness)}%` : "—"}
            status={data?.interview?.status === "completed" ? "Completed" : "In Progress"}
            timestamp={data?.interview?.created_at ? new Date(data.interview.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
          />

          <FocusCard
            title="Candidate focus"
            items={[
              { label: "Target role", detail: data?.interview?.job_role ?? userRole },
              { label: "Active skills", detail: (data?.candidate.skills ?? []).slice(0, 4).join(", ") || "Skills mapped from profile" },
            ]}
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.45fr,0.9fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Activity</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Assessment timeline</h3>
            </div>
            <Badge tone="violet">Isolated</Badge>
          </div>

          <div className="mt-5 space-y-4">
            {hasInterview ? (
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-violet-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100">Adaptive technical interview for {data?.interview?.job_role}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Status: {data?.interview?.status} • {data?.interview?.questions_answered ?? 0} questions answered
                  </p>
                </div>
              </div>
            ) : null}

            {data?.active_resume?.has_resume ? (
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100">Active Resume Uploaded</p>
                  <p className="mt-1 text-sm text-slate-400">{data.active_resume.filename} • {data.active_resume.skills.length} skills detected</p>
                </div>
              </div>
            ) : null}

            {data?.active_project?.has_project ? (
              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100">Project Knowledge Base Built</p>
                  <p className="mt-1 text-sm text-slate-400">{data.active_project.name}</p>
                </div>
              </div>
            ) : null}

            {!hasInterview && !data?.active_resume?.has_resume && !data?.active_project?.has_project ? (
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-center text-sm text-slate-400">
                No activity recorded yet for this account.
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Candidate profile</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-base font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{userName}</p>
              <p className="text-sm text-slate-400">{userRole}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Detected skills</span>
              <span className="text-slate-100">{(data?.candidate.skills ?? []).length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data?.candidate.skills ?? []).length > 0 ? (
                data?.candidate.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[11px] text-slate-200">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">Upload resume to populate skills</span>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-300">Account status</span>
              <CheckCircle2 size={15} className="text-emerald-300" />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Authenticated & data-isolated. Your records are visible only to you.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
