"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import {
  Building2,
  FileText,
  AlertTriangle,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  ShieldCheck,
  Gavel,
  BarChart3,
  Settings,
  ScrollText,
  CreditCard,
  Compass,
  ArrowRight,
  FolderOpen,
  Plus,
  Bell,
  Sparkles,
  Heart,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useFavorites } from "@/context/favorites-context";
import {
  properties,
  agreements,
  disputes,
  rentAdjustments,
  analyticsData,
  users,
  penaltyNotices,
  rentPayments,
  notifications as allNotifications,
  supportingDocuments,
} from "@/lib/dummy-data";
import { formatCurrency, formatDate, getStatusColor, formatStatus } from "@/lib/utils";
import { PropertyCoverImage } from "@/components/property-cover-image";

const LANDLORD_CARD_GRADIENTS = [
  "from-sky-500 via-blue-500 to-indigo-600",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-red-500",
  "from-violet-500 via-purple-500 to-indigo-600",
];

function landlordCardGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return LANDLORD_CARD_GRADIENTS[Math.abs(h) % LANDLORD_CARD_GRADIENTS.length];
}

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            changeType === "up" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {changeType === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm text-slate-500">{title}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { count: favCount } = useFavorites();
  const router = useRouter();
  const role = user?.role || "tenant";
  const userId = user?.id || "";

  const isAuthority =
    role === "admin" || role === "dara_agent" || role === "system_admin";

  useEffect(() => {
    if (isAuthority) {
      router.replace("/dashboard/authority");
    }
  }, [isAuthority, router]);

  const myProperties = properties.filter((p) => p.landlordId === userId);
  const myAgreementsAsLandlord = agreements.filter((a) => a.landlordId === userId);
  const myAgreementsAsTenant = agreements.filter((a) => a.tenantId === userId);
  const myDisputes = disputes.filter(
    (d) => d.reporterId === userId || d.respondentId === userId
  );
  const myRentAdjustments = rentAdjustments.filter((r) => r.landlordId === userId);
  const availableProperties = properties.filter((p) => p.status === "available");
  const openDisputes = disputes.filter((d) => !["resolved", "closed"].includes(d.status));
  const pendingRentAdj = rentAdjustments.filter((r) => ["pending", "under_review"].includes(r.status));
  const pendingVerifProps = properties.filter((p) => p.status === "pending_verification");

  const titleKey =
    role === "admin"
      ? "titleAdmin"
      : role === "landlord"
        ? "titleLandlord"
        : "title";

  // ====== TENANT EXPERIENCE — WELCOMING LANDING ======
  if (role === "tenant") {
    const myPendingPayments = rentPayments.filter(
      (p) => p.payerId === userId && (p.status === "pending" || p.status === "overdue")
    );
    const myDocs = supportingDocuments.filter((d) => d.uploaderId === userId);
    const unreadNotifs = allNotifications.filter((n) => !n.isRead).length;

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
        labelKey: "disputesChip",
        count: myDisputes.filter((d) => !["resolved", "closed"].includes(d.status)).length,
        countKey: "openNow",
        href: "/dashboard/disputes",
        icon: AlertTriangle,
        gradient: "from-rose-500 to-pink-600",
        soft: "bg-rose-50",
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
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-indigo-700 to-fuchsia-700 animate-gradient-pan" />
          <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-cyan-400/30 blur-3xl animate-blob" />
          <div
            className="absolute top-10 -right-32 w-[32rem] h-[32rem] rounded-full bg-fuchsia-400/30 blur-3xl animate-blob"
            style={{ animationDelay: "3s" }}
          />
          <div
            className="absolute -bottom-24 left-1/3 w-[26rem] h-[26rem] rounded-full bg-amber-300/20 blur-3xl animate-blob"
            style={{ animationDelay: "6s" }}
          />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="max-w-3xl text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-5 border border-white/20 animate-fade-in-up">
                <Sparkles className="w-4 h-4" />
                {t("dashboard", "welcomeTenantKicker")}
              </div>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight mb-5 animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                {t("dashboard", "welcomeTenantHeadline1")} {user?.firstName ?? "there"},{" "}
                <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-amber-200 via-rose-200 to-fuchsia-200 bg-clip-text text-transparent">
                  {t("dashboard", "welcomeTenantHeadline2")}
                </span>
              </h1>
              <p
                className="text-white/80 text-base sm:text-lg mb-8 max-w-2xl animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                {t("dashboard", "welcomeTenantHelper")}
              </p>

              <div
                className="flex flex-wrap items-center gap-3 animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <Link
                  href="/explore"
                  className="group inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3.5 rounded-2xl hover:scale-105 transition-all shadow-xl shadow-black/10 hover-shine"
                >
                  <Compass className="w-5 h-5 transition-transform group-hover:rotate-12" />
                  {t("dashboard", "exploreHomesCta")}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/dashboard/agreements"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white font-semibold px-6 py-3.5 rounded-2xl hover:bg-white/20 border border-white/20 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  {t("nav", "myAgreements")}
                </Link>
              </div>
            </div>
          </div>

          {/* wavy divider */}
          <div className="absolute bottom-0 inset-x-0 leading-none">
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-10 sm:h-14" aria-hidden>
              <path
                d="M0,64L80,58.7C160,53,320,43,480,42.7C640,43,800,53,960,56C1120,59,1280,53,1360,50.7L1440,48L1440,80L1360,80C1280,80,1120,80,960,80C800,80,640,80,480,80C320,80,160,80,80,80L0,80Z"
                fill="rgb(248 250 252)"
              />
            </svg>
          </div>
        </section>

        {/* Shortcuts */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t("dashboard", "yourShortcuts")}
            </h2>
          </div>
          <div className="stagger grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {shortcuts.map((s) => (
              <Link
                key={s.labelKey}
                href={s.href}
                className="group relative bg-white rounded-2xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div
                  className={`absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br ${s.gradient} opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500`}
                />
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm mb-3 transition-transform group-hover:scale-110 group-hover:rotate-3`}
                >
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {t("dashboard", s.labelKey)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {typeof s.count === "number" && s.count > 0 ? `${s.count} ` : ""}
                  {t("dashboard", s.countKey)}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending homes */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {t("dashboard", "trendingHomes")}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
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
                "from-sky-500 via-blue-500 to-indigo-600",
                "from-emerald-500 via-teal-500 to-cyan-600",
                "from-rose-500 via-pink-500 to-fuchsia-600",
                "from-amber-500 via-orange-500 to-red-500",
                "from-violet-500 via-purple-500 to-indigo-600",
                "from-cyan-500 via-sky-500 to-blue-600",
              ];
              const g = gradients[idx % gradients.length];
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/properties/${p.id}`}
                  className="group shrink-0 w-72 snap-start bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                  style={{ animation: `fade-in-up 0.6s ${idx * 0.06}s both` }}
                >
                  <div className="relative h-44 overflow-hidden bg-slate-900">
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
                    <h3 className="font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-primary-700 transition-colors">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 mb-3">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{p.subCity}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                        {p.bedrooms}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-slate-400" />
                        {p.bathrooms}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="w-3.5 h-3.5 text-slate-400" />
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
              className="group shrink-0 w-72 snap-start bg-gradient-to-br from-primary-600 to-indigo-700 text-white rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative hover:shadow-2xl hover:-translate-y-1 transition-all"
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

        {/* Recent activity + tip */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Recent agreements */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden animate-fade-in-up">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {t("dashboard", "recentAgreements")}
                </h3>
                <Link
                  href="/dashboard/agreements"
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                >
                  {t("dashboard", "viewAll")}
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {myAgreementsAsTenant.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500 mb-4">No agreements yet.</p>
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
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {a.propertyTitle}
                        </p>
                        <p className="text-xs text-slate-500">
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
      </main>
    );
  }

  // Authority roles are redirected to analytics (see useEffect above)
  if (isAuthority) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-sm">Redirecting…</div>
      </div>
    );
  }

  return (
    <>
      <Header title={t("dashboard", titleKey)} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* (Admin/DARA blocks removed — authority roles redirect to /dashboard/analytics) */}
        {false && role === "admin" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title={t("dashboard", "registeredUsers")}
                value={users.length.toString()}
                change="+15%"
                changeType="up"
                icon={Users}
                color="bg-indigo-500"
                href="/dashboard/admin/users"
              />
              <StatCard
                title={t("dashboard", "totalProperties")}
                value={properties.length.toString()}
                change="+12%"
                changeType="up"
                icon={Building2}
                color="bg-blue-500"
                href="/dashboard/admin/users"
              />
              <StatCard
                title={t("dashboard", "activeAgreements")}
                value={agreements.filter((a) => a.status === "active").length.toString()}
                change="+8%"
                changeType="up"
                icon={FileText}
                color="bg-emerald-500"
                href="/dashboard/admin/audit-logs"
              />
              <StatCard
                title={t("dashboard", "openDisputes")}
                value={openDisputes.length.toString()}
                change="-5%"
                changeType="down"
                icon={AlertTriangle}
                color="bg-amber-500"
                href="/dashboard/admin/audit-logs"
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link href="/dashboard/admin/users" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group text-center">
                <Users className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">{t("nav", "userManagement")}</p>
                <p className="text-xs text-slate-500 mt-1">{users.length} users</p>
              </Link>
              <Link href="/dashboard/admin/parameters" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group text-center">
                <Settings className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">{t("nav", "systemParameters")}</p>
                <p className="text-xs text-slate-500 mt-1">9 parameters</p>
              </Link>
              <Link href="/dashboard/admin/audit-logs" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group text-center">
                <ScrollText className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">{t("nav", "auditLogs")}</p>
                <p className="text-xs text-slate-500 mt-1">View activity</p>
              </Link>
              <Link href="/dashboard/admin/roles" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">{t("nav", "rolesPermissions")}</p>
                <p className="text-xs text-slate-500 mt-1">4 roles</p>
              </Link>
            </div>
          </>
        )}

        {/* Landlord Dashboard — Casino circular layout */}
        {role === "landlord" && (() => {
          const chips = [
            {
              title: t("dashboard", "myProperties"),
              value: myProperties.length,
              sub: `${myProperties.filter((p) => p.status === "available").length} available`,
              icon: Building2,
              href: "/dashboard/properties",
              // top-centre
              cx: 50, cy: 9,
              glow: "rgba(59,130,246,0.7)",
              ring: "#3b82f6",
              iconBg: "from-blue-500 to-blue-700",
            },
            {
              title: t("dashboard", "myAgreements"),
              value: myAgreementsAsLandlord.filter((a) => a.status === "active").length,
              sub: `${myAgreementsAsLandlord.length} total`,
              icon: FileText,
              href: "/dashboard/agreements",
              // top-right
              cx: 88, cy: 37,
              glow: "rgba(16,185,129,0.7)",
              ring: "#10b981",
              iconBg: "from-emerald-500 to-emerald-700",
            },
            {
              title: t("dashboard", "myRentAdjustments"),
              value: myRentAdjustments.filter((r) => ["pending","under_review"].includes(r.status)).length,
              sub: `${myRentAdjustments.length} total`,
              icon: TrendingUp,
              href: "/dashboard/rent-adjustment",
              // bottom-right
              cx: 74, cy: 82,
              glow: "rgba(168,85,247,0.7)",
              ring: "#a855f7",
              iconBg: "from-purple-500 to-purple-700",
            },
            {
              title: t("dashboard", "myDisputes"),
              value: myDisputes.filter((d) => !["resolved","closed"].includes(d.status)).length,
              sub: `${myDisputes.length} total`,
              icon: AlertTriangle,
              href: "/dashboard/disputes",
              // bottom-left
              cx: 26, cy: 82,
              glow: "rgba(245,158,11,0.7)",
              ring: "#f59e0b",
              iconBg: "from-amber-500 to-amber-700",
            },
            {
              title: t("nav", "payments"),
              value: rentPayments.filter((p) => p.recipientId === userId && p.status === "paid").length,
              sub: `${rentPayments.filter((p) => p.recipientId === userId && p.status === "pending").length} pending`,
              icon: CreditCard,
              href: "/dashboard/payments",
              // top-left
              cx: 12, cy: 37,
              glow: "rgba(20,184,166,0.7)",
              ring: "#14b8a6",
              iconBg: "from-teal-500 to-teal-700",
            },
          ];

          return (
            <div className="flex items-center justify-center py-4 px-4">
              <div className="relative w-full max-w-[620px]" style={{ aspectRatio: "1/1" }}>

                {/* Felt table */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(ellipse at center, #1a3d24 0%, #0e2016 55%, #060e09 100%)",
                    boxShadow: "0 0 0 3px #7c5a1a, 0 0 0 6px #3d2d0a, 0 0 80px rgba(234,179,8,0.12), inset 0 0 100px rgba(0,0,0,0.6)",
                  }}
                />

                {/* Decorative concentric rings */}
                <div className="absolute inset-[8%] rounded-full border border-yellow-700/20" />
                <div className="absolute inset-[16%] rounded-full border border-yellow-700/10" />

                {/* SVG lines from center to each chip */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {chips.map((c, i) => (
                    <line
                      key={i}
                      x1="50" y1="50"
                      x2={c.cx} y2={c.cy}
                      stroke={c.ring}
                      strokeWidth="0.3"
                      strokeOpacity="0.35"
                      strokeDasharray="1.5 1.5"
                    />
                  ))}
                  {/* Outer pentagon */}
                  <polygon
                    points={chips.map((c) => `${c.cx},${c.cy}`).join(" ")}
                    fill="none"
                    stroke="rgba(234,179,8,0.12)"
                    strokeWidth="0.25"
                  />
                </svg>

                {/* Center medallion */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[18%] aspect-square rounded-full flex flex-col items-center justify-center"
                  style={{
                    background: "radial-gradient(circle, #d97706 0%, #92400e 100%)",
                    boxShadow: "0 0 24px rgba(234,179,8,0.6), 0 0 60px rgba(234,179,8,0.2)",
                  }}
                >
                  <Building2 className="w-[45%] h-[45%] text-yellow-100" />
                  <span className="text-[1.8cqw] font-bold text-yellow-100 tracking-tight leading-none mt-[4%]" style={{ fontSize: "clamp(8px, 1.8vw, 14px)" }}>
                    {user?.firstName}
                  </span>
                </div>

                {/* Chips */}
                {chips.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="absolute z-10 group"
                    style={{
                      left: `${c.cx}%`,
                      top: `${c.cy}%`,
                      transform: "translate(-50%, -50%)",
                      width: "22%",
                    }}
                  >
                    <div
                      className="rounded-2xl p-3 flex flex-col items-center text-center transition-all duration-300 group-hover:-translate-y-1"
                      style={{
                        background: "linear-gradient(145deg, #111c14 0%, #0a1209 100%)",
                        border: `1px solid ${c.ring}55`,
                        boxShadow: `0 0 0 1px ${c.ring}22, 0 4px 20px rgba(0,0,0,0.6)`,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 16px ${c.glow}, 0 0 40px ${c.glow}55, 0 4px 20px rgba(0,0,0,0.6)`;
                        (e.currentTarget as HTMLDivElement).style.borderColor = c.ring;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px ${c.ring}22, 0 4px 20px rgba(0,0,0,0.6)`;
                        (e.currentTarget as HTMLDivElement).style.borderColor = `${c.ring}55`;
                      }}
                    >
                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center mb-1.5 shadow-lg`}
                        style={{ boxShadow: `0 0 12px ${c.glow}60` }}
                      >
                        <c.icon className="w-4 h-4 text-white" />
                      </div>
                      {/* Value */}
                      <span
                        className="text-2xl font-black leading-none tracking-tight"
                        style={{ color: c.ring, textShadow: `0 0 10px ${c.glow}` }}
                      >
                        {c.value}
                      </span>
                      {/* Title */}
                      <span className="text-[10px] font-semibold text-slate-300 mt-0.5 leading-tight line-clamp-2">
                        {c.title}
                      </span>
                      {/* Sub */}
                      <span className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                        {c.sub}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* (DARA block removed — dara_agent redirects to /dashboard/analytics) */}
        {false && role === "dara_agent" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard title={t("dashboard", "pendingVerifications")} value={`${pendingVerifProps.length + agreements.filter((a) => ["pending_verification", "pending_dara_verification"].includes(a.status)).length}`} change="To verify" changeType="up" icon={ShieldCheck} color="bg-orange-500" href="/dashboard/admin/verifications" />
              <StatCard title={t("dashboard", "openDisputes")} value={openDisputes.length.toString()} change={`${disputes.filter((d) => d.priority === "critical").length} critical`} changeType="down" icon={AlertTriangle} color="bg-amber-500" href="/dashboard/disputes" />
              <StatCard title={t("dashboard", "pendingAdjustments")} value={pendingRentAdj.length.toString()} change="To review" changeType="up" icon={TrendingUp} color="bg-purple-500" href="/dashboard/rent-adjustment" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <Link href="/dashboard/admin/verifications" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow text-center">
                <ShieldCheck className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">{t("nav", "verifyAgreements")}</p>
              </Link>
              <Link href="/dashboard/disputes" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">{t("nav", "reviewViolations")}</p>
              </Link>
              <Link href="/dashboard/rent-adjustment" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow text-center">
                <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">{t("nav", "approveRentAdjustment")}</p>
              </Link>
              <Link href="/dashboard/analytics" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow text-center">
                <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">{t("nav", "analytics")}</p>
              </Link>
              <Link href="/dashboard/penalty-notices" className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow text-center">
                <Gavel className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">{t("nav", "penaltyNotices")}</p>
              </Link>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">{t("dashboard", "recentAgreements")}</h3>
                  <Link href="/dashboard/admin/verifications" className="text-xs text-primary-600 hover:text-primary-700 font-medium">{t("dashboard", "viewAll")}</Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {agreements.filter((a) => ["pending_verification", "pending_dara_verification"].includes(a.status)).slice(0, 4).map((agreement) => (
                    <Link key={agreement.id} href={`/dashboard/agreements/${agreement.id}`} className="block px-6 py-3.5 flex items-center justify-between hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{agreement.propertyTitle}</p>
                        <p className="text-xs text-slate-500">{agreement.tenantName} &middot; {formatCurrency(agreement.monthlyRent)}/mo</p>
                      </div>
                      <span className={`ml-3 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agreement.status)}`}>{formatStatus(agreement.status)}</span>
                    </Link>
                  ))}
                  {agreements.filter((a) => ["pending_verification", "pending_dara_verification"].includes(a.status)).length === 0 && (
                    <p className="px-6 py-6 text-sm text-slate-500">No pending agreements.</p>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">{t("dashboard", "recentDisputes")}</h3>
                  <Link href="/dashboard/disputes" className="text-xs text-primary-600 hover:text-primary-700 font-medium">{t("dashboard", "viewAll")}</Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {openDisputes.slice(0, 4).map((dispute) => (
                    <Link key={dispute.id} href={`/dashboard/disputes/${dispute.id}`} className="block px-6 py-3.5 flex items-center justify-between hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{dispute.title}</p>
                        <p className="text-xs text-slate-500">{dispute.reporterName} &middot; {formatDate(dispute.createdAt)}</p>
                      </div>
                      <div className="ml-3 flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${dispute.priority === "critical" ? "bg-red-100 text-red-700" : dispute.priority === "high" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>{dispute.priority}</span>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>{formatStatus(dispute.status)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
