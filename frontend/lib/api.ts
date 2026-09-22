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

export async function fetchDashboardData(): Promise<DashboardData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

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
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/uploads/${type}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const result = (await response.json().catch(() => ({}))) as UploadResult & {
    detail?: string;
  };

  if (!response.ok) {
    throw new Error(result.detail || `${type.toUpperCase()} file upload failed.`);
  }

  return result;
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
  });
  if (!response.ok) return { active: false, resume: null };
  return (await response.json()) as ActiveResumeData;
}

export async function deleteActiveResume(): Promise<void> {
  await fetch(`${API_URL}/resume/active`, {
    method: "DELETE",
    credentials: "include",
  });
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
  });
  if (!response.ok) return { active: false, project: null };
  return (await response.json()) as ActiveProjectData;
}

export async function deleteActiveProject(): Promise<void> {
  await fetch(`${API_URL}/projects/active`, {
    method: "DELETE",
    credentials: "include",
  });
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
    headers: { "Content-Type": "application/json" },
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
  });
  if (!response.ok) {
    throw new Error("Failed to load interview question.");
  }
  return (await response.json()) as NextQuestionResponse;
}

export async function submitAnswer(interviewId: number, payload: Record<string, any>) {
  const response = await fetch(`${API_URL}/interviews/${interviewId}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to submit answer.");
  }
  return await response.json();
}

export async function finishInterview(interviewId: number, readinessScore?: number) {
  const response = await fetch(`${API_URL}/interviews/${interviewId}/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overall_score: 8.0, readiness_score: readinessScore }),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to complete interview.");
  }
  return await response.json();
}

export async function fetchLatestReport() {
  const response = await fetch(`${API_URL}/reports/latest`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) return { has_report: false, report: null };
  return await response.json();
}
