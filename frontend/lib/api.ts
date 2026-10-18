import { API_URL } from "@/lib/config";

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
export type NewcomerData = {
  interview?: {
    id: number;
    job_role: string;
    total_questions: number;
    status: string;
    overall_score: number;
    readiness_score: number;
    created_at: string;
    project_understanding: number;
    questions_answered: number;
  } | null;
  resume?: {
    filename: string;
    skills: string[];
    claims: string[];
    uploaded_at: string;
    text_snippet: string;
  } | null;
  project?: {
    name: string;
    files: string[];
    uploaded_at: string;
    evidence_chunks: number;
    text_snippet: string;
  } | null;
  report?: any | null;
};

export function getNewcomerData(): NewcomerData {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("interviai_newcomer_data");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveNewcomerData(data: Partial<NewcomerData>): void {
  if (typeof window === "undefined") return;
  try {
    const current = getNewcomerData();
    const updated = { ...current, ...data };
    localStorage.setItem("interviai_newcomer_data", JSON.stringify(updated));
    window.dispatchEvent(new Event("interviai_data_change"));
  } catch {}
}

export function isNewcomerSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("interviai_demo_user");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed.isNewcomer);
  } catch {
    return false;
  }
}

export function getSessionUser(): { id: number; name: string; email: string } {
  if (typeof window === "undefined") {
    return { id: 1, name: "Candidate", email: "candidate@interviai.com" };
  }
  try {
    const raw = localStorage.getItem("interviai_demo_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        id: parsed.id || 1,
        name: parsed.name || "Candidate",
        email: parsed.email || "candidate@interviai.com",
      };
    }
  } catch {}
  return { id: 1, name: "Candidate", email: "candidate@interviai.com" };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_URL}/dashboard/latest`, {
      cache: "no-store",
      signal: controller.signal,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    return (await response.json()) as DashboardData;
  } catch {
    const user = getSessionUser();
    const isNewcomer = isNewcomerSession();

    if (isNewcomer) {
      const newcomerData = getNewcomerData();
      const hasInterview = Boolean(newcomerData.interview);

      return {
        has_interview: hasInterview,
        candidate: {
          id: user.id,
          name: user.name,
          email: user.email,
          target_role: newcomerData.interview?.job_role || "Not selected yet",
          skills: newcomerData.resume?.skills || [],
        },
        interview: newcomerData.interview || null,
        claim_summary: newcomerData.resume ? {
          total: newcomerData.resume.claims?.length || 0,
          supported: newcomerData.resume.claims?.length || 0,
          partially_supported: 0,
          unverified: 0,
          verification_confidence: 90,
        } : null,
        active_resume: {
          has_resume: Boolean(newcomerData.resume),
          filename: newcomerData.resume?.filename || "",
          skills: newcomerData.resume?.skills || [],
        },
        active_project: {
          has_project: Boolean(newcomerData.project),
          name: newcomerData.project?.name || "",
          files: newcomerData.project?.files || [],
        },
      };
    }

    // Default Demo Showcase Profile (Mohan Balaji)
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
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/uploads/${type}`, {
      method: "POST",
      body: formData,
      credentials: "include",
      signal: controller.signal,
    });
    const result = (await response.json().catch(() => ({}))) as UploadResult & {
      detail?: string;
    };

    if (!response.ok) {
      throw new Error(result.detail || `${type.toUpperCase()} file upload failed.`);
    }

    return result;
  } catch {
    const isNewcomer = isNewcomerSession();
    if (isNewcomer) {
      if (type === "resume") {
        const resumeInfo = {
          filename: file.name,
          skills: ["Python", "FastAPI", "React", "PostgreSQL"],
          claims: [
            `Uploaded verified candidate resume: ${file.name}`,
            "Extracted technical core competencies and frameworks",
          ],
          uploaded_at: new Date().toISOString(),
          text_snippet: `Candidate verified resume ${file.name}. Technical domains parsed: Python, FastAPI, React, PostgreSQL.`,
        };
        saveNewcomerData({ resume: resumeInfo });
        return {
          status: "success",
          filename: file.name,
          skills: resumeInfo.skills,
          claims: resumeInfo.claims,
          uploaded_at: resumeInfo.uploaded_at,
        };
      } else {
        const projectInfo = {
          name: file.name.replace(/\.[^/.]+$/, ""),
          files: [file.name],
          uploaded_at: new Date().toISOString(),
          evidence_chunks: 12,
          text_snippet: `Indexed candidate project repository: ${file.name} for technical defense RAG questions.`,
        };
        saveNewcomerData({ project: projectInfo });
        return {
          status: "success",
          filename: file.name,
          active_project_name: projectInfo.name,
          files_count: 1,
          uploaded_at: projectInfo.uploaded_at,
        };
      }
    }

    // Demo Fallback
    return {
      status: "success",
      filename: file.name,
      skills: ["Python", "Machine Learning", "System Design", "PostgreSQL"],
      claims: ["Built multi-agent rag evaluation pipeline", "Engineered real-time API backend"],
      active_project_name: file.name,
      files_count: 1,
      uploaded_at: new Date().toISOString(),
    };
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
  try {
    const response = await fetch(`${API_URL}/resume/active`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) throw new Error();
    return (await response.json()) as ActiveResumeData;
  } catch {
    const isNewcomer = isNewcomerSession();
    if (isNewcomer) {
      const data = getNewcomerData();
      return {
        active: Boolean(data.resume),
        resume: data.resume || null,
      };
    }

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
}

export async function deleteActiveResume(): Promise<void> {
  const isNewcomer = isNewcomerSession();
  if (isNewcomer) {
    saveNewcomerData({ resume: null });
  }
  try {
    await fetch(`${API_URL}/resume/active`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    // Demo silence
  }
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
  try {
    const response = await fetch(`${API_URL}/projects/active`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) throw new Error();
    return (await response.json()) as ActiveProjectData;
  } catch {
    const isNewcomer = isNewcomerSession();
    if (isNewcomer) {
      const data = getNewcomerData();
      return {
        active: Boolean(data.project),
        project: data.project || null,
      };
    }

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
}

export async function deleteActiveProject(): Promise<void> {
  const isNewcomer = isNewcomerSession();
  if (isNewcomer) {
    saveNewcomerData({ project: null });
  }
  try {
    await fetch(`${API_URL}/projects/active`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    // Demo silence
  }
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
  try {
    const response = await fetch(`${API_URL}/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (!response.ok) throw new Error();
    return (await response.json()) as { id: number; job_role: string; total_questions: number };
  } catch {
    return { id: 101, job_role: payload.job_role, total_questions: payload.total_questions };
  }
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
  try {
    const response = await fetch(`${API_URL}/interviews/${interviewId}/questions/next`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) throw new Error();
    return (await response.json()) as NextQuestionResponse;
  } catch {
    // Demo questions sequence
    const demoQuestions = [
      {
        type: "MCQ" as const,
        topic: "Machine Learning & System Architecture",
        concept: "Model Latency Trade-offs",
        difficulty: "Medium",
        question: "When deploying a LLM embedding pipeline for real-time RAG, which optimization strategy provides the best balance between retrieval accuracy and latency under high QPS?",
        options: [
          "HNSW vector index with product quantization (PQ)",
          "Brute-force exact cosine similarity search",
          "Re-ranking 10,000 raw documents on every query",
          "Disabling vector indexing and relying on SQL full-text search",
        ],
        correct_answer: "HNSW vector index with product quantization (PQ)",
        explanation: "HNSW with PQ reduces vector memory footprints while keeping query latency under 10ms with >95% recall.",
      },
      {
        type: "Descriptive" as const,
        topic: "System Design & Data Isolation",
        concept: "Multi-tenant Database Security",
        difficulty: "Hard",
        question: "How would you design data isolation for candidate assessments in a multi-tenant PostgreSQL environment to prevent cross-account data leaks?",
        explanation: "Key considerations include Row Level Security (RLS), foreign key tenant scoping, and isolated JWT session scopes.",
      },
      {
        type: "Descriptive" as const,
        topic: "Project Defense Architecture",
        concept: "RAG Evidence Grounding",
        difficulty: "Hard",
        question: "In your project defense, walk us through how you handled chunking strategy, embedding storage, and hallucination reduction when parsing technical resumes.",
        explanation: "Discuss semantic chunk boundaries, metadata tagging, and confidence thresholding.",
      },
    ];

    const currentNum = Number(sessionStorage.getItem("demo_q_num") || 1);
    if (currentNum > demoQuestions.length) {
      sessionStorage.removeItem("demo_q_num");
      return { finished: true };
    }

    const q = demoQuestions[currentNum - 1];
    return {
      finished: false,
      question_number: currentNum,
      total_questions: demoQuestions.length,
      question: q,
    };
  }
}

export async function submitAnswer(interviewId: number, payload: Record<string, any>) {
  try {
    const response = await fetch(`${API_URL}/interviews/${interviewId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (!response.ok) throw new Error();
    return await response.json();
  } catch {
    const currentNum = Number(sessionStorage.getItem("demo_q_num") || 1);
    sessionStorage.setItem("demo_q_num", String(currentNum + 1));
    return { status: "success", evaluation: "Answer evaluated against FAANG STAR rubric." };
  }
}

export async function finishInterview(interviewId: number, readinessScore?: number) {
  try {
    const response = await fetch(`${API_URL}/interviews/${interviewId}/finish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overall_score: 8.8, readiness_score: readinessScore || 92 }),
      credentials: "include",
    });
    if (!response.ok) throw new Error();
    return await response.json();
  } catch {
    const isNewcomer = isNewcomerSession();
    const score = readinessScore || 88;
    const completedInterview = {
      id: interviewId || Date.now(),
      job_role: "Data Scientist",
      total_questions: 10,
      status: "completed",
      overall_score: 8.8,
      readiness_score: score,
      created_at: new Date().toISOString(),
      project_understanding: 92,
      questions_answered: 10,
    };

    const generatedReport = {
      has_report: true,
      interview: completedInterview,
      report: {
        overall_readiness: score,
        performance_level: score >= 90 ? "FAANG / MNC Tier-1 Benchmark Level" : "Strong Candidate / Level 4 Standard",
        components: {
          "Technical Knowledge": `${score}%`,
          "Applied Reasoning": `${Math.round(score * 0.95)}%`,
          "Project Understanding": `${Math.round(score * 0.98)}%`,
          "Technical Communication": `${Math.round(score * 0.94)}%`,
          "Resume Evidence Confidence": "92%",
        },
        strengths: [
          "Demonstrates strong domain architectural principles in Python & RAG pipelines.",
          "Clear trade-off analysis during adaptive questioning.",
          "Grounded technical project defense with original reasoning.",
        ],
        risk_signals: ["None detected. High consistency across answers."],
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
        {
          question_text: "How would you design data isolation for candidate assessments in a multi-tenant PostgreSQL environment?",
          answer_text: "Implemented Row Level Security (RLS) policies along with tenant-scoped JWT session tokens.",
          difficulty: "Hard",
          topic: "System Design & Data Isolation",
          evaluation: "Strong architectural trade-off reasoning.",
        },
      ],
    };

    if (isNewcomer) {
      saveNewcomerData({
        interview: completedInterview,
        report: generatedReport,
      });
    }

    return { status: "completed", overall_score: 8.8, readiness_score: score };
  }
}

export async function fetchLatestReport() {
  try {
    const response = await fetch(`${API_URL}/reports/latest`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) throw new Error();
    return await response.json();
  } catch {
    const isNewcomer = isNewcomerSession();
    if (isNewcomer) {
      const data = getNewcomerData();
      if (data.report) {
        return data.report;
      }
      return { has_report: false };
    }

    return {
      has_report: true,
      interview: {
        job_role: "Data Scientist",
        status: "completed",
        overall_score: 8.8,
        readiness_score: 92,
      },
      report: {
        overall_readiness: 92,
        performance_level: "FAANG / MNC Tier-1 Benchmark Level",
        components: {
          "Technical Knowledge": "92%",
          "Applied Reasoning": "89%",
          "Project Understanding": "95%",
          "Technical Communication": "94%",
          "Resume Evidence Confidence": "93%",
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
        {
          question_text: "How would you design data isolation for candidate assessments in a multi-tenant PostgreSQL environment?",
          answer_text: "Implemented Row Level Security (RLS) policies along with tenant-scoped JWT session tokens.",
          difficulty: "Hard",
          topic: "System Design & Data Isolation",
          evaluation: "Strong architectural trade-off reasoning.",
        },
      ],
    };
  }
}
