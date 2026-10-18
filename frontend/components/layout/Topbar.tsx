"use client";

import {
  Award,
  Bell,
  Check,
  FileText,
  FolderPlus,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  Search,
  Settings,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { fetchCurrentUser, logout, loginAsDemoUser, loginAsNewcomer, type AuthUser } from "@/lib/auth";

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
  const router = useRouter();
  const pageTitle = title ?? routeTitles[pathname] ?? "Overview";
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function loadUser() {
      void fetchCurrentUser().then((u) => setUser(u));
    }
    loadUser();

    window.addEventListener("interviai_auth_change", loadUser);
    return () => {
      window.removeEventListener("interviai_auth_change", loadUser);
    };
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  // Compute initials
  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0].toUpperCase())
        .slice(0, 2)
        .join("")
    : user?.isNewcomer
      ? "NC"
      : "MB";

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    router.replace("/login");
  };

  const handleSwitchMode = async (toNewcomer: boolean) => {
    if (toNewcomer) {
      await loginAsNewcomer("newcomer@interviai.com", "New Candidate");
    } else {
      await loginAsDemoUser("mohanbalaji1810@gmail.com", "Mohan Balaji");
    }
    setShowProfileMenu(false);
    router.replace("/");
  };

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
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070b12]/90 backdrop-blur-xl">
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
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Candidate Intelligence Profile
            </p>
            <h1 className="mt-0.5 text-base font-semibold text-white sm:text-xl">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 relative">
          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => {
              setShowSearch(!showSearch);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            aria-label="Search"
            className="hidden rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-slate-300 transition hover:border-violet-400/30 hover:text-violet-200 sm:inline-flex items-center gap-2 text-xs cursor-pointer"
          >
            <Search size={15} />
            <span className="text-slate-400 text-xs">Search features...</span>
          </button>

          {/* Notifications Trigger */}
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
              setShowSearch(false);
            }}
            aria-label="Notifications"
            className="relative rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-slate-300 transition hover:border-violet-400/30 hover:text-violet-200 cursor-pointer"
          >
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-400 animate-ping" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-400" />
          </button>

          {/* Responsive Rightside Top Corner Icon (Profile & Quick Menu) */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
                setShowSearch(false);
              }}
              aria-label="Candidate account and quick actions"
              className="relative flex items-center gap-2 rounded-full p-0.5 transition hover:ring-2 hover:ring-violet-400/40 focus:outline-none cursor-pointer"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-violet-900/30">
                {initials}
              </div>
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#070b12]" />
            </button>

            {/* Responsive Profile Popover Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-12 z-50 w-72 sm:w-80 rounded-2xl border border-white/10 bg-[#0d121c]/95 p-4 shadow-2xl backdrop-blur-2xl animate-fadeIn space-y-3.5">
                {/* Profile Header */}
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {user?.name || (user?.isNewcomer ? "New Candidate" : "Mohan Balaji")}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {user?.email || (user?.isNewcomer ? "newcomer@interviai.com" : "mohanbalaji1810@gmail.com")}
                    </p>
                    <span
                      className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        user?.isNewcomer
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                          : "bg-violet-500/10 text-violet-300 border-violet-500/20"
                      }`}
                    >
                      {user?.isNewcomer ? "Newcomer Profile (Blank)" : "Showcase Profile (Mohan Balaji)"}
                    </span>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="space-y-1 text-xs">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2 py-1">
                    Quick Navigation
                  </p>
                  <Link
                    href="/"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-slate-300 hover:bg-violet-500/10 hover:text-white transition"
                  >
                    <LayoutDashboard size={15} className="text-violet-400" />
                    <span>Dashboard Overview</span>
                  </Link>

                  <Link
                    href="/interview"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-slate-300 hover:bg-violet-500/10 hover:text-white transition"
                  >
                    <Zap size={15} className="text-amber-400" />
                    <span>Adaptive Technical Assessment</span>
                  </Link>

                  <Link
                    href="/reports"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-slate-300 hover:bg-violet-500/10 hover:text-white transition"
                  >
                    <Award size={15} className="text-emerald-400" />
                    <span>Candidate Intelligence Reports</span>
                  </Link>

                  <Link
                    href="/projects"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-slate-300 hover:bg-violet-500/10 hover:text-white transition"
                  >
                    <FolderPlus size={15} className="text-blue-400" />
                    <span>Project Defense Workspace</span>
                  </Link>

                  <Link
                    href="/resume"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-slate-300 hover:bg-violet-500/10 hover:text-white transition"
                  >
                    <FileText size={15} className="text-pink-400" />
                    <span>Resume Claims Analysis</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-slate-300 hover:bg-violet-500/10 hover:text-white transition"
                  >
                    <Settings size={15} className="text-slate-400" />
                    <span>Platform Settings</span>
                  </Link>
                </div>

                {/* Candidate Workspace Mode Switcher */}
                <div className="border-t border-white/10 pt-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2 mb-1.5">
                    Profile Switcher
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSwitchMode(true)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition cursor-pointer ${
                        user?.isNewcomer
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-semibold"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      Newcomer (0%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode(false)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition cursor-pointer ${
                        !user?.isNewcomer
                          ? "bg-violet-500/20 border-violet-500/40 text-violet-200 font-semibold"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      Demo (91%)
                    </button>
                  </div>
                </div>

                {/* Log Out Action */}
                <div className="border-t border-white/10 pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Log Out of InterviAI</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
                className="absolute right-3 text-slate-400 hover:text-white cursor-pointer"
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
        <div className="absolute right-4 sm:right-16 top-16 z-50 w-80 rounded-2xl border border-white/10 bg-[#0d121c] p-4 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-violet-300" /> Activity Alerts
            </span>
            <button
              type="button"
              onClick={() => setShowNotifications(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
              <p className="font-semibold text-emerald-300">Data Isolation Active</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Your assessments and profile data are isolated.</p>
            </div>

            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-2.5">
              <p className="font-semibold text-violet-300">MNC Recruiter Mode Active</p>
              <p className="text-[11px] text-slate-400 mt-0.5">STAR candidate rubrics ready for evaluation.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
