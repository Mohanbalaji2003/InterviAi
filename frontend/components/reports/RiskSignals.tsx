import { Card } from "@/components/ui/Card";

export function RiskSignals({ items }: { items: { label: string; detail: string }[] }) {
  return (
    <Card className="h-full p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Risk signals</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-100">{item.label}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-rose-200">Flag</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
