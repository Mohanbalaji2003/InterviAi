"use client";

import { ArrowUpRight, FolderOpen, LoaderCircle, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { uploadFile, type UploadResult } from "@/lib/api";

export default function ProjectWorkspacePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      setUpload(await uploadFile(file, "project"));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Project report upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Project defense</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Project knowledge workspace</h3>
          </div>
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "Uploading..." : "Upload project report"}
          </Button>
        </div>

        <input ref={inputRef} type="file" accept=".pdf,.md,.txt,.doc,.docx,.zip" onChange={handleFileChange} className="sr-only" />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Knowledge</p><p className="mt-3 text-3xl font-semibold text-white">{upload ? "Processing" : "82%"}</p></div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Evidence chunks</p><p className="mt-3 text-3xl font-semibold text-white">{upload ? "Queued" : "147"}</p></div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Defense ready</p><p className="mt-3 text-3xl font-semibold text-white">{upload ? "Pending" : "91%"}</p></div>
        </div>

        <button type="button" onClick={() => inputRef.current?.click()} className="mt-5 w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-4 text-left transition hover:border-violet-400/40 hover:bg-violet-500/5">
          <div className="flex items-center gap-3 text-slate-200"><Upload size={16} className="text-violet-300" /><span className="font-medium">Upload README, project report, documentation, or source archive</span></div>
          <p className="mt-2 text-sm text-slate-400">PDF, Markdown, TXT, DOC, DOCX, or ZIP up to 25 MB.</p>
          {upload ? <p className="mt-3 text-sm text-emerald-300">Uploaded: {upload.filename}. Processing has started.</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </button>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Repository</p><h3 className="mt-2 text-xl font-semibold text-white">Project evidence</h3></div>
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>Add file</Button>
          </div>
          <div className="mt-5 grid gap-3">
            {upload ? <div className="flex items-center justify-between gap-4 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-violet-500/10 p-2 text-violet-200"><FolderOpen size={16} /></div><div><p className="font-medium text-slate-100">{upload.filename}</p><p className="text-sm text-slate-400">Uploaded project evidence</p></div></div><span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-200">Processing</span></div> : null}
            {[{ name: "README.md", type: "Project brief", state: "Ready" }, { name: "src/system-design.md", type: "Architecture note", state: "Ready" }, { name: "docs/onboarding.md", type: "Operations guide", state: "Ready" }].map((file) => <div key={file.name} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-violet-500/10 p-2 text-violet-200"><FolderOpen size={16} /></div><div><p className="font-medium text-slate-100">{file.name}</p><p className="text-sm text-slate-400">{file.type}</p></div></div><span className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">{file.state}</span></div>)}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Status</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4"><div className="flex items-center gap-3 text-amber-200"><Sparkles size={16} /><span className="font-medium">{upload ? "Processing" : "Ready for upload"}</span></div><p className="mt-2 text-sm text-slate-300">{upload ? "Indexing project evidence and preparing defense context." : "Upload a project report or source archive to build project knowledge."}</p></div>
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4"><div className="flex items-center gap-3 text-emerald-200"><ShieldCheck size={16} /><span className="font-medium">Project defense ready</span></div><p className="mt-2 text-sm text-slate-300">High-confidence evidence is available for technical walkthroughs.</p></div>
            <Button type="button" size="lg" className="w-full"><ArrowUpRight size={16} />Start Project Defense</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
