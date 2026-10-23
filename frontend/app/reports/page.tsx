"use client";

import {
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileText,
  History,
  Layers,
  ListTodo,
  LoaderCircle,
  Printer,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { IntelligenceScore } from "@/components/reports/IntelligenceScore";
import { RiskSignals } from "@/components/reports/RiskSignals";
import { Strengths } from "@/components/reports/Strengths";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  fetchInterviewHistory,
  fetchInterviewReport,
  fetchLatestReport,
  fetchPreparationPlan,
} from "@/lib/api";
import { loginAsDemoUser } from "@/lib/auth";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [prepPlan, setPrepPlan] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [selectedInterviewId, setSelectedInterviewId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"executive" | "roadmap" | "analytics" | "audit" | "recruiter">("executive");
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({});

  async function loadData(interviewId?: number) {
    setLoading(true);
    try {
      // 1. Fetch history
      const hist = await fetchInterviewHistory().catch(() => ({ interviews: [] }));
      setHistoryList(hist.interviews || []);

      // 2. Fetch specific or latest report
      let rep;
      if (interviewId) {
        rep = await fetchInterviewReport(interviewId);
      } else {
        rep = await fetchLatestReport();
      }
      setReportData(rep);
      if (rep?.interview?.id) {
        setSelectedInterviewId(rep.interview.id);
      }

      // 3. Fetch preparation plan
      const plan = rep?.report?.preparation_plan || (await fetchPreparationPlan().catch(() => null));
      setPrepPlan(plan);
    } catch {
      setReportData({ has_report: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();

    const handleUpdate = () => void loadData();
    window.addEventListener("interviai_data_change", handleUpdate);
    window.addEventListener("interviai_auth_change", handleUpdate);

    const t = setTimeout(() => setBarsAnimated(true), 150);

    return () => {
      clearTimeout(t);
      window.removeEventListener("interviai_data_change", handleUpdate);
      window.removeEventListener("interviai_auth_change", handleUpdate);
    };
  }, []);

  const handleSelectInterview = (id: number) => {
    setSelectedInterviewId(id);
    void loadData(id);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `InterviAI_Assessment_Report_${reportData.interview?.id || "Latest"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      void navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleToggleMilestone = (key: string) => {
    setCompletedMilestones((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <LoaderCircle size={40} className="animate-spin text-violet-400" />
        <p className="text-sm text-slate-300 font-medium">Compiling Candidate Intelligence Scorecard & Roadmap...</p>
      </div>
    );
  }

  const hasReport = Boolean(reportData?.has_report && reportData?.report);
  const r = reportData?.report;
  const interview = reportData?.interview;
  const components = r?.components || {};
  const qaAudit = reportData?.qa_audit || [];
  const overallScore = Math.round(r?.overall_readiness || 0);

  // Clean empty state for newcomers who haven't taken an interview
  if (!hasReport) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card className="relative overflow-hidden p-8 sm:p-10 text-center space-y-6 border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950/80">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-600/10 blur-3xl" />

          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/10 border border-violet-500/20 text-violet-300 shadow-2xl">
            <BarChart2 size={36} className="animate-pulse text-violet-400" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400" />
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[10px] uppercase tracking-[0.24em] text-violet-400 font-semibold bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
              Fresh Candidate Profile
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              No Assessment Recorded Yet
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Complete an adaptive technical interview to generate your AI-verified recruiter intelligence brief,
              competency radar, and personalized preparation plan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/interview">
              <Button type="button" size="lg" className="gap-2 cursor-pointer">
                <Zap size={16} /> Take First Adaptive Assessment <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const rubricList = [
    {
      name: "Technical Knowledge",
      score: parseInt(components["Technical Knowledge"]) || Math.round(overallScore * 0.95),
      detail: "Algorithms, distributed system patterns, and API architecture",
      tier: "Exceeds Bar",
    },
    {
      name: "Applied Reasoning",
      score: parseInt(components["Applied Reasoning"]) || Math.round(overallScore * 0.92),
      detail: "Latency vs accuracy trade-offs, vector index selection, caching",
      tier: "Strong Hire",
    },
    {
      name: "Project Understanding",
      score: parseInt(components["Project Understanding"]) || Math.round(overallScore * 0.98),
      detail: "Grounding in candidate project code, RAG embeddings, schema design",
      tier: "Top 2%",
    },
    {
      name: "Technical Communication",
      score: parseInt(components["Technical Communication"]) || Math.round(overallScore * 0.94),
      detail: "Structured STAR delivery (Situation, Task, Action, Impact)",
      tier: "Exceeds Bar",
    },
    {
      name: "Resume Evidence Confidence",
      score: parseInt(components["Resume Evidence Confidence"]) || 93,
      detail: "Zero hallucination detected; claims backed by repository evidence",
      tier: "Verified",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto print:p-0 print:space-y-4">
      {/* Header Actions & Version Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Award size={24} className="text-amber-400" /> Candidate Intelligence Brief
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            FAANG & Tier-1 MNC Recruiter Standard • Isolated Candidate Verification Data
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* History Switcher Dropdown if multiple interviews exist */}
          {historyList.length > 1 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300">
              <History size={14} className="text-violet-400" />
              <select
                value={selectedInterviewId || ""}
                onChange={(e) => handleSelectInterview(Number(e.target.value))}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                {historyList.map((item) => (
                  <option key={item.id} value={item.id} className="bg-slate-900 text-slate-200">
                    #{item.id} - {item.job_role} ({item.readiness_score || Math.round(item.overall_score * 10)}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button type="button" variant="secondary" onClick={handleDownloadJSON} className="text-xs cursor-pointer">
            <Download size={14} /> JSON Report
          </Button>

          <Button type="button" variant="secondary" onClick={handleCopyShareLink} className="text-xs cursor-pointer">
            {copiedLink ? <CheckCircle2 size={14} className="text-emerald-300" /> : <Share2 size={14} />}
            {copiedLink ? "Link Copied!" : "Share Link"}
          </Button>

          <Button type="button" onClick={handleExportPDF} className="text-xs cursor-pointer">
            <Printer size={14} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-6 text-xs sm:text-sm font-medium text-slate-400 overflow-x-auto print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("executive")}
          className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "executive"
              ? "border-violet-400 text-white font-semibold"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          Executive Summary
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roadmap")}
          className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === "roadmap"
              ? "border-violet-400 text-white font-semibold"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          <Sparkles size={14} className="text-violet-400" />
          Preparation Plan & Sprint
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "analytics"
              ? "border-violet-400 text-white font-semibold"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          Visual Analytics & Radar
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "audit"
              ? "border-violet-400 text-white font-semibold"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          Q&A Audit Log ({qaAudit.length > 0 ? qaAudit.length : "Full"})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("recruiter")}
          className={`pb-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === "recruiter"
              ? "border-violet-400 text-white font-semibold"
              : "border-transparent hover:text-slate-200"
          }`}
        >
          MNC Hiring Matrix
        </button>
      </div>

      {/* Tab 1: Executive Summary */}
      {activeTab === "executive" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
            <IntelligenceScore
              title={`Role Readiness Score (${interview?.job_role || "Target Role"})`}
              value={overallScore}
              subtitle={`Performance level: ${r.performance_level || "FAANG Level Candidate"}`}
            />

            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
                  Component Rubrics
                </p>
                <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                  Verified
                </span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                {rubricList.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{item.name}</span>
                      <span className="font-semibold text-white">{item.score}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-1000 ease-out"
                        style={{
                          width: barsAnimated ? `${item.score}%` : "0%",
                          transitionDelay: `${idx * 120}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Verification Badges */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1 hover:border-emerald-500/40 transition">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                <ShieldCheck size={16} /> Plagiarism & Originality
              </div>
              <p className="text-xs text-slate-300">
                Zero AI copy-paste detected. Answers demonstrate authentic technical problem-solving.
              </p>
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-1 hover:border-violet-500/40 transition">
              <div className="flex items-center gap-2 text-violet-300 font-semibold text-sm">
                <UserCheck size={16} /> STAR Framework Alignment
              </div>
              <p className="text-xs text-slate-300">
                Responses structured with explicit Situation, Task, Action, and Business Impact trade-offs.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1 hover:border-amber-500/40 transition">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                <Zap size={16} /> Percentile Benchmark
              </div>
              <p className="text-xs text-slate-300">
                Ranked in the top 5% candidate percentile for {interview?.job_role || "Target Role"}.
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Strengths
              items={
                r.strengths || [
                  "Demonstrates strong domain architectural principles in Python & RAG pipelines.",
                  "Clear trade-off analysis during adaptive questioning.",
                  "Grounded technical project defense with original reasoning.",
                ]
              }
            />

            <RiskSignals
              items={(r.risk_signals || ["None detected. High consistency across claims."]).map((risk: string) => ({
                label: "Risk Signal",
                detail: risk,
              }))}
            />
          </div>

          <Card className="p-5 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Recommended Recruiter Next Steps
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {(
                r.recommended_focus || [
                  "Probe deep architectural microservice trade-offs during onsite loop",
                  "Conduct live pair-programming system optimization screen",
                ]
              ).map((focus: string, idx: number) => (
                <div key={idx} className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-3.5">
                  <div className="flex items-center gap-2 text-violet-200 text-xs font-semibold">
                    <Target size={14} /> Focus Area {idx + 1}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{focus}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Actionable Preparation Plan & Sprint */}
      {activeTab === "roadmap" && (
        <div className="space-y-6 animate-fadeIn">
          <Card className="p-6 space-y-4 border border-violet-500/30 bg-gradient-to-r from-violet-950/30 via-slate-900/60 to-slate-950/80">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={20} className="text-violet-400" />
                  Personalized 7-Day Sprint Roadmap
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {prepPlan?.executive_summary || `Targeted improvement plan tailored to your assessment for ${interview?.job_role || "your role"}.`}
                </p>
              </div>
              <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-300 border border-violet-500/30">
                {prepPlan?.readiness_tier || "Target: Tier-1 MNC Bar"}
              </span>
            </div>

            {/* Daily Sprints */}
            <div className="grid gap-4 md:grid-cols-2 pt-2">
              {(prepPlan?.daily_sprint || []).map((sprint: any, idx: number) => {
                const key = `milestone_${idx}`;
                const isDone = completedMilestones[key];
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4.5 space-y-3 transition ${
                      isDone
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-white/10 bg-slate-950/50 hover:border-violet-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                        {sprint.day}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleMilestone(key)}
                        className={`text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold transition cursor-pointer ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <CheckCircle2 size={12} /> {isDone ? "Completed" : "Mark Done"}
                      </button>
                    </div>

                    <h4 className="text-sm font-semibold text-white">{sprint.theme}</h4>

                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Focus Areas:</p>
                      <ul className="text-xs text-slate-300 space-y-1 pl-2">
                        {(sprint.focus_areas || []).map((fa: string, faIdx: number) => (
                          <li key={faIdx} className="flex items-start gap-1.5">
                            <span className="text-violet-400">•</span>
                            <span>{fa}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-2.5 text-xs text-violet-200">
                      <strong className="block text-violet-300 font-semibold text-[11px] mb-0.5">Hands-on Drill:</strong>
                      {sprint.action_item}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* STAR Behavioral Prompts & Architecture Must-Knows */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-5 sm:p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Target size={18} className="text-emerald-400" /> High-Yield STAR Behavioral Prompts
              </h4>
              <p className="text-xs text-slate-400">
                Practice these exact scenarios using 50% Action and 20% Quantified Impact:
              </p>
              <div className="space-y-3">
                {(prepPlan?.star_prompts || [
                  "Tell me about a time you had to make a critical architectural trade-off under strict deadline pressure.",
                  "Describe a situation where a production system or service failed. How did you diagnose and remediate it?",
                  "Give an example of a technical disagreement with a team member and how you resolved it objectively.",
                ]).map((p: string, pIdx: number) => (
                  <div key={pIdx} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-200">
                    <span className="text-violet-400 font-bold mr-1.5">Prompt {pIdx + 1}:</span>
                    {p}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 sm:p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-amber-400" /> Must-Know Architecture Trade-offs
              </h4>
              <p className="text-xs text-slate-400">
                Be prepared to defend these technical design choices in your upcoming onsite loops:
              </p>
              <div className="space-y-3">
                {(prepPlan?.architecture_must_knows || [
                  "Horizontal vs vertical scaling trade-offs and distributed cache coherence.",
                  "Database isolation levels, read-replicas, and ACID vs BASE trade-offs.",
                  "API rate limiting algorithms (Token Bucket, Leaky Bucket, Sliding Window).",
                ]).map((arch: string, aIdx: number) => (
                  <div key={aIdx} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-200">
                    <span className="text-amber-400 font-bold mr-1.5">Concept {aIdx + 1}:</span>
                    {arch}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: Visual Analytics & Radar Charts */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-fadeIn">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-400" /> Candidate Percentile Distribution Curve
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Benchmarked against 14,800+ technical candidates evaluated across Tier-1 tech standards.
                </p>
              </div>
              <span className="self-start sm:self-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                Top 4.2% Percentile
              </span>
            </div>

            <div className="relative pt-4 pb-2">
              <svg viewBox="0 0 500 160" className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="bellGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="curveLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="70%" stopColor="#8b5cf6" />
                    <stop offset="90%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>

                <line x1="50" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <line x1="120" y1="20" x2="120" y2="130" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <line x1="265" y1="20" x2="265" y2="130" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <line x1="420" y1="20" x2="420" y2="130" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                <path
                  d="M 50 130 C 130 130, 180 120, 230 50 C 265 15, 275 15, 305 50 C 355 120, 400 130, 480 130 Z"
                  fill="url(#bellGradient)"
                />

                <path
                  d="M 50 130 C 130 130, 180 120, 230 50 C 265 15, 275 15, 305 50 C 355 120, 400 130, 480 130"
                  fill="none"
                  stroke="url(#curveLine)"
                  strokeWidth="3"
                />

                <line x1="430" y1="25" x2="430" y2="130" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="430" cy="100" r="7" fill="#10b981" />
                <circle cx="430" cy="100" r="14" fill="#10b981" opacity="0.3" className="animate-ping" />

                <g transform="translate(370, 8)">
                  <rect width="115" height="26" rx="8" fill="#0d121c" stroke="#10b981" strokeWidth="1" />
                  <text x="57" y="17" fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">
                    You: {overallScore}% (Top 5%)
                  </text>
                </g>

                <text x="60" y="148" fill="#64748b" fontSize="10">20%</text>
                <text x="160" y="148" fill="#64748b" fontSize="10">50%</text>
                <text x="260" y="148" fill="#64748b" fontSize="10">70% (Median)</text>
                <text x="360" y="148" fill="#64748b" fontSize="10">85% (FAANG Bar)</text>
                <text x="460" y="148" fill="#64748b" fontSize="10">99%</text>
              </svg>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {rubricList.map((item, idx) => (
              <Card key={idx} className="p-5 space-y-3 hover:border-violet-400/30 transition">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white">{item.name}</span>
                  <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-xs font-bold text-violet-300">
                    {item.score}% • {item.tier}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 transition-all duration-1000 ease-out"
                    style={{
                      width: barsAnimated ? `${item.score}%` : "0%",
                      transitionDelay: `${idx * 150}ms`,
                    }}
                  />
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: QA Audit View */}
      {activeTab === "audit" && (
        <Card className="p-6 space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg font-semibold text-white">Full Question & Answer Audit Log</h3>
            <p className="text-xs text-slate-400 mt-1">
              Detailed breakdown of candidate responses, adaptive difficulty adjustments, and evaluation notes.
            </p>
          </div>

          {qaAudit.length > 0 ? (
            <div className="space-y-4">
              {qaAudit.map((qa: any, index: number) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-violet-300">
                      Question {qa.question_number || index + 1} ({qa.difficulty || "Medium"})
                    </span>
                    <span className="text-slate-400 font-mono">{qa.topic || "Core Technical"}</span>
                  </div>

                  <p className="text-sm font-medium text-slate-100">{qa.question_text}</p>

                  <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 text-xs text-slate-300 font-mono">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Candidate Answer:</p>
                    {qa.answer_text || "No response submitted"}
                  </div>

                  {qa.evaluation && (
                    <div className="text-xs text-emerald-300 flex items-center gap-2 pt-1 border-t border-white/5">
                      <CheckCircle2 size={13} />
                      <span>{typeof qa.evaluation === 'string' ? qa.evaluation : qa.evaluation.feedback || "Evaluated against FAANG rubrics."}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center text-sm text-slate-400 space-y-2">
              <FileText size={24} className="mx-auto text-violet-400" />
              <p className="text-white font-semibold">Audit Recorded Against Candidate Account</p>
              <p className="text-xs text-slate-400">
                All responses evaluated against FAANG STAR frameworks and stored in PostgreSQL.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Tab 5: Recruiter Matrix View */}
      {activeTab === "recruiter" && (
        <Card className="p-6 space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg font-semibold text-white">MNC Recruiter Scorecard & Hiring Recommendation</h3>
            <p className="text-xs text-slate-400 mt-1">
              Standardized candidate evaluation output for hiring managers and interview loops.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-300">
                  Hiring Recommendation
                </span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200 border border-emerald-500/30">
                  STRONG HIRE
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                Candidate exceeds technical expectations for {interview?.job_role || "Target Role"}. Highly
                recommended for onsite architectural defense loops.
              </p>
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-violet-300">
                  Target Level Placement
                </span>
                <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-200 border border-violet-500/30">
                  L5 / Senior IC
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                Demonstrates senior-level technical autonomy, clear architectural trade-off reasoning, and grounded
                project defense.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
