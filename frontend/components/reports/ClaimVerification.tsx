import { Card } from "@/components/ui/Card";

export function ClaimVerification({
  items,
}: {
  items: { label: string; value: string; tone: "green" | "amber" | "slate" }[];
}) {
  const tones = {
    green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    slate: "border-white/10 bg-white/[0.03] text-slate-200",
  };

  return (
    <Card className="p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Resume evidence</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className={`rounded-xl border p-3 ${tones[item.tone]}`}>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
