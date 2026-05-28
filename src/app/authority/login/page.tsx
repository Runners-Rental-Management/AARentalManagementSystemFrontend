"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { useAlert } from "@/context/alert-context";

export default function AuthorityLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { login, isAuthenticated, user } = useAuth();
  const { withLoading } = useLoading();
  const { showError } = useAlert();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.role === "admin" ? "/dashboard/authority" : "/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError(t("authorityAuth", "officialEmailRequired"));
      return;
    }
    if (password.length < 8) {
      setFormError(t("authorityAuth", "passwordMinLength"));
      return;
    }
    try {
      await withLoading(async () => {
        await login({ role: "admin", email: trimmedEmail, password });
      }, t("authorityAuth", "authenticating"));
      router.push("/dashboard/authority");
    } catch (err) {
      showError(err, (ns, key) => t(ns as "auth" | "common" | "authorityAuth", key), {
        titleKey: "loginFailed",
        namespace: "auth",
      });
    }
  };

  const bullets = [
    t("authorityAuth", "bulletProclamation"),
    t("authorityAuth", "bulletRentBand"),
    t("authorityAuth", "bulletVerification"),
  ];

  return (
    <div className="min-h-screen bg-stone-950 flex">
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-primary-950" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-52 h-52 bg-blue-600/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none">DARA</p>
              <p className="text-white/50 text-xs">{t("authorityAuth", "portalTitle")}</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            {t("authorityAuth", "government")}
            <br />
            <span className="bg-gradient-to-r from-primary-400 to-blue-300 bg-clip-text text-transparent">
              {t("authorityAuth", "authorityAccess")}
            </span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            {t("authorityAuth", "securePortalDesc")}
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {bullets.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
              <p className="text-white/50 text-xs">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-stone-900">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("authorityAuth", "residentLogin")}
            </Link>
            <LanguageToggle className="[&_button:not([aria-pressed=true])]:text-stone-400 [&_button:not([aria-pressed=true])]:hover:text-white [&_.border-stone-200]:border-white/10 [&_.bg-stone-50]:bg-white/5" />
          </div>

          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Lock className="w-3.5 h-3.5" />
            {t("authorityAuth", "restrictedBadge")}
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-blue-700 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base">
                {t("authorityAuth", "governmentAuthority")}
              </p>
              <p className="text-stone-400 text-xs mt-0.5 leading-snug">
                {t("authorityAuth", "daraFullName")}
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">
            {t("authorityAuth", "authoritySignIn")}
          </h1>
          <p className="text-stone-400 text-sm mb-7">
            {t("authorityAuth", "signInSubtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="role" value="admin" readOnly />
            {formError ? (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {formError}
              </p>
            ) : null}
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                {t("authorityAuth", "role")}
              </label>
              <div className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm">
                {t("authorityAuth", "locationAdmin")}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                {t("authorityAuth", "officialEmail")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-stone-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm transition-all"
                placeholder="officer@dara.gov.et"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                {t("auth", "password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-stone-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm pr-10 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all mt-2"
            >
              <LogIn className="w-4 h-4" />
              {t("authorityAuth", "signInToPortal")}
            </button>
          </form>

          <p className="text-center text-xs text-stone-600 mt-8">
            {t("authorityAuth", "footerLegal")}
            <br />
            {t("authorityAuth", "footerProclamation")}
          </p>
        </div>
      </div>
    </div>
  );
}
