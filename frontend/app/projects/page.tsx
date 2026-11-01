"use client";

import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FolderOpen,
  HelpCircle,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteActiveProject, fetchActiveProject, uploadFile, type ActiveProjectData } from "@/lib/api";

export default function ProjectWorkspacePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeProject, setActiveProject] = useState<ActiveProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  async function handleUpload(file: File) {
    if (!file) return;
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const res = await uploadFile(file, "project");
      setSuccess(`Project "${res.active_project_name || res.filename}" uploaded & indexed!`);
      await loadProject();
      setTimeout(() => setSuccess(""), 4000);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Project upload failed.");
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
    if (!confirm("Are you sure you want to remove your active project knowledge base?")) return;
    try {
      await deleteActiveProject();
      await loadProject();
      setDefenseQuestions(null);
      setSuccess("Project report removed.");
      setTimeout(() => setSuccess(""), 3000);
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
        `How does ${projName} handle high concurrency, rate-limiting, or database bottlenecks under heavy traffic?`,
        `If you had to re-architect ${projName} from scratch for multi-region zero-downtime deployment, what would change?`,
      ]);
      setSimulating(false);
    }, 400);
  };

  const isProjectActive = Boolean(activeProject?.active && activeProject?.project);
  const proj = activeProject?.project;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card className="p-5 sm:p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Project RAG Intelligence
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white flex items-center gap-2">
              <FolderOpen size={20} className="text-amber-400" /> Project Defense & Knowledge Workspace
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isProjectActive && (
              <Link href="/interview">
                <Button type="button" size="sm" className="bg-gradient-to-r from-amber-600 to-violet-600 hover:from-amber-500 hover:to-violet-500 text-xs">
                  Start Project Defense <ArrowRight size={13} />
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
                <LoaderCircle size={15} className="animate-spin text-amber-400" />
              ) : isProjectActive ? (
                <RefreshCw size={15} />
              ) : (
                <Upload size={15} />
              )}
              {uploading ? "Indexing Evidence..." : isProjectActive ? "Replace Project" : "Upload Project Report"}
            </Button>
            {isProjectActive && (
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
          accept=".pdf,.md,.txt,.doc,.docx,.py,.json,.csv,.zip"
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

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
              Knowledge Status
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {isProjectActive ? "Indexed in RAG" : "Empty"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
              Evidence Chunks
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {proj?.evidence_chunks ?? 0} Chunks
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
              MNC Defense Readiness
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">
              {isProjectActive ? "100% Ready" : "Pending"}
            </p>
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`rounded-2xl border p-5 text-left transition cursor-pointer ${
            isDragging
              ? "border-amber-400 bg-amber-500/15 scale-[1.01]"
              : isProjectActive
                ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-400/50"
                : "border-dashed border-white/20 bg-slate-950/40 hover:border-amber-400/40 hover:bg-amber-500/5"
          }`}
        >
          <div className="flex items-center gap-3 text-slate-200">
            <FolderOpen
              size={24}
              className={isProjectActive ? "text-amber-300" : "text-slate-400"}
            />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-white text-base block truncate">
                {uploading
                  ? "Indexing project report into RAG..."
                  : isProjectActive
                    ? `Active Knowledge Base: ${proj?.name}`
                    : "Click or Drag & Drop Project Report / Repository Files"}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                {isProjectActive
                  ? `Uploaded on ${new Date(proj?.uploaded_at || Date.now()).toLocaleDateString()}. Grounding context for candidate defense.`
                  : "Upload project PDFs, READMEs, architectural docs, or ZIP archives."}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
            <span>{isProjectActive ? "Click to replace project evidence" : "Instant local retrieval indexing"}</span>
            <span className="text-amber-400 font-medium">Browse files →</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Project Architecture Evidence
            </p>
            <span className="text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full">
              TF-IDF RAG
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {loading ? (
              <p className="text-xs text-slate-500">Loading project files...</p>
            ) : isProjectActive ? (
              <>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Active files in context:</strong>{" "}
                  {proj?.files.join(", ")}
                </p>
                {proj?.text_snippet ? (
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-400 italic">
                    &ldquo;{proj.text_snippet}&rdquo;
                  </div>
                ) : null}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSimulateDefense}
                    disabled={simulating}
                    className="w-full text-xs flex items-center justify-center gap-2"
                  >
                    <Wand2 size={14} className="text-amber-400" />
                    {simulating ? "Analyzing Architecture..." : "Generate MNC Defense Questions"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">
                Upload your project documentation or code files to build your defense RAG knowledge base.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Live Cross-Examination Probing
            </p>
            <span className="text-xs text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={12} /> MNC Ready
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {defenseQuestions ? (
              defenseQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100 space-y-1"
                >
                  <p className="font-semibold text-amber-300">Probing Question #{idx + 1}:</p>
                  <p className="text-slate-300">{q}</p>
                </div>
              ))
            ) : isProjectActive ? (
              <div className="text-center py-6 space-y-2">
                <Lightbulb size={24} className="mx-auto text-amber-400/80" />
                <p className="text-xs text-slate-300 font-medium">Ready to test project defense?</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Click &ldquo;Generate MNC Defense Questions&rdquo; or launch the Adaptive Technical Assessment to practice defending your project.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Awaiting project upload to simulate live interviewer cross-examination.
              </p>
            )}

            {isProjectActive && (
              <Link href="/interview" className="block pt-2">
                <Button type="button" className="w-full text-xs bg-gradient-to-r from-violet-600 to-indigo-600">
                  <ShieldCheck size={14} /> Practice Project Defense <ArrowRight size={14} />
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
