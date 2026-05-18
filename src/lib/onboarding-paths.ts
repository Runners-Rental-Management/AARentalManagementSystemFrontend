/** Routes allowed before Fayda (FAN) verification completes. */
export const FAYDA_ONBOARDING_PREFIXES = [
  "/dashboard/verify-fayda",
  "/dashboard/profile",
] as const;

/** Extra routes for landlords before their first property is registered. */
export const LANDLORD_PROPERTY_ONBOARDING_PREFIXES = [
  ...FAYDA_ONBOARDING_PREFIXES,
  "/dashboard/properties/register",
  "/dashboard/properties",
] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isFaydaOnboardingPath(pathname: string) {
  return matchesPrefix(pathname, FAYDA_ONBOARDING_PREFIXES);
}

export function isLandlordPropertyOnboardingPath(pathname: string) {
  return matchesPrefix(pathname, LANDLORD_PROPERTY_ONBOARDING_PREFIXES);
}

export function resolvePostFaydaPath(role: string | undefined) {
  if (role === "landlord") {
    return "/dashboard/properties/register";
  }
  return "/dashboard";
}
