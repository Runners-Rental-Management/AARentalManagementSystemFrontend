"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Fingerprint,
  MapPin,
  Phone,
  Shield,
  User,
} from "lucide-react";
import type { TenantPublicProfile } from "@/lib/types";
import { getInitials } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

function ReadOnlyField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | undefined;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      <div className="px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700">
        {value || "—"}
      </div>
    </div>
  );
}

export function TenantPublicProfileView({
  tenant,
  actions,
}: {
  tenant: TenantPublicProfile;
  actions?: React.ReactNode;
}) {
  const { t, formatDate } = useLanguage();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-sm shrink-0">
            {getInitials(tenant.fullName || `${tenant.firstName} ${tenant.lastName}`)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-stone-900">{tenant.fullName}</h2>
            <p className="text-sm text-stone-500">{t("components", "registeredTenant")}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {tenant.faydaVerified ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {t("components", "faydaVerified")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  {t("components", "identityUnverified")}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-stone-500">
                <Calendar className="w-3.5 h-3.5" />
                {t("components", "memberSince")} {formatDate(tenant.createdAt)}
              </span>
            </div>
          </div>
          {actions}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">{t("components", "faydaIdentity")}</h3>
              <p className="text-xs text-stone-500">{t("components", "verifiedNationalId")}</p>
            </div>
          </div>
          {tenant.faydaVerified && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("components", "verified")}
            </span>
          )}
        </div>
        <div className="p-6 space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            <ReadOnlyField icon={User} label={t("components", "firstName")} value={tenant.firstName} />
            <ReadOnlyField icon={User} label={t("components", "fathersName")} value={tenant.fatherName} />
            <ReadOnlyField
              icon={User}
              label={t("fayda", "grandfatherName")}
              value={tenant.grandfatherName}
            />
          </div>
          <ReadOnlyField
            icon={Fingerprint}
            label={t("fayda", "faydaNumber")}
            value={tenant.maskedFaydaNumber ?? undefined}
          />
          {tenant.faydaVerifiedAt && (
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Identity verified on{" "}
              <span className="font-medium text-stone-700">
                {new Date(tenant.faydaVerifiedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-stone-900">{t("components", "contactActivity")}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <ReadOnlyField icon={Phone} label={t("components", "phone")} value={tenant.phone} />
          <ReadOnlyField icon={MapPin} label={t("components", "address")} value={tenant.address} />
        </div>
        <p className="text-xs text-stone-500">
          This tenant has {tenant.agreementCountAsTenant} recorded agreement
          {tenant.agreementCountAsTenant === 1 ? "" : "s"} on the platform.
        </p>
      </div>
    </div>
  );
}

export function ViewTenantProfileLink({
  tenantId,
  className = "",
  label,
}: {
  tenantId: string;
  className?: string;
  label?: string;
}) {
  const { t } = useLanguage();
  const linkLabel = label ?? t("components", "viewProfile");
  if (!tenantId || tenantId.startsWith("fayda_")) return null;

  return (
    <Link
      href={`/dashboard/tenants/${tenantId}`}
      className={`inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline ${className}`}
    >
      <User className="w-3.5 h-3.5" />
      {linkLabel}
    </Link>
  );
}
