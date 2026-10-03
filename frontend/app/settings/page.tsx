"use client";

import { Bell, Check, Globe, LoaderCircle, Mic, MoonStar, RefreshCw, Save, ShieldCheck, Sparkles, User, Volume2, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchCurrentUser } from "@/lib/auth";
import { API_URL } from "@/lib/config";

export default function SettingsPage() {
  const [userName, setUserName] = useState("Mohan Balaji");
  const [userEmail, setUserEmail] = useState("mohan@example.com");
  const [targetRole, setTargetRole] = useState("Data Scientist");
  const [difficultyMode, setDifficultyMode] = useState("Adaptive");
  const [defaultQuestions, setDefaultQuestions] = useState(10);
  
  // MNC Recruiter & Feature Toggles
  const [mncMode, setMncMode] = useState(true);
  const [voiceMode, setVoiceMode] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);

  // Status & Testing
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [apiStatus, setApiStatus] = useState<"connected" | "error" | "idle">("idle");

  useEffect(() => {
    // Load persisted settings from localStorage
    const savedName = localStorage.getItem("setting_userName");
    const savedRole = localStorage.getItem("setting_targetRole");
    const savedMnc = localStorage.getItem("setting_mncMode");
    const savedVoice = localStorage.getItem("setting_voiceMode");

    if (savedName) setUserName(savedName);
    if (savedRole) setTargetRole(savedRole);
    if (savedMnc !== null) setMncMode(savedMnc === "true");
    if (savedVoice !== null) setVoiceMode(savedVoice === "true");

    // Load actual user email if logged in
    void fetchCurrentUser().then((u) => {
      if (u) {
        setUserName(u.name || "Mohan Balaji");
        setUserEmail(u.email || "candidate@interviai.com");
      }
    });
  }, []);

  const handleSave = () => {
    setSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      localStorage.setItem("setting_userName", userName);
      localStorage.setItem("setting_targetRole", targetRole);
      localStorage.setItem("setting_mncMode", String(mncMode));
      localStorage.setItem("setting_voiceMode", String(voiceMode));
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  const handleTestApi = async () => {
    setTestingApi(true);
    setApiStatus("idle");
    const start = Date.now();
    try {
      const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" }).catch(() => null);
      const elapsed = Date.now() - start;
      setApiLatency(elapsed);
      setApiStatus(res && res.status < 500 ? "connected" : "error");
    } catch {
      setApiStatus("error");
    } finally {
      setTestingApi(false);
    }
  };

  const handleClearCache = () => {
    if (confirm("Clear local assessment session cache?")) {
      sessionStorage.clear();
      alert("Session cache cleared successfully!");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Sparkles size={22} className="text-violet-400" /> Platform & Recruiter Settings
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Customize your candidate profile, MNC recruiter benchmarks, voice recognition, and backend connectivity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={handleClearCache} className="text-xs">
            <RefreshCw size={14} /> Clear Cache
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="text-xs">
            {saving ? <LoaderCircle size={14} className="animate-spin" /> : saveSuccess ? <Check size={14} className="text-emerald-300" /> : <Save size={14} />}
            {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Preferences"}
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check size={16} className="text-emerald-300" /> Preferences and MNC recruiter configurations saved locally!
          </span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Candidate Profile Details */}
        <Card className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <User size={18} className="text-violet-300" />
              <p className="text-sm font-semibold text-white uppercase tracking-wider">Candidate Profile</p>
            </div>
            <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-300 border border-violet-500/20">Active</span>
          </div>

          <div className="space-y-4 text-sm">
            <label className="block space-y-1.5">
              <span className="text-xs text-slate-400">Full Name</span>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-white focus:border-violet-400 focus:outline-none"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs text-slate-400">Email Address</span>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-slate-300 focus:border-violet-400 focus:outline-none"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs text-slate-400">Target Role Preference</span>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3.5 py-2.5 text-white focus:border-violet-400 focus:outline-none"
              />
            </label>
          </div>
        </Card>

        {/* MNC Recruiter Standards & Assessment Preferences */}
        <Card className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-amber-300" />
              <p className="text-sm font-semibold text-white uppercase tracking-wider">MNC Recruiter Standards</p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300 border border-amber-500/20">FAANG Benchmarks</span>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3.5 cursor-pointer hover:bg-slate-900/50 transition">
              <div className="space-y-0.5">
                <span className="font-medium text-white flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-400" /> MNC Recruiter Intelligence Mode
                </span>
                <p className="text-xs text-slate-400">Evaluates responses against Google/Amazon STAR candidate rubrics.</p>
              </div>
              <input
                type="checkbox"
                checked={mncMode}
                onChange={(e) => setMncMode(e.target.checked)}
                className="h-4 w-4 accent-violet-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3.5 cursor-pointer hover:bg-slate-900/50 transition">
              <div className="space-y-0.5">
                <span className="font-medium text-white flex items-center gap-2">
                  <Mic size={15} className="text-violet-300" /> Voice Response & Speech-to-Text
                </span>
                <p className="text-xs text-slate-400">Enables live voice recording during interview questions.</p>
              </div>
              <input
                type="checkbox"
                checked={voiceMode}
                onChange={(e) => setVoiceMode(e.target.checked)}
                className="h-4 w-4 accent-violet-500 rounded"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="block space-y-1">
                <span className="text-xs text-slate-400">Adaptive Mode</span>
                <select
                  value={difficultyMode}
                  onChange={(e) => setDifficultyMode(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Adaptive">Adaptive (Dynamic)</option>
                  <option value="Standard">Standard MNC</option>
                  <option value="FAANG Hard">FAANG Hard</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs text-slate-400">Default Questions</span>
                <select
                  value={defaultQuestions}
                  onChange={(e) => setDefaultQuestions(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </label>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Environment & UI Toggles */}
        <Card className="p-5 sm:p-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold border-b border-white/10 pb-2">Theme & Display</p>
          <div className="space-y-3 text-sm text-slate-300">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 cursor-pointer">
              <span className="inline-flex items-center gap-2"><MoonStar size={15} className="text-violet-300" /> Dark OLED Theme</span>
              <input type="checkbox" checked={darkTheme} onChange={(e) => setDarkTheme(e.target.checked)} className="h-4 w-4 accent-violet-500" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 cursor-pointer">
              <span className="inline-flex items-center gap-2"><Volume2 size={15} className="text-violet-300" /> Interactive Audio Cues</span>
              <input type="checkbox" checked={soundEffects} onChange={(e) => setSoundEffects(e.target.checked)} className="h-4 w-4 accent-violet-500" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 cursor-pointer">
              <span className="inline-flex items-center gap-2"><Bell size={15} className="text-violet-300" /> Assessment Completion Alerts</span>
              <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} className="h-4 w-4 accent-violet-500" />
            </label>
          </div>
        </Card>

        {/* Backend & API Connectivity Tester */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">Backend Endpoint Diagnostic</p>
            <Button type="button" variant="secondary" onClick={handleTestApi} disabled={testingApi} className="text-xs py-1 h-7">
              {testingApi ? <LoaderCircle size={12} className="animate-spin" /> : <Globe size={12} />}
              {testingApi ? "Pinging..." : "Test Connection"}
            </Button>
          </div>

          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">Target Endpoint</span>
              <span className="font-mono text-xs text-violet-300 truncate max-w-[220px]">{API_URL}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={15} className={apiStatus === "connected" ? "text-emerald-400" : apiStatus === "error" ? "text-rose-400" : "text-slate-400"} />
                Diagnostic Status
              </span>
              <span className={`font-semibold text-xs ${apiStatus === "connected" ? "text-emerald-300" : apiStatus === "error" ? "text-rose-300" : "text-slate-400"}`}>
                {apiStatus === "connected" ? `Connected (${apiLatency}ms)` : apiStatus === "error" ? "Unreachable / CORS" : "Ready to test"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
