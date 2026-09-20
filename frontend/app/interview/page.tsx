"use client";

import { ArrowRight, BriefcaseBusiness, Clock3, FileText, SlidersHorizontal, Sparkles, Upload, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const roleOptions = ["Senior Full-Stack Engineer", "AI Engineer", "Platform Engineer", "Product Engineer"];
const candidateTypes = ["Experienced", "Mid-level", "Junior", "Career switcher"];
const experienceOptions = ["0-2 years", "2-5 years", "5-8 years", "8+ years"];
const difficultyOptions = ["Adaptive", "Balanced", "Deep technical", "Expert"];

export default function InterviewSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    role: "Senior Full-Stack Engineer",
    candidateType: "Experienced",
    experience: "5-8 years",
    difficulty: "Adaptive",
    questions: 10,
    projectDefense: true,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Assessment configuration</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Interview setup</h3>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Target role</span>
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
                <p className="mt-2 text-2xl font-semibold text-white">{form.questions}</p>
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
            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-4">
              <div className="flex items-center gap-3 text-slate-200">
                <Upload size={16} className="text-violet-300" />
                <span className="font-medium">Resume upload</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">No file selected yet.</p>
            </div>

            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-4">
              <div className="flex items-center gap-3 text-slate-200">
                <FileText size={16} className="text-violet-300" />
                <span className="font-medium">Project files</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">Support a defense review.</p>
            </div>
          </div>

          <label className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-200">
            <span className="inline-flex items-center gap-2"><Wand2 size={16} className="text-violet-300" /> Project Defense toggle</span>
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
            <span>{form.role}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <span className="inline-flex items-center gap-2"><SlidersHorizontal size={15} className="text-violet-300" /> Difficulty</span>
            <span>{form.difficulty}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-violet-300" /> Length</span>
            <span>{form.questions} questions</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <span className="inline-flex items-center gap-2"><Sparkles size={15} className="text-violet-300" /> Project defense</span>
            <span>{form.projectDefense ? "Enabled" : "Disabled"}</span>
          </div>
        </div>

        <Button type="button" size="lg" className="mt-6 w-full" onClick={() => router.push('/interview/session')}>
          Create Assessment
          <ArrowRight size={16} />
        </Button>
      </Card>
    </div>
  );
}
