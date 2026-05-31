export type PaymentCompleteType = "agreement" | "rent";

export type PaymentMethodId =
  | "cbe_birr"
  | "telebirr"
  | "bank_transfer"
  | "mobile_money"
  | "cash"
  | "check";

export type PaymentCompleteParams = {
  type: PaymentCompleteType;
  agreementId?: string;
  paymentId?: string;
  method: PaymentMethodId;
  reference?: string;
  amount?: number;
  propertyTitle?: string;
};

const PENDING_PAYMENT_KEY = "pending_payment_context";

export function buildPaymentCompleteUrl(params: PaymentCompleteParams): string {
  const q = new URLSearchParams();
  q.set("type", params.type);
  if (params.agreementId) q.set("agreementId", params.agreementId);
  if (params.paymentId) q.set("paymentId", params.paymentId);
  q.set("method", params.method);
  if (params.reference) q.set("reference", params.reference);
  if (params.amount != null) q.set("amount", String(params.amount));
  if (params.propertyTitle) q.set("propertyTitle", params.propertyTitle);
  return `/payments/complete?${q.toString()}`;
}

export function stashPendingPayment(params: PaymentCompleteParams) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(params));
}

export function readPendingPayment(): PaymentCompleteParams | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PaymentCompleteParams;
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_PAYMENT_KEY);
}

export function parsePaymentCompleteParams(
  searchParams: URLSearchParams,
): PaymentCompleteParams | null {
  const type = searchParams.get("type");
  if (type !== "agreement" && type !== "rent") {
    const stashed = readPendingPayment();
    if (stashed) return stashed;
    return null;
  }

  const method = searchParams.get("method");
  if (!method) return null;

  return {
    type,
    agreementId: searchParams.get("agreementId") ?? undefined,
    paymentId: searchParams.get("paymentId") ?? undefined,
    method: method as PaymentMethodId,
    reference: searchParams.get("reference") ?? undefined,
    amount: searchParams.get("amount")
      ? Number(searchParams.get("amount"))
      : undefined,
    propertyTitle: searchParams.get("propertyTitle") ?? undefined,
  };
}

export function validatePaymentCompleteParams(
  params: PaymentCompleteParams,
): string | null {
  if (params.type === "agreement" && !params.agreementId) {
    return "Missing agreement ID for agreement payment.";
  }
  if (params.type === "rent" && !params.paymentId) {
    return "Missing payment ID for rent payment.";
  }
  return null;
}
