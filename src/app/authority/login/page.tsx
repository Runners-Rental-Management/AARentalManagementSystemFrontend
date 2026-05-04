"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  ArrowLeft,
  Globe,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";

export default function AuthorityLoginPage() {
  const router = useRouter();
  const { locale, setLocale } = useLanguage();
  const { login } = useAuth();
  const { withLoading } = useLoading();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await withLoading(async () => {
      await new Promise((r) => setTimeout(r, 800));
      login("dara_agent");
    }, "Authenticating…");
    router.push("/dashboard/authority");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-52 h-52 bg-blue-600/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none">DARA</p>
              <p className="text-white/50 text-xs">Authority Portal</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Government
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-blue-300 bg-clip-text text-transparent">
              Authority Access
            </span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Secure portal for the Addis Ababa Residential Rental Administration Authority to manage compliance, verify agreements, and resolve disputes.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            "Proclamation No. 1320/2016 (E.C.) — Residential Rent Control",
            "Annual indicative rent band management",
            "Agreement verification & dispute resolution",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-white/50 text-xs">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
        <div className="w-full max-w-md">
          {/* Header bar */}
          <div className="flex items-center justify-between mb-10">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Resident login
            </Link>
            <button
              onClick={() => setLocale(locale === "en" ? "am" : "en")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Globe className="w-4 h-4" />
              {locale === "en" ? "አማርኛ" : "English"}
            </button>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Lock className="w-3.5 h-3.5" />
            Restricted — Authorised Personnel Only
          </div>

          {/* Authority identity card */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base">Government Authority</p>
              <p className="text-slate-400 text-xs mt-0.5 leading-snug">
                Addis Ababa Residential Rental Administration
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Authority Sign In</h1>
          <p className="text-slate-400 text-sm mb-7">
            Enter your official credentials to access the administration dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Official Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all"
                placeholder="officer@dara.gov.et"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm pr-10 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all mt-2"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Authority Portal
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-8">
            This portal is restricted to authorised government personnel.
            <br />
            Unauthorised access is a violation of Proclamation 1320/2016.
          </p>
        </div>
      </div>
    </div>
  );
}
