import { Progress } from "@/components/ui/Progress";

export function MetricCard({
  label,
  value,
  subtitle,
  progress,
  tone = "violet",
}: {
  label: string;
  value: string;
  subtitle?: string;
  progress?: number;
  tone?: "violet" | "emerald" | "amber" | "slate";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <span className="text-xs font-medium text-slate-300">{value}</span>
      </div>

      {progress !== undefined ? (
        <div className="mt-4">
          <Progress value={progress} tone={tone} />
        </div>
      ) : null}

      {subtitle ? <p className="mt-3 text-xs text-slate-400">{subtitle}</p> : null}
    </div>
  );
}
