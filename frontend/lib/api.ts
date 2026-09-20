export type DashboardData = {
  candidate: {
    id: number;
    name: string | null;
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
  };
  claim_summary: {
    total: number;
    supported: number;
    partially_supported: number;
    unverified: number;
    verification_confidence: number | null;
  };
};

export const fallbackDashboardData: DashboardData = {
  candidate: {
    id: 1,
    name: "Mohan",
    target_role: "Senior Full-Stack Engineer",
    skills: ["Python", "TypeScript", "FastAPI", "Next.js", "PostgreSQL"],
  },
  interview: {
    id: 42,
    job_role: "Senior Full-Stack Engineer",
    total_questions: 10,
    status: "completed",
    overall_score: 8.6,
    readiness_score: 86,
    created_at: "2026-09-19T09:12:00Z",
    project_understanding: 82,
    questions_answered: 10,
  },
  claim_summary: {
    total: 8,
    supported: 5,
    partially_supported: 2,
    unverified: 1,
    verification_confidence: 81,
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

    const data = (await response.json()) as DashboardData;
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export type UploadResult = {
  id: number;
  filename: string;
  file_type: "resume" | "project";
  size_bytes: number;
  status: string;
  created_at: string;
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
    throw new Error(result.detail || "File upload failed.");
  }

  return result;
}
