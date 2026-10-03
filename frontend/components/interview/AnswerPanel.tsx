"use client";

import { Code2, Mic, MicOff, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";

export function AnswerPanel({
  mode,
  answer,
  setAnswer,
  options,
  onGetHint,
}: {
  mode: "mcq" | "descriptive";
  answer: string;
  setAnswer: (value: string) => void;
  options?: string[];
  onGetHint?: () => void;
}) {
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setAnswer(answer ? `${answer} ${transcript}` : transcript);
          }
        };

        rec.onerror = () => setListening(false);
        rec.onend = () => setListening(false);
        setRecognition(rec);
      }
    }
  }, [answer, setAnswer]);

  const toggleVoice = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please type your answer.");
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      recognition.start();
      setListening(true);
    }
  };

  const insertSnippet = (snippetType: "code" | "star") => {
    if (snippetType === "code") {
      setAnswer(answer + "\n```python\n# Write your architecture or implementation code here\n\n```");
    } else if (snippetType === "star") {
      setAnswer(
        answer +
          "\n**Situation:** \n**Task:** \n**Action:** \n**Result & Impact:** "
      );
    }
  };

  if (mode === "mcq") {
    return (
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
            <Sparkles size={14} className="text-violet-300" /> Multiple Choice Evaluation
          </div>
          {onGetHint && (
            <button
              type="button"
              onClick={onGetHint}
              className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg transition"
            >
              <Wand2 size={12} /> Recruiter Hint
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {options?.map((option) => {
            const selected = answer === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => setAnswer(option)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selected
                    ? "border-violet-400/50 bg-violet-500/15 text-violet-100 font-medium shadow-md shadow-violet-950/20"
                    : "border-white/10 bg-slate-950/40 text-slate-200 hover:border-violet-400/30 hover:bg-white/[0.03]"
                }`}
              >
                <span>{option}</span>
                <div
                  className={`h-4 w-4 rounded-full border ${
                    selected ? "border-violet-400 bg-violet-500" : "border-slate-500"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
          <Sparkles size={14} className="text-violet-300" /> Written & Architectural Response
        </div>

        <div className="flex items-center gap-2">
          {/* Speech-to-Text Voice Recording Button */}
          <button
            type="button"
            onClick={toggleVoice}
            className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
              listening
                ? "bg-rose-500/20 border-rose-500/40 text-rose-200 animate-pulse"
                : "bg-slate-950/50 border-white/10 text-slate-300 hover:border-violet-400/30 hover:text-white"
            }`}
          >
            {listening ? <MicOff size={13} className="text-rose-400" /> : <Mic size={13} className="text-violet-300" />}
            {listening ? "Recording..." : "Voice Mic"}
          </button>

          {/* STAR Framework Template Button */}
          <button
            type="button"
            onClick={() => insertSnippet("star")}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-950/50 border border-white/10 text-slate-300 hover:border-violet-400/30 hover:text-white transition flex items-center gap-1"
          >
            <Sparkles size={12} className="text-amber-300" /> STAR Template
          </button>

          {/* Code Block Snippet Button */}
          <button
            type="button"
            onClick={() => insertSnippet("code")}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-950/50 border border-white/10 text-slate-300 hover:border-violet-400/30 hover:text-white transition flex items-center gap-1"
          >
            <Code2 size={12} className="text-emerald-300" /> Code Snippet
          </button>

          {/* Clear Button */}
          {answer && (
            <button
              type="button"
              onClick={() => setAnswer("")}
              className="text-xs px-2 py-1 rounded-lg bg-slate-950/50 border border-white/10 text-slate-400 hover:text-rose-300 transition"
              title="Clear answer"
            >
              <RotateCcw size={12} />
            </button>
          )}

          {onGetHint && (
            <button
              type="button"
              onClick={onGetHint}
              className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg transition"
            >
              <Wand2 size={12} /> Hint
            </button>
          )}
        </div>
      </div>

      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Structure your answer using trade-offs, architecture decisions, and code implementation snippets..."
        className="min-h-[220px] w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:border-violet-400/40 focus:outline-none leading-relaxed"
      />

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Tip: MNC recruiters look for trade-offs, edge cases, and performance considerations.</span>
        <span>{answer.length} characters • {answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span>
      </div>
    </Card>
  );
}
