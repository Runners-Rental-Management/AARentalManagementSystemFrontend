"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  Heart,
  ShieldCheck,
  Globe,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  X,
  Sparkles,
  Home as HomeIcon,
  Hotel,
  Castle,
  Landmark,
  Compass,
  TrendingUp,
  BadgeCheck,
  FileSignature,
  ChevronRight,
  Key,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useFavorites } from "@/context/favorites-context";
import { apiListPublicProperties } from "@/lib/api";
import type { Property } from "@/lib/types";
import type { TranslationKeys } from "@/lib/i18n";
import { getInitials } from "@/lib/utils";
import { PropertyCoverImage } from "@/components/property-cover-image";
import { LayoutDashboard } from "lucide-react";

type PriceBucket = "any" | "under10k" | "10to20" | "20to40" | "over40k";
type BedroomFilter = "any" | "1" | "2" | "3" | "4+";
type TypeFilter = Property["propertyType"] | "any";

const PROPERTY_TYPES: {
  value: TypeFilter;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "any", labelKey: "allTypes", icon: Compass },
  { value: "apartment", labelKey: "apartment", icon: Building2 },
  { value: "house", labelKey: "house", icon: HomeIcon },
  { value: "condominium", labelKey: "condominium", icon: Hotel },
  { value: "villa", labelKey: "villa", icon: Castle },
];

const PRICE_BUCKETS: { value: PriceBucket; labelKey: string }[] = [
  { value: "any", labelKey: "anyPrice" },
  { value: "under10k", labelKey: "under10k" },
  { value: "10to20", labelKey: "range10to20" },
  { value: "20to40", labelKey: "range20to40" },
  { value: "over40k", labelKey: "over40k" },
];

const BEDROOM_OPTIONS: { value: BedroomFilter; labelKey: string }[] = [
  { value: "any", labelKey: "anyBedrooms" },
  { value: "1", labelKey: "oneBed" },
  { value: "2", labelKey: "twoBeds" },
  { value: "3", labelKey: "threeBeds" },
  { value: "4+", labelKey: "fourPlusBeds" },
];

const GRADIENTS = [
  "from-sky-500 via-blue-500 to-indigo-600",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-rose-500 via-pink-500 to-fuchsia-600",
  "from-amber-500 via-orange-500 to-red-500",
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-lime-500 via-green-500 to-emerald-600",
  "from-cyan-500 via-sky-500 to-blue-600",
  "from-fuchsia-500 via-pink-500 to-rose-600",
];

function gradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function matchesPrice(rent: number, bucket: PriceBucket): boolean {
  switch (bucket) {
    case "under10k":  return rent < 10000;
    case "10to20":    return rent >= 10000 && rent <= 20000;
    case "20to40":    return rent > 20000 && rent <= 40000;
    case "over40k":   return rent > 40000;
    default:          return true;
  }
}

function matchesBedrooms(beds: number, filter: BedroomFilter): boolean {
  switch (filter) {
    case "1": return beds === 1;
    case "2": return beds === 2;
    case "3": return beds === 3;
    case "4+": return beds >= 4;
    default: return true;
  }
}

export default function ExplorePage() {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { toggleFavorite: toggleFav, isFavorite: isFav } = useFavorites();

  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("any");
  const [subCity, setSubCity] = useState<string>("any");
  const [price, setPrice] = useState<PriceBucket>("any");
  const [beds, setBeds] = useState<BedroomFilter>("any");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadProperties = async () => {
      setIsLoadingProperties(true);
      setPropertiesError(null);
      try {
        const result = await apiListPublicProperties("page=1&pageSize=100");
        if (!mounted) return;
        setProperties(result.items);
      } catch (error) {
        if (!mounted) return;
        const message =
          error instanceof Error ? error.message : "Failed to fetch available properties.";
        setProperties([]);
        setPropertiesError(message);
      } finally {
        if (mounted) {
          setIsLoadingProperties(false);
        }
      }
    };
    void loadProperties();
    return () => {
      mounted = false;
    };
  }, []);

  const rentable = useMemo(
    () => properties.filter((p) => p.status === "available"),
    []
  );

  const subCities = useMemo(() => {
    const set = new Set(rentable.map((p) => p.subCity));
    return Array.from(set).sort();
  }, [rentable]);

  // Top areas by listing count
  const topAreas = useMemo(() => {
    const counts = new Map<string, number>();
    rentable.forEach((p) => counts.set(p.subCity, (counts.get(p.subCity) ?? 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [rentable]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rentable.filter((p) => {
      if (type !== "any" && p.propertyType !== type) return false;
      if (subCity !== "any" && p.subCity !== subCity) return false;
      if (!matchesPrice(p.monthlyRent, price)) return false;
      if (!matchesBedrooms(p.bedrooms, beds)) return false;
      if (q) {
        const blob = `${p.title} ${p.address} ${p.subCity} ${p.propertyType} ${p.description}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [rentable, query, type, subCity, price, beds]);

  const avgRent = useMemo(() => {
    if (!rentable.length) return 0;
    return Math.round(rentable.reduce((s, p) => s + p.monthlyRent, 0) / rentable.length);
  }, [rentable]);

  // Featured pick = most expensive verified villa/house or first
  const featured = useMemo(() => {
    return (
      [...rentable].sort((a, b) => b.monthlyRent - a.monthlyRent)[0] ?? null
    );
  }, [rentable]);

  const clearFilters = () => {
    setQuery("");
    setType("any");
    setSubCity("any");
    setPrice("any");
    setBeds("any");
  };

  const hasActiveFilters =
    query !== "" || type !== "any" || subCity !== "any" || price !== "any" || beds !== "any";

  const toggleFavorite = (id: string) => {
    toggleFav(id);
  };

  const goRent = (propertyId: string) => {
    if (!isAuthenticated) {
      router.push(`/register?role=tenant&propertyId=${propertyId}`);
      return;
    }
    if (!user?.faydaVerified) {
      router.push(`/dashboard/verify-fayda?propertyId=${propertyId}`);
      return;
    }
    router.push(`/dashboard/properties/${propertyId}`);
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Horizontal Nav */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                  scrolled ? "bg-primary-700" : "bg-white/15 backdrop-blur-sm border border-white/20"
                }`}
              >
                <Building2 className={`w-5 h-5 ${scrolled ? "text-white" : "text-white"}`} />
              </div>
              <span className={`font-bold text-lg ${scrolled ? "text-slate-900" : "text-white"}`}>
                {t("landing", "brand")}
                <span className={scrolled ? "text-primary-600" : "text-primary-200"}>
                  {t("landing", "brandAccent")}
                </span>
              </span>
            </Link>

            {/* Horizontal pill links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/explore"
                className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  scrolled
                    ? "text-primary-700 bg-primary-50"
                    : "text-white bg-white/15 backdrop-blur-sm"
                }`}
              >
                {t("landing", "explore")}
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocale(locale === "en" ? "am" : "en")}
                className={`text-sm font-medium px-3 py-2 rounded-full flex items-center gap-1.5 transition-colors ${
                  scrolled
                    ? "text-slate-700 hover:bg-slate-100"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{locale === "en" ? "አማ" : "EN"}</span>
              </button>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`hidden sm:inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                      scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t("nav", "overviewTenant")}
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    className={`inline-flex items-center gap-2 text-sm font-semibold rounded-full transition-all hover:scale-105 pl-1 pr-3 py-1 ${
                      scrolled
                        ? "bg-primary-50 text-primary-700 hover:bg-primary-100"
                        : "bg-white/15 backdrop-blur-sm text-white border border-white/20 hover:bg-white/25"
                    }`}
                    title={`${user?.firstName} ${user?.lastName}`}
                  >
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {user ? getInitials(`${user.firstName} ${user.lastName}`) : "?"}
                    </span>
                    <span className="hidden md:inline">{user?.firstName}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                      scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
                    }`}
                  >
                    {t("landing", "signIn")}
                  </Link>
                  <Link
                    href="/register?role=tenant"
                    className={`text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-full transition-all hover:scale-105 ${
                      scrolled
                        ? "text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-600/20"
                        : "text-primary-700 bg-white hover:bg-primary-50 shadow-lg shadow-black/10"
                    }`}
                  >
                    {t("landing", "register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO — animated gradient + floating blobs */}
      <section className="relative overflow-hidden text-white">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-indigo-700 to-fuchsia-700 animate-gradient-pan" />

        {/* Floating blobs */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-cyan-400/30 blur-3xl animate-blob" />
        <div
          className="absolute top-20 -right-32 w-[32rem] h-[32rem] rounded-full bg-fuchsia-400/30 blur-3xl animate-blob"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute -bottom-32 left-1/3 w-[26rem] h-[26rem] rounded-full bg-amber-300/20 blur-3xl animate-blob"
          style={{ animationDelay: "6s" }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        {/* Floating decorative icons */}
        <HomeIcon
          className="hidden lg:block absolute top-32 right-[12%] w-10 h-10 text-white/20 animate-float-slow"
          style={{ animationDelay: "0.5s" }}
        />
        <Sparkles
          className="hidden lg:block absolute top-52 left-[10%] w-8 h-8 text-white/30 animate-float-slow"
          style={{ animationDelay: "2s" }}
        />
        <Building2
          className="hidden lg:block absolute bottom-40 right-[20%] w-12 h-12 text-white/15 animate-float-slow"
          style={{ animationDelay: "1.2s" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-6 border border-white/20 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              {t("explore", "heroKicker")}
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6 animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              {t("explore", "heroHeadline1")}
              <br />
              <span className="bg-gradient-to-r from-amber-200 via-rose-200 to-fuchsia-200 bg-clip-text text-transparent">
                {t("explore", "heroHeadline2")}
              </span>
            </h1>
            <p
              className="text-white/80 text-base sm:text-xl leading-relaxed mb-8 max-w-2xl animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              {t("explore", "heroHelper")}
            </p>

            {/* Big search */}
            <div
              className="group relative bg-white rounded-2xl p-2 shadow-2xl shadow-black/20 flex flex-col sm:flex-row items-stretch gap-2 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-5 h-5 text-slate-400 shrink-0 transition-colors group-focus-within:text-primary-600" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("explore", "searchPlaceholder")}
                  className="w-full py-3 text-slate-800 outline-none text-sm sm:text-base placeholder:text-slate-400"
                  onFocus={scrollToResults}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={scrollToResults}
                className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-primary-700/30 hover-shine"
              >
                {t("explore", "startSearching")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-3 gap-6 sm:gap-10 mt-10 max-w-xl animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              {[
                { value: rentable.length, label: t("explore", "heroStatHomes") },
                { value: subCities.length, label: t("explore", "heroStatSubcities") },
                { value: avgRent.toLocaleString(), label: t("explore", "heroStatAvg") },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight">{s.value}</div>
                  <div className="text-xs sm:text-sm text-white/70 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wavy divider */}
        <div className="absolute bottom-0 inset-x-0 leading-none">
          <svg
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            className="w-full h-12 sm:h-16"
            aria-hidden
          >
            <path
              d="M0,64L80,58.7C160,53,320,43,480,42.7C640,43,800,53,960,56C1120,59,1280,53,1360,50.7L1440,48L1440,80L1360,80C1280,80,1120,80,960,80C800,80,640,80,480,80C320,80,160,80,80,80L0,80Z"
              fill="#ffffff"
            />
          </svg>
        </div>
      </section>

      {/* Type chips — horizontal scroll */}
      <section className="relative -mt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {t("explore", "browseByType")}
            </h2>
            <span className="text-sm text-slate-500">
              {filtered.length} {filtered.length === 1 ? t("explore", "homeCount_one") : t("explore", "homeCount_other")}
            </span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar -mx-2 px-2 pb-2">
            {PROPERTY_TYPES.map((pt) => {
              const active = type === pt.value;
              const Icon = pt.icon;
              return (
                <button
                  key={pt.value}
                  onClick={() => setType(pt.value)}
                  className={`group shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                    active
                      ? "border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-600/25"
                      : "border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:text-primary-700"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      active ? "text-white" : "text-slate-500 group-hover:text-primary-600"
                    }`}
                  />
                  {t("explore", pt.labelKey)}
                </button>
              );
            })}

            <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

            {/* Price pill */}
            <PillSelect
              label={t("explore", PRICE_BUCKETS.find((p) => p.value === price)?.labelKey ?? "anyPrice")}
              active={price !== "any"}
              options={PRICE_BUCKETS.map((o) => ({ value: o.value, label: t("explore", o.labelKey) }))}
              value={price}
              onChange={(v) => setPrice(v as PriceBucket)}
            />

            {/* Bedrooms pill */}
            <PillSelect
              label={t("explore", BEDROOM_OPTIONS.find((b) => b.value === beds)?.labelKey ?? "anyBedrooms")}
              active={beds !== "any"}
              options={BEDROOM_OPTIONS.map((o) => ({ value: o.value, label: t("explore", o.labelKey) }))}
              value={beds}
              onChange={(v) => setBeds(v as BedroomFilter)}
            />

            {/* Sub-city pill */}
            <PillSelect
              label={subCity === "any" ? t("explore", "allSubCities") : subCity}
              active={subCity !== "any"}
              options={[
                { value: "any", label: t("explore", "allSubCities") },
                ...subCities.map((s) => ({ value: s, label: s })),
              ]}
              value={subCity}
              onChange={setSubCity}
            />

            <button
              onClick={() => setShowMoreFilters(true)}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              More
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <X className="w-4 h-4" />
                {t("explore", "clearFilters")}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Featured pick */}
      {featured && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl shadow-slate-900/5 animate-fade-in-up group">
            <div className="grid md:grid-cols-2">
              <div className="relative h-64 md:min-h-[22rem] overflow-hidden bg-slate-900">
                {featured.images[0] ? (
                  <>
                    <PropertyCoverImage
                      images={featured.images}
                      alt={featured.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                  </>
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradientFor(featured.id)}`}
                  >
                    <div className="absolute inset-0 mix-blend-overlay opacity-30 bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" />
                  </div>
                )}
                <Building2 className="absolute right-6 bottom-6 w-40 h-40 text-white/15 pointer-events-none" />
                <div className="absolute top-5 left-5 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("explore", "featuredPick")}
                </div>
              </div>

              <div className="p-6 sm:p-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit mb-4">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t("explore", "verified")}
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 leading-tight">
                  {featured.title}
                </h3>
                <div className="flex items-center gap-1.5 text-slate-500 mb-5">
                  <MapPin className="w-4 h-4" />
                  <span>{featured.subCity} · {featured.address}</span>
                </div>
                <p className="text-slate-600 mb-6 line-clamp-2">{featured.description}</p>

                <div className="flex items-center gap-5 text-sm text-slate-600 mb-6">
                  <span className="inline-flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-slate-400" />
                    <span>{featured.bedrooms} {t("explore", "bedsShort")}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Bath className="w-4 h-4 text-slate-400" />
                    <span>{featured.bathrooms} {t("explore", "bathsShort")}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-slate-400" />
                    <span>{featured.area} {t("explore", "sqmShort")}</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <div className="text-3xl font-bold text-slate-900">
                      {featured.monthlyRent.toLocaleString()}{" "}
                      <span className="text-base font-medium text-slate-500">ETB{t("explore", "perMonth")}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => toggleFavorite(featured.id)}
                        className="inline-flex items-center justify-center w-12 h-12 rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm"
                        aria-label={
                          isFav(featured.id)
                            ? t("explore", "favoriteAriaRemove")
                            : t("explore", "favoriteAriaAdd")
                        }
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isFav(featured.id) ? "fill-rose-500 text-rose-500" : "text-slate-600"
                          }`}
                        />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => goRent(featured.id)}
                      className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-primary-600/20 hover-shine"
                    >
                      <Key className="w-4 h-4" />
                      {t("explore", "rentThisHome")}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Popular areas row */}
      {topAreas.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {t("explore", "popularAreas")}
            </h2>
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar -mx-2 px-2 pb-2">
            {topAreas.map(([name, count], idx) => {
              const active = subCity === name;
              return (
                <button
                  key={name}
                  onClick={() => {
                    setSubCity(active ? "any" : name);
                    scrollToResults();
                  }}
                  className={`group shrink-0 w-48 h-32 rounded-2xl overflow-hidden relative text-left transition-all hover:-translate-y-1 hover:shadow-xl ${
                    active ? "ring-2 ring-primary-600 ring-offset-2" : ""
                  }`}
                  style={{ animation: `fade-in-up 0.6s ${idx * 0.05 + 0.1}s both` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <MapPin className="w-5 h-5 text-white/90" />
                    <div>
                      <div className="text-white font-bold text-lg leading-tight">{name}</div>
                      <div className="text-white/80 text-xs">
                        {count} {count === 1 ? t("explore", "homeCount_one") : t("explore", "homeCount_other")}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Results grid */}
      <section ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {filtered.length}{" "}
              {filtered.length === 1 ? t("explore", "homeCount_one") : t("explore", "homeCount_other")}
            </h2>
            <p className="text-slate-500 text-sm mt-1">{t("explore", "pageSubtitle")}</p>
          </div>
        </div>

        {isLoadingProperties ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center animate-fade-in-up">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading available homes...</h3>
            <p className="text-slate-500 text-sm">Please wait while we fetch properties from the server.</p>
          </div>
        ) : propertiesError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-12 text-center animate-fade-in-up">
            <h3 className="text-lg font-semibold text-rose-900 mb-2">Could not load homes</h3>
            <p className="text-rose-700 text-sm">{propertiesError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Search className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t("explore", "noMatches")}</h3>
            <p className="text-slate-500 text-sm mb-6">{t("explore", "tryDifferent")}</p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              {t("explore", "clearFilters")}
            </button>
          </div>
        ) : (
          <div
            key={`${type}-${subCity}-${price}-${beds}-${query}`}
            className="stagger grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                isFavorite={isFav(p.id)}
                onToggleFavorite={() => toggleFavorite(p.id)}
                onRent={() => goRent(p.id)}
                showFavorite={isAuthenticated}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              <BadgeCheck className="w-4 h-4" />
              {t("explore", "whyRent")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              {t("explore", "step1")} · {t("explore", "step2")} · {t("explore", "step3")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, titleKey: "whyRent1Title", descKey: "whyRent1Desc", color: "emerald" },
              { icon: Landmark, titleKey: "whyRent2Title", descKey: "whyRent2Desc", color: "primary" },
              { icon: FileSignature, titleKey: "whyRent3Title", descKey: "whyRent3Desc", color: "fuchsia" },
            ].map((f, i) => (
              <div
                key={f.titleKey}
                className="relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    f.color === "emerald"
                      ? "bg-emerald-100 text-emerald-600"
                      : f.color === "primary"
                        ? "bg-primary-100 text-primary-600"
                        : "bg-fuchsia-100 text-fuchsia-600"
                  }`}
                >
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{t("explore", f.titleKey)}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{t("explore", f.descKey)}</p>
                <ChevronRight className="absolute top-6 right-6 w-4 h-4 text-slate-300 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary-700 via-indigo-700 to-fuchsia-700 animate-gradient-pan text-white">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-300/20 blur-3xl animate-blob" />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl animate-blob"
          style={{ animationDelay: "4s" }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium mb-5 border border-white/20 animate-bounce-subtle">
            <Sparkles className="w-4 h-4" />
            {t("explore", "loveIt")}
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">{t("landing", "ctaTitle")}</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto text-lg">{t("explore", "loveItDesc")}</p>
          <Link
            href={isAuthenticated ? "/dashboard" : "/register?role=tenant"}
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-4 rounded-xl hover:bg-primary-50 transition-all hover:scale-105 shadow-2xl hover-shine"
          >
            {isAuthenticated ? t("nav", "overviewTenant") : t("landing", "ctaButton")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">
              {t("landing", "brand")}
              {t("landing", "brandAccent")}
            </span>
          </div>
          <span>{t("landing", "footerRights")}</span>
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t("explore", "backToHome")}
          </Link>
        </div>
      </footer>

      {/* More filters modal */}
      {showMoreFilters && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm animate-fade-in flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowMoreFilters(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-slate-900">{t("explore", "filtersTitle")}</h3>
              <button
                onClick={() => setShowMoreFilters(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
                aria-label="Close filters"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {t("explore", "anyPrice")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRICE_BUCKETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPrice(p.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        price === p.value
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-white text-slate-700 border-slate-200 hover:border-primary-300"
                      }`}
                    >
                      {t("explore", p.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {t("explore", "anyBedrooms")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {BEDROOM_OPTIONS.map((b) => (
                    <button
                      key={b.value}
                      onClick={() => setBeds(b.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        beds === b.value
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-white text-slate-700 border-slate-200 hover:border-primary-300"
                      }`}
                    >
                      {t("explore", b.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {t("explore", "allSubCities")}
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto scrollbar-thin">
                  <button
                    onClick={() => setSubCity("any")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      subCity === "any"
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-slate-700 border-slate-200 hover:border-primary-300"
                    }`}
                  >
                    {t("explore", "allSubCities")}
                  </button>
                  {subCities.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubCity(s)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        subCity === s
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-white text-slate-700 border-slate-200 hover:border-primary-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-7">
              <button
                onClick={() => {
                  clearFilters();
                }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {t("explore", "clearFilters")}
              </button>
              <button
                onClick={() => setShowMoreFilters(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                {t("explore", "applyFilters")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PillSelect({
  label,
  options,
  value,
  onChange,
  active,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  active: boolean;
}) {
  return (
    <label
      className={`shrink-0 relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 ${
        active
          ? "border-primary-600 bg-primary-50 text-primary-700"
          : "border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:text-primary-700"
      }`}
    >
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PropertyCard({
  property,
  isFavorite,
  onToggleFavorite,
  onRent,
  showFavorite,
  t,
}: {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onRent: () => void;
  showFavorite: boolean;
  t: (section: keyof TranslationKeys, key: string) => string;
}) {
  const gradient = gradientFor(property.id);
  const typeLabel = t("explore", property.propertyType);

  return (
    <article className="group relative bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-500 hover:-translate-y-1 flex flex-col">
      {/* Image / gradient */}
      <div className={`relative h-56 overflow-hidden bg-slate-900`}>
        {property.images[0] ? (
          <>
            <PropertyCoverImage
              images={property.images}
              alt={property.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          </>
        ) : (
          <>
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-[1500ms] group-hover:scale-110`}
            />
            <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" />
            <Building2 className="absolute right-4 bottom-4 w-24 h-24 text-white/20 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
          </>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t("explore", "verified")}
          </span>
          <span className="bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
            {typeLabel}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 flex items-end">
          <div className="text-white">
            <div className="text-2xl font-bold drop-shadow-lg">
              {property.monthlyRent.toLocaleString()}{" "}
              <span className="text-sm font-medium opacity-90">ETB{t("explore", "perMonth")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-900 text-lg leading-snug mb-1.5 line-clamp-1 group-hover:text-primary-700 transition-colors">
          {property.title}
        </h3>
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-1">
            {property.subCity}
            {property.woreda ? ` · Woreda ${property.woreda}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4 pb-4 border-b border-slate-100">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-slate-400" />
            <span>{property.bedrooms} {t("explore", "bedsShort")}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath className="w-4 h-4 text-slate-400" />
            <span>{property.bathrooms} {t("explore", "bathsShort")}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ruler className="w-4 h-4 text-slate-400" />
            <span>{property.area} {t("explore", "sqmShort")}</span>
          </span>
        </div>

        {property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {property.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="inline-flex items-center text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md"
              >
                {a}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="inline-flex items-center text-xs text-slate-500 px-2 py-1">
                +{property.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex gap-2">
          {showFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50 transition-all"
              aria-label={
                isFavorite ? t("explore", "favoriteAriaRemove") : t("explore", "favoriteAriaAdd")
              }
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-600"
                }`}
              />
            </button>
          )}
          <button
            type="button"
            onClick={onRent}
            className={`inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-primary-600 text-white font-semibold py-3 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-primary-600/20 hover-shine ${
              showFavorite ? "flex-1 min-w-0" : "w-full"
            }`}
          >
            <Key className="w-4 h-4 shrink-0" />
            <span className="truncate">{t("explore", "rentThisHome")}</span>
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </article>
  );
}
