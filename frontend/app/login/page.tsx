"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { fetchCurrentUser, login, loginAsDemoUser, loginAsNewcomer, register } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please verify both password fields.");
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === "register") {
        await register(name.trim(), cleanEmail, password);
      } else {
        await login(cleanEmail, password);
      }
      router.replace("/");
    } catch (err: any) {
      const msg = err?.message || "Authentication failed. Please verify your credentials and try again.";
      setError(msg);
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
    await loginAsNewcomer(email.trim() || "newcomer@interviai.com", name.trim() || "New Candidate");
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
            Adaptive AI Interview & Candidate Intelligence
          </p>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-400">
            Sign in with your email or register a new candidate account.
          </p>
        </header>

        <section className="rounded-[24px] border border-white/10 bg-[#0d121c]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">
          {/* Mode Switcher Tabs: Sign In / Sign Up */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950/70 p-1 border border-white/10 mb-5">
            <button
              type="button"
              id="tab-signin"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === "login"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-950/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserCheck size={14} />
              Sign In
            </button>
            <button
              type="button"
              id="tab-signup"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === "register"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-950/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserPlus size={14} />
              Sign Up
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
              {mode === "login" ? "Welcome Back" : "Create Candidate Account"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {mode === "login"
                ? "Enter your email and password to access your dashboard and assessments."
                : "Register with your details to start practicing with our AI interviewer."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" ? (
              <label className="block space-y-1.5 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <User size={13} className="text-violet-400" />
                  Full Name
                </span>
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Alex Morgan"
                  autoComplete="name"
                  className="auth-input text-xs"
                />
              </label>
            ) : null}

            <label className="block space-y-1.5 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Mail size={13} className="text-violet-400" />
                Email Address
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="candidate@company.com"
                autoComplete="email"
                className="auth-input text-xs"
              />
            </label>

            <label className="block space-y-1.5 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Lock size={13} className="text-violet-400" />
                Password
              </span>
              <div className="relative">
                <input
                  required
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "register" ? "At least 6 characters" : "Enter your password"}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="auth-input text-xs pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </label>

            {mode === "register" ? (
              <label className="block space-y-1.5 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={13} className="text-violet-400" />
                  Confirm Password
                </span>
                <div className="relative">
                  <input
                    required
                    minLength={6}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="auth-input text-xs pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </label>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200"
              >
                <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p>{error}</p>
                  {error.includes("already exists") ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError("");
                      }}
                      className="text-violet-300 underline hover:text-violet-200 font-semibold cursor-pointer block mt-1"
                    >
                      Click here to Sign In with this email &rarr;
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <button
              disabled={submitting}
              type="submit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-950/30 transition duration-200 hover:bg-violet-500 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                mode === "login" ? "Signing In..." : "Creating Account..."
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In to InterviAI" : "Create Account & Sign In"}</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {/* Switch Mode Helper Link */}
            <div className="text-center pt-2">
              {mode === "login" ? (
                <p className="text-xs text-slate-400">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError("");
                    }}
                    className="font-semibold text-violet-400 hover:text-violet-300 underline cursor-pointer"
                  >
                    Sign Up here
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                    className="font-semibold text-violet-400 hover:text-violet-300 underline cursor-pointer"
                  >
                    Sign In here
                  </button>
                </p>
              )}
            </div>
          </form>

          {/* Quick Access Buttons for Evaluators and Reviewers */}
          <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
            <p className="text-[10px] text-center uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Recruiter & Evaluator Fast Pass
            </p>

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
              <span className="text-[10px] bg-violet-500/20 px-2 py-0.5 rounded text-violet-300 font-medium">
                91% Scorecard
              </span>
            </button>

            {/* Blank Newcomer Profile */}
            <button
              type="button"
              onClick={handleNewcomerSignIn}
              disabled={submitting}
              className="w-full py-2.5 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <UserPlus size={14} className="text-emerald-400" />
                Explore Fresh Candidate Workspace
              </span>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-medium">
                0% New Profile
              </span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
