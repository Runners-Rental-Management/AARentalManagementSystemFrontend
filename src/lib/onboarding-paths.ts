/** Routes landlords may use before their first property is registered. */
export const LANDLORD_PROPERTY_ONBOARDING_PREFIXES = [
  "/dashboard/profile",
  "/dashboard/verify-fayda",
  "/dashboard/properties/register",
  "/dashboard/properties",
] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
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
