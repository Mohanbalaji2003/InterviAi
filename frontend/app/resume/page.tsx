"use client";

import { CheckCircle2, FileText, Layers3, LoaderCircle, RefreshCw, Trash2, Upload } from "lucide-react";
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
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Resume intelligence</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Profile evidence & candidate resume</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <LoaderCircle size={16} className="animate-spin" /> : isResumeActive ? <RefreshCw size={16} /> : <Upload size={16} />}
              {uploading ? "Uploading..." : isResumeActive ? "Replace resume" : "Upload resume"}
            </Button>
            {isResumeActive && (
              <Button type="button" variant="secondary" onClick={handleDelete} className="text-rose-400 hover:text-rose-300">
                <Trash2 size={16} /> Remove
              </Button>
            )}
          </div>
        </div>

        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="sr-only" />

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr,0.8fr]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`rounded-2xl border p-4 text-left transition ${
              isResumeActive
                ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-400/40'
                : 'border-dashed border-white/15 bg-slate-950/40 hover:border-violet-400/40 hover:bg-violet-500/5'
            }`}
          >
            <div className="flex items-center gap-2 text-slate-200">
              <FileText size={18} className={isResumeActive ? "text-emerald-300" : "text-violet-300"} />
              <span className="font-semibold text-white">
                {isResumeActive ? `Active: ${resume?.filename}` : "Choose a resume file"}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {isResumeActive
                ? `Uploaded on ${new Date(resume?.uploaded_at || Date.now()).toLocaleDateString()}. Saved against your account.`
                : "PDF, DOC, DOCX, or TXT up to 10 MB. Your file persists across logins."}
            </p>
            {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
          </button>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Persistence status</p>
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 size={16} />
              <span>{isResumeActive ? "Resume active in PostgreSQL DB" : "No resume active"}</span>
            </div>
            {resume?.text_snippet ? (
              <p className="mt-2 text-xs text-slate-400 line-clamp-3">"{resume.text_snippet}..."</p>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Detected skills</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {loading ? (
              <p className="text-sm text-slate-500">Loading skills...</p>
            ) : isResumeActive && (resume?.skills.length ?? 0) > 0 ? (
              resume?.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-100">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-400">Upload your resume to extract candidate skills.</p>
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Extracted Claims</p>
          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-sm text-slate-500">Loading claims...</p>
            ) : isResumeActive && (resume?.claims.length ?? 0) > 0 ? (
              resume?.claims.map((claim, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 border border-white/5 rounded-xl p-2.5">
                  <span className="text-violet-400">•</span>
                  <span>{claim}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Upload your resume to extract verification claims.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
