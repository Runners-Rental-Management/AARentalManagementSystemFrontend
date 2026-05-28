"use client";

import { PropertyDossier } from "@/components/dashboard/property-dossier";
import {
  EmptyState,
  FilterBar,
  PageHeader,
  PropertyListCard,
} from "@/components/dashboard/ui";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useProperties } from "@/context/properties-context";
import { useRentalFlow } from "@/context/rental-flow-context";
import { Clock, LayoutGrid, List, Plus, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export default function PropertiesPage() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "dossier">("cards");
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
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={t("properties", "title")}
        subtitle={
          role === "landlord"
            ? t("dashboardUi", "landlordSubtitle")
            : t("dashboardUi", "tenantSubtitle")
        }
        actions={
          showRegisterButton ? (
            <Link
              href="/dashboard/properties/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              {t("properties", "registerProperty")}
            </Link>
          ) : undefined
        }
      />

      {role === "landlord" && myPendingCount > 0 && (
        <div className="dashboard-glass flex items-start gap-4 rounded-[18px] px-5 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100">
            <Clock className="h-5 w-5 text-primary-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900">
              {myPendingCount === 1
                ? "1 property pending verification"
                : `${myPendingCount} properties pending verification`}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
              Your submission has been forwarded to a DARA officer for compliance
              review.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-primary-700">
            <Sparkles className="h-3 w-3" />
            Just submitted
          </span>
        </div>
      )}

      <FilterBar
        searchPlaceholder={t("properties", "searchPlaceholder")}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-primary-300"
          >
            <option value="all">{t("properties", "allStatus")}</option>
            <option value="available">{t("properties", "available")}</option>
            <option value="rented">{t("properties", "rented")}</option>
            <option value="pending_verification">{t("properties", "pending")}</option>
            <option value="rejected">{t("properties", "rejected")}</option>
          </select>
        }
        actions={
          <div className="flex rounded-xl border border-stone-200 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "rounded-lg p-2 transition-colors",
                viewMode === "cards" ? "bg-primary-50 text-primary-700" : "text-stone-500"
              )}
              title={t("dashboardUi", "cardView")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("dossier")}
              className={cn(
                "rounded-lg p-2 transition-colors",
                viewMode === "dossier" ? "bg-primary-50 text-primary-700" : "text-stone-500"
              )}
              title={t("dashboardUi", "listView")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {isLoading ? (
        <p className="text-center py-16 text-sm text-stone-500">
          {t("dashboardUi", "loading")}
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("properties", "noProperties")}
          description={t("dashboardUi", "noAgreementsDesc")}
          actionLabel={
            showRegisterButton ? t("properties", "registerProperty") : undefined
          }
          actionHref={showRegisterButton ? "/dashboard/properties/register" : undefined}
        />
      ) : viewMode === "cards" ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property) => (
            <PropertyListCard
              key={property.id}
              property={property}
              href={`/dashboard/properties/${property.id}`}
              occupancyLabel={
                property.status === "rented"
                  ? t("dashboardUi", "occupied")
                  : t("dashboardUi", "vacant")
              }
            />
          ))}
        </div>
      ) : (
        <div className="ui-panel rounded-[20px] p-4 sm:p-6">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
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
        </div>
      )}
    </div>
  );
}
