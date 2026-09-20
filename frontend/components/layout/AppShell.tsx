"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { fetchCurrentUser, logout } from "@/lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(pathname !== "/login");

  useEffect(() => {
    if (pathname === "/login") {
      setCheckingAuth(false);
      return;
    }

    let mounted = true;
    void fetchCurrentUser().then((user) => {
      if (!mounted) return;
      if (!user) {
        router.replace("/login");
        return;
      }
      setCheckingAuth(false);
    });

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b12] text-sm text-slate-400">
        Loading your secure profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100">
      <div className="lg:flex">
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" style={{ display: mobileOpen ? "block" : "none" }} onClick={() => setMobileOpen(false)} aria-hidden="true" />

        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 shrink-0 border-r border-white/10 bg-[#0a0d13] transition-transform duration-300 lg:static lg:w-64 lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <Sidebar
            pathname={pathname}
            onClose={() => setMobileOpen(false)}
            onLogout={() => {
              void logout().finally(() => router.replace("/login"));
            }}
            readiness={86}
          />
        </div>

        <div className="min-w-0 flex-1">
          <Topbar pathname={pathname} mobileOpen={mobileOpen} title={undefined} onToggleMobile={() => setMobileOpen((value) => !value)} />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
