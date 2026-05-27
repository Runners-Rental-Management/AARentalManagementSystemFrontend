/**
 * Fayda tenant lookup for landlords — uses the backend when authenticated.
 */

import { apiLookupTenantByFayda } from "@/lib/api";
import { ApiError } from "@/lib/api-error";

export interface TenantLookupResult {
  faydaNumber: string;
  firstName: string;
  fatherName: string;
  fullName: string;
  maskedPhone: string;
  userId: string;
}

const FAN_REGEX = /^\d{16}$/;

export async function lookupTenantByFaydaNumber(
  fan: string,
  token?: string | null,
): Promise<TenantLookupResult | null> {
  const clean = fan.replace(/\s/g, "");
  if (!FAN_REGEX.test(clean)) {
    throw new Error("invalid_fayda_number");
  }

  if (!token) {
    throw new Error("authentication_required");
  }

  try {
    const profile = await apiLookupTenantByFayda(token, clean);
    return {
      faydaNumber: clean,
      firstName: profile.firstName,
      fatherName: profile.fatherName ?? "",
      fullName: profile.fullName,
      maskedPhone: profile.maskedPhone,
      userId: profile.id,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/** Seeded demo tenant FAN for local testing (tenant@aarental.local). */
export const DEMO_FAYDA_HINTS = [
  { label: "Tigist Haile (seed tenant)", fan: "9876543210987654" },
];
