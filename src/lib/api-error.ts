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

function mapRawErrorMessage(raw: string, t: Translate): string {
  const lower = raw.toLowerCase();

  if (lower.includes("invalid credentials")) {
    return t("auth", "invalidCredentials");
  }
  if (lower.includes("email already exists")) {
    return t("auth", "emailAlreadyExists");
  }
  if (lower.includes("account is temporarily locked")) {
    return t("auth", "accountLocked");
  }
  if (lower.includes("cannot reach backend api")) {
    return t("common", "backendUnreachable");
  }
  if (lower.includes("session expired")) {
    return t("auth", "sessionExpired");
  }
  if (lower.includes("description must be longer")) {
    return t("properties", "descriptionMinLength");
  }
  if (lower.includes("complete fayda")) {
    return t("fayda", "verificationRequired");
  }
  if (lower.includes("register at least one property")) {
    return t("properties", "propertyRequired");
  }
  if (lower.includes("fayda number is already registered")) {
    return t("fayda", "fanAlreadyRegistered");
  }
  if (lower.includes("incorrect verification cod")) {
    return t("fayda", "errIncorrectCode");
  }
  if (lower.includes("fayda names do not match")) {
    return t("fayda", "nameMismatchIntro");
  }
  if (
    lower.includes("database is unavailable") ||
    lower.includes("database connection lost") ||
    lower.includes("server has closed the connection")
  ) {
    return t("common", "databaseUnavailable");
  }
  if (lower.includes("internal server error")) {
    return t("common", "internalServerError");
  }
  if (
    lower.includes("unexpected error") ||
    raw === "An unexpected error occurred."
  ) {
    return t("common", "unexpectedError");
  }

  return raw;
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
  const message = mapRawErrorMessage(raw, t);

  if (
    raw.toLowerCase().includes("fayda names do not match") &&
    message === t("fayda", "nameMismatchIntro")
  ) {
    return { title: t("fayda", "nameMismatchTitle"), message };
  }

  return { title, message };
}

/** Localized message for inline form errors (no dialog title). */
export function translateErrorMessage(
  error: unknown,
  t: Translate,
): string {
  return mapRawErrorMessage(getErrorMessage(error), t);
}
