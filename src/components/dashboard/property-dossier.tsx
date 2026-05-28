"use client";

import Link from "next/link";
import { Building2, MapPin, Paperclip, Sparkles } from "lucide-react";
import type { Property } from "@/lib/types";
import type { LiveStatus } from "@/context/rental-flow-context";
import { useLanguage } from "@/context/language-context";

/* ------------------------------------------------------------------ */
/*  File-number generator — deterministic from property id             */
/* ------------------------------------------------------------------ */

const SUBCITY_CODE: Record<string, string> = {
  Bole: "BL",
  Kirkos: "KK",
  Lideta: "LD",
  Arada: "AR",
  Yeka: "YK",
  "Addis Ketema": "AK",
  Gullele: "GL",
  "Nifas Silk-Lafto": "NS",
  "Lemi Kura": "LK",
  "Kolfe Keranio": "KL",
  "Akaky Kaliti": "AY",
};

function fileNumberFor(p: Property): string {
  const sub = SUBCITY_CODE[p.subCity] ?? "AA";
  const year = new Date(p.createdAt).getFullYear() || 2026;
  let h = 0;
  for (let i = 0; i < p.id.length; i++) {
    h = (h * 31 + p.id.charCodeAt(i)) >>> 0;
  }
  const seq = String(1000 + (h % 9000));
  return `DARA/${sub}/${year}/${seq}`;
}

/* ------------------------------------------------------------------ */
/*  Dossier card                                                       */
/* ------------------------------------------------------------------ */

interface Props {
  property: Property;
  isJustSubmitted?: boolean;
  /** index in the grid — used for subtle rotation variance */
  index?: number;
  /** live agreement status for this property (if any) */
  liveStatus?: LiveStatus | null;
}

export function PropertyDossier({ property, isJustSubmitted = false, index = 0, liveStatus }: Props) {
  const { t, formatCurrency, formatDate } = useLanguage();

  const stampMeta: Record<string, { label: string; cls: string; rot: string }> = {
    pending_verification: {
      label: t("components", "pendingReview"),
      cls: "stamp-pending",
      rot: "-7deg",
    },
    available: {
      label: t("components", "openForRent"),
      cls: "stamp-available",
      rot: "-5deg",
    },
    rented: { label: t("components", "occupied"), cls: "stamp-rented", rot: "4deg" },
    rejected: { label: t("components", "rejected"), cls: "stamp-rejected", rot: "-9deg" },
  };

  const liveBannerMeta: Partial<
    Record<LiveStatus, { label: string; sub: string; cls: string }>
  > = {
    landlord_initiated: {
      label: t("components", "pendingTenantApproval"),
      sub: t("components", "awaitingTenantSignature"),
      cls: "bg-violet-100 text-violet-800 border-violet-300",
    },
    tenant_signed: {
      label: t("components", "pendingLandlordSign"),
      sub: t("components", "awaitingLandlordCounterSign"),
      cls: "bg-amber-100 text-amber-800 border-amber-300",
    },
    landlord_signed: {
      label: t("components", "pendingOfficerVerification"),
      sub: t("components", "daraReviewingCompliance"),
      cls: "bg-primary-100 text-primary-800 border-primary-300",
    },
    dara_approved: {
      label: t("components", "awaitingAdvance"),
      sub: t("components", "tenantPaymentPending"),
      cls: "bg-emerald-100 text-emerald-800 border-emerald-300",
    },
    paid: {
      label: t("components", "rentedActive"),
      sub: t("components", "advancePaymentConfirmed"),
      cls: "bg-primary-100 text-primary-800 border-primary-300",
    },
    tenant_cancelled: {
      label: t("components", "withdrawnByTenant"),
      sub: t("components", "tenantCancelledBeforePayment"),
      cls: "bg-red-100 text-red-800 border-red-300",
    },
    landlord_cancelled: {
      label: t("components", "cancelledByYou"),
      sub: t("components", "tenantDaraNotified"),
      cls: "bg-red-100 text-red-800 border-red-300",
    },
    rejected: {
      label: t("components", "declinedByTenant"),
      sub: t("components", "tenantDeclinedContract"),
      cls: "bg-red-100 text-red-800 border-red-300",
    },
  };

  const stamp = stampMeta[property.status] ?? stampMeta.available;
  const liveBanner = liveStatus ? liveBannerMeta[liveStatus] : null;
  const fileNo = fileNumberFor(property);
  const filed = formatDate(property.createdAt);

  // Subtle, deterministic per-card tilt for "stack of papers" feel
  const tilts = ["-0.6deg", "0.4deg", "-0.3deg", "0.7deg", "-0.5deg", "0.2deg"];
  const tilt = tilts[index % tilts.length];

  return (
    <Link
      href={`/dashboard/properties/${property.id}`}
      className="dossier-link group dossier-shadow"
      style={{ transform: `rotate(${tilt})` }}
    >
      <div
        className="dossier-paper relative paper-manila rounded-md overflow-hidden border border-stone-400/30"
        style={{ minHeight: 348 }}
      >
        {/* ── Folder tab w/ file # ── */}
        <div className="dossier-tab px-4 py-2.5 flex items-center justify-between gap-2">
          <span className="typewriter text-[10px] font-bold text-stone-800 tracking-widest truncate">
            {fileNo}
          </span>
          <span className="typewriter text-[9px] font-bold text-stone-600 shrink-0">
            {t("components", "filedPrefix")} {filed}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="p-4 pt-3 relative">
          {/* Photo paper-clipped */}
          <div className="grid grid-cols-[92px_1fr] items-start gap-3.5 mb-4">
            <div className="relative shrink-0">
              {/* Paperclip */}
              <Paperclip
                className="absolute -top-2.5 -left-1 w-4.5 h-4.5 text-stone-500 drop-shadow z-10"
                style={{ transform: "rotate(-30deg)" }}
                strokeWidth={2.5}
              />
              {/* Photo */}
              <div
                className="w-[88px] h-[88px] bg-white border-[3px] border-white shadow-sm overflow-hidden rounded-[2px]"
                style={{ transform: "rotate(-1.5deg)" }}
              >
                {property.images[0] ? (
                  <img
                    src={property.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-stone-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Type-written subject */}
            <div className="min-w-0 pt-0.5">
              <p className="typewriter text-[9px] font-bold tracking-widest text-stone-500 uppercase mb-1">
                {t("components", "subject")}
              </p>
              <p className="typewriter text-sm font-bold text-stone-900 leading-snug line-clamp-2 min-h-[2.35rem]">
                {property.title}
              </p>
              <div className="typewriter text-[10px] text-stone-500 mt-1.5 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 mt-[1px] shrink-0" />
                <span className="line-clamp-1">{property.address}</span>
              </div>
            </div>
          </div>

          {/* Form-style key/value rows */}
          <dl className="space-y-1.5 typewriter text-[11px] text-stone-800 border-t border-dashed border-stone-300 pt-2.5 min-h-[104px]">
            <Row label={t("components", "property")} value={property.propertyType.toUpperCase()} />
            <Row
              label={t("components", "subCity")}
              value={`${property.subCity} · ${t("components", "woreda")} ${property.woreda}`}
            />
            <Row
              label={t("components", "specs")}
              value={`${property.bedrooms} BR · ${property.bathrooms} BA · ${property.area} m²`}
            />
            <Row
              label={t("components", "rent")}
              value={`${formatCurrency(property.monthlyRent)} / mo`}
              accent
            />
          </dl>

          {/* "New" badge for just-submitted */}
          {isJustSubmitted && (
            <div className="absolute top-2 right-2 inline-flex items-center gap-1 bg-primary-600 text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wider shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              {t("components", "new")}
            </div>
          )}

          {/* Live agreement status banner */}
          {liveBanner && (
            <div className={`mt-3 rounded border px-2.5 py-1.5 ${liveBanner.cls}`}>
              <p className="typewriter text-[9px] font-bold tracking-widest uppercase">
                {liveBanner.label}
              </p>
              <p className="typewriter text-[9px] text-stone-600 mt-0.5">{liveBanner.sub}</p>
            </div>
          )}

          {/* Footer meta + stamp (no overlap) */}
          <div className="mt-3 pt-2 border-t border-dashed border-stone-300 flex items-center justify-between gap-2">
            <span className="typewriter text-[10px] text-stone-500">
              {t("components", "daraReviewTrack")}
            </span>
            <div
              className={`stamp ${stamp.cls} animate-stamp text-[10px]`}
              style={{ ["--stamp-rot" as string]: stamp.rot } as React.CSSProperties}
            >
              {stamp.label}
            </div>
          </div>

          {/* Folded corner shadow */}
          <div className="dossier-corner-fold" />
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="grid grid-cols-[74px_1fr] items-baseline gap-2">
      <dt className="text-[9px] font-bold tracking-widest text-stone-500 uppercase">
        {label}
      </dt>
      <dd
        className={`truncate ${
          accent ? "text-primary-700 font-bold text-[12px]" : "text-stone-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
