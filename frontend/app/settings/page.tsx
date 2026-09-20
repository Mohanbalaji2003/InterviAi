import { Bell, MoonStar, ShieldCheck, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Profile</p>
          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-base font-semibold text-white">M</div>
            <div>
              <p className="text-lg font-semibold text-white">Mohan Balaji</p>
              <p className="text-sm text-slate-400">Product engineer profile</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Assessment preferences</p>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <label className="flex items-center justify-between gap-3"><span>Target role</span><span className="font-medium text-white">Senior Full-Stack Engineer</span></label>
            <label className="flex items-center justify-between gap-3"><span>Difficulty mode</span><span className="font-medium text-white">Adaptive</span></label>
            <label className="flex items-center justify-between gap-3"><span>Question count</span><span className="font-medium text-white">10</span></label>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Theme & notifications</p>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3"><span className="inline-flex items-center gap-2"><MoonStar size={15} className="text-violet-300" /> Dark theme</span><input type="checkbox" checked readOnly className="h-4 w-4 accent-violet-500" /></label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3"><span className="inline-flex items-center gap-2"><Bell size={15} className="text-violet-300" /> Notifications</span><input type="checkbox" checked readOnly className="h-4 w-4 accent-violet-500" /></label>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Backend connection</p>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3"><span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-300" /> API status</span><span className="font-medium text-emerald-200">Connected</span></div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3"><span className="inline-flex items-center gap-2"><Sparkles size={15} className="text-violet-300" /> Endpoint</span><span className="font-medium text-white">http://127.0.0.1:8000</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
