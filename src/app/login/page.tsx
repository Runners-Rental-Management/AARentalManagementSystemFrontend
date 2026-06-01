"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  LogIn,
  Globe,
  User,
  Home,
  ArrowLeft,
  MapPin,
  Heart,
  ShieldX,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { useAlert } from "@/context/alert-context";
import { properties } from "@/lib/dummy-data";
import type { UserRole } from "@/lib/types";

const LOGIN_ROLES: {
  value: UserRole;
  labelKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    value: "tenant",
    labelKey: "tenantRole",
    descKey: "tenantRoleDesc",
    icon: User,
    color: "blue",
  },
  {
    value: "landlord",
    labelKey: "landlordRole",
    descKey: "landlordRoleDesc",
    icon: Home,
    color: "emerald",
  },
];

const COLOR_MAP: Record<
  string,
  { border: string; bg: string; text: string; icon: string }
> = {
  blue: {
    border: "border-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: "text-blue-600",
  },
  emerald: {
    border: "border-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "text-emerald-600",
  },
};

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale, setLocale } = useLanguage();
  const { login, isAuthenticated } = useAuth();
  const { withLoading } = useLoading();
  const { showError } = useAlert();
  const [showPassword, setShowPassword] = useState(false);

  const returnUrl = searchParams.get("returnUrl");
  const safeReturnUrl =
    returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//")
      ? returnUrl
      : null;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(safeReturnUrl ?? "/dashboard");
    }
  }, [isAuthenticated, router, safeReturnUrl]);

  const propertyIdParam = searchParams.get("propertyId");
  const roleParam = searchParams.get("role");

  const selectedProperty = useMemo(
    () =>
      propertyIdParam ? properties.find((p) => p.id === propertyIdParam) : null,
    [propertyIdParam],
  );

  const roleFromUrl: UserRole | "" =
    roleParam === "tenant" || roleParam === "landlord" ? roleParam : "";
  const initialRole: UserRole | "" =
    roleFromUrl || (selectedProperty ? "tenant" : "");
  const [selectedRole, setSelectedRole] = useState<UserRole | "">(initialRole);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const isLandlordWithRentIntent =
    selectedRole === "landlord" && !!selectedProperty;
  const isBlockedRole = selectedRole === "landlord" && !!selectedProperty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedRole || isBlockedRole) {
      setFormError(t("auth", "selectRole"));
      return;
    }
    const email = formData.email.trim();
    const password = formData.password;
    if (!email) {
      setFormError(t("auth", "emailRequired"));
      return;
    }
    if (password.length < 8) {
      setFormError(t("auth", "passwordMinLength"));
      return;
    }
    try {
      const signedInUser = await withLoading(async () => {
        return login({ role: selectedRole, email, password });
      }, "Signing in…");

      if (selectedProperty && signedInUser.role === "tenant") {
        router.push(`/dashboard/properties/${selectedProperty.id}`);
        return;
      }
      router.push(safeReturnUrl ?? "/dashboard");
    } catch (err) {
      showError(err, (ns, key) => t(ns as "auth" | "common", key), {
        titleKey: "loginFailed",
        namespace: "auth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end justify-start p-12">
        <img
          src="/addis-ababa-skyline.png"
          alt="Addis Ababa skyline"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/85 via-stone-900/40 to-stone-900/20" />
        <div className="relative z-10 max-w-md text-white">
          <div
            className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20"
            suppressHydrationWarning
          >
            <Building2 className="w-8 h-8" suppressHydrationWarning />
          </div>
          <h2 className="text-3xl font-bold mb-3 drop-shadow-lg">
            {t("auth", "loginSideTitle")}
          </h2>
          <p className="text-white/80 leading-relaxed text-sm drop-shadow">
            {t("auth", "loginSideDesc")}
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-8 gap-3">
            <Link
              href={selectedProperty ? "/explore" : "/"}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {selectedProperty
                ? t("landing", "explore")
                : t("explore", "backToHome")}
            </Link>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">
                {t("landing", "brand")}
                {t("landing", "brandAccent")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocale(locale === "en" ? "am" : "en")}
                className="text-sm font-medium text-stone-700 hover:text-primary-600 px-3 py-1.5 border border-stone-200 rounded-lg flex items-center gap-1.5"
              >
                <Globe className="w-4 h-4" />
                {locale === "en" ? "አማርኛ" : "English"}
              </button>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-stone-900 mb-2">
            {t("auth", "welcomeBack")}
          </h1>
          <p className="text-stone-500 mb-6">{t("auth", "selectRole")}</p>

          {/* Property card shown when arriving from "Rent this home" */}
          {selectedProperty && (
            <div className="mb-6 rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-primary-50 p-4 flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-600 to-primary-600 flex items-center justify-center shrink-0 shadow-sm">
                <Heart className="w-7 h-7 text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">
                  {t("explore", "rentThisHome")}
                </div>
                <div className="font-semibold text-stone-900 truncate">
                  {selectedProperty.title}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">
                    {selectedProperty.subCity} · {selectedProperty.address}
                  </span>
                </div>
                <div className="text-sm font-semibold text-primary-700 mt-1">
                  {selectedProperty.monthlyRent.toLocaleString()} ETB
                  {t("explore", "perMonth")}
                </div>
              </div>
              <Link
                href="/explore"
                className="text-xs font-medium text-stone-500 hover:text-primary-700 shrink-0"
              >
                Change
              </Link>
            </div>
          )}

          {/* Role selection grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {LOGIN_ROLES.map((role) => {
              const colors = COLOR_MAP[role.color];
              const isSelected = selectedRole === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? `${colors.border} ${colors.bg}`
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <role.icon
                    className={`w-6 h-6 mb-2 ${isSelected ? colors.icon : "text-stone-400"}`}
                  />
                  <p
                    className={`font-semibold text-sm ${isSelected ? colors.text : "text-stone-700"}`}
                  >
                    {t("auth", role.labelKey)}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {t("auth", role.descKey)}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Warning: landlord or agent can't rent */}
          {isBlockedRole && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <ShieldX className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {isLandlordWithRentIntent
                    ? "Landlords cannot rent a property"
                    : "This role cannot rent a property"}
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Your rental session is paused. Switch back to{" "}
                  <strong>Tenant</strong> to continue renting this home.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {selectedRole ? (
              <input type="hidden" name="role" value={selectedRole} readOnly />
            ) : null}
            {formError ? (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formError}
              </p>
            ) : null}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                {t("auth", "email")}
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-stone-700">
                  {t("auth", "password")}
                </label>
                <Link
                  href="#"
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  {t("auth", "forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-stone-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={!selectedRole || isBlockedRole}
              className={`w-full font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                selectedRole && !isBlockedRole
                  ? "bg-primary-600 hover:bg-primary-700 text-white"
                  : "bg-stone-200 text-stone-400 cursor-not-allowed"
              }`}
            >
              <LogIn className="w-4 h-4" />
              {selectedRole && !isBlockedRole
                ? `${t("auth", "continueAs")} ${t("auth", LOGIN_ROLES.find((r) => r.value === selectedRole)?.labelKey || "")}`
                : t("auth", "signInButton")}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500 mt-6">
            {t("auth", "noAccount")}{" "}
            <Link
              href={
                propertyIdParam
                  ? `/register?role=${selectedRole || "tenant"}&propertyId=${propertyIdParam}`
                  : selectedRole
                    ? `/register?role=${selectedRole}`
                    : "/register"
              }
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t("auth", "registerHere")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <LoginPageInner />
    </Suspense>
  );
}
