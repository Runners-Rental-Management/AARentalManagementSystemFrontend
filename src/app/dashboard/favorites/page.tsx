"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Heart,
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  ShieldCheck,
  Compass,
  ArrowRight,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useFavorites } from "@/context/favorites-context";
import { properties } from "@/lib/dummy-data";
import type { Property } from "@/lib/types";
import { PropertyCoverImage } from "@/components/property-cover-image";

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

export default function FavoritesPage() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { favorites, removeFavorite, clearFavorites, count } = useFavorites();
  const router = useRouter();

  const savedProps = useMemo<Property[]>(
    () => favorites.map((id) => properties.find((p) => p.id === id)).filter(Boolean) as Property[],
    [favorites]
  );

  const goRent = (id: string) => {
    if (!isAuthenticated) {
      router.push(`/register?role=tenant&propertyId=${id}`);
      return;
    }
    router.push(`/dashboard/properties/${id}`);
  };

  const countLabel =
    count === 1
      ? t("favorites", "savedCount_one")
      : t("favorites", "savedCount_other");

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-700 animate-gradient-pan" />
        <div className="absolute -top-24 -left-24 w-[26rem] h-[26rem] rounded-full bg-amber-300/25 blur-3xl animate-blob" />
        <div
          className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-sky-400/25 blur-3xl animate-blob"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-4 border border-white/20 text-white animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            {countLabel}: {count}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="text-white">
              <h1
                className="text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight mb-3 animate-fade-in-up"
                style={{ animationDelay: "0.05s" }}
              >
                {t("favorites", "pageTitle")}
              </h1>
              <p
                className="text-white/85 max-w-2xl animate-fade-in-up"
                style={{ animationDelay: "0.12s" }}
              >
                {t("favorites", "pageSubtitle")}
              </p>
            </div>
            <div
              className="flex flex-wrap items-center gap-2 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 bg-white text-rose-700 font-semibold px-5 py-3 rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-black/10"
              >
                <Compass className="w-4 h-4" />
                {t("favorites", "startBrowsing")}
              </Link>
              {count > 0 && (
                <button
                  onClick={clearFavorites}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white font-semibold px-5 py-3 rounded-2xl hover:bg-white/20 border border-white/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("favorites", "remove")}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 leading-none">
          <svg
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            className="w-full h-10 sm:h-14"
            aria-hidden
          >
            <path
              d="M0,64L80,58.7C160,53,320,43,480,42.7C640,43,800,53,960,56C1120,59,1280,53,1360,50.7L1440,48L1440,80L1360,80C1280,80,1120,80,960,80C800,80,640,80,480,80C320,80,160,80,80,80L0,80Z"
              fill="rgb(248 250 252)"
            />
          </svg>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {savedProps.length === 0 ? (
          <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 py-16 px-6 text-center animate-fade-in-up">
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-rose-100 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-sky-100 blur-3xl" />
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-600/20 mb-5 animate-bounce-subtle">
                <Heart className="w-10 h-10 text-white fill-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                {t("favorites", "empty")}
              </h2>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                {t("favorites", "emptyDesc")}
              </p>
              <Link
                href="/explore"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold px-6 py-3.5 rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-rose-500/20"
              >
                <Compass className="w-5 h-5 transition-transform group-hover:rotate-12" />
                {t("favorites", "startBrowsing")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {savedProps.map((p, idx) => {
              const g = gradientFor(p.id);
              return (
                <div
                  key={p.id}
                  className="group relative bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                  style={{ animation: `fade-in-up 0.5s ${idx * 0.05}s both` }}
                >
                  <Link href={`/dashboard/properties/${p.id}`} className="block">
                    <div className="relative h-48 overflow-hidden bg-slate-900">
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
                          <Building2 className="absolute right-3 bottom-3 w-24 h-24 text-white/15" />
                        </>
                      )}

                      <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
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
                  </Link>

                  {/* Unfavorite button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFavorite(p.id);
                    }}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 text-rose-600 flex items-center justify-center shadow-md hover:scale-110 hover:bg-rose-50 transition-all"
                    aria-label={t("favorites", "remove")}
                    title={t("favorites", "remove")}
                  >
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                  </button>

                  <div className="p-5">
                    <Link
                      href={`/dashboard/properties/${p.id}`}
                      className="block"
                    >
                      <h3 className="font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-primary-700 transition-colors">
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 mb-3">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {p.subCity} · {p.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mb-4">
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
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/properties/${p.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors"
                      >
                        {t("favorites", "viewDetails")}
                      </Link>
                      <button
                        onClick={() => goRent(p.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-sm font-semibold px-3 py-2.5 rounded-xl hover:scale-[1.02] transition-transform shadow-sm shadow-primary-600/20"
                      >
                        {t("favorites", "rentThis")}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
