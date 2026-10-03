"use client";

import { Bell, Check, Menu, PanelLeftClose, Search, Sparkles, User, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const searchResults = [
    { title: "Adaptive Technical Assessment", url: "/interview", tag: "Interview" },
    { title: "Candidate Resume Analysis & Claims", url: "/resume", tag: "Resume" },
    { title: "Project Defense RAG Knowledge Base", url: "/projects", tag: "Project" },
    { title: "MNC Recruiter Intelligence Scorecard", url: "/reports", tag: "Report" },
    { title: "Platform & Voice Mic Settings", url: "/settings", tag: "Settings" },
  ].filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Candidate Intelligence Profile</p>
            <h1 className="mt-0.5 text-base font-semibold text-white sm:text-xl">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 relative">
          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Search"
            className="hidden rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-slate-300 transition hover:border-violet-400/30 hover:text-violet-200 sm:inline-flex items-center gap-2 text-xs"
          >
            <Search size={15} />
            <span className="text-slate-400 text-xs">Search features...</span>
          </button>

          {/* Notifications Trigger */}
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-slate-300 transition hover:border-violet-400/30 hover:text-violet-200"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-400 animate-ping" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-400" />
          </button>

          {/* Profile Avatar -> Settings */}
          <Link href="/settings" title="Candidate Settings">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 hover:scale-105 transition cursor-pointer">
              M
            </div>
          </Link>
        </div>
      </div>

      {/* Interactive Quick Search Overlay */}
      {showSearch && (
        <div className="border-t border-white/10 bg-[#0a0d13] p-4 animate-fadeIn">
          <div className="mx-auto max-w-xl space-y-3">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search interviews, reports, resume claims, project defense..."
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-10 pr-10 text-sm text-white focus:border-violet-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1">
              {searchResults.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.url}
                  onClick={() => setShowSearch(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs text-slate-300 hover:bg-violet-500/10 hover:text-white transition"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                    {item.tag}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Popover */}
      {showNotifications && (
        <div className="absolute right-4 sm:right-8 top-16 z-50 w-80 rounded-2xl border border-white/10 bg-[#0d121c] p-4 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-violet-300" /> Activity Alerts
            </span>
            <button
              type="button"
              onClick={() => setShowNotifications(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
              <p className="font-semibold text-emerald-300">PostgreSQL DB Connected</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Your profile evidence is data-isolated & persisted.</p>
            </div>

            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-2.5">
              <p className="font-semibold text-violet-300">MNC Recruiter Mode Active</p>
              <p className="text-[11px] text-slate-400 mt-0.5">FAANG candidate rubrics ready for evaluation.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
