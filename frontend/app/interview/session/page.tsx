"use client";

import { AlertTriangle, Check, Lightbulb, LoaderCircle, Save, TimerReset, Wand2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AnswerPanel } from "@/components/interview/AnswerPanel";
import { InterviewProgress } from "@/components/interview/InterviewProgress";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchNextQuestion, finishInterview, submitAnswer, type NextQuestionResponse } from "@/lib/api";

export default function LiveInterviewPage() {
  const searchParams = useSearchParams();
  const [interviewId, setInterviewId] = useState<number | null>(null);

  const [questionData, setQuestionData] = useState<NextQuestionResponse | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // Recruiter Hint Modal / State
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const idFromParam = searchParams.get("id");
    const idFromSession = typeof window !== "undefined" ? sessionStorage.getItem("current_interview_id") : null;
    const finalId = idFromParam ? Number(idFromParam) : idFromSession ? Number(idFromSession) : null;
    setInterviewId(finalId);
  }, [searchParams]);

  const loadQuestion = useCallback(async (id: number) => {
    setLoadingQuestion(true);
    setError(null);
    setHint(null);
    try {
      const res = await fetchNextQuestion(id);
      if (res.finished) {
        await finishInterview(id);
        setCompleted(true);
      } else {
        setQuestionData(res);
        setAnswer("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load question.");
    } finally {
      setLoadingQuestion(false);
    }
  }, []);

  useEffect(() => {
    if (interviewId) {
      void loadQuestion(interviewId);
    }
  }, [interviewId, loadQuestion]);

  const currentQ = questionData?.question;
  const currentNum = questionData?.question_number ?? 1;
  const totalNum = questionData?.total_questions ?? 10;

  const canSubmit = Boolean(
    answer.trim().length > 0 &&
      (currentQ?.type !== "MCQ" || Boolean(answer))
  );

  const handleGetHint = () => {
    if (!currentQ) return;
    if (currentQ.explanation) {
      setHint(`Recruiter Guidance: Focus on ${currentQ.topic || 'the core concept'}. Key principle: ${currentQ.explanation.slice(0, 140)}...`);
    } else {
      setHint(`Recruiter Guidance: State your assumptions clearly, discuss time/space complexity trade-offs, and mention failure scenarios for ${currentQ.topic || 'this question'}.`);
    }
  };

  const handleSubmit = async () => {
    if (!interviewId || !currentQ || !canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitAnswer(interviewId, {
        question_number: currentNum,
        question_type: currentQ.type,
        difficulty: currentQ.difficulty,
        topic: currentQ.topic,
        concept: currentQ.concept,
        question_text: currentQ.question,
        answer_text: answer,
        options: currentQ.options,
        correct_answer: currentQ.correct_answer,
        explanation: currentQ.explanation,
      });

      if (currentNum >= totalNum) {
        await finishInterview(interviewId);
        setCompleted(true);
      } else {
        await loadQuestion(interviewId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 text-emerald-300">
            <Check size={24} className="rounded-full bg-emerald-500/20 p-1 border border-emerald-500/30" />
            <span className="text-xs uppercase tracking-[0.22em] font-semibold">Assessment Complete</span>
          </div>

          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">Your interview responses have been analyzed.</h2>
          <p className="text-sm leading-6 text-slate-300">
            Your Candidate Intelligence Report has been compiled against MNC FAANG technical benchmarks, including STAR frameworks and verification confidence metrics.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <Link href="/reports">
              <Button type="button" size="lg" className="w-full sm:w-auto">View Candidate Intelligence Report</Button>
            </Link>
            <Link href="/interview">
              <Button type="button" variant="secondary" size="lg" className="w-full sm:w-auto">Start another assessment</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (loadingQuestion && !questionData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <LoaderCircle size={36} className="animate-spin text-violet-400" />
        <p className="text-sm text-slate-300 font-medium">Generating adaptive role-specific question...</p>
      </div>
    );
  }

  if (!interviewId) {
    return (
      <Card className="p-8 text-center space-y-4 max-w-xl mx-auto my-8">
        <AlertTriangle size={36} className="mx-auto text-amber-400" />
        <h3 className="text-xl font-semibold text-white">No Active Session Found</h3>
        <p className="text-sm text-slate-400">Please launch a new technical assessment session from the setup workspace.</p>
        <Link href="/interview">
          <Button type="button" size="lg">Configure Interview</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-semibold text-white">I</div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">InterviAI Adaptive Assessment</p>
              <p className="mt-1 text-sm text-slate-300">Question {currentNum} / {totalNum}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
            <span className="inline-flex items-center gap-1.5"><Save size={13} className="text-emerald-300" /> Grounded RAG</span>
            <span className="inline-flex items-center gap-1.5"><TimerReset size={13} className="text-violet-300" /> Session active</span>
          </div>
        </div>

        <div className="mt-4">
          <InterviewProgress current={currentNum} total={totalNum} />
        </div>
      </Card>

      {currentQ ? (
        <>
          <QuestionCard
            index={currentNum}
            total={totalNum}
            difficulty={currentQ.difficulty || "Medium"}
            question={currentQ.question}
          />

          {hint && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-start gap-3 animate-fadeIn">
              <Lightbulb size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <span>{hint}</span>
            </div>
          )}

          <AnswerPanel
            mode={currentQ.type.toLowerCase() as "mcq" | "descriptive"}
            answer={answer}
            setAnswer={setAnswer}
            options={currentQ.options || []}
            onGetHint={handleGetHint}
          />
        </>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/15 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
        <div className="text-xs text-slate-400">
          Tip: You can use the Voice Mic or STAR template buttons to structure your answer.
        </div>

        <Button
          type="button"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
          className="min-w-[180px]"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle size={16} className="animate-spin" /> Submitting...
            </>
          ) : (
            "Submit Answer"
          )}
        </Button>
      </div>
    </div>
  );
}
