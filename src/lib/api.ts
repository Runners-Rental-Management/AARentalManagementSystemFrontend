import { ApiError } from "@/lib/api-error";
import type { Property, RentAdjustment, RentPayment, TenantPublicProfile, User, UserRole } from "@/lib/types";
import type { TenancyAgreement } from "@/lib/types";

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

function devProxyBaseUrl(): string | null {
  if (typeof window === "undefined") return null;
  if (process.env.NEXT_PUBLIC_API_USE_PROXY !== "1") return null;
  return `${window.location.origin}/api-proxy`;
}

const API_BASE_URLS = configuredBaseUrl
  ? [configuredBaseUrl]
  : [
      ...(devProxyBaseUrl() ? [devProxyBaseUrl() as string] : []),
      "http://localhost:3001",
      "http://localhost:3000",
    ];
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
    throw new ApiError(
      `Cannot reach backend API. Tried: ${candidates.join(", ")}. Details: ${details}`,
      0,
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
      throw new ApiError("Your session expired. Please sign in again.", 401);
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export type LoginInput = {
  email: string;
  password: string;
  role: UserRole;
};

export type RegisterInput = {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
};

export function apiLogin(input: LoginInput) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      role: input.role,
    },
  });
}

export function apiRegister(input: RegisterInput) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: {
      role: input.role,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      phone: input.phone.trim(),
    },
  });
}

export function apiGetMe(token: string) {
  return apiRequest<User>("/users/me", { token });
}

export function apiUpdateMe(token: string, input: { address?: string }) {
  return apiRequest<User>("/users/me", {
    method: "PATCH",
    token,
    body: {
      address: input.address?.trim() || undefined,
    },
  });
}

export function apiChangePassword(
  token: string,
  input: { email: string; currentPassword: string; newPassword: string },
) {
  return apiRequest<{ ok: boolean }>("/users/me/password", {
    method: "PATCH",
    token,
    body: {
      email: input.email.trim().toLowerCase(),
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
  });
}

export type VerifyFaydaInput = {
  faydaNumber: string;
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  otpCode: string;
};

export function apiVerifyFayda(token: string, input: VerifyFaydaInput) {
  return apiRequest<User>("/users/me/fayda/verify", {
    method: "POST",
    token,
    body: {
      faydaNumber: input.faydaNumber.trim(),
      firstName: input.firstName.trim(),
      fatherName: input.fatherName.trim(),
      grandfatherName: input.grandfatherName.trim(),
      otpCode: input.otpCode.trim(),
    },
  });
}

export async function apiLookupTenantByFayda(token: string, faydaNumber: string) {
  const clean = faydaNumber.replace(/\s/g, "");
  const raw = await apiRequest<Record<string, unknown>>(
    `/users/tenants/lookup?faydaNumber=${encodeURIComponent(clean)}`,
    { token },
  );
  return mapTenantPublicProfile(raw);
}

export async function apiGetTenantProfile(token: string, tenantId: string) {
  const raw = await apiRequest<Record<string, unknown>>(
    `/users/tenants/${tenantId}`,
    { token },
  );
  return mapTenantPublicProfile(raw);
}

function mapTenantPublicProfile(raw: Record<string, unknown>): TenantPublicProfile {
  return {
    id: String(raw.id),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    fatherName: raw.fatherName ? String(raw.fatherName) : undefined,
    grandfatherName: raw.grandfatherName ? String(raw.grandfatherName) : undefined,
    fullName: String(raw.fullName ?? ""),
    phone: String(raw.phone ?? ""),
    maskedPhone: String(raw.maskedPhone ?? ""),
    address: raw.address ? String(raw.address) : undefined,
    role: "tenant",
    isVerified: Boolean(raw.isVerified),
    faydaVerified: Boolean(raw.faydaVerified),
    faydaVerifiedAt: raw.faydaVerifiedAt
      ? toIsoDate(raw.faydaVerifiedAt)
      : undefined,
    maskedFaydaNumber:
      raw.maskedFaydaNumber != null ? String(raw.maskedFaydaNumber) : null,
    createdAt: toIsoDate(raw.createdAt),
    agreementCountAsTenant: Number(raw.agreementCountAsTenant ?? 0),
  };
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
  isPostedToExplore?: boolean;
  postedToExploreAt?: string;
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
    isPostedToExplore: Boolean(raw.isPostedToExplore),
    postedToExploreAt: raw.postedToExploreAt
      ? toIsoDate(raw.postedToExploreAt)
      : undefined,
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

export async function apiGetProperty(token: string, id: string) {
  const raw = await apiRequest<BackendProperty>(`/properties/${id}`, { token });
  return mapBackendProperty(raw);
}

export async function apiPostPropertyToExplore(token: string, id: string) {
  const raw = await apiRequest<BackendProperty>(`/properties/${id}/post-to-explore`, {
    method: "PATCH",
    token,
  });
  return mapBackendProperty(raw);
}

export type UploadedFile = {
  url: string;
  storageKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
};

export type UploadFileType = "photos" | "ownership";

/**
 * Upload files to Cloudinary via the backend and return permanent URLs + metadata.
 */
export async function apiUploadFiles(
  token: string,
  files: File[],
  type: UploadFileType = "photos",
): Promise<UploadedFile[]> {
  if (!files.length) return [];

  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const candidates = [
    ...(activeApiBaseUrl ? [activeApiBaseUrl] : []),
    ...API_BASE_URLS.filter((u) => u !== activeApiBaseUrl),
  ];

  let response: Response | null = null;
  for (const baseUrl of candidates) {
    try {
      response = await fetch(`${baseUrl}/upload/files?type=${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      activeApiBaseUrl = baseUrl;
      break;
    } catch {
      // try next base
    }
  }

  if (!response) throw new ApiError("Cannot reach upload endpoint", 0);
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(payload.message ?? `Upload failed: ${response.status}`, response.status);
  }

  const data = (await response.json()) as { files: UploadedFile[] };
  return data.files;
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
    ownershipDocuments?: UploadedFile[];
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
  initialPaymentAt?: string | null;
  proposedEndDate?: string | null;
  proposedMonthlyRent?: number | string | null;
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
    initialPaymentAt: raw.initialPaymentAt
      ? toIsoDate(raw.initialPaymentAt)
      : undefined,
    proposedEndDate: raw.proposedEndDate
      ? toIsoDate(raw.proposedEndDate)
      : undefined,
    proposedMonthlyRent:
      raw.proposedMonthlyRent != null
        ? Number(raw.proposedMonthlyRent)
        : undefined,
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

export async function apiTenantRequestAgreement(
  token: string,
  payload: { propertyId: string; utilities?: string[] },
) {
  const result = await apiRequest<BackendAgreement>("/agreements/tenant-request", {
    method: "POST",
    token,
    body: payload,
  });
  return mapBackendAgreement(result);
}

export async function apiTenantSignAgreement(token: string, id: string) {
  const result = await apiRequest<BackendAgreement>(`/agreements/${id}/tenant-sign`, {
    method: "PATCH",
    token,
  });
  return mapBackendAgreement(result);
}

export async function apiLandlordSignAgreement(token: string, id: string) {
  const result = await apiRequest<BackendAgreement>(`/agreements/${id}/landlord-sign`, {
    method: "PATCH",
    token,
  });
  return mapBackendAgreement(result);
}

export async function apiConfirmAgreementPayment(
  token: string,
  id: string,
  payload: { method?: "cbe_birr" | "telebirr" | "bank_transfer" | "mobile_money" | "cash" | "check"; reference?: string },
) {
  const result = await apiRequest<BackendAgreement>(`/agreements/${id}/confirm-payment`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return mapBackendAgreement(result);
}

export async function apiWithdrawAgreement(
  token: string,
  id: string,
  reason: string,
) {
  const result = await apiRequest<BackendAgreement>(`/agreements/${id}/withdraw`, {
    method: "PATCH",
    token,
    body: { reason },
  });
  return mapBackendAgreement(result);
}

// ─── Rent payments ────────────────────────────────────────────────────────────

type BackendRentPayment = {
  id: string;
  agreementId: string;
  payerId: string;
  recipientId: string;
  amount: number | string;
  dueDate: string;
  paidDate?: string | null;
  status: RentPayment["status"];
  method?: RentPayment["method"] | null;
  reference?: string | null;
  agreement?: {
    id: string;
    property?: { id: string; title?: string };
  };
  payer?: { id: string; firstName?: string; lastName?: string };
  recipient?: { id: string; firstName?: string; lastName?: string };
};

type RentPaymentListResponse = {
  items: BackendRentPayment[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

function mapBackendRentPayment(raw: BackendRentPayment): RentPayment {
  const payerName = raw.payer
    ? `${raw.payer.firstName ?? ""} ${raw.payer.lastName ?? ""}`.trim()
    : "—";
  const recipientName = raw.recipient
    ? `${raw.recipient.firstName ?? ""} ${raw.recipient.lastName ?? ""}`.trim()
    : "—";
  return {
    id: raw.id,
    agreementId: raw.agreementId,
    propertyTitle: raw.agreement?.property?.title ?? "—",
    payerId: raw.payerId,
    payerName,
    recipientId: raw.recipientId,
    recipientName,
    amount: Number(raw.amount ?? 0),
    dueDate: toIsoDate(raw.dueDate),
    paidDate: raw.paidDate ? toIsoDate(raw.paidDate) : undefined,
    status: raw.status,
    method: raw.method ?? undefined,
    reference: raw.reference ?? undefined,
  };
}

export async function apiListRentPayments(
  token: string,
  query = "page=1&pageSize=100",
) {
  const result = await apiRequest<RentPaymentListResponse>(`/payments?${query}`, {
    token,
  });
  return {
    ...result,
    items: result.items.map(mapBackendRentPayment),
  };
}

export async function apiGetRentPaymentById(token: string, id: string) {
  const result = await apiRequest<BackendRentPayment>(`/payments/${id}`, { token });
  return mapBackendRentPayment(result);
}

export async function apiConfirmRentPayment(
  token: string,
  id: string,
  payload: {
    method?: RentPayment["method"];
    reference?: string;
  },
) {
  const result = await apiRequest<BackendRentPayment>(`/payments/${id}/confirm`, {
    method: "PATCH",
    token,
    body: payload,
  });
  return mapBackendRentPayment(result);
}

export type ChapaInitResponse = {
  checkoutUrl: string;
  txRef: string;
  amount: number | string;
  currency: string;
};

export async function apiInitiateChapaPayment(token: string, paymentId: string) {
  return apiRequest<ChapaInitResponse>(`/payments/${paymentId}/pay-with-chapa`, {
    method: "POST",
    token,
  });
}

export async function apiInitiateChapaAdvancePayment(token: string, agreementId: string) {
  return apiRequest<ChapaInitResponse & { paymentId: string }>(
    `/agreements/${agreementId}/pay-with-chapa`,
    {
      method: "POST",
      token,
    },
  );
}

export type ChapaVerifyResponse = {
  txRef: string;
  verified: boolean;
  chapaStatus?: string;
  payment: BackendRentPayment | null;
};

export async function apiVerifyChapaPayment(token: string, txRef: string) {
  const result = await apiRequest<ChapaVerifyResponse>(
    `/payments/chapa/verify/${encodeURIComponent(txRef)}`,
    { token },
  );
  return {
    ...result,
    payment: result.payment ? mapBackendRentPayment(result.payment) : null,
  };
}

export async function apiRequestAgreementTermination(
  token: string,
  id: string,
  reason: string,
) {
  const result = await apiRequest<BackendAgreement>(
    `/agreements/${id}/request-termination`,
    {
      method: "PATCH",
      token,
      body: { reason },
    },
  );
  return mapBackendAgreement(result);
}

export async function apiRequestAgreementExtension(
  token: string,
  id: string,
  payload: {
    newEndDate: string;
    newMonthlyRent?: number;
    reference?: string;
  },
) {
  const result = await apiRequest<BackendAgreement>(
    `/agreements/${id}/request-extension`,
    {
      method: "PATCH",
      token,
      body: payload,
    },
  );
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

// ─── Notifications ────────────────────────────────────────────────────────────

export type BackendNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  category: "agreement" | "rent_adjustment" | "verification" | "system";
  isRead: boolean;
  link?: string | null;
  createdAt: string;
  readAt?: string | null;
};

export type NotificationListResponse = {
  items: BackendNotification[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export async function apiListNotifications(
  token: string,
  query = "page=1&pageSize=50",
): Promise<NotificationListResponse> {
  const suffix = query ? `?${query}` : "";
  return apiRequest<NotificationListResponse>(`/notifications${suffix}`, { token });
}

export async function apiGetUnreadCount(token: string): Promise<number> {
  const res = await apiRequest<{ count: number }>("/notifications/unread-count", { token });
  return res.count;
}

export async function apiMarkNotificationRead(token: string, id: string): Promise<void> {
  await apiRequest(`/notifications/${id}/read`, { method: "PATCH", token });
}

export async function apiMarkAllNotificationsRead(token: string): Promise<void> {
  await apiRequest("/notifications/read-all", { method: "PATCH", token });
}
