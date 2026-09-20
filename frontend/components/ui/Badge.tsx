type BadgeProps = {
  children: React.ReactNode;
  tone?: "violet" | "emerald" | "amber" | "slate" | "rose";
};

export function Badge({ children, tone = "slate" }: BadgeProps) {
  const tones = {
    violet: "border-violet-400/20 bg-violet-500/10 text-violet-200",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    slate: "border-white/10 bg-white/[0.03] text-slate-200",
    rose: "border-rose-400/20 bg-rose-500/10 text-rose-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}
