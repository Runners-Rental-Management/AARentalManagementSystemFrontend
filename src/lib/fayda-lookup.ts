/**
 * Simulated Fayda tenant lookup.
 * In production this calls the Fayda eKYC directory API.
 * Demo: two hard-coded FANs map to real demo tenants; any other 16-digit
 * number resolves to a generic "verified tenant" so the flow can be explored.
 */

export interface TenantLookupResult {
  faydaNumber: string;
  firstName: string;
  fatherName: string;
  fullName: string;
  maskedPhone: string;
  userId?: string; // matched demo user id
}

const DEMO_TENANTS: Record<string, TenantLookupResult> = {
  "1234567890123456": {
    faydaNumber: "1234567890123456",
    firstName: "Tigist",
    fatherName: "Haile",
    fullName: "Tigist Haile Bekele",
    maskedPhone: "+251 91* *** ***",
    userId: "u3",
  },
  "9876543210987654": {
    faydaNumber: "9876543210987654",
    firstName: "Meron",
    fatherName: "Tadesse",
    fullName: "Meron Tadesse Girma",
    maskedPhone: "+251 96* *** ***",
    userId: "u9",
  },
};

const FAN_REGEX = /^\d{16}$/;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms));
}

export async function lookupTenantByFaydaNumber(
  fan: string
): Promise<TenantLookupResult | null> {
  const clean = fan.replace(/\s/g, "");
  if (!FAN_REGEX.test(clean)) {
    throw new Error("invalid_fayda_number");
  }
  await delay(null, 900); // simulate network
  if (DEMO_TENANTS[clean]) return DEMO_TENANTS[clean];
  // Any other valid 16-digit number resolves as a generic verified tenant
  return {
    faydaNumber: clean,
    firstName: "Verified",
    fatherName: "Tenant",
    fullName: "Verified Tenant (Demo)",
    maskedPhone: "+251 9** *** ***",
  };
}

export const DEMO_FAYDA_HINTS = [
  { label: "Tigist Haile", fan: "1234567890123456" },
  { label: "Meron Tadesse", fan: "9876543210987654" },
];
