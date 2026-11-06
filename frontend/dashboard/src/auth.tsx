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
    const res = await fetch("/api/auth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) return "Invalid username or password.";
    const tokens = (await res.json()) as { access: string; refresh: string };
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
