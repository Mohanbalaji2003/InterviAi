"use client";

import { ArrowUpRight, FolderOpen, HelpCircle, Lightbulb, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
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
  const [simulating, setSimulating] = useState(false);
  const [defenseQuestions, setDefenseQuestions] = useState<string[] | null>(null);

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
      setDefenseQuestions(null);
    } catch {
      setError("Failed to delete project knowledge base.");
    }
  }

  const handleSimulateDefense = () => {
    setSimulating(true);
    setTimeout(() => {
      const projName = activeProject?.project?.name || "Uploaded Project";
      setDefenseQuestions([
        `What were the primary architectural trade-offs you considered when implementing ${projName}?`,
        `How does your project handle high concurrency, rate-limiting, or database bottlenecks under heavy traffic?`,
        `If you had to re-architect ${projName} from scratch for multi-region zero-downtime deployment, what would change?`,
      ]);
      setSimulating(false);
    }, 800);
  };

  const isProjectActive = Boolean(activeProject?.active && activeProject?.project);
  const proj = activeProject?.project;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card className="p-5 sm:p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Project RAG Intelligence</p>
            <h3 className="mt-1 text-xl font-semibold text-white flex items-center gap-2">
              <FolderOpen size={20} className="text-amber-400" /> Project Defense & Knowledge Workspace
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading} className="text-xs">
              {uploading ? <LoaderCircle size={15} className="animate-spin" /> : isProjectActive ? <RefreshCw size={15} /> : <Upload size={15} />}
              {uploading ? "Uploading..." : isProjectActive ? "Add/Replace Project File" : "Upload Project File"}
            </Button>
            {isProjectActive && (
              <Button type="button" variant="secondary" onClick={handleDelete} className="text-xs text-rose-400 hover:text-rose-300">
                <Trash2 size={15} /> Remove
              </Button>
            )}
          </div>
        </div>

        <input ref={inputRef} type="file" accept=".pdf,.md,.txt,.doc,.docx,.py,.json,.csv,.zip" onChange={handleFileChange} className="sr-only" />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">Knowledge Status</p>
            <p className="mt-2 text-2xl font-semibold text-white">{isProjectActive ? "Indexed in RAG" : "Empty"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">Evidence Chunks</p>
            <p className="mt-2 text-2xl font-semibold text-white">{proj?.evidence_chunks ?? 0} Chunks</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">MNC Defense Readiness</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">{isProjectActive ? "100% Ready" : "Pending"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-5 text-left transition hover:border-violet-400/40 hover:bg-violet-500/5"
        >
          <div className="flex items-center gap-3 text-slate-200">
            <Upload size={20} className="text-violet-300" />
            <span className="font-semibold text-base text-white">
              {isProjectActive ? `Active Project: ${proj?.name}` : "Upload Project Report, README, or Code File"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">PDF, Markdown, TXT, DOC, DOCX, PY, JSON, CSV or ZIP up to 25 MB. Persisted for candidate defense.</p>
          {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
        </button>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Evidence Sources</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Project Knowledge Base Files</h3>
            </div>
            {isProjectActive && (
              <Button type="button" variant="secondary" onClick={handleSimulateDefense} disabled={simulating} className="text-xs py-1">
                {simulating ? <LoaderCircle size={13} className="animate-spin" /> : <Wand2 size={13} className="text-amber-300" />}
                {simulating ? "Analyzing..." : "Simulate MNC Tech Lead Questions"}
              </Button>
            )}
          </div>

          <div className="grid gap-3 pt-1">
            {loading ? (
              <p className="text-xs text-slate-500">Loading project files...</p>
            ) : isProjectActive && (proj?.files.length ?? 0) > 0 ? (
              proj?.files.map((file) => (
                <div key={file} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-violet-500/10 p-2 text-violet-200">
                      <FolderOpen size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-100">{file}</p>
                      <p className="text-xs text-slate-400">Active project knowledge source</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-emerald-300">
                    Ready
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No project files uploaded yet.</p>
            )}
          </div>

          {defenseQuestions && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3 animate-fadeIn mt-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
                <Lightbulb size={16} /> Simulated MNC Tech Lead Defense Probing Questions:
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                {defenseQuestions.map((q, idx) => (
                  <li key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 font-mono">
                    <span className="text-amber-400 font-bold me-1">Q{idx + 1}:</span> {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold border-b border-white/10 pb-2">Status & Defense Launch</p>
          <div className="space-y-3 text-xs">
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-amber-200 font-semibold">
                <Sparkles size={15} />
                <span>{isProjectActive ? "Project RAG Active" : "No Project Uploaded"}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {isProjectActive
                  ? "Questions in your assessment will directly reference architecture decisions from your uploaded files."
                  : "Upload project files to enable grounded project defense questions."}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-200 font-semibold">
                <ShieldCheck size={15} />
                <span>FAANG Technical Defense</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {isProjectActive ? `Knowledge source: ${proj?.name}` : "Prepare your project defense before technical screens."}
              </p>
            </div>

            <Link href="/interview" className="block pt-2">
              <Button type="button" size="lg" className="w-full text-xs">
                <ArrowUpRight size={16} /> Launch Project Defense Interview
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
