"use client";

import Link from "next/link";
import {
  Building2,
  FileText,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  FileSignature,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import {
  PageHeader,
  StatCard,
  ActivitySidebar,
  EmptyState,
  type ActivitySection,
} from "@/components/dashboard/ui";
import type { Property, RentAdjustment, TenancyAgreement } from "@/lib/types";
import { getStatusColor } from "@/lib/utils";

type LandlordDashboardViewProps = {
  properties: Property[];
  agreements: TenancyAgreement[];
  rentAdjustments: RentAdjustment[];
  loading?: boolean;
  error?: string | null;
};

export function LandlordDashboardView({
  properties,
  agreements,
  rentAdjustments,
  loading,
  error,
}: LandlordDashboardViewProps) {
  const { t, formatCurrency: fmt, formatStatus } = useLanguage();
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greetingKey =
    hour < 12 ? "goodMorning" : hour < 17 ? "goodAfternoon" : "goodEvening";

  const activeAgreements = agreements.filter(
    (a) => a.status === "active" || a.status === "extended"
  );
  const pendingActions = agreements.filter((a) =>
    [
      "pending_tenant_signature",
      "pending_verification",
      "pending_dara_verification",
    ].includes(a.status)
  );
  const monthlyRevenue = activeAgreements.reduce(
    (sum, a) => sum + (a.monthlyRent || 0),
    0
  );
  const availableCount = properties.filter((p) => p.status === "available").length;
  const compliancePct =
    properties.length === 0
      ? 100
      : Math.round(
          (properties.filter((p) => p.status !== "rejected").length /
            properties.length) *
            100
        );

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sidebarSections: ActivitySection[] = [
    {
      title: t("dashboardUi", "pendingApprovals"),
      icon: FileSignature,
      href: "/dashboard/agreements",
      viewAllLabel: t("dashboard", "viewAll"),
      emptyLabel: t("dashboardUi", "nonePending"),
      items: pendingActions.slice(0, 4).map((a) => ({
        id: a.id,
        title: a.propertyTitle,
        meta: formatStatus(a.status),
        href: `/dashboard/agreements/${a.id}`,
        badge: t("dashboardUi", "action"),
      })),
    },
    {
      title: t("dashboard", "recentAgreements"),
      icon: FileText,
      href: "/dashboard/agreements",
      viewAllLabel: t("dashboard", "viewAll"),
      emptyLabel: t("dashboardUi", "noAgreementsYet"),
      items: agreements.slice(0, 4).map((a) => ({
        id: a.id,
        title: a.propertyTitle,
        meta: `${fmt(a.monthlyRent)} / mo`,
        href: `/dashboard/agreements/${a.id}`,
      })),
    },
    {
      title: t("dashboardUi", "rentAdjustments"),
      icon: TrendingUp,
      href: "/dashboard/rent-adjustment",
      viewAllLabel: t("dashboard", "viewAll"),
      emptyLabel: t("dashboardUi", "noAdjustments"),
      items: rentAdjustments.slice(0, 3).map((r) => ({
        id: r.id,
        title: r.propertyTitle,
        meta: `${fmt(r.currentRent)} → ${fmt(r.proposedRent)}`,
        href: "/dashboard/rent-adjustment",
      })),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <PageHeader
        greeting={`${t("dashboardUi", greetingKey)}, ${user?.firstName ?? ""} 👋`}
        title={t("dashboard", "titleLandlord")}
        subtitle={t("dashboardUi", "landlordSubtitle")}
        dateLabel={dateLabel}
        badge={
          <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800 ring-1 ring-primary-200/60 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/30">
            {t("roles", "landlord")}
          </span>
        }
      />

      {loading && (
        <p className="text-xs text-stone-500">{t("dashboardUi", "loading")}</p>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("dashboard", "myProperties")}
          value={properties.length}
          subtitle={`${availableCount} ${t("properties", "available")}`}
          trend={12}
          trendLabel={t("dashboardUi", "thisMonth")}
          icon={Building2}
          gradient="from-blue-500 to-indigo-600"
          href="/dashboard/properties"
        />
        <StatCard
          title={t("dashboard", "myAgreements")}
          value={activeAgreements.length}
          subtitle={`${agreements.length} ${t("dashboardUi", "total")}`}
          trend={5}
          trendLabel={t("dashboardUi", "thisMonth")}
          icon={FileText}
          gradient="from-emerald-500 to-teal-600"
          href="/dashboard/agreements"
        />
        <StatCard
          title={t("dashboardUi", "revenue")}
          value={fmt(monthlyRevenue)}
          subtitle={t("dashboardUi", "activeLeases")}
          trend={18}
          trendLabel={t("dashboardUi", "thisMonth")}
          icon={CreditCard}
          gradient="from-amber-500 to-orange-600"
          href="/dashboard/payments"
        />
        <StatCard
          title={t("dashboardUi", "compliance")}
          value={`${compliancePct}%`}
          subtitle={
            compliancePct >= 90
              ? t("dashboardUi", "excellent")
              : t("dashboardUi", "reviewNeeded")
          }
          icon={ShieldCheck}
          gradient="from-violet-500 to-purple-600"
          href="/dashboard/properties"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="theme-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-800 dark:text-stone-200">
                {t("dashboard", "recentAgreements")}
              </h2>
              <Link
                href="/dashboard/agreements"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                {t("dashboard", "viewAll")}
              </Link>
            </div>
            {agreements.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t("dashboardUi", "noAgreementsTitle")}
                description={t("dashboardUi", "noAgreementsDesc")}
                actionLabel={t("dashboardUi", "createAgreement")}
                actionHref="/dashboard/agreements/create"
              />
            ) : (
              <ul className="divide-y divide-stone-100">
                {agreements.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/dashboard/agreements/${a.id}`}
                      className="flex items-center justify-between gap-3 py-3.5 transition-colors hover:bg-stone-50/80 -mx-2 px-2 rounded-xl"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900 truncate">
                          {a.propertyTitle}
                        </p>
                        <p className="text-xs text-stone-500">
                          {fmt(a.monthlyRent)} / mo
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(a.status)}`}
                      >
                        {formatStatus(a.status)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="theme-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-800 dark:text-stone-200">
                {t("dashboardUi", "portfolio")}
              </h2>
              <Link
                href="/dashboard/properties"
                className="text-xs font-semibold text-primary-600"
              >
                {t("dashboard", "viewAll")}
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {properties.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/properties/${p.id}`}
                  className="rounded-2xl border border-stone-100 bg-stone-50/50 p-4 hover:border-primary-200 hover:bg-white transition-all dark:border-orange-500/15 dark:bg-[#1a1a1a] dark:hover:border-orange-500/30 dark:hover:bg-[#1f1f1f]"
                >
                  <p className="font-semibold text-sm text-stone-900 truncate">
                    {p.title}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    {fmt(p.monthlyRent)} · {formatStatus(p.status)}
                  </p>
                </Link>
              ))}
              {properties.length === 0 && (
                <p className="text-sm text-stone-500 col-span-2 py-4 text-center">
                  {t("properties", "noProperties")}
                </p>
              )}
            </div>
          </div>
        </div>

        <ActivitySidebar sections={sidebarSections} className="lg:sticky lg:top-20 lg:self-start" />
      </div>
    </div>
  );
}
