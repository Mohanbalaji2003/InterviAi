"use client";

import { BrainCircuit, Check, RotateCcw, Sparkles, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/Card";

type FocusArea = {
  id: string;
  label: string;
  baseline: number;
  impact: number;
};

const focusAreas: FocusArea[] = [
  { id: "architecture", label: "Architecture trade-offs", baseline: 62, impact: 0.28 },
  { id: "observability", label: "Observability & reliability", baseline: 58, impact: 0.22 },
  { id: "communication", label: "Technical communication", baseline: 76, impact: 0.18 },
];

const STORAGE_KEY = "interviai-readiness-plan";

export function ReadinessSimulator() {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(focusAreas.map((area) => [area.id, area.baseline])),
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedPlan = window.localStorage.getItem(STORAGE_KEY);
    if (!savedPlan) return;

    try {
      const parsed = JSON.parse(savedPlan) as Record<string, number>;
      setValues((current) => ({ ...current, ...parsed }));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const projectedReadiness = useMemo(() => {
    const improvement = focusAreas.reduce((total, area) => {
      const delta = Math.max(0, values[area.id] - area.baseline);
      return total + delta * area.impact;
    }, 0);

    return Math.min(99, Math.round(86 + improvement));
  }, [values]);

  function updateValue(id: string, value: number) {
    setSaved(false);
    setValues((current) => ({ ...current, [id]: value }));
  }

  function savePlan() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    setSaved(true);
  }

  function resetPlan() {
    setValues(Object.fromEntries(focusAreas.map((area) => [area.id, area.baseline])));
    window.localStorage.removeItem(STORAGE_KEY);
    setSaved(false);
  }

  return (
    <Card className="relative overflow-hidden border-violet-400/20 bg-[radial-gradient(circle_at_top_right,_rgba(124,58,237,0.14),_transparent_38%),rgba(255,255,255,0.03)] p-5 sm:p-6">
      <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2 text-violet-200">
              <BrainCircuit size={17} />
              <p className="text-[10px] uppercase tracking-[0.22em]">Readiness simulator</p>
            </div>
            <h3 className="mt-2 text-xl font-semibold text-white">Build your next interview edge</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Move each focus area to the confidence level you want to reach. InterviAI estimates how much your role readiness could improve.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-violet-200/70">Projected</p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-white transition-all duration-300">{projectedReadiness}%</p>
            <p className="text-xs text-violet-200/70">role readiness</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {focusAreas.map((area) => (
            <label key={area.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium leading-5 text-slate-200">{area.label}</span>
                <span className="text-sm font-semibold text-violet-200">{values[area.id]}%</span>
              </div>
              <input
                aria-label={`${area.label} target`}
                type="range"
                min={area.baseline}
                max={100}
                value={values[area.id]}
                onChange={(event) => updateValue(area.id, Number(event.target.value))}
                className="mt-5 w-full accent-violet-500"
              />
              <span className="mt-2 block text-xs text-slate-500">Current baseline: {area.baseline}%</span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-col justify-between gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-sm text-slate-400">
            {saved ? <Check size={15} className="text-emerald-300" /> : <Target size={15} className="text-violet-300" />}
            {saved ? "Your preparation plan is saved on this device." : "Set targets, then save your preparation plan."}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={resetPlan} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-white/20 hover:text-slate-200">
              <RotateCcw size={13} /> Reset
            </button>
            <button type="button" onClick={savePlan} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-violet-400">
              <Sparkles size={13} /> Save plan
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
