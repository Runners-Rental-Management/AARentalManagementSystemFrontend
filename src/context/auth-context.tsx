"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, UserRole } from "@/lib/types";
import { users as allUsers } from "@/lib/dummy-data";
import type { FaydaConfirmResult } from "@/lib/fayda-api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
  register: (role: UserRole, firstName: string, lastName: string) => void;
  logout: () => void;
  applyFaydaVerification: (result: FaydaConfirmResult) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "rental_auth_user";

const DEMO_USERS: Record<UserRole, string> = {
  tenant: "u3",
  landlord: "u2",
  admin: "u1",
  dara_agent: "u6",
  system_admin: "u10",
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

  const login = useCallback((role: UserRole) => {
    const demoUserId = DEMO_USERS[role];
    const found = allUsers.find((u) => u.id === demoUserId);
    if (found) {
      // Demo accounts are treated as already Fayda-verified so the seeded
      // flows continue to work without forcing an extra step.
      const next: User = { ...found, faydaVerified: true };
      setUser(next);
      persist(next);
    }
  }, []);

  const register = useCallback(
    (role: UserRole, firstName: string, lastName: string) => {
      const newUser: User = {
        id: `u_new_${Date.now()}`,
        firstName: firstName || "New",
        lastName: lastName || "User",
        email: `${(firstName || "new").toLowerCase()}@example.com`,
        phone: "+251900000000",
        role,
        createdAt: new Date().toISOString().split("T")[0],
        isVerified: false,
        address: "Addis Ababa",
        faydaVerified: false,
      };
      setUser(newUser);
      persist(newUser);
    },
    []
  );

  const logout = useCallback(() => {
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
