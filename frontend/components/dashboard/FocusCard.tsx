import { Card } from "@/components/ui/Card";

export function FocusCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; detail: string }[];
}) {
  return (
    <Card className="h-full p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-100">{item.label}</span>
              <span className="text-xs text-violet-200">{item.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
