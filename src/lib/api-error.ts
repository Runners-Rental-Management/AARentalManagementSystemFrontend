export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

type Translate = (namespace: string, key: string) => string;

export function formatErrorForUser(
  error: unknown,
  t: Translate,
  options?: { titleKey?: string; namespace?: string },
): { title: string; message: string } {
  const ns = options?.namespace ?? "common";
  const title = t(ns, options?.titleKey ?? "errorTitle");
  const raw = getErrorMessage(error);
  const lower = raw.toLowerCase();

  if (lower.includes("invalid credentials")) {
    return { title, message: t("auth", "invalidCredentials") };
  }
  if (lower.includes("email already exists")) {
    return { title, message: t("auth", "emailAlreadyExists") };
  }
  if (lower.includes("account is temporarily locked")) {
    return { title, message: t("auth", "accountLocked") };
  }
  if (lower.includes("cannot reach backend api")) {
    return { title, message: t("common", "backendUnreachable") };
  }
  if (lower.includes("session expired")) {
    return { title, message: t("auth", "sessionExpired") };
  }
  if (lower.includes("description must be longer")) {
    return { title, message: t("properties", "descriptionMinLength") };
  }
  if (lower.includes("complete fayda")) {
    return { title, message: t("fayda", "verificationRequired") };
  }
  if (lower.includes("register at least one property")) {
    return { title, message: t("properties", "propertyRequired") };
  }
  if (lower.includes("fayda number is already registered")) {
    return { title, message: t("fayda", "fanAlreadyRegistered") };
  }
  if (lower.includes("incorrect verification cod`e")) {
    return { title, message: t("fayda", "errIncorrectCode") };
  }
  if (lower.includes("fayda names do not match")) {
    return { title: t("fayda", "nameMismatchTitle"), message: t("fayda", "nameMismatchIntro") };
  }

  return { title, message: raw };
}
