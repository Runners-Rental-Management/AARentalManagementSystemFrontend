"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useProperties } from "@/context/properties-context";
import {
  isFaydaOnboardingPath,
  isLandlordPropertyOnboardingPath,
} from "@/lib/onboarding-paths";

/**
 * Redirects tenant/landlord users through required onboarding:
 * 1. Fayda (FAN) verification
 * 2. Landlords: at least one registered property
 */
export function OnboardingRedirect() {
  const { user, isAuthenticated } = useAuth();
  const { userProperties, isLoading } = useProperties();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const role = user.role;
    if (role !== "tenant" && role !== "landlord") return;

    if (!user.faydaVerified) {
      if (!isFaydaOnboardingPath(pathname)) {
        const next = encodeURIComponent(pathname);
        router.replace(`/dashboard/verify-fayda?next=${next}`);
      }
      return;
    }

    if (role === "landlord") {
      if (isLoading) return;
      const hasProperty = userProperties.some((p) => p.landlordId === user.id);
      if (!hasProperty && !isLandlordPropertyOnboardingPath(pathname)) {
        router.replace("/dashboard/properties/register");
      }
    }
  }, [
    isAuthenticated,
    user,
    userProperties,
    isLoading,
    pathname,
    router,
  ]);

  return null;
}
