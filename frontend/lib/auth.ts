import { API_URL } from "@/lib/config";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

const DEMO_USER_KEY = "interviai_demo_user";

async function authRequest(path: string, payload?: Record<string, string>) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: payload ? "POST" : "GET",
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });

    const result = (await response.json().catch(() => ({}))) as {
      user?: AuthUser;
      detail?: string;
    };

    if (!response.ok) {
      throw new Error(result.detail || "Authentication request failed.");
    }

    return result;
  } catch (err: any) {
    if (err.name === "AbortError" || err.message?.includes("aborted") || err.message?.includes("fetch")) {
      throw new Error("Unable to connect to backend API server. Please check your backend URL or use Demo Mode.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function login(email: string, password: string) {
  try {
    const res = await authRequest("/auth/login", { email, password });
    if (typeof window !== "undefined") {
      localStorage.removeItem(DEMO_USER_KEY);
    }
    return res;
  } catch (err) {
    // If backend is unreachable and user enters demo credentials or falls back
    throw err;
  }
}

export async function loginAsDemoUser(email = "mohanbalaji1810@gmail.com", name = "Mohan Balaji"): Promise<AuthUser> {
  const demoUser: AuthUser = {
    id: 1,
    name: name || "Mohan Balaji",
    email: email || "mohanbalaji1810@gmail.com",
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
  }
  return demoUser;
}

export async function register(name: string, email: string, password: string) {
  try {
    const res = await authRequest("/auth/register", { name, email, password });
    if (typeof window !== "undefined") {
      localStorage.removeItem(DEMO_USER_KEY);
    }
    return res;
  } catch (err) {
    throw err;
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  // Check local demo session first
  if (typeof window !== "undefined") {
    const savedDemo = localStorage.getItem(DEMO_USER_KEY);
    if (savedDemo) {
      try {
        return JSON.parse(savedDemo) as AuthUser;
      } catch {
        localStorage.removeItem(DEMO_USER_KEY);
      }
    }
  }

  try {
    const result = await authRequest("/auth/me");
    return result.user ?? null;
  } catch {
    return null;
  }
}

export async function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEMO_USER_KEY);
  }
  try {
    await authRequest("/auth/logout", {});
  } catch {
    // Ignore logout backend errors
  }
}
