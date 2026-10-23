import { API_URL } from "@/lib/config";
import { getAuthToken } from "@/lib/auth";

export type DashboardData = {
  has_interview: boolean;
  candidate: {
    id: number;
    name: string | null;
    email: string | null;
    target_role: string | null;
    skills: string[];
  };
  interview: {
    id: number;
    job_role: string;
    total_questions: number;
    status: string;
    overall_score: number | null;
    readiness_score: number | null;
    created_at: string | null;
    project_understanding: number | null;
    questions_answered: number;
  } | null;
  claim_summary: {
    total: number;
    supported: number;
    partially_supported: number;
    unverified: number;
    verification_confidence: number | null;
  } | null;
  active_resume: {
    has_resume: boolean;
    filename: string | null;
    skills: string[];
  };
  active_project: {
    has_project: boolean;
    name: string | null;
    files: string[];
  };
};

function getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function isDemoSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(localStorage.getItem("interviai_demo_user"));
  } catch {
    return false;
  }
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}/dashboard/latest`, {
      cache: "no-store",
      signal: controller.signal,
      credentials: "include",
      headers: getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      throw new Error(`Server returned ${response.status}`);
    }

    return (await response.json()) as DashboardData;
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") throw err;

    // If explicit demo showcase user is chosen in localStorage
    if (isDemoSession()) {
      return {
        has_interview: true,
        candidate: {
          id: 1,
          name: "Mohan Balaji",
          email: "mohanbalaji1810@gmail.com",
          target_role: "Data Scientist",
          skills: ["Python", "FastAPI", "PyTorch", "PostgreSQL", "Next.js", "Scikit-Learn"],
        },
        interview: {
          id: 101,
          job_role: "Data Scientist",
          total_questions: 10,
          status: "completed",
          overall_score: 8.8,
          readiness_score: 91,
          created_at: new Date().toISOString(),
          project_understanding: 94,
          questions_answered: 10,
        },
        claim_summary: {
          total: 5,
          supported: 4,
          partially_supported: 1,
          unverified: 0,
          verification_confidence: 93,
        },
        active_resume: {
          has_resume: true,
          filename: "Mohan_Balaji_Resume.pdf",
          skills: ["Python", "FastAPI", "PyTorch", "PostgreSQL", "Next.js"],
        },
        active_project: {
          has_project: true,
          name: "InterviAI Architecture RAG",
          files: ["README.md", "app.py", "interviai_api.py"],
        },
      };
    }

    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export type UploadResult = {
  status: string;
  filename: string;
  skills?: string[];
  claims?: string[];
  active_project_name?: string;
  files_count?: number;
  uploaded_at: string;
};

export async function uploadFile(
  file: File,
  type: "resume" | "project",
): Promise<UploadResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const headers = getHeaders();

    const response = await fetch(`${API_URL}/uploads/${type}`, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers,
      signal: controller.signal,
    });

    const result = (await response.json().catch(() => ({}))) as UploadResult & {
      detail?: string;
    };

    if (!response.ok) {
      throw new Error(result.detail || `${type.toUpperCase()} upload failed.`);
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export type ActiveResumeData = {
  active: boolean;
  resume: {
    filename: string;
    skills: string[];
    claims: string[];
    uploaded_at: string | null;
    text_snippet: string;
  } | null;
};

export async function fetchActiveResume(): Promise<ActiveResumeData> {
  const response = await fetch(`${API_URL}/resume/active`, {
    cache: "no-store",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) {
    if (isDemoSession()) {
      return {
        active: true,
        resume: {
          filename: "Mohan_Balaji_Resume.pdf",
          skills: ["Python", "FastAPI", "PyTorch", "PostgreSQL", "Next.js", "Scikit-Learn"],
          claims: [
            "Engineered high-throughput adaptive assessment pipeline using Python & FastAPI",
            "Optimized RAG embedding retrieval latency down to under 120ms",
            "Built data-isolated candidate evaluation architecture backed by PostgreSQL",
          ],
          uploaded_at: new Date().toISOString(),
          text_snippet: "Mohan Balaji - Data Scientist & AI Product Engineer with expertise in FastAPI, PostgreSQL, RAG systems...",
        },
      };
    }
    throw new Error("Failed to fetch active resume.");
  }
  return (await response.json()) as ActiveResumeData;
}

export async function deleteActiveResume(): Promise<void> {
  const response = await fetch(`${API_URL}/resume/active`, {
    method: "DELETE",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete resume.");
}

export type ActiveProjectData = {
  active: boolean;
  project: {
    name: string;
    files: string[];
    uploaded_at: string | null;
    evidence_chunks: number;
    text_snippet: string;
  } | null;
};

export async function fetchActiveProject(): Promise<ActiveProjectData> {
  const response = await fetch(`${API_URL}/projects/active`, {
    cache: "no-store",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) {
    if (isDemoSession()) {
      return {
        active: true,
        project: {
          name: "InterviAI Candidate Intelligence System",
          files: ["README.md", "interviai_api.py", "database.py", "adaptive_engine.py"],
          uploaded_at: new Date().toISOString(),
          evidence_chunks: 18,
          text_snippet: "InterviAI is an AI-powered candidate intelligence platform with adaptive questioning and project defense RAG...",
        },
      };
    }
    throw new Error("Failed to fetch active project.");
  }
  return (await response.json()) as ActiveProjectData;
}

export async function deleteActiveProject(): Promise<void> {
  const response = await fetch(`${API_URL}/projects/active`, {
    method: "DELETE",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete project.");
}

export type CreateInterviewPayload = {
  job_role: string;
  total_questions: number;
  candidate_type?: string;
  experience_years?: string;
  starting_difficulty?: string;
  use_project_defense?: boolean;
};

export async function createInterview(payload: CreateInterviewPayload) {
  const response = await fetch(`${API_URL}/interviews`, {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create assessment.");
  }
  return (await response.json()) as { id: number; job_role: string; total_questions: number };
}

export type NextQuestionResponse = {
  finished: boolean;
  question_number?: number;
  total_questions?: number;
  question?: {
    type: "MCQ" | "Descriptive";
    topic: string;
    concept: string;
    difficulty: string;
    question: string;
    options?: string[];
    correct_answer?: string;
    explanation?: string;
  };
};

export async function fetchNextQuestion(interviewId: number): Promise<NextQuestionResponse> {
  const response = await fetch(`${API_URL}/interviews/${interviewId}/questions/next`, {
    cache: "no-store",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load question.");
  }
  return (await response.json()) as NextQuestionResponse;
}

export async function submitAnswer(interviewId: number, payload: Record<string, any>) {
  const response = await fetch(`${API_URL}/interviews/${interviewId}/answers`, {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit answer.");
  }
  return await response.json();
}

export async function finishInterview(interviewId: number, readinessScore?: number) {
  const response = await fetch(`${API_URL}/interviews/${interviewId}/finish`, {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ overall_score: 8.8, readiness_score: readinessScore || 90 }),
    credentials: "include",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to finalize interview report.");
  }
  return await response.json();
}

export async function fetchLatestReport() {
  const response = await fetch(`${API_URL}/reports/latest`, {
    cache: "no-store",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) {
    if (isDemoSession()) {
      return {
        has_report: true,
        interview: {
          id: 101,
          job_role: "Data Scientist",
          status: "completed",
          overall_score: 8.8,
          readiness_score: 92,
        },
        report: {
          overall_readiness: 92,
          performance_level: "FAANG / MNC Tier-1 Benchmark Level",
          components: {
            "Technical Knowledge": 92,
            "Applied Reasoning": 89,
            "Project Understanding": 95,
            "Technical Communication": 94,
            "Resume Evidence Confidence": 93,
          },
          strengths: [
            "Demonstrates strong domain architectural principles in Python & RAG pipelines.",
            "Clear trade-off analysis during adaptive questioning.",
            "Grounded technical project defense with zero hallucination flag.",
          ],
          risk_signals: ["None detected. High consistency across resume claims."],
          recommended_focus: [
            "Deep dive into multi-region database scaling trade-offs.",
            "Conduct live pair-programming microservice optimization screen.",
          ],
        },
        qa_audit: [
          {
            question_text: "When deploying a LLM embedding pipeline for real-time RAG, which optimization strategy provides the best balance between retrieval accuracy and latency under high QPS?",
            answer_text: "HNSW vector index with product quantization (PQ)",
            difficulty: "Medium",
            topic: "Machine Learning & System Architecture",
            evaluation: "Correct. Selected optimal vector index algorithm.",
          },
        ],
      };
    }
    throw new Error("Failed to fetch report.");
  }
  return await response.json();
}

export async function fetchInterviewReport(interviewId: number) {
  const response = await fetch(`${API_URL}/reports/${interviewId}`, {
    cache: "no-store",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to load interview report.");
  return await response.json();
}

export async function fetchInterviewHistory() {
  const response = await fetch(`${API_URL}/interviews`, {
    cache: "no-store",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch interview history.");
  return (await response.json()) as {
    interviews: Array<{
      id: number;
      job_role: string;
      total_questions: number;
      status: string;
      overall_score: number | null;
      readiness_score: number | null;
      created_at: string | null;
      questions_answered: number;
    }>;
  };
}

export async function fetchPreparationPlan() {
  const response = await fetch(`${API_URL}/reports/latest/prep-plan`, {
    cache: "no-store",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch preparation plan.");
  return await response.json();
}

// ==========================================
// CHATBOT CLIENT APIS
// ==========================================

export async function fetchChatHistory() {
  const response = await fetch(`${API_URL}/chatbot/history`, {
    cache: "no-store",
    credentials: "include",
    headers: getHeaders(),
  });
  if (!response.ok) return { history: [] };
  return (await response.json()) as {
    history: Array<{
      id: string;
      role: "user" | "assistant";
      message: string;
      citations: string[];
      created_at: string | null;
    }>;
  };
}

export async function sendChatMessage(message: string) {
  const response = await fetch(`${API_URL}/chatbot/message`, {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ message }),
    credentials: "include",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Chat assistant is unavailable right now.");
  }
  return (await response.json()) as {
    reply: string;
    citations: string[];
    suggested_followups: string[];
  };
}

export async function clearChatHistory() {
  await fetch(`${API_URL}/chatbot/history`, {
    method: "DELETE",
    credentials: "include",
    headers: getHeaders(),
  });
}
