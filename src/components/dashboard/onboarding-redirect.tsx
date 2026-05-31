"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useProperties } from "@/context/properties-context";
import { isLandlordPropertyOnboardingPath } from "@/lib/onboarding-paths";

/**
 * Redirects landlords without a property to register their first listing.
 * Fayda verification runs on /dashboard/verify-fayda after signup (must stay
 * allowlisted here so landlords are not bounced to property register first).
 */
export function OnboardingRedirect() {
  const { user, isAuthenticated } = useAuth();
  const { userProperties, isLoading } = useProperties();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.role === "landlord") {
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
