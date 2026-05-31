"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { properties } from "@/lib/dummy-data";
import {
  confirmFaydaCode,
  FAYDA_DEMO_CODE,
  requestFaydaVerification,
  type FaydaPersonalInfo,
  type FaydaRequestResult,
} from "@/lib/fayda-api";
import {
  compareFaydaNamesToAccount,
  formatNameMismatchMessage,
  getRegisteredNameSnapshot,
} from "@/lib/fayda-account-name";
import { formatErrorForUser, getErrorMessage } from "@/lib/api-error";
import { resolvePostFaydaPath } from "@/lib/onboarding-paths";

type Step = "info" | "otp" | "done";

const OTP_LENGTH = 6;

function VerifyFaydaInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { user, applyFaydaVerification } = useAuth();
  const { withLoading } = useLoading();

  const fromRegistration = searchParams.get("from") === "register";
  const propertyId = searchParams.get("propertyId");
  const nextHref = useMemo(() => {
    if (propertyId && user?.role === "tenant") {
      return `/dashboard/properties/${propertyId}`;
    }
    const requested = searchParams.get("next");
    if (requested && requested.startsWith("/dashboard")) {
      return requested;
    }
    return resolvePostFaydaPath(user?.role);
  }, [propertyId, searchParams, user?.role]);

  const property = useMemo(
    () => (propertyId ? properties.find((p) => p.id === propertyId) ?? null : null),
    [propertyId]
  );

  const [step, setStep] = useState<Step>(user?.faydaVerified ? "done" : "info");

  const [info, setInfo] = useState<FaydaPersonalInfo>({
    firstName: user?.firstName ?? "",
    fatherName: user?.fatherName ?? user?.lastName ?? "",
    grandfatherName: user?.grandfatherName ?? "",
    faydaNumber: user?.faydaNumber ?? "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, setRequest] = useState<FaydaRequestResult | null>(null);
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const registeredNames = useMemo(
    () => (user ? getRegisteredNameSnapshot(user) : null),
    [user],
  );

  const nameMismatches = useMemo(() => {
    if (!user) return [];
    return compareFaydaNamesToAccount(info, user);
  }, [info, user]);

  const assertAccountNamesMatch = useCallback((): boolean => {
    if (!user) return true;
    const mismatches = compareFaydaNamesToAccount(info, user);
    if (mismatches.length === 0) {
      return true;
    }
    setError(formatNameMismatchMessage(mismatches, (key) => t("fayda", key)));
    return false;
  }, [info, user, t]);

  /** Fayda verification is only shown during registration, not after login. */
  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.faydaVerified) {
      router.replace(nextHref);
      return;
    }
    if (!fromRegistration) {
      router.replace("/dashboard");
    }
  }, [user, user?.faydaVerified, fromRegistration, router, nextHref]);

  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;
    const id = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [step, secondsLeft]);

  useEffect(() => {
    if (step === "otp") otpRefs.current[0]?.focus();
  }, [step]);

  useEffect(() => {
    if (step === "done") {
      const id = window.setTimeout(() => router.replace(nextHref), 1500);
      return () => window.clearTimeout(id);
    }
  }, [step, router, nextHref]);

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!assertAccountNamesMatch()) return;
    setSubmitting(true);
    try {
      await withLoading(async () => {
        const result = await requestFaydaVerification(info);
        setRequest(result);
        setSecondsLeft(result.expiresInSeconds);
        setCode(Array(OTP_LENGTH).fill(""));
        setStep("otp");
      }, "Contacting Fayda API…");
    } catch (err) {
      setError(resolveVerifyError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoOtp = () => {
    setCode(FAYDA_DEMO_CODE.split(""));
    setError(null);
    otpRefs.current[OTP_LENGTH - 1]?.focus();
  };

  const handleOtpChange = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (text.length >= OTP_LENGTH) {
      e.preventDefault();
      const arr = text.slice(0, OTP_LENGTH).split("");
      setCode(arr);
      otpRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    setError(null);
    if (!assertAccountNamesMatch()) return;
    const fullCode = code.join("");
    if (fullCode.length !== OTP_LENGTH) {
      setError(t("fayda", "errIncompleteCode"));
      return;
    }
    setSubmitting(true);
    try {
      await withLoading(async () => {
        const result = await confirmFaydaCode(request.otpId, fullCode, info);
        await applyFaydaVerification(result, fullCode);
        setStep("done");
      }, "Verifying your identity…");
    } catch (err) {
      setError(resolveVerifyError(err, t));
      setCode(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    if (!assertAccountNamesMatch()) return;
    setSubmitting(true);
    try {
      await withLoading(async () => {
        const result = await requestFaydaVerification(info);
        setRequest(result);
        setSecondsLeft(result.expiresInSeconds);
        setCode(Array(OTP_LENGTH).fill(""));
        otpRefs.current[0]?.focus();
      }, "Resending verification code…");
    } catch (err) {
      setError(resolveVerifyError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(
    1,
    "0"
  )}:${String(secondsLeft % 60).padStart(2, "0")}`;

  if (
    !user ||
    user.faydaVerified ||
    !fromRegistration
  ) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-to-br from-stone-50 via-white to-primary-50/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("fayda", "back")}
        </Link>

        <header className="mb-8">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4" />
            {t("fayda", "kicker")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
            {t("fayda", "title")}
          </h1>
          <p className="text-stone-600 mt-2 max-w-2xl leading-relaxed">
            {t("fayda", "subtitle")}
          </p>
        </header>

        {property && (
          <div className="mb-8 rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-primary-50 p-4 flex items-start gap-4">
            {property.images[0] ? (
              <img
                src={property.images[0]}
                alt=""
                className="w-20 h-20 rounded-xl object-cover shrink-0 border border-primary-200 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-600 to-primary-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">
                {t("fayda", "rentingThis")}
              </div>
              <div className="font-semibold text-stone-900 truncate">
                {property.title}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">
                  {property.subCity} · {property.address}
                </span>
              </div>
              <div className="text-sm font-semibold text-primary-700 mt-1">
                {property.monthlyRent.toLocaleString()} ETB{t("explore", "perMonth")}
              </div>
            </div>
          </div>
        )}

        {/* Stepper */}
        <ol className="grid grid-cols-3 gap-2 mb-8">
          {[
            { id: "info", label: t("fayda", "stepInfo"), icon: User },
            { id: "otp", label: t("fayda", "stepOtp"), icon: Fingerprint },
            { id: "done", label: t("fayda", "stepDone"), icon: CheckCircle2 },
          ].map((s, idx) => {
            const order: Step[] = ["info", "otp", "done"];
            const currentIdx = order.indexOf(step);
            const isActive = order[idx] === step;
            const isComplete = idx < currentIdx;
            const Icon = s.icon;
            return (
              <li
                key={s.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-stone-200 bg-white text-stone-500"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-primary-600 text-white"
                      : isComplete
                        ? "bg-emerald-500 text-white"
                        : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </span>
                <span className="truncate">{s.label}</span>
              </li>
            );
          })}
        </ol>

        {step === "info" && (
          <form
            onSubmit={handleSubmitInfo}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-5"
          >
            <h2 className="text-lg font-bold text-stone-900">
              {t("fayda", "infoFormTitle")}
            </h2>
            <p className="text-sm text-stone-600">
              {t("fayda", "infoFormDesc")}
            </p>
            {registeredNames && (
              <p className="text-sm text-stone-700 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                {t("fayda", "infoFormAccountNames")
                  .replace("{firstName}", registeredNames.firstName)
                  .replace("{fatherName}", registeredNames.fatherName)}
              </p>
            )}

            {nameMismatches.length > 0 && (
              <div
                role="alert"
                className="rounded-xl border border-amber-300 bg-amber-50 text-amber-950 px-4 py-3 text-sm space-y-1"
              >
                <p className="font-semibold">{t("fayda", "nameMismatchTitle")}</p>
                <p className="text-xs leading-relaxed">
                  {formatNameMismatchMessage(nameMismatches, (key) =>
                    t("fayda", key),
                  )}
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-4">
              <Field
                label={t("fayda", "firstName")}
                value={info.firstName}
                onChange={(v) => {
                  setInfo({ ...info, firstName: v });
                  setError(null);
                }}
                placeholder={t("fayda", "firstNamePlaceholder")}
                required
              />
              <Field
                label={t("fayda", "fatherName")}
                value={info.fatherName}
                onChange={(v) => {
                  setInfo({ ...info, fatherName: v });
                  setError(null);
                }}
                placeholder={t("fayda", "fatherNamePlaceholder")}
                required
              />
              <Field
                label={t("fayda", "grandfatherName")}
                value={info.grandfatherName}
                onChange={(v) => setInfo({ ...info, grandfatherName: v })}
                placeholder={t("fayda", "grandfatherNamePlaceholder")}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("fayda", "faydaNumber")}
              </label>
              <div className="relative">
                <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatFan(info.faydaNumber)}
                  onChange={(e) =>
                    setInfo({
                      ...info,
                      faydaNumber: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 16),
                    })
                  }
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full pl-11 pr-3.5 py-3 rounded-xl border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-base font-mono tracking-wider"
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-stone-500">
                {t("fayda", "faydaNumberHint")}
              </p>
              <p className="mt-2 text-xs text-stone-500">
                {t("fayda", "demoFanHint")}
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || nameMismatches.length > 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("fayda", "submitting")}
                </>
              ) : (
                <>
                  {t("fayda", "sendCode")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-stone-400 leading-relaxed">
              {t(
                "fayda",
                user?.role === "landlord" ? "consentLandlord" : "consent",
              )}
            </p>
          </form>
        )}

        {step === "otp" && request && (
          <form
            onSubmit={handleConfirmOtp}
            className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8"
          >
            <h2 className="text-lg font-bold text-stone-900">
              {t("fayda", "otpTitle")}
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              {t("fayda", "otpDesc")}{" "}
              <span className="font-semibold text-stone-900">
                {request.maskedPhone}
              </span>
            </p>

            <div className="rounded-xl border border-stone-200 bg-stone-50 text-stone-700 px-3 py-3 mt-4 space-y-2">
              <p className="text-xs leading-relaxed">{t("fayda", "demoCodeHint")}</p>
              <button
                type="button"
                onClick={fillDemoOtp}
                className="text-xs font-semibold text-primary-700 underline underline-offset-2 hover:text-primary-800"
              >
                {t("fayda", "demoOtpFill")} ({FAYDA_DEMO_CODE})
              </button>
            </div>

            <div className="flex justify-center gap-2 sm:gap-3 mt-6">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(idx, e)}
                  onPaste={handleOtpPaste}
                  className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 border-stone-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              ))}
            </div>

            <div className="text-center text-xs text-stone-500 mt-3">
              {secondsLeft > 0 ? (
                <>{t("fayda", "expiresIn")} {formattedTime}</>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={submitting}
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  {t("fayda", "resend")}
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm mt-4">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep("info")}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("fayda", "editInfo")}
              </button>
              <button
                type="submit"
                disabled={submitting || code.join("").length !== OTP_LENGTH}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("fayda", "verifying")}
                  </>
                ) : (
                  <>
                    {t("fayda", "verifyAndContinue")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">
              {t("fayda", "successTitle")}
            </h2>
            <p className="text-stone-600 mt-2 max-w-md mx-auto">
              {t("fayda", "successDesc")}
            </p>
            <Link
              href={nextHref}
              className="inline-flex items-center gap-2 mt-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {property
                ? t("fayda", "continueToProperty")
                : t("fayda", "continueToDashboard")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
      />
    </div>
  );
}

function formatFan(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function mapFaydaError(code: string): string {
  switch (code) {
    case "invalid_first_name":
      return "errInvalidFirstName";
    case "invalid_father_name":
      return "errInvalidFatherName";
    case "invalid_grandfather_name":
      return "errInvalidGrandfatherName";
    case "invalid_fayda_number":
      return "errInvalidFaydaNumber";
    case "incorrect_code":
      return "errIncorrectCode";
    case "invalid_code_format":
      return "errIncompleteCode";
    case "invalid_session":
      return "errSessionExpired";
    default:
      return "errGeneric";
  }
}

function resolveVerifyError(
  err: unknown,
  t: (namespace: "fayda" | "common" | "auth", key: string) => string,
): string {
  const raw = getErrorMessage(err);
  const mapped = mapFaydaError(raw);
  if (mapped !== "errGeneric") {
    return t("fayda", mapped);
  }
  return formatErrorForUser(err, (ns, key) =>
    t(ns as "fayda" | "common" | "auth", key),
  ).message;
}

export default function VerifyFaydaPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        </main>
      }
    >
      <VerifyFaydaInner />
    </Suspense>
  );
}
