"use client";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  FileText,
  HelpCircle,
  Layers3,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteActiveResume, fetchActiveResume, uploadFile, type ActiveResumeData } from "@/lib/api";

export default function ResumePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeResume, setActiveResume] = useState<ActiveResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  async function handleUpload(file: File) {
    if (!file) return;
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const res = await uploadFile(file, "resume");
      setSuccess(`Resume "${res.filename}" uploaded & ${res.skills?.length || 0} skills detected!`);
      await loadResume();
      setTimeout(() => setSuccess(""), 4000);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Resume upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleUpload(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleUpload(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to remove your active resume?")) return;
    try {
      await deleteActiveResume();
      await loadResume();
      setSuccess("Resume removed.");
      setTimeout(() => setSuccess(""), 3000);
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
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Resume Intelligence Engine
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white flex items-center gap-2">
              <FileText size={20} className="text-violet-400" /> Candidate Resume & Verified Claims
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isResumeActive && (
              <Link href="/interview">
                <Button type="button" size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs">
                  Start Adaptive Assessment <ArrowRight size={13} />
                </Button>
              </Link>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs"
            >
              {uploading ? (
                <LoaderCircle size={15} className="animate-spin text-violet-400" />
              ) : isResumeActive ? (
                <RefreshCw size={15} />
              ) : (
                <Upload size={15} />
              )}
              {uploading ? "Extracting Skills..." : isResumeActive ? "Replace Resume" : "Upload Resume"}
            </Button>
            {isResumeActive && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleDelete}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                <Trash2 size={15} /> Remove
              </Button>
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="sr-only"
        />

        {success ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            <span>{error}</span>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.4fr,0.8fr]">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`rounded-2xl border p-5 text-left transition cursor-pointer ${
              isDragging
                ? "border-violet-400 bg-violet-500/15 scale-[1.01]"
                : isResumeActive
                  ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400/50"
                  : "border-dashed border-white/20 bg-slate-950/40 hover:border-violet-400/40 hover:bg-violet-500/5"
            }`}
          >
            <div className="flex items-center gap-3 text-slate-200">
              <FileText
                size={24}
                className={isResumeActive ? "text-emerald-300" : "text-violet-300"}
              />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-white text-base block truncate">
                  {uploading
                    ? "Parsing resume skills and claims..."
                    : isResumeActive
                      ? `Active: ${resume?.filename}`
                      : "Click or Drag & Drop Candidate Resume"}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  {isResumeActive
                    ? `Uploaded on ${new Date(resume?.uploaded_at || Date.now()).toLocaleDateString()}. Verified across candidate profile.`
                    : "Supports PDF, DOC, DOCX, or TXT up to 10 MB."}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
              <span>{isResumeActive ? "Click to upload and replace" : "Instant NLP skill extraction"}</span>
              <span className="text-violet-400 font-medium">Browse files →</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 space-y-2.5 flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
                Candidate Profile Status
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium pt-1.5">
                <CheckCircle2 size={16} />
                <span>{isResumeActive ? "Active & Indexed for Assessments" : "No active resume loaded"}</span>
              </div>
              {resume?.text_snippet ? (
                <p className="text-xs text-slate-400 line-clamp-3 italic pt-2 border-t border-white/5 mt-2">
                  &ldquo;{resume.text_snippet}&rdquo;
                </p>
              ) : null}
            </div>

            {isResumeActive && (
              <Link href="/interview" className="block pt-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-violet-500/20 bg-violet-500/10 text-xs text-violet-200 hover:bg-violet-500/20 transition">
                  <span className="flex items-center gap-2 font-medium">
                    <Sparkles size={14} className="text-violet-300" />
                    Adaptive Assessment Ready
                  </span>
                  <ArrowRight size={13} className="text-violet-400" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr,1.1fr]">
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Extracted Skills ({resume?.skills?.length ?? 0})
            </p>
            <span className="text-xs text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full">
              NLP Mapped
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {loading ? (
              <p className="text-xs text-slate-500">Extracting skills...</p>
            ) : isResumeActive && (resume?.skills.length ?? 0) > 0 ? (
              resume?.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100 hover:bg-violet-500/20 cursor-default transition"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400">
                Upload your resume to extract candidate technical skills for adaptive interviews.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Extracted Verification Claims ({resume?.claims?.length ?? 0})
            </p>
            <span className="text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap size={11} /> Probing Questions
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
                      <Eye
                        size={14}
                        className={isSelected ? "text-amber-300 shrink-0" : "text-slate-500 shrink-0"}
                      />
                    </div>

                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-amber-500/20 text-slate-300 space-y-1.5 animate-fadeIn">
                        <p className="font-semibold text-amber-300 flex items-center gap-1">
                          <Wand2 size={12} /> MNC Recruiter Probing Follow-Up:
                        </p>
                        <p className="italic text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-white/5">
                          &ldquo;Can you walk me through the architectural constraints and metrics achieved when you worked on: {claim}?&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400">
                Upload your resume to extract candidate claims for cross-examination.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
