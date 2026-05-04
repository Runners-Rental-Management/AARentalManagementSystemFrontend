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
import { useAuth } from "@/context/auth-context";

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => void;
  removeFavorite: (propertyId: string) => void;
  clearFavorites: () => void;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const storageKey = (userId: string | null | undefined) =>
  `rental_favorites_${userId ?? "guest"}`;

function readFavs(userId: string | null | undefined): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [favorites, setFavorites] = useState<string[]>(() => readFavs(userId));

  // Reload favorites whenever the logged-in user changes (login / logout / switch)
  useEffect(() => {
    setFavorites(readFavs(userId));
  }, [userId]);

  // Persist on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(favorites));
    } catch {
      // ignore quota errors
    }
  }, [favorites, userId]);

  const isFavorite = useCallback(
    (propertyId: string) => favorites.includes(propertyId),
    [favorites]
  );

  const toggleFavorite = useCallback((propertyId: string) => {
    setFavorites((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
  }, []);

  const removeFavorite = useCallback((propertyId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== propertyId));
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  const value = useMemo<FavoritesContextType>(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      clearFavorites,
      count: favorites.length,
    }),
    [favorites, isFavorite, toggleFavorite, removeFavorite, clearFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
