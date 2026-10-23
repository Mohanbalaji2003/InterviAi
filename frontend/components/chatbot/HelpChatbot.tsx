"use client";

import {
  Bot,
  Check,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Minus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
  Volume2,
  VolumeX,
  X,
  Zap,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { clearChatHistory, fetchChatHistory, sendChatMessage } from "@/lib/api";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  citations?: string[];
  quickActions?: { label: string; action: string }[];
  isError?: boolean;
};

const STARTER_PROMPTS = [
  { label: "Analyze My Weak Areas", action: "What were my weakest areas in my latest interview, and how should I practice?" },
  { label: "Probe My Resume", action: "What claims in my active resume might a FAANG interviewer cross-examine?" },
  { label: "Project Defense Drill", action: "Generate a challenging technical defense question based on my uploaded project." },
  { label: "Master the STAR Method", action: "Explain the STAR method rubric for Amazon and Google behavioral questions." },
  { label: "7-Day Preparation Plan", action: "Give me an actionable 7-day preparation roadmap for my target role." },
];

function renderFormattedText(text: string) {
  // Simple markdown renderer for bold, inline code, and lists
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-bold text-white text-sm mt-2 mb-1">
              {trimmed.replace("### ", "")}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-bold text-white text-sm mt-2 mb-1">
              {trimmed.replace("## ", "")}
            </h3>
          );
        }

        const isBullet = trimmed.startsWith("• ") || trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed);
        const cleanContent = isBullet
          ? trimmed.replace(/^(•\s|-\s|\d+\.\s)/, "")
          : trimmed;

        // Process bold and code blocks
        const parts = cleanContent.split(/(\*\*.*?\*\*|`.*?`)/g);

        const renderedContent = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code key={pIdx} className="rounded bg-black/40 px-1 py-0.5 font-mono text-[11px] text-violet-300 border border-white/10">
                {part.slice(1, -1)}
              </code>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-violet-400 font-bold shrink-0">•</span>
              <span>{renderedContent}</span>
            </div>
          );
        }

        return <p key={idx}>{renderedContent}</p>;
      })}
    </div>
  );
}

export function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Hi! I'm your **InterviAI Intelligence Assistant & MNC Interview Coach**.\n\nI have access to your active resume, uploaded project documentation, and latest interview reports. Ask me about your weak areas, project architecture trade-offs, or FAANG hiring rubrics!",
      time: "Just now",
      quickActions: STARTER_PROMPTS.slice(0, 4),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Load chat history from backend on mount
    async function loadHistory() {
      try {
        const res = await fetchChatHistory();
        if (res.history && res.history.length > 0) {
          const loaded: Message[] = res.history.map((m) => ({
            id: m.id,
            sender: m.role === "user" ? "user" : "bot",
            text: m.message,
            time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
            citations: m.citations,
          }));
          setMessages((prev) => [prev[0], ...loaded]);
        }
      } catch {
        // Fallback to initial welcome message
      }
    }
    void loadHistory();
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  const playChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setLastUserMessage(text);

    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsTyping(true);

    try {
      const result = await sendChatMessage(text);
      const botMsg: Message = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: result.reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations: result.citations,
        quickActions: result.suggested_followups
          ? result.suggested_followups.map((q) => ({ label: q, action: q }))
          : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
      playChime();
      if (!isOpen) setHasUnread(true);
    } catch (err: any) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: `⚠️ **Unable to reach assistant:** ${err.message || "Network request failed. Please check your connection."}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear your chat conversation history?")) return;
    try {
      await clearChatHistory();
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: "Conversation cleared. How can I assist your interview preparation now?",
          time: "Just now",
          quickActions: STARTER_PROMPTS.slice(0, 3),
        },
      ]);
    } catch {
      // Ignored
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open InterviAI Assistant Chatbot"
            className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 text-white shadow-2xl shadow-violet-600/50 transition-all duration-300 hover:scale-105 hover:shadow-violet-500/70 cursor-pointer border border-white/20"
          >
            <Bot size={26} className="transition-transform group-hover:rotate-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#070b12]" />
            </span>
            {hasUnread && (
              <span className="absolute -top-2 -left-2 bg-rose-500 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full border border-black animate-bounce">
                New
              </span>
            )}
          </button>
        )}
      </div>

      {/* Main Chat Drawer / Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="InterviAI Assistant Chatbot"
          className="fixed bottom-6 right-6 z-50 flex h-[620px] w-[95vw] sm:w-[440px] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0f18]/95 shadow-2xl shadow-black/80 backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-violet-950/60 via-slate-900/80 to-slate-950/90 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-900/40">
                <Bot size={20} />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  InterviAI Copilot
                  <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-medium text-violet-300 border border-violet-500/30">
                    Gemini RAG
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Grounded in your resume & projects</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute audio chime" : "Enable audio chime"}
                className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <button
                type="button"
                onClick={handleClear}
                title="Clear conversation"
                className="rounded-lg p-1.5 hover:bg-white/10 hover:text-rose-300 transition cursor-pointer"
              >
                <Trash2 size={16} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 text-slate-100 ${
                      isUser
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/30 rounded-br-xs"
                        : m.isError
                          ? "bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-bl-xs"
                          : "bg-slate-900/90 border border-white/10 shadow-md rounded-bl-xs"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-violet-400">
                        <Sparkles size={12} /> InterviAI Assistant
                      </div>
                    )}

                    {renderFormattedText(m.text)}

                    {/* Citations Pill Badge if available */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                          Evidence Grounding:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.citations.map((c, cIdx) => (
                            <span
                              key={cIdx}
                              className="inline-flex items-center gap-1 rounded bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] text-violet-300 font-mono"
                            >
                              <ExternalLink size={10} /> {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Retry button on error */}
                    {m.isError && lastUserMessage && (
                      <button
                        type="button"
                        onClick={() => handleSendMessage(lastUserMessage)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-xs text-rose-200 hover:bg-rose-500/30 transition cursor-pointer"
                      >
                        <RotateCcw size={12} /> Retry request
                      </button>
                    )}

                    <div className={`mt-1.5 text-[9px] ${isUser ? "text-violet-200" : "text-slate-500"} text-right`}>
                      {m.time}
                    </div>
                  </div>

                  {/* Interactive Quick Actions */}
                  {m.quickActions && m.quickActions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                      {m.quickActions.map((qa, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => handleSendMessage(qa.action)}
                          className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-200 hover:bg-violet-500/20 hover:border-violet-400/50 transition cursor-pointer flex items-center gap-1"
                        >
                          <Zap size={10} className="text-violet-400" />
                          {qa.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-900/90 border border-white/10 px-4 py-3 max-w-[220px]">
                <Bot size={15} className="text-violet-400 animate-spin" />
                <span className="text-xs text-slate-300">Consulting Gemini & RAG...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="border-t border-white/10 bg-slate-950/80 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about your resume, project defense, or concepts..."
                disabled={isTyping}
                className="flex-1 rounded-xl border border-white/15 bg-slate-900/90 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-violet-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                aria-label="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
