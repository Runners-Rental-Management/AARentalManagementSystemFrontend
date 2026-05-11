import type { Property, RentAdjustment, User, UserRole } from "@/lib/types";
import type { TenancyAgreement } from "@/lib/types";
import type { Dispute } from "@/lib/types";

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const API_BASE_URLS = configuredBaseUrl
  ? [configuredBaseUrl]
  : ["http://localhost:3001", "http://localhost:3000"];
let activeApiBaseUrl: string | null = null;

const ACCESS_TOKEN_KEY = "rental_access_token";
const REFRESH_TOKEN_KEY = "rental_refresh_token";
let activeAccessToken: string | null = null;

function authDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("auth_debug") === "1";
}

function authDebug(event: string, details?: Record<string, unknown>) {
  if (!authDebugEnabled()) return;
  const payload = details ? JSON.stringify(details) : "";
  console.log(`[AUTH_DEBUG] ${event}${payload ? ` ${payload}` : ""}`);
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
};

export type AuthResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
};

export type PropertyListResponse = {
  items: BackendProperty[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function getAccessToken(): string | null {
  if (activeAccessToken) return activeAccessToken;
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  activeAccessToken = stored;
  authDebug("getAccessToken.storage", { hasToken: !!stored });
  return stored;
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  activeAccessToken = accessToken;
  authDebug("setAuthTokens", {
    accessTokenPrefix: accessToken.slice(0, 12),
    refreshTokenPrefix: refreshToken.slice(0, 12),
  });
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthTokens() {
  authDebug("clearAuthTokens");
  activeAccessToken = null;
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function apiRequest<T>(
  path: string,
  { method = "GET", token, body }: ApiRequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response | null = null;
  let networkError: unknown = null;
  const candidates = [
    ...(activeApiBaseUrl ? [activeApiBaseUrl] : []),
    ...API_BASE_URLS.filter((url) => url !== activeApiBaseUrl),
  ];

  for (const baseUrl of candidates) {
    try {
      authDebug("request.try", {
        method,
        path,
        baseUrl,
        hasAuthHeader: !!headers.Authorization,
      });
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      activeApiBaseUrl = baseUrl;
      authDebug("request.response", { method, path, baseUrl, status: response.status });
      break;
    } catch (error) {
      networkError = error;
      authDebug("request.networkError", {
        method,
        path,
        baseUrl,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (!response) {
    const details =
      networkError instanceof Error ? networkError.message : "Network error";
    throw new Error(
      `Cannot reach backend API. Tried: ${candidates.join(", ")}. Details: ${details}`,
    );
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const payload = (await response.json()) as {
        message?: string | string[];
      };
      if (Array.isArray(payload.message)) {
        message = payload.message.join(", ");
      } else if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore JSON parse failure and use default message.
    }

    if (
      response.status === 401 &&
      (message.toLowerCase().includes("invalid token subject") ||
        message.toLowerCase().includes("session is no longer valid"))
    ) {
      authDebug("request.401.sessionInvalid", { path, message });
      clearAuthTokens();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("rental_auth_user");
      }
      throw new Error("Your session expired. Please sign in again.");
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function apiLogin(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function apiRegister(input: {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export function apiGetMe(token: string) {
  return apiRequest<User>("/users/me", { token });
}

function toIsoDate(value: unknown): string {
  if (typeof value !== "string") return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

type BackendProperty = {
  id: string;
  title?: string;
  address?: string;
  subCity?: string;
  woreda?: string;
  propertyType: Property["propertyType"];
  bedrooms?: number | string;
  bathrooms?: number | string;
  area?: number | string;
  amenities?: string[];
  monthlyRent?: number | string;
  status: Property["status"];
  landlordId?: string;
  landlord?: { id?: string; firstName?: string; lastName?: string };
  images?: string[];
  description?: string;
  createdAt?: string;
  verifiedAt?: string;
  homeCondition?: Property["homeCondition"];
};

export function mapBackendProperty(raw: BackendProperty): Property {
  const landlordName =
    raw?.landlord?.firstName && raw?.landlord?.lastName
      ? `${raw.landlord.firstName} ${raw.landlord.lastName}`.trim()
      : "Landlord";

  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    address: String(raw.address ?? ""),
    subCity: String(raw.subCity ?? ""),
    woreda: String(raw.woreda ?? ""),
    propertyType: raw.propertyType,
    bedrooms: Number(raw.bedrooms ?? 0),
    bathrooms: Number(raw.bathrooms ?? 0),
    area: Number(raw.area ?? 0),
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    monthlyRent: Number(raw.monthlyRent ?? 0),
    status: raw.status,
    landlordId: String(raw.landlordId ?? raw.landlord?.id ?? ""),
    landlordName,
    images: Array.isArray(raw.images) ? raw.images : [],
    description: String(raw.description ?? ""),
    createdAt: toIsoDate(raw.createdAt),
    verifiedAt: raw.verifiedAt ? toIsoDate(raw.verifiedAt) : undefined,
    homeCondition: raw.homeCondition ?? undefined,
  };
}

export async function apiListProperties(token: string, query?: string) {
  const suffix = query ? `?${query}` : "";
  const result = await apiRequest<PropertyListResponse>(
    `/properties${suffix}`,
    { token },
  );
  return {
    ...result,
    items: result.items.map(mapBackendProperty),
  };
}

export async function apiListPublicProperties(
  query = "page=1&pageSize=100&status=available",
) {
  const suffix = query ? `?${query}` : "";
  const result = await apiRequest<PropertyListResponse>(
    `/properties/public${suffix}`,
  );
  return {
    ...result,
    items: result.items.map(mapBackendProperty),
  };
}

export async function apiCreateProperty(
  token: string,
  payload: {
    title: string;
    address: string;
    subCity: string;
    woreda: string;
    propertyType: Property["propertyType"];
    bedrooms: number;
    bathrooms: number;
    area: number;
    amenities: string[];
    monthlyRent: number;
    images: string[];
    description: string;
    homeCondition?: Property["homeCondition"];
  },
) {
  const raw = await apiRequest<BackendProperty>("/properties", {
    method: "POST",
    token,
    body: payload,
  });
  return mapBackendProperty(raw);
}

type BackendAgreement = {
  id: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  monthlyRent: number | string;
  advancePayment: number | string;
  startDate: string;
  endDate: string;
  status: TenancyAgreement["status"];
  createdAt: string;
  signedAt?: string | null;
  tenantSignedAt?: string | null;
  landlordSignedAt?: string | null;
  verifiedAt?: string | null;
  terminatedAt?: string | null;
  terminationReason?: string | null;
  utilities?: string[];
  property?: {
    id: string;
    title?: string;
    address?: string;
  };
  landlord?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  tenant?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
};

type AgreementListResponse = {
  items: BackendAgreement[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function mapBackendAgreement(raw: BackendAgreement): TenancyAgreement {
  const landlordName =
    raw.landlord?.firstName && raw.landlord?.lastName
      ? `${raw.landlord.firstName} ${raw.landlord.lastName}`.trim()
      : "Landlord";
  const tenantName =
    raw.tenant?.firstName && raw.tenant?.lastName
      ? `${raw.tenant.firstName} ${raw.tenant.lastName}`.trim()
      : "Tenant";

  return {
    id: raw.id,
    propertyId: raw.propertyId,
    propertyTitle: raw.property?.title ?? "Property",
    propertyAddress: raw.property?.address ?? "",
    landlordId: raw.landlordId,
    landlordName,
    tenantId: raw.tenantId,
    tenantName,
    monthlyRent: Number(raw.monthlyRent ?? 0),
    advancePayment: Number(raw.advancePayment ?? 0),
    startDate: toIsoDate(raw.startDate),
    endDate: toIsoDate(raw.endDate),
    status: raw.status,
    createdAt: toIsoDate(raw.createdAt),
    signedAt: raw.signedAt ? toIsoDate(raw.signedAt) : undefined,
    tenantSignedAt: raw.tenantSignedAt
      ? toIsoDate(raw.tenantSignedAt)
      : undefined,
    landlordSignedAt: raw.landlordSignedAt
      ? toIsoDate(raw.landlordSignedAt)
      : undefined,
    verifiedAt: raw.verifiedAt ? toIsoDate(raw.verifiedAt) : undefined,
    terminatedAt: raw.terminatedAt ? toIsoDate(raw.terminatedAt) : undefined,
    terminationReason: raw.terminationReason ?? undefined,
    utilities: Array.isArray(raw.utilities) ? raw.utilities : [],
  };
}

export async function apiListAgreements(
  token: string,
  query = "page=1&pageSize=100",
) {
  const result = await apiRequest<AgreementListResponse>(
    `/agreements?${query}`,
    {
      token,
    },
  );
  return {
    ...result,
    items: result.items.map(mapBackendAgreement),
  };
}

export async function apiGetAgreementById(token: string, id: string) {
  const result = await apiRequest<BackendAgreement>(`/agreements/${id}`, {
    token,
  });
  return mapBackendAgreement(result);
}

export async function apiCreateAgreement(
  token: string,
  payload: {
    propertyId: string;
    tenantId: string;
    monthlyRent: number;
    advancePayment: number;
    startDate: string;
    endDate: string;
    utilities: string[];
    terminationReason?: string;
  },
) {
  const result = await apiRequest<BackendAgreement>("/agreements", {
    method: "POST",
    token,
    body: payload,
  });
  return mapBackendAgreement(result);
}

type BackendRentAdjustment = {
  id: string;
  agreementId: string;
  landlordId: string;
  currentRent: number | string;
  proposedRent: number | string;
  increasePercentage: number | string;
  maxAllowedPercentage: number | string;
  reason: string;
  status: RentAdjustment["status"];
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  agreement?: {
    id: string;
    property?: {
      id: string;
      title?: string;
      address?: string;
    };
  };
  landlord?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
};

type RentAdjustmentListResponse = {
  items: BackendRentAdjustment[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function mapBackendRentAdjustment(raw: BackendRentAdjustment): RentAdjustment {
  const landlordName =
    raw.landlord?.firstName && raw.landlord?.lastName
      ? `${raw.landlord.firstName} ${raw.landlord.lastName}`.trim()
      : "Landlord";
  return {
    id: raw.id,
    agreementId: raw.agreementId,
    propertyTitle: raw.agreement?.property?.title ?? "Property",
    landlordId: raw.landlordId,
    landlordName,
    tenantName: "Tenant",
    currentRent: Number(raw.currentRent ?? 0),
    proposedRent: Number(raw.proposedRent ?? 0),
    increasePercentage: Number(raw.increasePercentage ?? 0),
    maxAllowedPercentage: Number(raw.maxAllowedPercentage ?? 0),
    reason: raw.reason ?? "",
    status: raw.status,
    createdAt: toIsoDate(raw.createdAt),
    reviewedAt: raw.reviewedAt ? toIsoDate(raw.reviewedAt) : undefined,
    reviewedBy: raw.reviewedBy ?? undefined,
    reviewNotes: raw.reviewNotes ?? undefined,
  };
}

export async function apiListRentAdjustments(
  token: string,
  query = "page=1&pageSize=100",
) {
  const result = await apiRequest<RentAdjustmentListResponse>(
    `/rent-adjustments?${query}`,
    {
      token,
    },
  );
  return {
    ...result,
    items: result.items.map(mapBackendRentAdjustment),
  };
}

type BackendDispute = {
  id: string;
  agreementId: string;
  propertyId: string;
  reporterId: string;
  respondentId: string;
  violationType: Dispute["violationType"];
  title: string;
  description: string;
  evidence: string[];
  status: Dispute["status"];
  priority: Dispute["priority"];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  resolution?: string | null;
  assignedToId?: string | null;
  agreement?: { id: string };
  reporter?: {
    id: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
  };
  respondent?: {
    id: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
  };
  assignedTo?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
};

type DisputeListResponse = {
  items: BackendDispute[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function mapBackendDispute(raw: BackendDispute): Dispute {
  const reporterName =
    raw.reporter?.firstName && raw.reporter?.lastName
      ? `${raw.reporter.firstName} ${raw.reporter.lastName}`.trim()
      : "Reporter";
  const respondentName =
    raw.respondent?.firstName && raw.respondent?.lastName
      ? `${raw.respondent.firstName} ${raw.respondent.lastName}`.trim()
      : "Respondent";
  const assignedTo =
    raw.assignedTo?.firstName && raw.assignedTo?.lastName
      ? `${raw.assignedTo.firstName} ${raw.assignedTo.lastName}`.trim()
      : undefined;

  return {
    id: raw.id,
    agreementId: raw.agreementId,
    reporterId: raw.reporterId,
    reporterName,
    reporterRole: raw.reporter?.role === "landlord" ? "landlord" : "tenant",
    respondentId: raw.respondentId,
    respondentName,
    violationType: raw.violationType,
    title: raw.title,
    description: raw.description,
    evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
    status: raw.status,
    priority: raw.priority,
    createdAt: toIsoDate(raw.createdAt),
    updatedAt: toIsoDate(raw.updatedAt),
    resolvedAt: raw.resolvedAt ? toIsoDate(raw.resolvedAt) : undefined,
    resolution: raw.resolution ?? undefined,
    assignedTo,
  };
}

export async function apiListDisputes(
  token: string,
  query = "page=1&pageSize=100",
) {
  const result = await apiRequest<DisputeListResponse>(`/disputes?${query}`, {
    token,
  });
  return {
    ...result,
    items: result.items.map(mapBackendDispute),
  };
}

export async function apiGetDisputeById(token: string, id: string) {
  const result = await apiRequest<BackendDispute>(`/disputes/${id}`, { token });
  return mapBackendDispute(result);
}

export async function apiCreateDispute(
  token: string,
  payload: {
    agreementId: string;
    violationType: Dispute["violationType"];
    title: string;
    description: string;
    priority?: Dispute["priority"];
    evidence: string[];
  },
) {
  const result = await apiRequest<BackendDispute>("/disputes", {
    method: "POST",
    token,
    body: payload,
  });
  return mapBackendDispute(result);
}
