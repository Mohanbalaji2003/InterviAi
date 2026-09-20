import Link from "next/link";

import { Button } from "@/components/ui/Button";

export function Hero({
  greeting,
  headline,
  subheadline,
}: {
  greeting: string;
  headline: string;
  subheadline: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-violet-500/20 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.18),_transparent_30%),linear-gradient(135deg,_rgba(17,24,39,0.96),_rgba(12,16,25,0.98))] p-6 sm:p-8 lg:p-10">
      <div className="absolute -right-20 -top-16 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 max-w-2xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-violet-200/80">{greeting}</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">{headline}</h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">{subheadline}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/interview">
            <Button type="button" size="lg">Start New Assessment</Button>
          </Link>
          <Link href="/reports">
            <Button type="button" size="lg" variant="secondary">View Reports</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
