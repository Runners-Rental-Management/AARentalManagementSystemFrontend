"use client";

import { LandlordDashboardView } from "@/components/dashboard/landlord-dashboard-view";
import {
  PageHeader,
  StatCard,
  ActivitySidebar,
  EmptyState,
  type ActivitySection,
} from "@/components/dashboard/ui";
import { useLanguage } from "@/context/language-context";
import {
  Building2,
  FileText,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Compass,
  ArrowRight,
  Bell,
  Heart,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useFavorites } from "@/context/favorites-context";
import {
  apiListAgreements,
  apiListProperties,
  apiListRentAdjustments,
  getAccessToken,
} from "@/lib/api";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { PropertyCoverImage } from "@/components/property-cover-image";
import type { Property, RentAdjustment, TenancyAgreement } from "@/lib/types";

export default function DashboardPage() {
  const { t, formatStatus } = useLanguage();
  const { user } = useAuth();
  const { count: favCount } = useFavorites();
  const router = useRouter();
  const role = user?.role || "tenant";
  const userId = user?.id || "";

  const isAuthority = role === "admin";
  const [landlordProperties, setLandlordProperties] = useState<Property[]>([]);
  const [landlordAgreements, setLandlordAgreements] = useState<TenancyAgreement[]>([]);
  const [landlordRentAdjustments, setLandlordRentAdjustments] = useState<RentAdjustment[]>([]);
  const [landlordDashboardLoading, setLandlordDashboardLoading] = useState(false);
  const [landlordDashboardError, setLandlordDashboardError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthority) {
      router.replace("/dashboard/authority");
    }
  }, [isAuthority, router]);

  useEffect(() => {
    if (isAuthority) return;

    let mounted = true;
    const loadDashboardData = async () => {
      setLandlordDashboardLoading(true);
      setLandlordDashboardError(null);
      try {
        let token: string | null = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          token = getAccessToken();
          if (token) break;
          await new Promise((resolve) => setTimeout(resolve, 250));
        }

        if (!token) {
          throw new Error("Missing auth token. Please login again.");
        }

        const propertiesResult = await apiListProperties(token, "page=1&pageSize=1000");
        const agreementsResult = await apiListAgreements(token, "page=1&pageSize=1000");
        const rentAdjustmentsResult = await apiListRentAdjustments(
          token,
          "page=1&pageSize=1000",
        );

        if (!mounted) return;
        setLandlordProperties(propertiesResult.items);
        setLandlordAgreements(agreementsResult.items);
        setLandlordRentAdjustments(rentAdjustmentsResult.items);
      } catch (error) {
        if (!mounted) return;
        const message =
          error instanceof Error ? error.message : "Failed to load landlord dashboard data.";
        setLandlordDashboardError(message);
      } finally {
        if (mounted) setLandlordDashboardLoading(false);
      }
    };

    void loadDashboardData();
    return () => {
      mounted = false;
    };
  }, [isAuthority, role, user?.id]);

  const myAgreementsAsTenant = landlordAgreements.filter((a) => a.tenantId === userId);
  const availableProperties = landlordProperties.filter((p) => p.status === "available");

  // ====== TENANT EXPERIENCE ======
  if (role === "tenant") {
    const myPendingPayments = myAgreementsAsTenant.filter((a) =>
      ["pending_tenant_signature", "pending_verification", "pending_dara_verification"].includes(a.status)
    );
    const featured = [...availableProperties]
      .sort((a, b) => a.monthlyRent - b.monthlyRent)
      .slice(0, 6);

    const shortcuts = [
      {
        labelKey: "agreementsChip",
        count: myAgreementsAsTenant.filter((a) => a.status === "active").length,
        countKey: "activeNow",
        href: "/dashboard/agreements",
        icon: FileText,
        gradient: "from-emerald-500 to-teal-600",
        soft: "bg-emerald-50",
      },
      {
        labelKey: "paymentsChip",
        count: myPendingPayments.length,
        countKey: "dueSoon",
        href: "/dashboard/payments",
        icon: CreditCard,
        gradient: "from-amber-500 to-orange-600",
        soft: "bg-amber-50",
      },
      {
        labelKey: "favoritesChip",
        count: favCount,
        countKey: "savedHomes",
        href: "/dashboard/favorites",
        icon: Heart,
        gradient: "from-rose-500 to-pink-600",
        soft: "bg-rose-50",
      },
    ] as const;

    const hour = new Date().getHours();
    const greetingKey =
      hour < 12 ? "goodMorning" : hour < 17 ? "goodAfternoon" : "goodEvening";
    const dateLabel = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const tenantSidebar: ActivitySection[] = [
      {
        title: t("nav", "notifications"),
        icon: Bell,
        href: "/dashboard/notifications",
        viewAllLabel: t("dashboard", "viewAll"),
        emptyLabel: t("dashboardUi", "nonePending"),
        items: [],
      },
      {
        title: t("dashboard", "recentAgreements"),
        icon: FileText,
        href: "/dashboard/agreements",
        viewAllLabel: t("dashboard", "viewAll"),
        emptyLabel: t("dashboardUi", "noAgreementsYet"),
        items: myAgreementsAsTenant.slice(0, 4).map((a) => ({
          id: a.id,
          title: a.propertyTitle,
          meta: `${formatCurrency(a.monthlyRent)} / mo`,
          href: `/dashboard/agreements/${a.id}`,
          badge: formatStatus(a.status),
        })),
      },
    ];

    return (
      <div className="space-y-8 animate-fade-in-up">
        <PageHeader
          greeting={`${t("dashboardUi", greetingKey)}, ${user?.firstName ?? ""} 👋`}
          title={t("dashboard", "title")}
          subtitle={t("dashboardUi", "tenantSubtitle")}
          dateLabel={dateLabel}
          badge={
            <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 ring-1 ring-teal-200/60">
              {t("roles", "tenant")}
            </span>
          }
        />

        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((s) => (
            <StatCard
              key={s.labelKey}
              title={t("dashboard", s.labelKey)}
              value={typeof s.count === "number" ? s.count : 0}
              subtitle={t("dashboard", s.countKey)}
              icon={s.icon}
              gradient={s.gradient}
              href={s.href}
              trend={s.labelKey === "agreementsChip" ? 5 : 8}
              trendLabel={t("dashboardUi", "thisMonth")}
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
        <section>
            <div className="theme-panel overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-orange-500/15">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
                  {t("dashboard", "recentAgreements")}
                </h3>
                <Link
                  href="/dashboard/agreements"
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                >
                  {t("dashboard", "viewAll")}
                </Link>
              </div>
              <div className="divide-y divide-stone-100">
                {myAgreementsAsTenant.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      icon={FileText}
                      title={t("dashboardUi", "noAgreementsTitle")}
                      description={t("dashboardUi", "noAgreementsDesc")}
                      actionLabel={t("dashboard", "startExploring")}
                      actionHref="/explore"
                    />
                  </div>
                ) : (
                  myAgreementsAsTenant.slice(0, 4).map((a) => (
                    <Link
                      key={a.id}
                      href={`/dashboard/agreements/${a.id}`}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-stone-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-stone-900 truncate">
                          {a.propertyTitle}
                        </p>
                        <p className="text-xs text-stone-500">
                          {a.landlordName} · {formatCurrency(a.monthlyRent)}/mo
                        </p>
                      </div>
                      <span
                        className={`ml-3 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(a.status)}`}
                      >
                        {formatStatus(a.status)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                {t("dashboard", "trendingHomes")}
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                {t("dashboard", "trendingHomesDesc")}
              </p>
            </div>
            <Link
              href="/explore"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800 group"
            >
              {t("dashboard", "seeAll")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-3 snap-x snap-mandatory">
            {featured.map((p, idx) => {
              const gradients = [
                "from-sky-500 via-blue-500 to-primary-600",
                "from-emerald-500 via-teal-500 to-cyan-600",
                "from-rose-500 via-pink-500 to-fuchsia-600",
                "from-amber-500 via-orange-500 to-red-500",
                "from-violet-500 via-purple-500 to-primary-600",
                "from-cyan-500 via-sky-500 to-blue-600",
              ];
              const g = gradients[idx % gradients.length];
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/properties/${p.id}`}
                  className="group shrink-0 w-72 snap-start theme-panel overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-500 dark:hover:shadow-orange-900/20"
                  style={{ animation: `fade-in-up 0.6s ${idx * 0.06}s both` }}
                >
                  <div className="relative h-44 overflow-hidden bg-stone-900">
                    {p.images[0] ? (
                      <>
                        <PropertyCoverImage
                          images={p.images}
                          alt={p.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      </>
                    ) : (
                      <>
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${g} transition-transform duration-[1200ms] group-hover:scale-110`}
                        />
                        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" />
                        <Building2 className="absolute right-3 bottom-3 w-20 h-20 text-white/15" />
                      </>
                    )}
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t("explore", "verified")}
                    </div>
                    <div className="absolute bottom-3 left-3 text-white">
                      <div className="text-xl font-bold drop-shadow">
                        {p.monthlyRent.toLocaleString()}{" "}
                        <span className="text-xs font-medium opacity-90">ETB/mo</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-stone-900 leading-snug line-clamp-1 group-hover:text-primary-700 transition-colors">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1 mb-3">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{p.subCity}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-600">
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-stone-400" />
                        {p.bedrooms}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-stone-400" />
                        {p.bathrooms}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="w-3.5 h-3.5 text-stone-400" />
                        {p.area} m²
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* "Explore" card at the end */}
            <Link
              href="/explore"
              className="group shrink-0 w-72 snap-start bg-primary-700 text-white rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" />
              <div className="relative">
                <Compass className="w-10 h-10 mb-4 text-white/80 transition-transform group-hover:rotate-12" />
                <h3 className="text-2xl font-bold leading-tight mb-2">
                  {t("dashboard", "exploreHomesCta")}
                </h3>
                <p className="text-white/80 text-sm">
                  {availableProperties.length} {t("explore", "homeCount_other")}
                </p>
              </div>
              <div className="relative inline-flex items-center gap-2 text-sm font-semibold">
                {t("dashboard", "startExploring")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </section>
          </div>
          <ActivitySidebar sections={tenantSidebar} className="lg:sticky lg:top-20 lg:self-start" />
        </div>
      </div>
    );
  }

  // Authority roles are redirected to analytics (see useEffect above)
  if (isAuthority) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400 text-sm">Redirecting…</div>
      </div>
    );
  }

  if (role === "landlord") {
    return (
      <LandlordDashboardView
        properties={landlordProperties.filter((p) => p.landlordId === userId)}
        agreements={landlordAgreements.filter((a) => a.landlordId === userId)}
        rentAdjustments={landlordRentAdjustments}
        loading={landlordDashboardLoading}
        error={landlordDashboardError}
      />
    );
  }

  return null;
}
