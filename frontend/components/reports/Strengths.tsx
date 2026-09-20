import { Card } from "@/components/ui/Card";

export function Strengths({ items }: { items: string[] }) {
  return (
    <Card className="h-full p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Strengths</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-sm leading-6 text-slate-200">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
