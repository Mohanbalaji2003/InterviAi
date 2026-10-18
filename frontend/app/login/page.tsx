"use client";

import { ArrowRight, Sparkles, UserCheck, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { fetchCurrentUser, login, loginAsDemoUser, loginAsNewcomer, register } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchCurrentUser().then((user) => {
      if (user) router.replace("/");
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "register") {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      router.replace("/");
    } catch {
      // If live backend API is unreachable or fails
      if (mode === "register") {
        await loginAsNewcomer(email || "newcomer@interviai.com", name || "New Candidate");
      } else {
        await loginAsDemoUser(email || "mohanbalaji1810@gmail.com", name || "Mohan Balaji");
      }
      router.replace("/");
    } finally {
      setSubmitting(false);
    }
  }

  const handleDemoSignIn = async () => {
    setSubmitting(true);
    await loginAsDemoUser("mohanbalaji1810@gmail.com", "Mohan Balaji");
    router.replace("/");
  };

  const handleNewcomerSignIn = async () => {
    setSubmitting(true);
    await loginAsNewcomer(email || "newcomer@interviai.com", name || "New Candidate");
    router.replace("/");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b12] px-4 py-8 text-slate-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />
        <div className="login-grid" />
      </div>

      <div className="relative z-10 w-full max-w-[460px] animate-page-in">
        <header className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-lg font-semibold text-white shadow-xl shadow-violet-950/40 animate-logo-in">
            I
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">InterviAI</h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-violet-400 font-semibold">
            Adaptive AI Interview & Intelligence Platform
          </p>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-400">
            Sign in or start as a newcomer with a clean, blank profile.
          </p>
        </header>

        <section className="rounded-[24px] border border-white/10 bg-[#0d121c]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950/70 p-1 border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                mode === "login"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                mode === "register"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Newcomer (Blank Profile)
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
              {mode === "login" ? "Welcome Back" : "Create New Candidate Profile"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {mode === "login"
                ? "Enter your credentials to access your saved assessments."
                : "Starts with clean, blank details ready for your first interview."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" ? (
              <label className="block space-y-1.5 text-xs text-slate-300">
                <span>Candidate Full Name</span>
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. John Doe"
                  className="auth-input text-xs"
                />
              </label>
            ) : null}

            <label className="block space-y-1.5 text-xs text-slate-300">
              <span>Email Address</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="candidate@company.com"
                className="auth-input text-xs"
              />
            </label>

            <label className="block space-y-1.5 text-xs text-slate-300">
              <span>Password</span>
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="auth-input text-xs"
              />
            </label>

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-200"
              >
                {error}
              </p>
            ) : null}

            <button
              disabled={submitting}
              type="submit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-950/30 transition duration-200 hover:bg-violet-500 disabled:opacity-60 cursor-pointer"
            >
              {submitting
                ? "Securing profile..."
                : mode === "login"
                  ? "Sign In"
                  : "Register New Profile (Blank Details)"}
              {!submitting ? (
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              ) : null}
            </button>
          </form>

          {/* Quick Access Buttons for Evaluators and Newcomers */}
          <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
            <p className="text-[10px] text-center uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Instant 1-Click Access
            </p>

            {/* Blank Newcomer Profile */}
            <button
              type="button"
              onClick={handleNewcomerSignIn}
              disabled={submitting}
              className="w-full py-2.5 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <UserPlus size={14} className="text-emerald-400" />
                Start as Newcomer (Blank Workspace)
              </span>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                Fresh 0% Stats
              </span>
            </button>

            {/* Showcase Pre-Filled Demo */}
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={submitting}
              className="w-full py-2.5 px-3 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <UserCheck size={14} className="text-violet-300" />
                Explore Demo Candidate (Mohan Balaji)
              </span>
              <span className="text-[10px] bg-violet-500/20 px-2 py-0.5 rounded text-violet-300">
                91% Scorecard
              </span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
