"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileSignature,
  Loader2,
  LockKeyhole,
  Pen,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { useLanguage } from "@/context/language-context";
import {
  apiGetAgreementById,
  apiLandlordSignAgreement,
  getAccessToken,
} from "@/lib/api";
import type { TenancyAgreement } from "@/lib/types";
import { ContractBody } from "@/components/dashboard/contract-body";
import { SignaturePad } from "@/components/dashboard/signature-pad";
import { exportCanvasSignaturePng } from "@/lib/procedural-signature";
import { Header } from "@/components/dashboard/header";

export default function BackendLandlordCounterSignPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { withLoading } = useLoading();
  const { locale, t } = useLanguage();
  const ct = (key: string) => t("contract", key);

  const [agreement, setAgreement] = useState<TenancyAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasReadContract, setHasReadContract] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contractScrollRef = useRef<HTMLDivElement>(null);

  const agreementId = String(params.id ?? "");

  const handleContractScroll = useCallback(() => {
    const el = contractScrollRef.current;
    if (!el) return;
    const pct = Math.round(
      (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100,
    );
    setScrollPct(Math.min(pct, 100));
    if (pct >= 90) setHasReadContract(true);
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !agreementId) {
      setLoading(false);
      return;
    }
    apiGetAgreementById(token, agreementId)
      .then(setAgreement)
      .finally(() => setLoading(false));
  }, [agreementId]);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (submitted) {
      const id = window.setTimeout(
        () => router.replace(`/dashboard/agreements/${agreementId}`),
        2000,
      );
      return () => window.clearTimeout(id);
    }
  }, [submitted, agreementId, router]);

  if (loading) {
    return (
      <>
        <Header title="Counter-Sign Contract" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </main>
      </>
    );
  }

  if (!agreement) {
    return (
      <>
        <Header title="Counter-Sign Contract" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-500">Agreement not found.</p>
        </main>
      </>
    );
  }

  if (user?.role !== "landlord" || user.id !== agreement.landlordId) {
    return (
      <>
        <Header title="Counter-Sign Contract" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-500">Only the property landlord can counter-sign.</p>
        </main>
      </>
    );
  }

  const canCounterSign =
    agreement.status === "draft" && !!agreement.tenantSignedAt;

  if (!canCounterSign) {
    return (
      <>
        <Header title="Counter-Sign Contract" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center max-w-md">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-700 font-medium">
              This agreement is not awaiting your counter-signature.
            </p>
            <Link
              href={`/dashboard/agreements/${agreementId}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to agreement
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <Header title="Counter-Sign Contract" />
        <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Counter-Signature Recorded!
            </h2>
            <p className="text-slate-600">
              Your e-signature has been recorded. The agreement has been forwarded to
              DARA for verification.
            </p>
          </div>
        </main>
      </>
    );
  }

  const handleSubmit = async () => {
    if (!agreed || !hasSig || !canvasRef.current) return;
    const token = getAccessToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await withLoading(async () => {
        exportCanvasSignaturePng(canvasRef.current!);
        await apiLandlordSignAgreement(token, agreementId);
      }, "Submitting your counter-signature…");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Counter-sign failed");
    } finally {
      setSubmitting(false);
    }
  };

  const advanceMonths =
    agreement.monthlyRent > 0
      ? agreement.advancePayment / agreement.monthlyRent
      : 2;

  return (
    <>
      <Header title="Counter-Sign Contract" />
      <main className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href={`/dashboard/agreements/${agreementId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to agreement
          </Link>

          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-semibold mb-3">
              <FileSignature className="w-4 h-4" />
              Landlord Counter-Signature
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {agreement.propertyTitle}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {agreement.tenantName} has signed. Read the contract and apply your
              e-signature to counter-sign.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="px-6 pt-3 pb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Reading progress
                </span>
                <span
                  className={`text-xs font-semibold ${hasReadContract ? "text-emerald-600" : "text-slate-400"}`}
                >
                  {hasReadContract ? "✓ Read" : `${scrollPct}%`}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${hasReadContract ? "bg-emerald-500" : "bg-primary-500"}`}
                  style={{ width: `${scrollPct}%` }}
                />
              </div>
              {!hasReadContract && (
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <ChevronDown className="w-3 h-3 animate-bounce" />
                  Scroll to the end of the contract to unlock signing
                </p>
              )}
            </div>

            <div
              ref={contractScrollRef}
              onScroll={handleContractScroll}
              className="px-8 py-6 max-h-[520px] overflow-y-auto scroll-smooth"
            >
              <ContractBody
                locale={locale}
                today={today}
                landlordName={agreement.landlordName}
                landlordAddress={agreement.propertyAddress}
                tenantName={agreement.tenantName}
                tenantAddress="Addis Ababa"
                propertyAddress={agreement.propertyAddress}
                propertyType="Residential"
                monthlyRent={agreement.monthlyRent.toLocaleString()}
                advanceMonths={Math.round(advanceMonths)}
                advanceAmount={agreement.advancePayment.toLocaleString()}
                leaseDuration={2}
                paymentDeadlineDay={5}
              />
            </div>
          </div>

          {!hasReadContract ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <LockKeyhole className="w-7 h-7 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Signing section locked</p>
              <p className="text-sm text-slate-500 mt-1">
                Scroll through the full contract to unlock counter-signing.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                    <Pen className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{ct("eSignTitle")}</h3>
                    <p className="text-xs text-slate-500">{ct("eSignDraw")}</p>
                  </div>
                </div>
                <SignaturePad canvasRef={canvasRef} onSigned={setHasSig} />
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-start gap-3 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                  <span>{ct("eSignLegal")}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <label className="flex items-start gap-3 cursor-pointer mb-6">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-primary-600"
                  />
                  <span className="text-sm text-slate-700 leading-relaxed">
                    I have reviewed the tenant&apos;s signature and agree to counter-sign
                    this agreement for DARA verification.
                  </span>
                </label>

                {error && (
                  <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/dashboard/agreements/${agreementId}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {ct("cancel")}
                  </Link>
                  <button
                    onClick={handleSubmit}
                    disabled={!agreed || !hasSig || submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-semibold px-6 py-3 rounded-xl"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {ct("submitting")}
                      </>
                    ) : (
                      <>
                        <FileSignature className="w-4 h-4" />
                        Counter-Sign & Submit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
