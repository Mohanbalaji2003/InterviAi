"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { fetchCurrentUser, logout } from "@/lib/auth";
import { getNewcomerData } from "@/lib/api";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(pathname !== "/login");
  const [readinessScore, setReadinessScore] = useState<number>(0);

  useEffect(() => {
    if (pathname === "/login") {
      setCheckingAuth(false);
      return;
    }

    let mounted = true;
    void fetchCurrentUser()
      .then((user) => {
        if (!mounted) return;
        if (!user) {
          setCheckingAuth(false);
          router.replace("/login");
          return;
        }
        if (user.isNewcomer) {
          const data = getNewcomerData();
          setReadinessScore(data.interview?.readiness_score || 0);
        } else {
          setReadinessScore(91);
        }
        setCheckingAuth(false);
      })
      .catch(() => {
        if (!mounted) return;
        setCheckingAuth(false);
        router.replace("/login");
      });

    const handleDataChange = () => {
      void fetchCurrentUser().then((u) => {
        if (!mounted) return;
        if (u?.isNewcomer) {
          const data = getNewcomerData();
          setReadinessScore(data.interview?.readiness_score || 0);
        } else {
          setReadinessScore(91);
        }
      });
    };

    window.addEventListener("interviai_auth_change", handleDataChange);
    window.addEventListener("interviai_data_change", handleDataChange);

    return () => {
      mounted = false;
      window.removeEventListener("interviai_auth_change", handleDataChange);
      window.removeEventListener("interviai_data_change", handleDataChange);
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
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          style={{ display: mobileOpen ? "block" : "none" }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

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
            readiness={readinessScore}
          />
        </div>

        <div className="min-w-0 flex-1">
          <Topbar
            pathname={pathname}
            mobileOpen={mobileOpen}
            title={undefined}
            onToggleMobile={() => setMobileOpen((value) => !value)}
          />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
