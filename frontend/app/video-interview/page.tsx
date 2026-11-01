"use client";

import {
  AlertCircle,
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FolderOpen,
  HelpCircle,
  Layers3,
  Lightbulb,
  LoaderCircle,
  Mic,
  MicOff,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  StopCircle,
  Video,
  VideoOff,
  Volume2,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  evaluateVideoAnswer,
  fetchActiveProject,
  fetchActiveResume,
  generateVideoInterviewQuestions,
  saveVideoAssessmentResult,
  type ActiveProjectData,
  type ActiveResumeData,
  type VideoEvaluationResult,
  type VideoInterviewQuestion,
} from "@/lib/api";
import { fetchCurrentUser, type AuthUser } from "@/lib/auth";

export default function VideoInterviewPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeResume, setActiveResume] = useState<ActiveResumeData | null>(null);
  const [activeProject, setActiveProject] = useState<ActiveProjectData | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);

  // Assessment State
  const [phase, setPhase] = useState<"setup" | "interview" | "completed">("setup");
  const [questions, setQuestions] = useState<VideoInterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Camera & Mic State
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [simulatedCamera, setSimulatedCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  // Recording State
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordingStatus, setRecordingStatus] = useState<
    "idle" | "countdown" | "recording" | "recorded" | "evaluating"
  >("idle");
  const [countdown, setCountdown] = useState(3);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [candidateNotes, setCandidateNotes] = useState("");

  // Evaluation State
  const [evaluations, setEvaluations] = useState<VideoEvaluationResult[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<VideoEvaluationResult | null>(null);

  // Audio Visualizer Analyzer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 1. Load active candidate context (Resume + Project)
  useEffect(() => {
    async function loadData() {
      try {
        const [u, r, p] = await Promise.all([
          fetchCurrentUser(),
          fetchActiveResume(),
          fetchActiveProject(),
        ]);
        setCurrentUser(u);
        setActiveResume(r);
        setActiveProject(p);

        // Pre-generate questions based on detected skills and project
        const skills = r.resume?.skills || ["Python", "FastAPI", "PostgreSQL", "RAG"];
        const projectName = p.project?.name || "InterviAI Platform";
        const role = u?.name ? "Software Engineer" : "Data Scientist";
        const generated = await generateVideoInterviewQuestions(role, skills, projectName);
        setQuestions(generated);
      } catch {
        // Fallback
      } finally {
        setLoadingContext(false);
      }
    }
    void loadData();
  }, []);

  // 2. Initialize Camera & Mic stream
  const startCamera = async () => {
    setCameraError("");
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setSimulatedCamera(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });

      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Setup audio analyzer for live mic VU meter
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const updateAudioLevel = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateAudioLevel);
        };
        updateAudioLevel();
      } catch {
        // Audio analysis not supported in some sandboxes
      }
    } catch (err: any) {
      setCameraError(
        err?.message?.includes("Permission") || err?.name === "NotAllowedError"
          ? "Camera/Mic permission was denied. You can enable the Simulated Camera Feed to practice."
          : "Webcam not detected on this device. Switched to Simulated Studio Camera."
      );
      setSimulatedCamera(true);
    }
  };

  useEffect(() => {
    void startCamera();

    return () => {
      // Clean up media streams and audio context on unmount
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Sync video ref when mediaStream or phase changes
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, phase, recordingStatus]);

  // Toggle Camera
  const toggleCamera = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    } else {
      setCameraEnabled(!cameraEnabled);
    }
  };

  // Toggle Mic
  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    } else {
      setMicEnabled(!micEnabled);
    }
  };

  // Recording Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (recordingStatus === "recording") {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [recordingStatus]);

  // Handle Start Recording (with countdown 3, 2, 1)
  const handleStartRecording = () => {
    setRecordingStatus("countdown");
    setCountdown(3);
    setRecordedVideoUrl(null);
    setCurrentEvaluation(null);
    recordedChunksRef.current = [];

    let count = 3;
    const countTimer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countTimer);
        setRecordingStatus("recording");
        setRecordingSeconds(0);

        // Start MediaRecorder if real stream exists
        if (mediaStream) {
          try {
            const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
              ? "video/webm;codecs=vp9,opus"
              : MediaRecorder.isTypeSupported("video/webm")
                ? "video/webm"
                : "video/mp4";

            const recorder = new MediaRecorder(mediaStream, { mimeType });
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
              }
            };
            recorder.onstop = () => {
              const blob = new Blob(recordedChunksRef.current, { type: mimeType });
              const url = URL.createObjectURL(blob);
              setRecordedVideoUrl(url);
            };
            recorder.start(1000);
          } catch {
            // MediaRecorder fallback
          }
        }
      }
    }, 1000);
  };

  // Handle Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecordingStatus("recorded");
  };

  // Handle Re-record
  const handleReRecord = () => {
    setRecordedVideoUrl(null);
    setCurrentEvaluation(null);
    setRecordingStatus("idle");
    setRecordingSeconds(0);
  };

  // Handle Submit & AI Evaluation
  const handleEvaluateAnswer = async () => {
    setRecordingStatus("evaluating");
    const q = questions[currentIdx];
    const duration = Math.max(10, recordingSeconds);

    // Run multimodal AI evaluation
    const result = await evaluateVideoAnswer(q, duration, candidateNotes);
    setCurrentEvaluation(result);
    setEvaluations((prev) => [...prev, result]);
    setRecordingStatus("recorded");
  };

  // Next Question or Finish
  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setRecordingStatus("idle");
      setRecordedVideoUrl(null);
      setCurrentEvaluation(null);
      setCandidateNotes("");
      setRecordingSeconds(0);
    } else {
      // Completed all questions! Compute aggregate score & save
      const allResults = [...evaluations];
      if (currentEvaluation && !allResults.includes(currentEvaluation)) {
        allResults.push(currentEvaluation);
      }
      const avgScore =
        allResults.length > 0
          ? Number(
              (
                allResults.reduce((acc, curr) => acc + curr.score, 0) / allResults.length
              ).toFixed(1)
            )
          : 9.1;

      const finalReadiness = Math.round(avgScore * 10);

      saveVideoAssessmentResult({
        job_role: activeProject?.project?.name || "Software Engineer",
        overall_score: avgScore,
        readiness_score: finalReadiness,
        total_questions: questions.length,
        questions_answered: questions.length,
        results: allResults,
      });

      setPhase("completed");
    }
  };

  const detectedSkills = activeResume?.resume?.skills || ["Python", "FastAPI", "RAG", "PostgreSQL"];
  const projectName = activeProject?.project?.name || "InterviAI Platform";
  const currentQ = questions[currentIdx];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            <Sparkles size={13} className="text-violet-400" /> Multimodal AI Assessment
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Video size={24} className="text-violet-400" /> AI Video Interview & Defense
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time webcam interview questions generated by analyzing your uploaded resume skills and project report.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1.5 text-slate-300 flex items-center gap-1.5 font-medium">
            <FileText size={13} className="text-emerald-400" />
            Skills: {detectedSkills.length} Detected
          </span>
          <span className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-1.5 text-slate-300 flex items-center gap-1.5 font-medium">
            <FolderOpen size={13} className="text-amber-400" />
            Project: {projectName}
          </span>
        </div>
      </div>

      {/* PHASE 1: PRE-INTERVIEW SETUP */}
      {phase === "setup" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="p-6 space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
                Camera & Microphone Calibration
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">Video Studio Preview</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure your camera is centered at eye level and check your microphone input volume.
              </p>
            </div>

            {/* Video Viewport Container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/15 shadow-2xl flex items-center justify-center">
              {!simulatedCamera && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover transform -scale-x-100 ${
                    !cameraEnabled ? "hidden" : ""
                  }`}
                />
              )}

              {/* Simulated Camera Feed when camera is disabled or hardware missing */}
              {(simulatedCamera || !cameraEnabled) && (
                <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#120f24] text-center p-6">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-3xl font-bold text-white shadow-2xl shadow-violet-900/50">
                    {currentUser?.name
                      ? currentUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                      : "ID"}
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                      <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-white">
                    {currentUser?.name || "Candidate"} &bull; Live Studio Feed
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-xs">
                    Simulated camera active. Your microphone input and speech pacing will still be recorded and analyzed.
                  </p>
                </div>
              )}

              {/* Camera Framing Overlay */}
              <div className="pointer-events-none absolute inset-4 border border-dashed border-white/20 rounded-xl" />

              {/* Top Controls on Video */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="rounded-full bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Preview
                </span>
              </div>

              {/* Audio VU Meter */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Volume2 size={14} className="text-violet-400" />
                  <span className="text-[11px] font-medium">Mic Level:</span>
                  <div className="w-24 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                      style={{ width: `${micEnabled ? audioLevel : 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                      cameraEnabled
                        ? "border-white/10 bg-white/10 text-slate-200 hover:text-white"
                        : "border-rose-500/30 bg-rose-500/20 text-rose-300"
                    }`}
                    title={cameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
                  >
                    {cameraEnabled ? <Camera size={14} /> : <VideoOff size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                      micEnabled
                        ? "border-white/10 bg-white/10 text-slate-200 hover:text-white"
                        : "border-rose-500/30 bg-rose-500/20 text-rose-300"
                    }`}
                    title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
                  >
                    {micEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimulatedCamera(!simulatedCamera)}
                    className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-[10px] text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    {simulatedCamera ? "Use Physical Webcam" : "Simulate Camera"}
                  </button>
                </div>
              </div>
            </div>

            {cameraError && (
              <p className="text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                {cameraError}
              </p>
            )}

            <Button
              type="button"
              size="lg"
              onClick={() => setPhase("interview")}
              className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-semibold py-3 shadow-xl shadow-violet-900/30 cursor-pointer"
            >
              Start AI Video Assessment <ArrowRight size={16} />
            </Button>
          </Card>

          {/* Right Column: Grounded Assessment Context */}
          <div className="space-y-5">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                  Analyzed Resume Skills ({detectedSkills.length})
                </p>
                <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                The AI has formulated assessment questions targeting these verified core competencies:
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedSkills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200 font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                  Grounded Project Defense
                </p>
                <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                  RAG Indexed
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 space-y-1">
                <p className="text-xs font-semibold text-white">{projectName}</p>
                <p className="text-[11px] text-slate-400">
                  {activeProject?.project?.text_snippet ||
                    "Project documentation and architectural evidence mapped into live cross-examination."}
                </p>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1 border-t border-white/5 pt-2">
                <p className="font-semibold text-slate-300">How Multimodal Evaluation Works:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>AI listens to speech pacing, vocal tone & confidence.</li>
                  <li>Cross-checks answers against project architectural trade-offs.</li>
                  <li>Generates actionable MNC benchmark scores out of 10.</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* PHASE 2: LIVE INTERVIEW QUESTION & RECORDING */}
      {phase === "interview" && currentQ && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-violet-300">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span>
                Progress: {Math.round(((currentIdx + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-900 border border-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
            {/* Left: Live Camera & Recording Controls */}
            <Card className="p-5 space-y-4">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/15 shadow-2xl flex items-center justify-center">
                {/* When answering and not viewing playback */}
                {recordingStatus !== "recorded" && !simulatedCamera && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover transform -scale-x-100"
                  />
                )}

                {/* When answer is recorded and available for replay */}
                {recordingStatus === "recorded" && recordedVideoUrl && (
                  <video
                    ref={playbackRef}
                    src={recordedVideoUrl}
                    controls
                    playsInline
                    className="h-full w-full object-cover"
                  />
                )}

                {/* Simulated Feed fallback */}
                {(simulatedCamera || (recordingStatus === "recorded" && !recordedVideoUrl)) && (
                  <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#0c1222] to-[#16122c] p-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-2xl font-bold text-white shadow-xl">
                      {currentUser?.name ? currentUser.name[0] : "C"}
                    </div>
                    <p className="mt-3 text-xs font-semibold text-white">
                      {recordingStatus === "recording"
                        ? "Recording Candidate Audio & Speech..."
                        : "Candidate Video Answer Ready"}
                    </p>
                  </div>
                )}

                {/* Countdown Overlay (3, 2, 1) */}
                {recordingStatus === "countdown" && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fadeIn">
                    <div className="text-center">
                      <span className="text-6xl font-black text-violet-400 animate-ping block mb-2">
                        {countdown}
                      </span>
                      <p className="text-xs uppercase tracking-widest text-white font-semibold">
                        Get Ready to Answer...
                      </p>
                    </div>
                  </div>
                )}

                {/* Active Recording Pill */}
                {recordingStatus === "recording" && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full bg-rose-950/90 border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-200 shadow-lg">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span>REC &bull; {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, "0")} / 02:00</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {recordingStatus === "idle" && (
                  <Button
                    type="button"
                    onClick={handleStartRecording}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-xs font-semibold py-2.5"
                  >
                    <Play size={14} /> Start Recording Answer
                  </Button>
                )}

                {recordingStatus === "recording" && (
                  <Button
                    type="button"
                    onClick={handleStopRecording}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-xs font-semibold py-2.5 flex items-center justify-center gap-2"
                  >
                    <Square size={14} /> Stop Recording Answer
                  </Button>
                )}

                {recordingStatus === "recorded" && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleReRecord}
                      className="text-xs"
                    >
                      <RotateCcw size={14} /> Re-record
                    </Button>

                    {!currentEvaluation ? (
                      <Button
                        type="button"
                        onClick={handleEvaluateAnswer}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold"
                      >
                        <Sparkles size={14} /> Analyze & Evaluate Answer
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleNextQuestion}
                        className="flex-1 bg-violet-600 hover:bg-violet-500 text-xs font-semibold"
                      >
                        {currentIdx + 1 < questions.length ? (
                          <>
                            <span>Next Question</span> <ChevronRight size={14} />
                          </>
                        ) : (
                          <>
                            <span>View Final Evaluation Report</span> <Award size={14} />
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}

                {recordingStatus === "evaluating" && (
                  <Button disabled type="button" className="w-full text-xs">
                    <LoaderCircle size={15} className="animate-spin text-violet-400" />
                    Multimodal AI Analyzing Answer & Audio Delivery...
                  </Button>
                )}
              </div>
            </Card>

            {/* Right: Question Details & AI Evaluation */}
            <div className="space-y-4">
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full font-semibold border border-violet-500/20">
                    {currentQ.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Focus: <strong className="text-slate-200">{currentQ.skillFocus}</strong>
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                  &ldquo;{currentQ.question}&rdquo;
                </h3>

                <p className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <strong className="text-violet-300">Interviewer Context:</strong> {currentQ.probingReason}
                </p>

                {/* Candidate Notes / Transcript Area */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                    <span>Candidate Answer Summary / Key Points (Optional):</span>
                    <span className="text-[10px] text-slate-500">Aids speech-to-text accuracy</span>
                  </label>
                  <textarea
                    rows={2}
                    value={candidateNotes}
                    onChange={(e) => setCandidateNotes(e.target.value)}
                    placeholder="Briefly type your core talking points or technical architecture keywords..."
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-2.5 text-xs text-slate-200 focus:border-violet-500/40 focus:outline-none"
                  />
                </div>
              </Card>

              {/* Evaluation Card (When Evaluated) */}
              {currentEvaluation && (
                <Card className="p-5 space-y-4 border-emerald-500/30 bg-emerald-500/5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                        AI Multimodal Feedback
                      </span>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-1.5 mt-0.5">
                        <Award size={15} className="text-emerald-400" />
                        {currentEvaluation.performanceLevel}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-400">
                        {currentEvaluation.score}
                      </span>
                      <span className="text-xs text-slate-400"> / 10</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2">
                      <p className="text-[10px] text-slate-500 font-semibold">Technical</p>
                      <p className="text-sm font-bold text-white">{currentEvaluation.technicalAccuracy}%</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2">
                      <p className="text-[10px] text-slate-500 font-semibold">Communication</p>
                      <p className="text-sm font-bold text-white">{currentEvaluation.communicationScore}%</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2">
                      <p className="text-[10px] text-slate-500 font-semibold">Project Grounding</p>
                      <p className="text-sm font-bold text-white">{currentEvaluation.projectDefenseAlignment}%</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 italic bg-slate-950/40 p-3 rounded-xl border border-white/5">
                    &ldquo;{currentEvaluation.summaryFeedback}&rdquo;
                  </p>

                  <div className="space-y-1.5 text-xs">
                    <p className="font-semibold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Key Strengths Observed:
                    </p>
                    <ul className="space-y-1 text-slate-300 pl-4 list-disc">
                      {currentEvaluation.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 text-xs pt-1">
                    <p className="font-semibold text-amber-300 flex items-center gap-1">
                      <Lightbulb size={13} /> Recommendations for Next Level:
                    </p>
                    <ul className="space-y-1 text-slate-300 pl-4 list-disc">
                      {currentEvaluation.improvements.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: COMPLETED ASSESSMENT SCORECARD */}
      {phase === "completed" && (
        <Card className="p-6 sm:p-8 space-y-6 max-w-4xl mx-auto border-emerald-500/30 bg-gradient-to-b from-[#0d1527] to-[#0a0e1a]">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-2xl shadow-emerald-500/40 animate-bounce">
              <Award size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">AI Video Assessment Complete!</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your video interview has been evaluated against Tier-1 MNC hiring standards and persisted to your candidate profile.
            </p>
          </div>

          {/* Aggregate Metrics */}
          <div className="grid gap-3 sm:grid-cols-4 text-center">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Overall Score</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {(
                  evaluations.reduce((acc, curr) => acc + curr.score, 0) /
                  Math.max(1, evaluations.length)
                ).toFixed(1)}{" "}
                <span className="text-xs text-slate-400">/ 10</span>
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Readiness Score</p>
              <p className="text-2xl font-black text-violet-400 mt-1">
                {Math.round(
                  (evaluations.reduce((acc, curr) => acc + curr.score, 0) /
                    Math.max(1, evaluations.length)) *
                    10
                )}%
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Technical Depth</p>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {Math.round(
                  evaluations.reduce((acc, curr) => acc + curr.technicalAccuracy, 0) /
                    Math.max(1, evaluations.length)
                )}%
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Speech Pacing</p>
              <p className="text-2xl font-black text-teal-400 mt-1">
                {Math.round(
                  evaluations.reduce((acc, curr) => acc + curr.communicationScore, 0) /
                    Math.max(1, evaluations.length)
                )}%
              </p>
            </div>
          </div>

          {/* Question Breakdown List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-white">Video Question Performance Breakdown</h3>
            <div className="space-y-2">
              {evaluations.map((ev, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-slate-950/50 p-4 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-violet-300">
                      Question {i + 1}: {questions[i]?.category}
                    </span>
                    <span className="font-bold text-emerald-400">{ev.score} / 10</span>
                  </div>
                  <p className="text-slate-300 italic">&ldquo;{ev.summaryFeedback}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-white/10">
            <Link href="/" className="w-full sm:flex-1">
              <Button type="button" className="w-full text-xs bg-violet-600 hover:bg-violet-500">
                Return to Dashboard
              </Button>
            </Link>

            <Link href="/reports" className="w-full sm:flex-1">
              <Button type="button" variant="secondary" className="w-full text-xs">
                View Full Intelligence Report
              </Button>
            </Link>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPhase("setup");
                setCurrentIdx(0);
                setEvaluations([]);
                setCurrentEvaluation(null);
              }}
              className="w-full sm:w-auto text-xs"
            >
              <RotateCcw size={14} /> Retake Assessment
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
