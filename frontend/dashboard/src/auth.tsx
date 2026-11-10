import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate } from "react-router-dom";
import {
  apiFetch,
  apiPath,
  clearAuth,
  getStoredUser,
  getTokens,
  setStoredUser,
  setTokens,
  type StaffUser,
} from "./api";

interface AuthContextValue {
  user: StaffUser | null;
  booting: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(getStoredUser());
  const [booting, setBooting] = useState(true);

  // Validate any stored tokens on load.
  useEffect(() => {
    const { access } = getTokens();
    if (!access) {
      setBooting(false);
      return;
    }
    apiFetch<StaffUser>("/api/auth/me/", { skipAuthRetry: false })
      .then(({ ok, data }) => {
        if (ok && data) {
          setUser(data);
          setStoredUser(data);
        } else {
          clearAuth();
          setUser(null);
        }
      })
      .finally(() => setBooting(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    // apiPath() is required here: the deployed console is on a different origin
    // from the API, so a relative "/api/..." would resolve against the static
    // site and return HTML instead of JSON.
    let res: Response;
    try {
      res = await fetch(apiPath("/api/auth/token/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      return "Could not reach the server. Check your connection and try again.";
    }

    // Never assume a JSON body: a proxy error page, an empty response or an
    // HTML redirect all parse as "Unexpected end of JSON input".
    const raw = await res.text();
    let tokens: { access?: string; refresh?: string } | null = null;
    try {
      tokens = raw ? (JSON.parse(raw) as { access?: string; refresh?: string }) : null;
    } catch {
      tokens = null;
    }

    if (!res.ok) {
      if (res.status === 429) return "Too many attempts. Please wait a minute.";
      if (res.status >= 500) return `Server error (${res.status}). Try again shortly.`;
      if (!tokens) return "Unexpected response from the server. Please try again.";
      return "Invalid username or password.";
    }
    if (!tokens?.access || !tokens.refresh) {
      return "Unexpected response from the server. Please try again.";
    }
    setTokens(tokens.access, tokens.refresh);

    const { ok, data } = await apiFetch<StaffUser>("/api/auth/me/");
    if (!ok || !data) {
      clearAuth();
      return "Could not verify your account. Please try again.";
    }
    if (!data.is_staff) {
      clearAuth();
      return "This account does not have staff access.";
    }
    setUser(data);
    setStoredUser(data);
    return null;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, booting, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** Route guard: requires a valid staff session. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, booting } = useAuth();
  if (booting) {
    return (
      <div className="boot-screen">
        <div className="spinner" aria-label="Loading" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
