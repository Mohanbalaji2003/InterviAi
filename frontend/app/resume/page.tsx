"use client";

import { CheckCircle2, Eye, FileText, HelpCircle, Layers3, LoaderCircle, RefreshCw, Sparkles, Trash2, Upload, Wand2, Zap } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteActiveResume, fetchActiveResume, uploadFile, type ActiveResumeData } from "@/lib/api";

export default function ResumePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeResume, setActiveResume] = useState<ActiveResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);

  async function loadResume() {
    try {
      const data = await fetchActiveResume();
      setActiveResume(data);
    } catch {
      setActiveResume({ active: false, resume: null });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadResume();
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      await uploadFile(file, "resume");
      await loadResume();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Resume upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to remove your active resume?")) return;
    try {
      await deleteActiveResume();
      await loadResume();
    } catch {
      setError("Failed to delete resume.");
    }
  }

  const isResumeActive = Boolean(activeResume?.active && activeResume?.resume);
  const resume = activeResume?.resume;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card className="p-5 sm:p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Resume Intelligence Engine</p>
            <h3 className="mt-1 text-xl font-semibold text-white flex items-center gap-2">
              <FileText size={20} className="text-violet-400" /> Candidate Resume & Verified Claims
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs"
            >
              {uploading ? <LoaderCircle size={15} className="animate-spin" /> : isResumeActive ? <RefreshCw size={15} /> : <Upload size={15} />}
              {uploading ? "Uploading..." : isResumeActive ? "Replace Resume" : "Upload Resume"}
            </Button>
            {isResumeActive && (
              <Button type="button" variant="secondary" onClick={handleDelete} className="text-xs text-rose-400 hover:text-rose-300">
                <Trash2 size={15} /> Remove
              </Button>
            )}
          </div>
        </div>

        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="sr-only" />

        <div className="grid gap-4 lg:grid-cols-[1.4fr,0.8fr]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`rounded-2xl border p-5 text-left transition ${
              isResumeActive
                ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400/50'
                : 'border-dashed border-white/15 bg-slate-950/40 hover:border-violet-400/40 hover:bg-violet-500/5'
            }`}
          >
            <div className="flex items-center gap-3 text-slate-200">
              <FileText size={22} className={isResumeActive ? "text-emerald-300" : "text-violet-300"} />
              <div>
                <span className="font-semibold text-white text-base block">
                  {isResumeActive ? `Active: ${resume?.filename}` : "Upload Candidate Resume"}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  {isResumeActive
                    ? `Uploaded on ${new Date(resume?.uploaded_at || Date.now()).toLocaleDateString()}. Persisted to PostgreSQL database.`
                    : "PDF, DOC, DOCX, or TXT up to 10 MB."}
                </p>
              </div>
            </div>
            {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
          </button>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">DB Persistence & Verification</p>
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium pt-1">
              <CheckCircle2 size={16} />
              <span>{isResumeActive ? "Resume active in PostgreSQL DB" : "No active resume loaded"}</span>
            </div>
            {resume?.text_snippet ? (
              <p className="text-xs text-slate-400 line-clamp-3 italic pt-1 border-t border-white/5">
                "{resume.text_snippet}..."
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr,1.1fr]">
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Extracted Skills ({resume?.skills?.length ?? 0})</p>
            <span className="text-xs text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full">NLP Mapped</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {loading ? (
              <p className="text-xs text-slate-500">Extracting skills...</p>
            ) : isResumeActive && (resume?.skills.length ?? 0) > 0 ? (
              resume?.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100 hover:bg-violet-500/20 cursor-default transition">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400">Upload your resume to extract candidate technical skills.</p>
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Extracted Verification Claims</p>
            <span className="text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap size={11} /> Click to Inspect Probing Qs
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {loading ? (
              <p className="text-xs text-slate-500">Extracting verification claims...</p>
            ) : isResumeActive && (resume?.claims.length ?? 0) > 0 ? (
              resume?.claims.map((claim, idx) => {
                const isSelected = selectedClaim === claim;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedClaim(isSelected ? null : claim)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition space-y-2 ${
                      isSelected
                        ? "border-amber-400/50 bg-amber-500/10 text-amber-100"
                        : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-violet-400/30 hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium flex items-start gap-2">
                        <span className="text-violet-400 shrink-0">•</span> {claim}
                      </span>
                      <Eye size={14} className={isSelected ? "text-amber-300 shrink-0" : "text-slate-500 shrink-0"} />
                    </div>

                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-amber-500/20 text-slate-300 space-y-1.5 animate-fadeIn">
                        <p className="font-semibold text-amber-300 flex items-center gap-1">
                          <Wand2 size={12} /> MNC Recruiter Probing Follow-Up:
                        </p>
                        <p className="italic text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-white/5">
                          "Can you walk me through the architectural constraints and metrics achieved when you worked on: {claim}?"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400">Upload your resume to extract candidate claims for verification.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
