"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2, Eye, EyeOff, UserPlus, Home, User, Globe,
  Heart, MapPin, ArrowLeft, ShieldX, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { properties } from "@/lib/dummy-data";
import type { UserRole } from "@/lib/types";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  role?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(\+2519\d{8}|09\d{8}|07\d{8})$/;
const NAME_RE  = /^[A-Za-zÀ-öø-ÿ\u1200-\u137F ]{2,}$/;

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "", color: "" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-yellow-400" },
    { label: "Strong", color: "bg-emerald-500" },
  ];
  return { score, ...map[score] };
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="w-3 h-3 shrink-0" />{msg}
    </p>
  );
}

function inputCls(err?: string) {
  return `w-full px-3.5 py-2.5 rounded-lg border ${err ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20" : "border-slate-300 focus:border-primary-500 focus:ring-primary-500/20"} focus:ring-2 outline-none transition-all text-sm`;
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale, setLocale } = useLanguage();
  const { register } = useAuth();
  const { withLoading } = useLoading();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const roleParam      = searchParams.get("role");
  const propertyIdParam = searchParams.get("propertyId");

  const initialRole: UserRole | "" =
    roleParam === "tenant" || roleParam === "landlord" ? (roleParam as UserRole) : "";

  const selectedProperty = useMemo(
    () => (propertyIdParam ? properties.find((p) => p.id === propertyIdParam) : null),
    [propertyIdParam]
  );

  const resolvedInitialRole: UserRole | "" =
    initialRole || (selectedProperty ? "tenant" : "");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">(resolvedInitialRole);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "",
  });

  const roles = [
    { value: "tenant" as UserRole,   labelKey: "tenantRole",   icon: User, descKey: "tenantRoleDesc" },
    { value: "landlord" as UserRole, labelKey: "landlordRole", icon: Home, descKey: "landlordRoleDesc" },
  ];

  const isLandlordWithRentIntent = selectedRole === "landlord" && !!selectedProperty;
  const pwStrength = passwordStrength(formData.password);

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!selectedRole) e.role = "Please select a role to continue.";
    if (!NAME_RE.test(formData.firstName.trim()))
      e.firstName = "Enter a valid first name (letters only, min 2 characters).";
    if (!NAME_RE.test(formData.lastName.trim()))
      e.lastName = "Enter a valid last name (letters only, min 2 characters).";
    if (!EMAIL_RE.test(formData.email.trim()))
      e.email = "Enter a valid email address (e.g. name@example.com).";
    if (!PHONE_RE.test(formData.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid Ethiopian phone number (e.g. +251912345678 or 0912345678).";
    if (formData.password.length < 8)
      e.password = "Password must be at least 8 characters.";
    else if (pwStrength.score < 2)
      e.password = "Password is too weak — add uppercase letters or numbers.";
    if (formData.confirmPassword !== formData.password)
      e.confirmPassword = "Passwords do not match.";
    if (!termsAccepted)
      e.terms = "You must accept the terms and conditions.";
    return e;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (isLandlordWithRentIntent) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    await withLoading(async () => {
      await register(
        selectedRole as UserRole,
        formData.firstName.trim(),
        formData.lastName.trim(),
        formData.email.trim(),
        formData.password,
        formData.phone.trim()
      );
    }, "Creating your account…");

    if (selectedRole === "tenant" && selectedProperty) {
      router.push(`/dashboard/verify-fayda?propertyId=${selectedProperty.id}`);
      return;
    }
    if (selectedRole === "tenant") {
      router.push("/dashboard/verify-fayda");
      return;
    }
    router.push("/dashboard");
  };

  // Re-validate on change once the user has attempted submit
  const field = (key: keyof typeof formData, value: string) => {
    const next = { ...formData, [key]: value };
    setFormData(next);
    if (submitted) {
      const errs = validate();
      setErrors(errs);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-5/12 bg-primary-700 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWNkgyVjRoMzR6TTIgNTBoMzR2Mkgydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10 max-w-md text-white">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold mb-4">{t("auth", "registerSideTitle")}</h2>
          <p className="text-primary-100 leading-relaxed mb-8">{t("auth", "registerSideDesc")}</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-4">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 gap-3">
            <Link
              href={selectedProperty ? "/explore" : "/"}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {selectedProperty ? t("landing", "explore") : t("explore", "backToHome")}
            </Link>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">{t("landing", "brand")}{t("landing", "brandAccent")}</span>
            </div>
            <button
              onClick={() => setLocale(locale === "en" ? "am" : "en")}
              className="text-sm font-medium text-slate-700 hover:text-primary-600 px-3 py-1.5 border border-slate-200 rounded-lg flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" />{locale === "en" ? "አማርኛ" : "English"}
            </button>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("auth", "createAccount")}</h1>
          <p className="text-slate-500 mb-6">{t("auth", "registerSubtitle")}</p>

          {/* Property intent card */}
          {selectedProperty && (
            <div className="mb-6 rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-indigo-50 p-4 flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <Heart className="w-7 h-7 text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">
                  {t("explore", "rentThisHome")}
                </div>
                <div className="font-semibold text-slate-900 truncate">{selectedProperty.title}</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{selectedProperty.subCity} · {selectedProperty.address}</span>
                </div>
                <div className="text-sm font-semibold text-primary-700 mt-1">
                  {selectedProperty.monthlyRent.toLocaleString()} ETB{t("explore", "perMonth")}
                </div>
              </div>
              <Link href="/explore" className="text-xs font-medium text-slate-500 hover:text-primary-700 shrink-0">
                Change
              </Link>
            </div>
          )}

          {/* Role selection */}
          <div className="grid grid-cols-2 gap-3 mb-1">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => { setSelectedRole(role.value); if (submitted) setErrors(validate()); }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedRole === role.value
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <role.icon className={`w-6 h-6 mb-2 ${selectedRole === role.value ? "text-primary-600" : "text-slate-400"}`} />
                <p className={`font-semibold text-sm ${selectedRole === role.value ? "text-primary-700" : "text-slate-700"}`}>
                  {t("auth", role.labelKey)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{t("auth", role.descKey)}</p>
              </button>
            ))}
          </div>
          {submitted && errors.role && <FieldError msg={errors.role} />}

          {/* Landlord rent block */}
          {isLandlordWithRentIntent && (
            <div className="mt-4 mb-2 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <ShieldX className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Landlords cannot rent a property</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Your rental session is paused. Switch back to <strong>Tenant</strong> to continue.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-5" noValidate>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("auth", "firstName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => field("firstName", e.target.value)}
                  className={inputCls(errors.firstName)}
                  placeholder="Tigist"
                  autoComplete="given-name"
                />
                <FieldError msg={errors.firstName} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("auth", "lastName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => field("lastName", e.target.value)}
                  className={inputCls(errors.lastName)}
                  placeholder="Haile"
                  autoComplete="family-name"
                />
                <FieldError msg={errors.lastName} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("auth", "email")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => field("email", e.target.value)}
                  className={inputCls(errors.email) + " pr-8"}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {formData.email && !errors.email && EMAIL_RE.test(formData.email.trim()) && (
                  <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                )}
                {formData.email && errors.email && (
                  <XCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400 pointer-events-none" />
                )}
              </div>
              <FieldError msg={errors.email} />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("auth", "phone")} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => field("phone", e.target.value)}
                className={inputCls(errors.phone)}
                placeholder="+251 912 345 678"
                autoComplete="tel"
              />
              <FieldError msg={errors.phone} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("auth", "password")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => field("password", e.target.value)}
                  className={inputCls(errors.password) + " pr-10"}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {formData.password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          pwStrength.score >= s ? pwStrength.color : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    pwStrength.score <= 1 ? "text-red-600" :
                    pwStrength.score === 2 ? "text-amber-600" :
                    pwStrength.score === 3 ? "text-yellow-600" : "text-emerald-600"
                  }`}>
                    {pwStrength.label && `Password strength: ${pwStrength.label}`}
                  </p>
                </div>
              )}
              <FieldError msg={errors.password} />
              {!errors.password && (
                <p className="mt-1 text-xs text-slate-400">
                  Use 8+ characters with uppercase letters and numbers.
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("auth", "confirmPassword")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => field("confirmPassword", e.target.value)}
                  className={inputCls(errors.confirmPassword) + " pr-10"}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password && formData.confirmPassword === formData.password && (
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
              <FieldError msg={errors.confirmPassword} />
            </div>

            {/* Terms */}
            <div>
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (submitted) setErrors((prev) => ({ ...prev, terms: e.target.checked ? undefined : "You must accept the terms and conditions." }));
                  }}
                  className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="terms" className="text-xs text-slate-500 cursor-pointer">
                  {t("auth", "terms")}
                </label>
              </div>
              <FieldError msg={errors.terms} />
            </div>

            <button
              type="submit"
              disabled={isLandlordWithRentIntent}
              className={`w-full font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                !isLandlordWithRentIntent
                  ? "bg-primary-600 hover:bg-primary-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <UserPlus className="w-4 h-4" />{t("auth", "createButton")}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {t("auth", "hasAccount")}{" "}
            <Link
              href={propertyIdParam ? `/login?propertyId=${propertyIdParam}` : "/login"}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t("auth", "signInLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <RegisterPageInner />
    </Suspense>
  );
}
