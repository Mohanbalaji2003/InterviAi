"use client";

import Link from "next/link";
import { BarChart3, BriefcaseBusiness, FileText, Gauge, LayoutGrid, LogOut, MessageSquareText, Settings } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/interview", label: "Interviews", icon: MessageSquareText },
  { href: "/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  pathname,
  onClose,
  onLogout,
  readiness,
}: {
  pathname: string;
  onClose?: () => void;
  onLogout?: () => void;
  readiness: number;
}) {
  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-[#0a0d13] px-5 py-6">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-violet-950/40">
          I
        </div>
        <div>
          <p className="text-base font-semibold tracking-tight text-white">InterviAI</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Candidate intelligence profile</p>
        </div>
      </div>

      <nav className="mt-10 space-y-1.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-violet-500/10 text-violet-200 ring-1 ring-violet-500/30"
                  : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-100"
              }`}
            >
              <Icon size={16} className={active ? "text-violet-300" : "text-slate-500"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
          <span>Readiness</span>
          <Gauge size={14} className="text-violet-300" />
        </div>

        <p className="mt-3 text-2xl font-semibold text-white">{Math.round(readiness)}%</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-700"
            style={{ width: `${Math.max(0, Math.min(100, readiness))}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-slate-400">Role alignment score</p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-5 inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-rose-200"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
