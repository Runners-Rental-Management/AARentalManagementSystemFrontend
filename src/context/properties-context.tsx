"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Property } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Persistence                                                        */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "rental.user_properties.v1";

function loadFromStorage(): Property[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Property[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(props: Property[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(props));
  } catch {
    /* ignore quota errors */
  }
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

export type NewPropertyInput = Omit<
  Property,
  "id" | "status" | "createdAt" | "verifiedAt" | "images"
> & {
  /** Object-URL previews from the upload step (kept ephemeral) */
  images?: string[];
};

interface PropertiesCtx {
  /** All properties submitted by the current session (across all users) */
  userProperties: Property[];
  /** Get the user's own pending-or-verified submissions */
  propertiesForLandlord: (landlordId: string) => Property[];
  /** Submit a new property — returns the generated id, status defaults to pending_verification */
  addProperty: (input: NewPropertyInput) => Property;
}

const Ctx = createContext<PropertiesCtx | undefined>(undefined);

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const [userProperties, setUserProperties] = useState<Property[]>([]);

  useEffect(() => {
    setUserProperties(loadFromStorage());
  }, []);

  useEffect(() => {
    saveToStorage(userProperties);
  }, [userProperties]);

  const addProperty = useCallback((input: NewPropertyInput): Property => {
    const property: Property = {
      ...input,
      images: input.images ?? [],
      id: `usr-prop-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      status: "pending_verification",
      createdAt: new Date().toISOString(),
    };
    setUserProperties((prev) => [property, ...prev]);
    return property;
  }, []);

  const propertiesForLandlord = useCallback(
    (landlordId: string) =>
      userProperties.filter((p) => p.landlordId === landlordId),
    [userProperties]
  );

  const value = useMemo(
    () => ({ userProperties, propertiesForLandlord, addProperty }),
    [userProperties, propertiesForLandlord, addProperty]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProperties() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProperties must be inside PropertiesProvider");
  return ctx;
}
