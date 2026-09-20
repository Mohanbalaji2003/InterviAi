import { Progress } from "@/components/ui/Progress";

export function InterviewProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const percent = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
        <span>Progress</span>
        <span>{current}/{total}</span>
      </div>
      <Progress value={percent} />
    </div>
  );
}
