import { API_URL } from "@/lib/config";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  isNewcomer?: boolean;
};

export const DEMO_USER_KEY = "interviai_demo_user";
export const NEWCOMER_DATA_KEY = "interviai_newcomer_data";

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
    throw err;
  }
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
    // Clear any previous newcomer session progress
    localStorage.removeItem(NEWCOMER_DATA_KEY);
    window.dispatchEvent(new Event("interviai_auth_change"));
  }
  return newcomerUser;
}

export async function register(name: string, email: string, password: string) {
  try {
    const res = await authRequest("/auth/register", { name, email, password });
    if (typeof window !== "undefined") {
      const user = res.user || { id: Date.now(), name, email, isNewcomer: true };
      user.isNewcomer = true;
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
      localStorage.removeItem(NEWCOMER_DATA_KEY);
      window.dispatchEvent(new Event("interviai_auth_change"));
    }
    return res;
  } catch (err) {
    // If backend is offline during registration, create offline newcomer account
    const offlineUser: AuthUser = {
      id: Date.now(),
      name: name || "New Candidate",
      email: email || "candidate@interviai.com",
      isNewcomer: true,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(offlineUser));
      localStorage.removeItem(NEWCOMER_DATA_KEY);
      window.dispatchEvent(new Event("interviai_auth_change"));
    }
    return { user: offlineUser };
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  // Check local demo/newcomer session first
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(DEMO_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as AuthUser;
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
    localStorage.removeItem(NEWCOMER_DATA_KEY);
    sessionStorage.clear();
    window.dispatchEvent(new Event("interviai_auth_change"));
  }
  try {
    await authRequest("/auth/logout", {});
  } catch {
    // Ignore logout backend errors
  }
}
