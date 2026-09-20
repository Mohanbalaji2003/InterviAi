import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

export function IntelligenceScore({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="mt-4 flex items-end gap-3">
        <span className="text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">{value}</span>
        <span className="pb-1 text-sm text-slate-400">/ 100</span>
      </div>
      <p className="mt-3 text-sm text-slate-400">{subtitle}</p>
      <div className="mt-5">
        <Progress value={value} />
      </div>
    </Card>
  );
}
