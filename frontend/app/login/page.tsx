"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { fetchCurrentUser, login, register } from "@/lib/auth";

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
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete authentication.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b12] px-4 py-8 text-slate-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />
        <div className="login-grid" />
      </div>

      <div className="relative z-10 w-full max-w-[430px] animate-page-in">
        <header className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-lg font-semibold text-white shadow-xl shadow-violet-950/40 animate-logo-in">
            I
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-white">InterviAI</h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-500">
            Candidate intelligence profile
          </p>
          <p className="mx-auto mt-5 max-w-xs text-sm leading-6 text-slate-400">
            AI-powered adaptive interviews and candidate intelligence.
          </p>
        </header>

        <section className="rounded-[26px] border border-white/10 bg-[#0d121c]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <div className="mb-7">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
              <Sparkles size={18} />
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              {mode === "login" ? "Welcome back" : "Create your profile"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {mode === "login"
                ? "Sign in to continue to your private workspace."
                : "Create a secure profile for your interviews and reports."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" ? (
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Name</span>
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Mohan Balaji"
                  className="auth-input"
                />
              </label>
            ) : null}

            <label className="block space-y-2 text-sm text-slate-300">
              <span>Email address</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="auth-input"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-300">
              <span>Password</span>
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="auth-input"
              />
            </label>

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"
              >
                {error}
              </p>
            ) : null}

            <button
              disabled={submitting}
              type="submit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Securing your profile..."
                : mode === "login"
                  ? "Sign in to InterviAI"
                  : "Create secure profile"}
              {!submitting ? (
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              ) : null}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="text-sm text-violet-300 transition hover:text-violet-200"
            >
              {mode === "login"
                ? "New to InterviAI? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </div>

        </section>
      </div>
    </main>
  );
}
