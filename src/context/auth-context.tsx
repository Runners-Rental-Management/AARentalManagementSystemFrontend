"use client";



import {

  createContext,

  useEffect,

  useContext,

  useState,

  useCallback,

  type ReactNode,

} from "react";

import type { User } from "@/lib/types";

import type { FaydaConfirmResult } from "@/lib/fayda-api";

import {

  apiGetMe,

  apiLogin,

  apiRegister,

  apiVerifyFayda,

  clearAuthTokens,

  getAccessToken,

  setAuthTokens,

  type LoginInput,

  type RegisterInput,

} from "@/lib/api";



interface AuthContextType {

  user: User | null;

  isAuthenticated: boolean;

  login: (input: LoginInput) => Promise<User>;

  register: (input: RegisterInput) => Promise<void>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;

  applyFaydaVerification: (
    result: FaydaConfirmResult,
    otpCode: string,
  ) => Promise<void>;

}



const AuthContext = createContext<AuthContextType | undefined>(undefined);



const STORAGE_KEY = "rental_auth_user";



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

        if (getAccessToken() !== tokenAtStart) return;

        clearAuthTokens();

        setUser(null);

        persist(null);

      });



    return () => {

      cancelled = true;

    };

  }, []);



  const login = useCallback(async (input: LoginInput) => {

    const result = await apiLogin(input);

    setAuthTokens(result.accessToken, result.refreshToken);

    const next = await apiGetMe(result.accessToken);

    setUser(next);

    persist(next);

    return next;

  }, []);



  const register = useCallback(async (input: RegisterInput) => {

    const result = await apiRegister(input);

    setAuthTokens(result.accessToken, result.refreshToken);

    const next = await apiGetMe(result.accessToken);

    setUser(next);

    persist(next);

  }, []);



  const logout = useCallback(async () => {

    clearAuthTokens();

    setUser(null);

    persist(null);

  }, []);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    const next = await apiGetMe(token);
    setUser(next);
    persist(next);
  }, []);



  const applyFaydaVerification = useCallback(
    async (result: FaydaConfirmResult, otpCode: string) => {
      const token = getAccessToken();
      if (!token) {
        throw new Error("You must be logged in");
      }

      const next = await apiVerifyFayda(token, {
        faydaNumber: result.fan,
        firstName: result.firstName,
        fatherName: result.fatherName,
        grandfatherName: result.grandfatherName,
        otpCode,
      });

      setUser(next);
      persist(next);
    },
    [],
  );



  return (

    <AuthContext.Provider

      value={{

        user,

        isAuthenticated: !!user,

        login,

        register,

        logout,

        refreshUser,

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


