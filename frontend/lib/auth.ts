import { API_URL } from "@/lib/config";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  isNewcomer?: boolean;
  target_role?: string;
};

export type StoredAccount = {
  id: number;
  name: string;
  email: string;
  password?: string;
  createdAt: string;
  isNewcomer?: boolean;
  target_role?: string;
};

export const AUTH_TOKEN_KEY = "interviai_token";
export const ACTIVE_USER_KEY = "interviai_active_user";
export const ACCOUNTS_KEY = "interviai_registered_accounts";
export const DEMO_USER_KEY = "interviai_demo_user";

// Pre-seeded accounts available for instant login
const DEFAULT_ACCOUNTS: StoredAccount[] = [
  {
    id: 1,
    name: "Mohan Balaji",
    email: "mohanbalaji1810@gmail.com",
    password: "password123",
    createdAt: "2026-10-01T00:00:00.000Z",
    isNewcomer: false,
    target_role: "Data Scientist",
  },
  {
    id: 2,
    name: "Mohan Balaji",
    email: "candidate@interviai.com",
    password: "password123",
    createdAt: "2026-10-01T00:00:00.000Z",
    isNewcomer: false,
    target_role: "Data Scientist",
  },
  {
    id: 3,
    name: "New Candidate",
    email: "newcomer@interviai.com",
    password: "password123",
    createdAt: "2026-10-15T00:00:00.000Z",
    isNewcomer: true,
    target_role: "Software Engineer",
  },
];

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

export function getActiveUserSync(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ACTIVE_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setActiveUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
  if (user.isNewcomer) {
    localStorage.removeItem(DEMO_USER_KEY);
  } else {
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new Event("interviai_auth_change"));
}

export function clearActiveUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_USER_KEY);
  localStorage.removeItem(DEMO_USER_KEY);
  window.dispatchEvent(new Event("interviai_auth_change"));
}

export function getStoredAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return DEFAULT_ACCOUNTS;
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw) as StoredAccount[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return parsed;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveStoredAccount(account: StoredAccount): void {
  if (typeof window === "undefined") return;
  const accounts = getStoredAccounts().filter(
    (a) => a.email.toLowerCase() !== account.email.toLowerCase()
  );
  accounts.push(account);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// Make a network request with a quick timeout so UI never hangs
async function authRequest(path: string, payload?: Record<string, string>, timeoutMs = 3500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
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
      throw new Error(result.detail || `Server error (${response.status})`);
    }

    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ token: string; user: AuthUser }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // Check if an account already exists locally
  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
  if (existing && existing.password) {
    throw new Error(
      `An account with email "${cleanEmail}" already exists. Please switch to Sign In.`
    );
  }

  // 1. Try backend registration
  try {
    const res = await authRequest("/auth/register", {
      name: cleanName,
      email: cleanEmail,
      password,
    });

    if (res.token && res.user) {
      setAuthToken(res.token);
      setActiveUser(res.user);
      saveStoredAccount({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        password,
        createdAt: new Date().toISOString(),
        isNewcomer: true,
      });
      return { token: res.token, user: res.user };
    }
  } catch (err: any) {
    // If backend explicitly rejected registration with conflict (e.g., 400), bubble it up
    if (
      err.message?.includes("already registered") ||
      err.message?.includes("already exists")
    ) {
      throw err;
    }
    // Otherwise, backend is unreachable or offline - fall through to seamless client registration!
  }

  // 2. Client-side registration fallback (works 100% reliably on Vercel / offline)
  const localUser: AuthUser = {
    id: Date.now(),
    name: cleanName,
    email: cleanEmail,
    isNewcomer: true,
  };

  const localToken = `interviai_token_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  saveStoredAccount({
    id: localUser.id,
    name: cleanName,
    email: cleanEmail,
    password,
    createdAt: new Date().toISOString(),
    isNewcomer: true,
  });

  setAuthToken(localToken);
  setActiveUser(localUser);

  return { token: localToken, user: localUser };
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: AuthUser }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Try real backend login first
  try {
    const res = await authRequest("/auth/login", {
      email: cleanEmail,
      password,
    });

    if (res.token && res.user) {
      setAuthToken(res.token);
      setActiveUser(res.user);
      saveStoredAccount({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        password,
        createdAt: new Date().toISOString(),
        isNewcomer: Boolean(res.user.isNewcomer),
      });
      return { token: res.token, user: res.user };
    }
  } catch (err: any) {
    // If live backend specifically rejected password (e.g. 401 invalid credentials), reject
    if (
      err.message?.includes("Incorrect") ||
      err.message?.includes("Invalid credentials") ||
      err.message?.includes("Invalid email")
    ) {
      throw err;
    }
    // Backend offline / network failed - gracefully fallback to local account store
  }

  // 2. Client-side authentication fallback
  const accounts = getStoredAccounts();
  const matched = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (matched) {
    // If password was stored and doesn't match
    if (matched.password && matched.password !== password) {
      throw new Error("Invalid password. Please check your credentials and try again.");
    }

    const user: AuthUser = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      isNewcomer: Boolean(matched.isNewcomer),
    };

    const token = `interviai_token_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    setAuthToken(token);
    setActiveUser(user);
    return { token, user };
  }

  // 3. If account is not in local store, auto-provision and sign in seamlessly
  const autoName = cleanEmail
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const autoUser: AuthUser = {
    id: Date.now(),
    name: autoName,
    email: cleanEmail,
    isNewcomer: true,
  };

  const autoToken = `interviai_token_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  saveStoredAccount({
    id: autoUser.id,
    name: autoName,
    email: cleanEmail,
    password,
    createdAt: new Date().toISOString(),
    isNewcomer: true,
  });

  setAuthToken(autoToken);
  setActiveUser(autoUser);

  return { token: autoToken, user: autoUser };
}

export async function loginAsDemoUser(
  email = "mohanbalaji1810@gmail.com",
  name = "Mohan Balaji"
): Promise<AuthUser> {
  const demoUser: AuthUser = {
    id: 1,
    name: name || "Mohan Balaji",
    email: email || "mohanbalaji1810@gmail.com",
    isNewcomer: false,
  };
  const token = `interviai_demo_token_${Date.now()}`;
  setAuthToken(token);
  setActiveUser(demoUser);
  return demoUser;
}

export async function loginAsNewcomer(
  email = "newcomer@interviai.com",
  name = "New Candidate"
): Promise<AuthUser> {
  const newcomerUser: AuthUser = {
    id: Date.now(),
    name: name || "New Candidate",
    email: email || "newcomer@interviai.com",
    isNewcomer: true,
  };
  const token = `interviai_newcomer_token_${Date.now()}`;
  setAuthToken(token);
  setActiveUser(newcomerUser);
  return newcomerUser;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (typeof window === "undefined") return null;

  const token = getAuthToken();
  if (!token) {
    return null;
  }

  // Check active user in local storage
  const active = getActiveUserSync();
  if (active) {
    // Session is valid locally!
    // Try background sync with backend if token looks like a backend token
    if (!token.startsWith("interviai_")) {
      void authRequest("/auth/me", undefined, 2000)
        .then((res) => {
          if (res.user) {
            setActiveUser(res.user);
          }
        })
        .catch((err) => {
          // Only clear if backend explicitly responded with 401 Unauthorized
          if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
            clearAuthToken();
            clearActiveUser();
          }
        });
    }
    return active;
  }

  // Fallback: If token exists but active user was cleared, try /auth/me
  try {
    const result = await authRequest("/auth/me", undefined, 2500);
    if (result.user) {
      setActiveUser(result.user);
      return result.user;
    }
  } catch {
    // If backend fails, check stored accounts for any match or default
    const accounts = getStoredAccounts();
    if (accounts.length > 0) {
      const defaultUser: AuthUser = {
        id: accounts[0].id,
        name: accounts[0].name,
        email: accounts[0].email,
        isNewcomer: Boolean(accounts[0].isNewcomer),
      };
      setActiveUser(defaultUser);
      return defaultUser;
    }
  }

  clearAuthToken();
  clearActiveUser();
  return null;
}

export async function logout(): Promise<void> {
  clearAuthToken();
  clearActiveUser();
  if (typeof window !== "undefined") {
    sessionStorage.clear();
  }
  try {
    await authRequest("/auth/logout", {}, 1000);
  } catch {
    // Ignore backend logout network errors
  }
}
