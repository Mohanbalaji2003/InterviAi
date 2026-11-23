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

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/interview">
            <Button type="button" size="lg" className="shadow-lg shadow-violet-950/40">
              Start Adaptive Assessment
            </Button>
          </Link>
          <Link href="/video-interview">
            <Button type="button" size="lg" variant="secondary" className="border-violet-500/30 hover:border-violet-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse mr-1" />
              AI Video Mock Interview
            </Button>
          </Link>
          <Link href="/reports">
            <Button type="button" size="lg" variant="secondary">View Scorecard</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
