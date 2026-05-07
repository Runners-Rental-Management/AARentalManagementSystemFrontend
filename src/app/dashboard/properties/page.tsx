"use client";

import { Header } from "@/components/dashboard/header";
import { PropertyDossier } from "@/components/dashboard/property-dossier";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useProperties } from "@/context/properties-context";
import { useRentalFlow } from "@/context/rental-flow-context";
import {
  Archive,
  Clock,
  Filter,
  FolderArchive,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function PropertiesPage() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { userProperties, isLoading } = useProperties();
  const { getPropertyLiveStatus } = useRentalFlow();
  const role = user?.role || "tenant";
  const userId = user?.id || "";

  const roleBasedList = useMemo(() => {
    if (role === "landlord") {
      return userProperties.filter((p) => p.landlordId === userId);
    }
    return userProperties;
  }, [role, userId, userProperties]);

  const filtered = roleBasedList.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subCity.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const showRegisterButton = role === "landlord";

  /* User-submitted ids for the current landlord — used to mark "just submitted" cards */
  const myUserSubmittedIds = useMemo(
    () => new Set(userProperties.filter((p) => p.landlordId === userId).map((p) => p.id)),
    [userProperties, userId]
  );

  const myPendingCount = useMemo(
    () =>
      role === "landlord"
        ? userProperties.filter(
            (p) => p.landlordId === userId && p.status === "pending_verification"
          ).length
        : 0,
    [userProperties, userId, role]
  );

  return (
    <>
      <Header title={t("properties", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Pending submissions banner */}
        {role === "landlord" && myPendingCount > 0 && (
          <div className="mb-5 rounded-2xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50 via-slate-50 to-cyan-50 px-5 py-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-indigo-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">
                {myPendingCount === 1
                  ? "1 property pending verification"
                  : `${myPendingCount} properties pending verification`}
              </p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Your submission has been forwarded to a DARA officer for compliance
                review. You&apos;ll be notified once it&apos;s approved and goes live.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-white border border-indigo-200 text-indigo-700 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0">
              <Sparkles className="w-3 h-3" />
              Just submitted
            </span>
          </div>
        )}

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t("properties", "searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none"
              >
                <option value="all">{t("properties", "allStatus")}</option>
                <option value="available">{t("properties", "available")}</option>
                <option value="rented">{t("properties", "rented")}</option>
                <option value="pending_verification">{t("properties", "pending")}</option>
                <option value="rejected">{t("properties", "rejected")}</option>
              </select>
            </div>
          </div>
          {showRegisterButton && (
            <Link
              href="/dashboard/properties/register"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("properties", "registerProperty")}
            </Link>
          )}
        </div>

        {/* ── Filing-cabinet caption ── */}
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 dark:text-slate-400 typewriter tracking-wider uppercase">
          <FolderArchive className="w-3.5 h-3.5" />
          <span>
            DARA Property Registry · {filtered.length}{" "}
            {filtered.length === 1 ? "dossier" : "dossiers"} on file
          </span>
          <span className="flex-1 border-t border-dashed border-slate-300 dark:border-slate-700 ml-2" />
        </div>

        {/* ── Dossier shelf ── */}
        <div
          className="rounded-2xl p-4 sm:p-6 border border-slate-300/80 dark:border-slate-700 relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/80"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(100,116,139,0.06) 0 1px, transparent 1px 20px)",
          }}
        >
          {/* Wood-grain shelf strip on top */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{
              background:
                "linear-gradient(90deg, #334155 0%, #64748b 50%, #334155 100%)",
            }}
          />

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 pt-2">
            {filtered.map((property, idx) => (
              <PropertyDossier
                key={property.id}
                property={property}
                isJustSubmitted={myUserSubmittedIds.has(property.id)}
                index={idx}
                liveStatus={getPropertyLiveStatus(property.id)}
              />
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-sm text-slate-500">Loading properties...</p>
            </div>
          ) : filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-3 border border-slate-300 dark:border-slate-700">
                <Archive className="w-8 h-8 text-slate-600 dark:text-slate-300" />
              </div>
              <p className="typewriter text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wider uppercase">
                Cabinet Empty
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t("properties", "noProperties")}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
