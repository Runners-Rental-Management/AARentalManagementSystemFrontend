"use client";

import {
  createContext,
  useEffect,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, UserRole } from "@/lib/types";
import type { FaydaConfirmResult } from "@/lib/fayda-api";
import {
  apiGetMe,
  apiLogin,
  apiRegister,
  clearAuthTokens,
  getAccessToken,
  setAuthTokens,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: UserRole, email?: string, password?: string) => Promise<void>;
  register: (
    role: UserRole,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phone: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  applyFaydaVerification: (result: FaydaConfirmResult) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "rental_auth_user";

const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string }> = {
  tenant: { email: "tenant@aarental.local", password: "Passw0rd!234" },
  landlord: { email: "landlord@aarental.local", password: "Passw0rd!234" },
  admin: { email: "admin@aarental.local", password: "Passw0rd!234" },
  dara_agent: { email: "admin@aarental.local", password: "Passw0rd!234" },
  system_admin: { email: "admin@aarental.local", password: "Passw0rd!234" },
};

function persist(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      persist(null);
      return;
    }

    let cancelled = false;
    const tokenAtStart = token;

    apiGetMe(token)
      .then((next) => {
        if (cancelled) return;
        if (getAccessToken() !== tokenAtStart) return;
        setUser(next);
        persist(next);
      })
      .catch(() => {
        if (cancelled) return;
        // Avoid clearing a freshly-updated token from a concurrent login.
        if (getAccessToken() !== tokenAtStart) return;
        clearAuthTokens();
        setUser(null);
        persist(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (role: UserRole, email?: string, password?: string) => {
      const creds = DEMO_CREDENTIALS[role];
      const loginEmail = (email?.trim() || creds.email).toLowerCase();
      const loginPassword = password?.trim() || creds.password;
      const result = await apiLogin(loginEmail, loginPassword);
      setAuthTokens(result.accessToken, result.refreshToken);
      const next = await apiGetMe(result.accessToken);
      setUser(next);
      persist(next);
    },
    []
  );

  const register = useCallback(
    async (
      role: UserRole,
      firstName: string,
      lastName: string,
      email: string,
      password: string,
      phone: string
    ) => {
      const result = await apiRegister({
        role,
        firstName: firstName || "New",
        lastName: lastName || "User",
        email: email.toLowerCase(),
        password,
        phone,
      });
      setAuthTokens(result.accessToken, result.refreshToken);
      const next = await apiGetMe(result.accessToken);
      setUser(next);
      persist(next);
    },
    []
  );

  const logout = useCallback(async () => {
    clearAuthTokens();
    setUser(null);
    persist(null);
  }, []);

  const applyFaydaVerification = useCallback((result: FaydaConfirmResult) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next: User = {
        ...prev,
        firstName: result.firstName || prev.firstName,
        fatherName: result.fatherName,
        grandfatherName: result.grandfatherName,
        faydaNumber: result.fan,
        faydaVerified: true,
        faydaVerifiedAt: result.verifiedAt,
        isVerified: true,
      };
      persist(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        applyFaydaVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
