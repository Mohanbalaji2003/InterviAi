"use client";

import { ArrowRight, BriefcaseBusiness, Clock3, FileText, LoaderCircle, SlidersHorizontal, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createInterview, fetchActiveProject, fetchActiveResume } from "@/lib/api";

const roleOptions = [
  "Data Scientist",
  "Data Analyst",
  "Machine Learning Engineer",
  "AI Engineer",
  "Software Engineer",
  "Data Engineer",
  "ML Engineer",
  "MLOps Engineer",
  "AI/ML Engineer",
  "NLP Engineer",
  "Computer Vision Engineer",
  "Generative AI Engineer",
  "LLM Engineer",
  "AI Product Engineer",
  "Research Engineer",
  "Business Intelligence Analyst",
  "Business Analyst",
  "BI Developer",
  "Analytics Engineer",
  "Data Architect",
  "Cloud Data Engineer",
  "Big Data Engineer",
  "Python Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Software Development Engineer",
  "QA Automation Engineer",
  "Database Developer",
  "SQL Developer",
  "Prompt Engineer",
  "AI Solutions Engineer",
  "Applied Scientist",
];

const candidateTypes = ["Experienced", "Mid-level", "Junior", "Career switcher"];
const experienceOptions = ["0-2 years", "2-5 years", "5-8 years", "8+ years"];
const difficultyOptions = ["Easy", "Medium", "Hard"];

export default function InterviewSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    role: "Data Scientist",
    candidateType: "Experienced",
    experience: "3-5 years",
    difficulty: "Medium",
    questions: 10,
    projectDefense: true,
  });

  const [activeResume, setActiveResume] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInputs() {
      try {
        const [res, proj] = await Promise.all([fetchActiveResume(), fetchActiveProject()]);
        if (res.active && res.resume) setActiveResume(res.resume.filename);
        if (proj.active && proj.project) setActiveProject(proj.project.name);
      } catch {
        // Ignored
      }
    }
    void loadInputs();
  }, []);

  async function handleCreateAssessment() {
    setError("");
    setCreating(true);
    try {
      const result = await createInterview({
        job_role: form.role,
        total_questions: form.questions,
        candidate_type: form.candidateType,
        experience_years: form.experience,
        starting_difficulty: form.difficulty,
        use_project_defense: form.projectDefense,
      });

      sessionStorage.setItem("current_interview_id", String(result.id));
      router.push(`/interview/session?id=${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assessment.");
      setCreating(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Assessment configuration</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Interview setup</h3>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Target job role ({roleOptions.length} available)</span>
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-slate-100 focus:border-violet-400/30 focus:outline-none"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Candidate type</span>
              <select
                value={form.candidateType}
                onChange={(event) => setForm((current) => ({ ...current, candidateType: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-slate-100 focus:border-violet-400/30 focus:outline-none"
              >
                {candidateTypes.map((candidateType) => (
                  <option key={candidateType} value={candidateType}>{candidateType}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Experience</span>
              <select
                value={form.experience}
                onChange={(event) => setForm((current) => ({ ...current, experience: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-slate-100 focus:border-violet-400/30 focus:outline-none"
              >
                {experienceOptions.map((experience) => (
                  <option key={experience} value={experience}>{experience}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Starting difficulty</span>
              <select
                value={form.difficulty}
                onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-slate-100 focus:border-violet-400/30 focus:outline-none"
              >
                {difficultyOptions.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Question count</p>
                <p className="mt-2 text-2xl font-semibold text-white">{form.questions} questions</p>
              </div>

              <input
                aria-label="Number of questions"
                type="range"
                min={5}
                max={20}
                step={1}
                value={form.questions}
                onChange={(event) => setForm((current) => ({ ...current, questions: Number(event.target.value) }))}
                className="w-full max-w-sm accent-violet-500"
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Assessment materials</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Candidate inputs</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className={`rounded-2xl border p-4 ${activeResume ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-dashed border-white/15 bg-slate-950/40'}`}>
              <div className="flex items-center justify-between text-slate-200">
                <span className="font-medium text-white">Resume upload</span>
                <Link href="/resume" className="text-xs text-violet-400 hover:underline">Manage</Link>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {activeResume ? `Active: ${activeResume}` : "No resume active. Upload resume to ground interview questions."}
              </p>
            </div>

            <div className={`rounded-2xl border p-4 ${activeProject ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-dashed border-white/15 bg-slate-950/40'}`}>
              <div className="flex items-center justify-between text-slate-200">
                <span className="font-medium text-white">Project defense RAG</span>
                <Link href="/projects" className="text-xs text-amber-400 hover:underline">Manage</Link>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {activeProject ? `Active: ${activeProject}` : "No project active. Upload project to enable project defense."}
              </p>
            </div>
          </div>

          <label className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-200">
            <span className="inline-flex items-center gap-2">
              <Wand2 size={16} className="text-violet-300" /> Project Defense & Resume Grounding
            </span>
            <input
              type="checkbox"
              checked={form.projectDefense}
              onChange={(event) => setForm((current) => ({ ...current, projectDefense: event.target.checked }))}
              className="h-4 w-4 accent-violet-500"
            />
          </label>
        </Card>
      </div>

      <Card className="h-fit p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Assessment preview</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Summary</h3>

        <div className="mt-5 space-y-4 text-sm text-slate-300">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <span className="inline-flex items-center gap-2"><BriefcaseBusiness size={15} className="text-violet-300" /> Role</span>
            <span className="font-medium text-white">{form.role}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <span className="inline-flex items-center gap-2"><SlidersHorizontal size={15} className="text-violet-300" /> Difficulty</span>
            <span className="font-medium text-white">{form.difficulty}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-violet-300" /> Length</span>
            <span className="font-medium text-white">{form.questions} questions</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <span className="inline-flex items-center gap-2"><Sparkles size={15} className="text-violet-300" /> Project defense</span>
            <span className="font-medium text-white">{form.projectDefense ? "Enabled" : "Disabled"}</span>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <Button
          type="button"
          size="lg"
          className="mt-6 w-full"
          onClick={handleCreateAssessment}
          disabled={creating}
        >
          {creating ? (
            <>
              <LoaderCircle size={16} className="animate-spin" /> Creating Assessment...
            </>
          ) : (
            <>
              Start Adaptive Assessment <ArrowRight size={16} />
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}
