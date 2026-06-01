export type PaymentCompleteType = "agreement" | "rent";

export type PaymentMethodId =
  | "cbe_birr"
  | "telebirr"
  | "bank_transfer"
  | "mobile_money"
  | "cash"
  | "check"
  | "chapa";

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

/** Chapa appends trx_ref / tx_ref when redirecting back to CHAPA_RETURN_URL. */
export function parseChapaReturnTxRef(searchParams: URLSearchParams): string | null {
  return (
    searchParams.get("trx_ref") ??
    searchParams.get("tx_ref") ??
    searchParams.get("reference") ??
    null
  );
}

export function isChapaReturn(searchParams: URLSearchParams): boolean {
  return Boolean(parseChapaReturnTxRef(searchParams));
}

export function parsePaymentCompleteParams(
  searchParams: URLSearchParams,
): PaymentCompleteParams | null {
  const txRef = parseChapaReturnTxRef(searchParams);
  if (txRef) {
    const stashed = readPendingPayment();
    return {
      type: (searchParams.get("type") as PaymentCompleteType) ?? stashed?.type ?? "rent",
      paymentId: searchParams.get("paymentId") ?? stashed?.paymentId,
      agreementId: searchParams.get("agreementId") ?? stashed?.agreementId,
      method: "chapa",
      reference: txRef,
      amount: searchParams.get("amount")
        ? Number(searchParams.get("amount"))
        : stashed?.amount,
      propertyTitle: searchParams.get("propertyTitle") ?? stashed?.propertyTitle,
    };
  }

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
  if (params.method === "chapa" && params.reference) {
    return null;
  }
  if (params.type === "agreement" && !params.agreementId) {
    return "Missing agreement ID for agreement payment.";
  }
  if (params.type === "rent" && !params.paymentId && params.method !== "chapa") {
    return "Missing payment ID for rent payment.";
  }
  return null;
}
