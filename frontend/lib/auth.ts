export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function authRequest(path: string, payload?: Record<string, string>) {
  const response = await fetch(`${API_URL}${path}`, {
    method: payload ? "POST" : "GET",
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const result = (await response.json().catch(() => ({}))) as {
    user?: AuthUser;
    detail?: string;
  };

  if (!response.ok) {
    throw new Error(result.detail || "Authentication request failed.");
  }

  return result;
}

export async function login(email: string, password: string) {
  return authRequest("/auth/login", { email, password });
}

export async function register(name: string, email: string, password: string) {
  return authRequest("/auth/register", { name, email, password });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const result = await authRequest("/auth/me");
    return result.user ?? null;
  } catch {
    return null;
  }
}

export async function logout() {
  await authRequest("/auth/logout", {});
}
