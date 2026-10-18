"use client";

import { Award, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

export function IntelligenceScore({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const stepTime = 16;
    const totalSteps = duration / stepTime;
    const increment = value / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  // Circular gauge math (radius 54, circumference 2 * PI * 54 = 339.29)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  return (
    <Card className="relative overflow-hidden p-6 sm:p-7">
      {/* Background Animated Gradient Orb */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            <Sparkles size={13} className="text-violet-400" />
            <span>AI Verified Scorecard</span>
          </div>

          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h3>

          <div className="flex items-baseline justify-center sm:justify-start gap-2">
            <span className="text-5xl font-black tracking-tight text-white">{animatedValue}%</span>
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp size={14} /> Exceeds Benchmark
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-sm leading-relaxed">{subtitle}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
              <Zap size={12} className="text-amber-400" /> FAANG Percentile: <strong className="text-white">Top 5%</strong>
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
              <Award size={12} /> Tier-1 MNC Ready
            </span>
          </div>
        </div>

        {/* Animated Radial SVG Progress Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 128 128">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated Gradient Stroke */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="url(#scoreGradient)"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </svg>

          {/* Inner Badge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-white tracking-tight">{animatedValue}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Readiness</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
