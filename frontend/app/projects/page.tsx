"use client";

import { ArrowUpRight, FolderOpen, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteActiveProject, fetchActiveProject, uploadFile, type ActiveProjectData } from "@/lib/api";

export default function ProjectWorkspacePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeProject, setActiveProject] = useState<ActiveProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function loadProject() {
    try {
      const data = await fetchActiveProject();
      setActiveProject(data);
    } catch {
      setActiveProject({ active: false, project: null });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProject();
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      await uploadFile(file, "project");
      await loadProject();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Project upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to remove your active project knowledge base?")) return;
    try {
      await deleteActiveProject();
      await loadProject();
    } catch {
      setError("Failed to delete project knowledge base.");
    }
  }

  const isProjectActive = Boolean(activeProject?.active && activeProject?.project);
  const proj = activeProject?.project;

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Project defense</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Project knowledge workspace</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <LoaderCircle size={16} className="animate-spin" /> : isProjectActive ? <RefreshCw size={16} /> : <Upload size={16} />}
              {uploading ? "Uploading..." : isProjectActive ? "Add/Replace project file" : "Upload project file"}
            </Button>
            {isProjectActive && (
              <Button type="button" variant="secondary" onClick={handleDelete} className="text-rose-400 hover:text-rose-300">
                <Trash2 size={16} /> Remove
              </Button>
            )}
          </div>
        </div>

        <input ref={inputRef} type="file" accept=".pdf,.md,.txt,.doc,.docx,.py,.json,.csv,.zip" onChange={handleFileChange} className="sr-only" />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Knowledge status</p>
            <p className="mt-3 text-3xl font-semibold text-white">{isProjectActive ? "Indexed" : "Empty"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Evidence chunks</p>
            <p className="mt-3 text-3xl font-semibold text-white">{proj?.evidence_chunks ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Defense ready</p>
            <p className="mt-3 text-3xl font-semibold text-white">{isProjectActive ? "Ready" : "Pending"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-4 text-left transition hover:border-violet-400/40 hover:bg-violet-500/5"
        >
          <div className="flex items-center gap-3 text-slate-200">
            <Upload size={16} className="text-violet-300" />
            <span className="font-medium">
              {isProjectActive ? `Active Project: ${proj?.name}` : "Upload README, project report, documentation, or code file"}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">PDF, Markdown, TXT, DOC, DOCX, PY, JSON, CSV or ZIP up to 25 MB. Saved to your candidate profile.</p>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </button>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Files</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Project evidence files</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading project files...</p>
            ) : isProjectActive && (proj?.files.length ?? 0) > 0 ? (
              proj?.files.map((file) => (
                <div key={file} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-violet-500/10 p-2 text-violet-200">
                      <FolderOpen size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">{file}</p>
                      <p className="text-sm text-slate-400">Active project knowledge source</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                    Ready
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No project files uploaded yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Status</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
              <div className="flex items-center gap-3 text-amber-200">
                <Sparkles size={16} />
                <span className="font-medium">{isProjectActive ? "Project RAG Enabled" : "No Project Knowledge"}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {isProjectActive
                  ? "Your project text will be indexed during technical interviews to ask grounded architecture & implementation questions."
                  : "Upload project files to enable grounded project defense questions in your interview."}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-3 text-emerald-200">
                <ShieldCheck size={16} />
                <span className="font-medium">Evidence Grounding</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {isProjectActive ? `Active project: ${proj?.name}` : "Upload a file to prepare your project defense."}
              </p>
            </div>
            <Link href="/interview">
              <Button type="button" size="lg" className="w-full">
                <ArrowUpRight size={16} /> Start Interview with Project Defense
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
