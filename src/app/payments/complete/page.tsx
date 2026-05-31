"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Home,
  Loader2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  apiConfirmAgreementPayment,
  apiGetAgreementById,
  apiGetRentPaymentById,
  apiVerifyChapaPayment,
  getAccessToken,
} from "@/lib/api";
import {
  clearPendingPayment,
  isChapaReturn,
  parseChapaReturnTxRef,
  parsePaymentCompleteParams,
  validatePaymentCompleteParams,
  type PaymentCompleteParams,
} from "@/lib/payment-flow";
import { formatCurrency } from "@/lib/utils";

type PageState =
  | { phase: "loading" }
  | {
      phase: "success";
      params: PaymentCompleteParams;
      reference: string;
      propertyTitle: string;
      amount?: number;
      agreementActive?: boolean;
    }
  | { phase: "error"; message: string; params: PaymentCompleteParams | null };

function methodLabel(method: string) {
  switch (method) {
    case "cbe_birr":
      return "CBE Birr";
    case "telebirr":
      return "Telebirr";
    case "bank_transfer":
      return "Bank transfer";
    case "mobile_money":
      return "Mobile money";
    case "cash":
      return "Cash";
    case "check":
      return "Check";
    case "chapa":
      return "Chapa";
    default:
      return method.replace(/_/g, " ");
  }
}

function PaymentCompleteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<PageState>({ phase: "loading" });
  const ran = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = `/payments/complete?${searchParams.toString()}`;
      router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (ran.current) return;
    ran.current = true;

    const params = parsePaymentCompleteParams(searchParams);
    const validationError = params ? validatePaymentCompleteParams(params) : null;

    if (!params || validationError) {
      setState({
        phase: "error",
        message: validationError ?? "Invalid or missing payment details.",
        params,
      });
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setState({
        phase: "error",
        message: "You must be signed in to complete this payment.",
        params,
      });
      return;
    }

    (async () => {
      try {
        const chapaTxRef = parseChapaReturnTxRef(searchParams);
        const isChapa = params.method === "chapa" || isChapaReturn(searchParams);

        if (isChapa && chapaTxRef) {
          const verify = await apiVerifyChapaPayment(token, chapaTxRef);
          clearPendingPayment();

          if (verify.verified && verify.payment) {
            const isAgreement = params.type === "agreement";
            let agreementActive = false;
            if (isAgreement && params.agreementId) {
              const agreement = await apiGetAgreementById(token, params.agreementId);
              agreementActive = agreement.status === "active";
            }

            setState({
              phase: "success",
              params: { ...params, method: "chapa", reference: chapaTxRef },
              reference: verify.payment.reference ?? chapaTxRef,
              propertyTitle: verify.payment.propertyTitle,
              amount: Number(verify.payment.amount),
              agreementActive: isAgreement ? agreementActive : undefined,
            });
            return;
          }

          if (verify.payment?.status === "paid") {
            const isAgreement = params.type === "agreement";
            let agreementActive = false;
            if (isAgreement && params.agreementId) {
              const agreement = await apiGetAgreementById(token, params.agreementId);
              agreementActive = agreement.status === "active";
            }

            setState({
              phase: "success",
              params: { ...params, method: "chapa", reference: chapaTxRef },
              reference: verify.payment.reference ?? chapaTxRef,
              propertyTitle: verify.payment.propertyTitle,
              amount: verify.payment.amount,
              agreementActive: isAgreement ? agreementActive : undefined,
            });
            return;
          }

          setState({
            phase: "error",
            message:
              verify.chapaStatus === "pending"
                ? "Payment is still processing. Please wait a moment and refresh, or check your Chapa receipt."
                : "Chapa could not verify this payment. If you were charged, contact support with reference: " +
                  chapaTxRef,
            params,
          });
          return;
        }

        if (params.type === "agreement") {
          const agreementId = params.agreementId!;
          const existing = await apiGetAgreementById(token, agreementId);

          if (existing.status === "active") {
            clearPendingPayment();
            setState({
              phase: "success",
              params,
              reference: params.reference ?? "—",
              propertyTitle: params.propertyTitle ?? existing.propertyTitle,
              amount: params.amount ?? existing.advancePayment,
              agreementActive: true,
            });
            return;
          }

          const reference =
            params.reference ??
            `PAY-${Date.now().toString(36).toUpperCase()}`;

          await apiConfirmAgreementPayment(token, agreementId, {
            method: params.method,
            reference,
          });

          clearPendingPayment();
          setState({
            phase: "success",
            params,
            reference,
            propertyTitle: params.propertyTitle ?? existing.propertyTitle,
            amount: params.amount ?? existing.advancePayment,
            agreementActive: true,
          });
          return;
        }

        if (params.paymentId) {
          const paymentId = params.paymentId;
          const existing = await apiGetRentPaymentById(token, paymentId);

          if (existing.status === "paid") {
            clearPendingPayment();
            setState({
              phase: "success",
              params,
              reference: existing.reference ?? params.reference ?? "—",
              propertyTitle: params.propertyTitle ?? existing.propertyTitle,
              amount: params.amount ?? existing.amount,
            });
            return;
          }
        }

        setState({
          phase: "error",
          message: "Could not confirm this payment. Please try paying again from the payments page.",
          params,
        });
      } catch (err) {
        setState({
          phase: "error",
          message:
            err instanceof Error ? err.message : "Payment confirmation failed.",
          params,
        });
      }
    })();
  }, [isAuthenticated, router, searchParams]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (state.phase === "loading") {
    return (
      <div className="min-h-screen bg-surface-muted flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
          <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
        </div>
        <h1 className="text-xl font-semibold text-stone-900 mb-2">
          Confirming your payment…
        </h1>
        <p className="text-sm text-stone-500 max-w-sm">
          Please wait while we verify your transaction and update your account.
        </p>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="min-h-screen bg-surface-muted flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-surface-elevated rounded-xl border border-stone-200/80 shadow-sm p-8 text-center">
          <XCircle className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-stone-900 mb-2">
            Payment could not be completed
          </h1>
          <p className="text-sm text-stone-600 mb-6">{state.message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/payments"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold transition-colors"
            >
              Back to payments
            </Link>
            {state.params?.type === "agreement" && state.params.agreementId && (
              <Link
                href={`/dashboard/agreements/${state.params.agreementId}`}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-sm font-semibold hover:bg-stone-50 transition-colors"
              >
                View agreement
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isAgreement = state.params.type === "agreement";

  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-surface-elevated rounded-xl border border-stone-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-5 bg-primary-700 text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-primary-100">Payment successful</p>
              <h1 className="text-lg font-bold tracking-tight">
                {isAgreement ? "Advance rent paid" : "Rent payment confirmed"}
              </h1>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-stone-500">Property</span>
                <span className="font-medium text-stone-900 text-right">
                  {state.propertyTitle}
                </span>
              </div>
              {state.amount != null && (
                <div className="flex justify-between gap-4">
                  <span className="text-stone-500">Amount</span>
                  <span className="font-bold text-stone-900">
                    {formatCurrency(state.amount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-stone-500">Method</span>
                <span className="font-medium text-stone-900">
                  {methodLabel(state.params.method)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-500">Reference</span>
                <span className="font-mono text-xs text-stone-800 text-right break-all">
                  {state.reference}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-500">Paid by</span>
                <span className="font-medium text-stone-900">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              {isAgreement
                ? "Your advance rent has been received. The tenancy agreement is now active and the property has been marked as rented."
                : "Your monthly rent payment has been recorded. The landlord has been notified."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {isAgreement ? (
                <Link
                  href={`/dashboard/agreements/${state.params.agreementId}`}
                  className="inline-flex items-center justify-center gap-2 flex-1 px-5 py-2.5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold transition-colors"
                >
                  <Home className="w-4 h-4" />
                  View agreement
                </Link>
              ) : (
                <Link
                  href="/dashboard/payments"
                  className="inline-flex items-center justify-center gap-2 flex-1 px-5 py-2.5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Payment history
                </Link>
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 flex-1 px-5 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-sm font-semibold hover:bg-stone-50 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-muted flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      }
    >
      <PaymentCompleteInner />
    </Suspense>
  );
}
