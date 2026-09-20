"use client";

import { AlertTriangle, Check, LoaderCircle, Save, TimerReset } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AnswerPanel } from "@/components/interview/AnswerPanel";
import { InterviewProgress } from "@/components/interview/InterviewProgress";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const questions = [
  {
    difficulty: "Medium",
    type: "mcq",
    question: "Which HTTP status code best signals a successful resource creation request in a REST API?",
    options: ["200 OK", "201 Created", "202 Accepted", "204 No Content"],
  },
  {
    difficulty: "High",
    type: "descriptive",
    question: "Explain how you would design a rate-limited API that prevents abuse without harming legitimate users during traffic spikes.",
    options: [],
  },
  {
    difficulty: "High",
    type: "mcq",
    question: "In a relational database, which indexing strategy is most effective for a frequently queried `WHERE status = ? AND created_at > ?` filter?",
    options: ["Single-column index on status", "Composite index on (status, created_at)", "Hash index on created_at", "Full-text index"],
  },
  {
    difficulty: "Medium",
    type: "descriptive",
    question: "Describe the trade-offs between optimistic and pessimistic locking in a distributed system that handles concurrent order updates.",
    options: [],
  },
  {
    difficulty: "Medium",
    type: "mcq",
    question: "What is the primary benefit of using asynchronous background workers for a long-running report generation task?",
    options: ["Improves local CPU performance", "Reduces database locks", "Prevents user interaction blocking and improves resilience", "Eliminates the need for retries"],
  },
];

export default function LiveInterviewPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const question = questions[currentIndex];
  const nextQuestionNumber = currentIndex + 1;

  const canSubmit = useMemo(() => {
    if (question.type === "mcq") return Boolean(answer);
    return answer.trim().length > 30;
  }, [answer, question.type]);

  const handleSubmit = () => {
    if (!canSubmit) {
      setError("Add a complete answer before submitting this response.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    window.setTimeout(() => {
      if (currentIndex === questions.length - 1) {
        setCompleted(true);
      } else {
        setCurrentIndex((value) => value + 1);
        setAnswer("");
      }
      setIsSubmitting(false);
    }, 700);
  };

  if (completed) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 text-emerald-300">
            <Check size={20} />
            <span className="text-xs uppercase tracking-[0.22em]">Assessment complete</span>
          </div>

          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">Your interview has been submitted.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">The system is evaluating your responses internally and will generate a structured readiness and evidence report.</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/reports">
              <Button type="button" size="lg">View report</Button>
            </Link>
            <Link href="/interview">
              <Button type="button" variant="secondary" size="lg">Create another</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-semibold text-white">I</div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">InterviAI</p>
              <p className="mt-1 text-sm text-slate-300">Question {nextQuestionNumber} / {questions.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
            <span className="inline-flex items-center gap-1.5"><Save size={13} className="text-emerald-300" /> Autosave on</span>
            <span className="inline-flex items-center gap-1.5"><TimerReset size={13} className="text-violet-300" /> 12s ago</span>
          </div>
        </div>

        <div className="mt-4">
          <InterviewProgress current={nextQuestionNumber} total={questions.length} />
        </div>
      </Card>

      <QuestionCard index={nextQuestionNumber} total={questions.length} difficulty={question.difficulty} question={question.question} />

      <AnswerPanel mode={question.type as "mcq" | "descriptive"} answer={answer} setAnswer={setAnswer} options={question.options} />

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/15 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
        <div className="text-sm text-slate-400">No per-question scoring. Evaluation remains internal.</div>

        <Button type="button" size="lg" onClick={handleSubmit} disabled={isSubmitting || !canSubmit} className="min-w-[180px]">
          {isSubmitting ? (
            <>
              <LoaderCircle size={16} className="animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Answer"
          )}
        </Button>
      </div>
    </div>
  );
}
