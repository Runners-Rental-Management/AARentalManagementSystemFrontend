"use client";

import { Header } from "@/components/dashboard/header";
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
  FolderOpen,
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
import { formatCurrency, formatDate, getStatusColor, formatStatus } from "@/lib/utils";
import { PropertyCoverImage } from "@/components/property-cover-image";
import type { Property, RentAdjustment, TenancyAgreement } from "@/lib/types";

export default function DashboardPage() {
  const { t } = useLanguage();
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

  const titleKey =
    role === "admin"
      ? "titleAdmin"
      : role === "landlord"
        ? "titleLandlord"
        : "title";

  // ====== TENANT EXPERIENCE — WELCOMING LANDING ======
  if (role === "tenant") {
    const myPendingPayments = myAgreementsAsTenant.filter((a) =>
      ["pending_tenant_signature", "pending_verification", "pending_dara_verification"].includes(a.status)
    );
    const myDocs: Array<{ id: string }> = [];
    const unreadNotifs = 0;

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
        labelKey: "documentsChip",
        count: myDocs.length,
        countKey: "uploaded",
        href: "/dashboard/documents",
        icon: FolderOpen,
        gradient: "from-violet-500 to-purple-600",
        soft: "bg-violet-50",
      },
      {
        labelKey: "notificationsChip",
        count: unreadNotifs,
        countKey: "unread",
        href: "/dashboard/notifications",
        icon: Bell,
        gradient: "from-sky-500 to-blue-600",
        soft: "bg-sky-50",
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

    return (
      <main className="flex-1">
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl sm:text-[1.875rem] font-medium leading-snug tracking-tight text-stone-900 antialiased">
            <span className="text-stone-400 font-normal">
              {t("dashboard", "welcomeTenantHeadline1")}
            </span>{" "}
            <span className="font-semibold bg-gradient-to-r from-stone-900 via-stone-800 to-stone-600 bg-clip-text text-transparent">
              {user?.firstName ?? ""}
            </span>
          </h1>
        </section>

        {/* Shortcuts */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              {t("dashboard", "yourShortcuts")}
            </h2>
          </div>
          <div className="stagger grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {shortcuts.map((s) => (
              <Link
                key={s.labelKey}
                href={s.href}
                className="group relative bg-white rounded-2xl border border-stone-200 p-4 hover:border-primary-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div
                  className={`absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br ${s.gradient} opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500`}
                />
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm mb-3 transition-transform group-hover:scale-110 group-hover:rotate-3`}
                >
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm font-semibold text-stone-900">
                  {t("dashboard", s.labelKey)}
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  {typeof s.count === "number" && s.count > 0 ? `${s.count} ` : ""}
                  {t("dashboard", s.countKey)}
                </div>
              </Link>
            ))}
          </div>
        </section>

         {/* Recent activity + tip */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Recent agreements */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 overflow-hidden animate-fade-in-up">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
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
                  <div className="px-6 py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-stone-400" />
                    </div>
                    <p className="text-sm text-stone-500 mb-4">No agreements yet.</p>
                    <Link
                      href="/explore"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800"
                    >
                      <Compass className="w-4 h-4" />
                      {t("dashboard", "startExploring")}
                    </Link>
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

            {/* Tip card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-6 animate-fade-in-up">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/10 animate-blob" />
              <Heart className="w-8 h-8 mb-4 fill-white text-white animate-bounce-subtle" />
              <h3 className="text-lg font-bold mb-2 leading-tight">
                {t("dashboard", "quickTipTitle")}
              </h3>
              <p className="text-white/90 text-sm leading-relaxed">
                {t("dashboard", "quickTipDesc")}
              </p>
            </div>
          </div>
        </section>
        
        {/* Trending homes */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  className="group shrink-0 w-72 snap-start bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-500"
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

       
      </main>
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

  return (
    <>
      <Header title={t("dashboard", titleKey)} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* (Admin/DARA blocks removed — authority roles redirect to /dashboard/analytics) */}
        {false && role === "admin" && null}

        {/* Landlord Dashboard */}
        {role === "landlord" && (() => {
          const landlordActiveAgreements = landlordAgreements.filter(
            (agreement) => agreement.status === "active" || agreement.status === "extended"
          );
          const landlordPendingAgreementActions = landlordAgreements.filter((agreement) =>
            [
              "pending_tenant_signature",
              "pending_verification",
              "pending_dara_verification",
            ].includes(agreement.status)
          );

          const stats = [
            {
              title: t("dashboard", "myProperties"),
              value: landlordProperties.length,
              sub: `${landlordProperties.filter((p) => p.status === "available").length} available`,
              icon: Building2,
              href: "/dashboard/properties",
              tone: "bg-blue-50 text-blue-700",
            },
            {
              title: t("dashboard", "myAgreements"),
              value: landlordAgreements.filter((a) => a.status === "active").length,
              sub: `${landlordAgreements.length} total`,
              icon: FileText,
              href: "/dashboard/agreements",
              tone: "bg-emerald-50 text-emerald-700",
            },
            {
              title: t("dashboard", "myRentAdjustments"),
              value: landlordRentAdjustments.filter((r) =>
                ["pending", "under_review"].includes(r.status)
              ).length,
              sub: `${landlordRentAdjustments.length} total`,
              icon: TrendingUp,
              href: "/dashboard/rent-adjustment",
              tone: "bg-violet-50 text-violet-700",
            },
            {
              title: t("nav", "payments"),
              value: landlordActiveAgreements.length,
              sub: `${landlordPendingAgreementActions.length} pending actions`,
              icon: CreditCard,
              href: "/dashboard/payments",
              tone: "bg-cyan-50 text-cyan-700",
            },
          ];

          return (
            <div className="space-y-6">
              <div className="px-4">
                {landlordDashboardLoading && (
                  <div className="text-xs text-stone-500 mb-3">Loading landlord dashboard...</div>
                )}
                {landlordDashboardError && (
                  <div className="text-xs text-rose-600 mb-3">{landlordDashboardError}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {stats.map((stat) => (
                    <Link
                      key={stat.href}
                      href={stat.href}
                      className="bg-white rounded-xl border border-stone-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.tone}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-bold text-stone-900 mt-3">{stat.value}</p>
                      <p className="text-sm font-medium text-stone-700">{stat.title}</p>
                      <p className="text-xs text-stone-500 mt-1">{stat.sub}</p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-4 px-4 pb-6">
                <div className="bg-white rounded-xl border border-stone-200">
                  <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-stone-900">Recent agreements</h3>
                    <Link href="/dashboard/agreements" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      View all
                    </Link>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {landlordAgreements.slice(0, 4).map((agreement) => (
                      <Link
                        key={agreement.id}
                        href={`/dashboard/agreements/${agreement.id}`}
                        className="block px-4 py-3 hover:bg-stone-50"
                      >
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {agreement.propertyTitle}
                        </p>
                        <p className="text-xs text-stone-500">
                          {formatCurrency(agreement.monthlyRent)} / mo
                        </p>
                      </Link>
                    ))}
                    {landlordAgreements.length === 0 && (
                      <p className="px-4 py-6 text-xs text-stone-500">No agreements yet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200">
                  <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-stone-900">Recent rent adjustments</h3>
                    <Link href="/dashboard/rent-adjustment" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      View all
                    </Link>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {landlordRentAdjustments.slice(0, 4).map((adjustment) => (
                      <Link
                        key={adjustment.id}
                        href="/dashboard/rent-adjustment"
                        className="block px-4 py-3 hover:bg-stone-50"
                      >
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {adjustment.propertyTitle}
                        </p>
                        <p className="text-xs text-stone-500">
                          {formatCurrency(adjustment.currentRent)} {"->"} {formatCurrency(adjustment.proposedRent)}
                        </p>
                      </Link>
                    ))}
                    {landlordRentAdjustments.length === 0 && (
                      <p className="px-4 py-6 text-xs text-stone-500">No rent adjustments yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </>
  );
}
