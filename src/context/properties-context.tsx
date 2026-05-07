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
import { useAuth } from "@/context/auth-context";
import { apiCreateProperty, apiListProperties, getAccessToken } from "@/lib/api";

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
  /** Role-aware properties loaded from backend */
  userProperties: Property[];
  isLoading: boolean;
  /** Get the user's own pending-or-verified submissions */
  propertiesForLandlord: (landlordId: string) => Property[];
  /** Submit a new property — returns the generated id, status defaults to pending_verification */
  addProperty: (input: NewPropertyInput) => Promise<Property>;
  refreshProperties: () => Promise<void>;
}

const Ctx = createContext<PropertiesCtx | undefined>(undefined);

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshProperties = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !isAuthenticated) {
      setUserProperties([]);
      return;
    }
    setIsLoading(true);
    try {
      const result = await apiListProperties(token, "page=1&pageSize=100");
      setUserProperties(result.items);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshProperties();
  }, [refreshProperties, user?.id]);

  const addProperty = useCallback(
    async (input: NewPropertyInput): Promise<Property> => {
      const token = getAccessToken();
      if (!token) {
        throw new Error("You must be logged in");
      }

      const created = await apiCreateProperty(token, {
        title: input.title,
        address: input.address,
        subCity: input.subCity,
        woreda: input.woreda,
        propertyType: input.propertyType,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        area: input.area,
        amenities: input.amenities,
        monthlyRent: input.monthlyRent,
        images: input.images ?? [],
        description: input.description,
        homeCondition: input.homeCondition,
      });

      setUserProperties((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const propertiesForLandlord = useCallback(
    (landlordId: string) =>
      userProperties.filter((p) => p.landlordId === landlordId),
    [userProperties]
  );

  const value = useMemo(
    () => ({
      userProperties,
      isLoading,
      propertiesForLandlord,
      addProperty,
      refreshProperties,
    }),
    [userProperties, isLoading, propertiesForLandlord, addProperty, refreshProperties]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProperties() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProperties must be inside PropertiesProvider");
  return ctx;
}
