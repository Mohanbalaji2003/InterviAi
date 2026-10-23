import { API_URL } from "@/lib/config";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  isNewcomer?: boolean;
};

export const AUTH_TOKEN_KEY = "interviai_token";
export const DEMO_USER_KEY = "interviai_demo_user";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function authRequest(path: string, payload?: Record<string, string>) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  const token = getAuthToken();

  const headers: Record<string, string> = {};
  if (payload) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: payload ? "POST" : "GET",
      headers,
      credentials: "include",
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });

    const result = (await response.json().catch(() => ({}))) as {
      token?: string;
      user?: AuthUser;
      detail?: string;
    };

    if (!response.ok) {
      throw new Error(result.detail || "Authentication request failed.");
    }

    if (result.token) {
      setAuthToken(result.token);
    }

    return result;
  } catch (err: any) {
    if (err.name === "AbortError" || err.message?.includes("aborted")) {
      throw new Error("Unable to reach backend API server. Connection timed out.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const res = await authRequest("/auth/login", { email: normalizedEmail, password });
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEMO_USER_KEY);
    window.dispatchEvent(new Event("interviai_auth_change"));
  }
  return res;
}

export async function register(name: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const res = await authRequest("/auth/register", { name: name.trim(), email: normalizedEmail, password });
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEMO_USER_KEY);
    window.dispatchEvent(new Event("interviai_auth_change"));
  }
  return res;
}

export async function loginAsDemoUser(email = "mohanbalaji1810@gmail.com", name = "Mohan Balaji"): Promise<AuthUser> {
  const demoUser: AuthUser = {
    id: 1,
    name: name || "Mohan Balaji",
    email: email || "mohanbalaji1810@gmail.com",
    isNewcomer: false,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    window.dispatchEvent(new Event("interviai_auth_change"));
  }
  return demoUser;
}

export async function loginAsNewcomer(email = "newcomer@interviai.com", name = "New Candidate"): Promise<AuthUser> {
  const newcomerUser: AuthUser = {
    id: Date.now(),
    name: name || "New Candidate",
    email: email || "newcomer@interviai.com",
    isNewcomer: true,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newcomerUser));
    window.dispatchEvent(new Event("interviai_auth_change"));
  }
  return newcomerUser;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  // Check local demo/newcomer session first if explicitly chosen
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(DEMO_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as AuthUser;
      } catch {
        localStorage.removeItem(DEMO_USER_KEY);
      }
    }

    // Fast synchronous check: If there is no token, user is unauthenticated.
    // Avoid making an unnecessary 12-second network request to /auth/me that causes cold-start lag.
    const token = getAuthToken();
    if (!token) {
      return null;
    }
  }

  try {
    const result = await authRequest("/auth/me");
    return result.user ?? null;
  } catch {
    clearAuthToken();
    return null;
  }
}

export async function logout() {
  clearAuthToken();
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEMO_USER_KEY);
    sessionStorage.clear();
    window.dispatchEvent(new Event("interviai_auth_change"));
  }
  try {
    await authRequest("/auth/logout", {});
  } catch {
    // Ignore logout backend errors
  }
}
