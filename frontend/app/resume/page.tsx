"use client";

import { FileText, Layers3, LoaderCircle, Upload, X } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClaimVerification } from "@/components/reports/ClaimVerification";
import { uploadFile, type UploadResult } from "@/lib/api";

const skills = ["Python", "FastAPI", "TypeScript", "SQL", "System Design", "PostgreSQL", "React", "MLOps"];

export default function ResumePage() {
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
      setUpload(await uploadFile(file, "resume"));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Resume upload failed.");
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
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Resume intelligence</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Profile evidence analysis</h3>
          </div>
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "Uploading..." : "Upload resume"}
          </Button>
        </div>

        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="sr-only" />

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr,0.8fr]">
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-4 text-left transition hover:border-violet-400/40 hover:bg-violet-500/5">
            <div className="flex items-center gap-2 text-slate-200">
              <FileText size={16} className="text-violet-300" />
              <span className="font-medium">Choose a resume file</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">PDF, DOC, DOCX, or TXT up to 10 MB. Your file is saved to your profile.</p>
            {upload ? <p className="mt-3 text-sm text-emerald-300">Uploaded: {upload.filename}</p> : null}
            {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
          </button>

          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Target role</p>
            <p className="mt-3 text-lg font-semibold text-white">Senior Full-Stack Engineer</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Detected skills</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => <span key={skill} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-100">{skill}</span>)}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Role skill coverage</p>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-3"><span>System design</span><span className="font-medium text-white">82%</span></div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-500" style={{ width: "82%" }} /></div>
            <div className="flex items-center justify-between gap-3"><span>Backend performance</span><span className="font-medium text-white">74%</span></div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-500" style={{ width: "74%" }} /></div>
            <div className="flex items-center justify-between gap-3"><span>Product thinking</span><span className="font-medium text-white">68%</span></div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-500" style={{ width: "68%" }} /></div>
          </div>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Claims</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Resume claim verification</h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-300"><Layers3 size={14} className="text-violet-300" /> 8 claims</div>
        </div>
        <div className="mt-6"><ClaimVerification items={[
          { label: "Supported", value: "5", tone: "green" },
          { label: "Partially supported", value: "2", tone: "amber" },
          { label: "Unverified", value: "1", tone: "slate" },
        ]} /></div>
      </Card>
    </div>
  );
}
