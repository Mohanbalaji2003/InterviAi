"use client";

import { AlertTriangle, Check, LoaderCircle, Save, TimerReset } from "lucide-react";
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

  useEffect(() => {
    const idFromParam = searchParams.get("id");
    const idFromSession = typeof window !== "undefined" ? sessionStorage.getItem("current_interview_id") : null;
    const finalId = idFromParam ? Number(idFromParam) : idFromSession ? Number(idFromSession) : null;
    setInterviewId(finalId);
  }, [searchParams]);

  const loadQuestion = useCallback(async (id: number) => {
    setLoadingQuestion(true);
    setError(null);
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
      <div className="mx-auto max-w-2xl">
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 text-emerald-300">
            <Check size={20} />
            <span className="text-xs uppercase tracking-[0.22em]">Assessment complete</span>
          </div>

          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">Your interview has been submitted.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            The system evaluated your responses internally and has generated your isolated Candidate Intelligence Report.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/reports">
              <Button type="button" size="lg">View Candidate Intelligence Report</Button>
            </Link>
            <Link href="/interview">
              <Button type="button" variant="secondary" size="lg">Start another assessment</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (loadingQuestion && !questionData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <LoaderCircle size={32} className="animate-spin text-violet-400" />
        <p className="text-sm text-slate-300 font-medium">Generating candidate & role-specific question...</p>
      </div>
    );
  }

  if (!interviewId) {
    return (
      <Card className="p-6 text-center space-y-4">
        <AlertTriangle size={32} className="mx-auto text-amber-400" />
        <h3 className="text-xl font-semibold text-white">No active interview session found</h3>
        <p className="text-sm text-slate-400">Please start a new assessment session from the interview setup page.</p>
        <Link href="/interview">
          <Button type="button" size="lg">Configure Interview</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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

          <AnswerPanel
            mode={currentQ.type.toLowerCase() as "mcq" | "descriptive"}
            answer={answer}
            setAnswer={setAnswer}
            options={currentQ.options || []}
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
        <div className="text-sm text-slate-400">
          Adaptive questions adapt based on your performance and candidate evidence.
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
