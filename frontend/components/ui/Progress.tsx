type ProgressProps = {
  value: number;
  tone?: "violet" | "emerald" | "amber" | "slate";
  className?: string;
};

export function Progress({ value, tone = "violet", className = "" }: ProgressProps) {
  const clamp = Math.max(0, Math.min(100, value));
  const tones = {
    violet: "bg-violet-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    slate: "bg-slate-400",
  };

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${tones[tone]}`}
        style={{ width: `${clamp}%` }}
      />
    </div>
  );
}
