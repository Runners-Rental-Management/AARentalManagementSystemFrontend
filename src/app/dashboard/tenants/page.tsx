"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronRight,
  Info,
  Loader2,
  Search,
  UserSearch,
} from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { TenantPublicProfileView } from "@/components/dashboard/tenant-public-profile";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { apiGetTenantProfile, getAccessToken } from "@/lib/api";
import type { TenantPublicProfile } from "@/lib/types";
import {
  DEMO_FAYDA_HINTS,
  lookupTenantByFaydaNumber,
  type TenantLookupResult,
} from "@/lib/fayda-lookup";

export default function FindTenantPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const ct = (key: string) => t("contract", key);

  const [faydaInput, setFaydaInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [foundTenant, setFoundTenant] = useState<TenantLookupResult | null>(null);
  const [profile, setProfile] = useState<TenantPublicProfile | null>(null);

  useEffect(() => {
    if (user && user.role !== "landlord") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || user.role !== "landlord") return null;

  const handleLookup = async () => {
    const token = getAccessToken();
    if (!token) {
      setLookupError("Please sign in again.");
      return;
    }

    setLookupLoading(true);
    setLookupError("");
    setFoundTenant(null);
    setProfile(null);

    try {
      const result = await lookupTenantByFaydaNumber(faydaInput, token);
      if (!result) {
        setLookupError(ct("fanNotFound"));
        return;
      }
      setFoundTenant(result);
      const full = await apiGetTenantProfile(token, result.userId);
      setProfile(full);
    } catch (e) {
      if (e instanceof Error && e.message === "invalid_fayda_number") {
        setLookupError(ct("invalidFan"));
      } else {
        setLookupError(e instanceof Error ? e.message : ct("fanNotFound"));
      }
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <>
      <Header title={t("nav", "findTenant")} />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <UserSearch className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">{ct("findTitle")}</h2>
                <p className="text-sm text-stone-500 mt-1">{ct("findDesc")}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                {ct("fanLabel")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={faydaInput}
                  onChange={(e) => {
                    setFaydaInput(e.target.value);
                    setLookupError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  maxLength={16}
                  placeholder="9876543210987654"
                  className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-mono tracking-widest outline-none focus:ring-2 transition-all ${
                    lookupError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                      : "border-stone-300 focus:border-primary-500 focus:ring-primary-500/20"
                  }`}
                />
                <button
                  onClick={handleLookup}
                  disabled={lookupLoading}
                  className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-60 transition-colors"
                >
                  {lookupLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {lookupLoading ? ct("searching") : ct("lookup")}
                </button>
              </div>
              {lookupError && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  {lookupError}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Demo Fayda Numbers
              </p>
              <div className="space-y-1">
                {DEMO_FAYDA_HINTS.map((h) => (
                  <button
                    key={h.fan}
                    type="button"
                    onClick={() => setFaydaInput(h.fan)}
                    className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-2 w-full text-left"
                  >
                    <ChevronRight className="w-3 h-3 shrink-0" />
                    <span className="font-mono">{h.fan}</span>
                    <span className="text-amber-600">→ {h.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {profile && foundTenant && (
            <TenantPublicProfileView
              tenant={profile}
              actions={
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/tenants/${profile.id}`)}
                  className="shrink-0 px-4 py-2 rounded-xl border border-primary-200 text-primary-700 text-sm font-semibold hover:bg-primary-50 transition-colors"
                >
                  Open full profile
                </button>
              }
            />
          )}
        </div>
      </main>
    </>
  );
}
