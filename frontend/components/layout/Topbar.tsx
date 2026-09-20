"use client";

import { Bell, Menu, PanelLeftClose, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/interview": "Interview setup",
  "/interview/session": "Live interview",
  "/projects": "Project workspace",
  "/resume": "Resume analysis",
  "/reports": "Candidate intelligence report",
  "/settings": "Settings",
};

export function Topbar({
  pathname,
  onToggleMobile,
  mobileOpen,
  title,
}: {
  pathname: string;
  onToggleMobile: () => void;
  mobileOpen: boolean;
  title?: string;
}) {
  const pageTitle = title ?? routeTitles[pathname] ?? "Overview";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b12]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onToggleMobile}
            aria-label="Toggle navigation"
            leading={mobileOpen ? <PanelLeftClose size={16} /> : <Menu size={16} />}
          />

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Candidate intelligence profile</p>
            <h1 className="mt-1 text-base font-semibold text-white sm:text-xl">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Search"
            className="hidden rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-slate-300 transition hover:border-violet-400/30 hover:text-violet-200 sm:inline-flex"
          >
            <Search size={15} />
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-slate-300 transition hover:border-violet-400/30 hover:text-violet-200"
          >
            <Bell size={15} />
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-violet-900/20">
            M
          </div>
        </div>
      </div>
    </header>
  );
}
