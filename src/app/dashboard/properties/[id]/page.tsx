"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/header";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { apiGetProperty, apiListAgreements, getAccessToken } from "@/lib/api";
import type { Property, TenancyAgreement } from "@/lib/types";
import { getStatusColor } from "@/lib/utils";
import {
  Building2, MapPin, BedDouble, Bath, Ruler, User, Calendar,
  ArrowLeft, CheckCircle2, FileText, FileSignature, ArrowRight,
  UserSearch, Scissors, TrendingUp, Clock, AlertTriangle,
  Info, X, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

function monthsBetween(from: string, to: Date): number {
  const d = new Date(from);
  return (to.getFullYear() - d.getFullYear()) * 12 + (to.getMonth() - d.getMonth());
}

function Modal({
  title, children, onClose,
}: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-900">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { user } = useAuth();
  const { t, formatCurrency, formatDate, formatStatus } = useLanguage();
  const params = useParams();
  const id = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [agreements, setAgreements] = useState<TenancyAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"" | "termination" | "upscaling">("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !id) return;
    setLoading(true);
    Promise.all([
      apiGetProperty(token, id),
      apiListAgreements(token, `propertyId=${id}&pageSize=50`).catch(() => ({ items: [] })),
    ])
      .then(([prop, agrs]) => {
        setProperty(prop);
        setAgreements(agrs.items);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Property not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Header title={t("properties", "propertyDetails")} />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading property…</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !property) {
    return (
      <>
        <Header title={t("common", "propertyNotFound")} />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 font-medium">{error ?? "Property not found."}</p>
            <Link href="/dashboard/properties" className="mt-3 inline-block text-primary-600 text-sm hover:underline">
              Back to Properties
            </Link>
          </div>
        </main>
      </>
    );
  }

  const isTenant = user?.role === "tenant";
  const isLandlord = user?.role === "landlord";
  const isOwner = isLandlord && user?.id === property.landlordId;

  const activeAgreement = agreements.find(
    (a) => a.status === "active" || a.status === "extended"
  );
  const today = new Date();
  const monthsOccupied = activeAgreement ? monthsBetween(activeAgreement.startDate, today) : 0;
  const twoYearsMet = monthsOccupied >= 24;
  const unlockDate = activeAgreement
    ? (() => {
        const d = new Date(activeAgreement.startDate);
        d.setFullYear(d.getFullYear() + 2);
        return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
      })()
    : "";

  const isOccupied = property.status === "rented";
  const isApproved = property.status === "available";

  return (
    <>
      <Header title={t("properties", "propertyDetails")} />

      {modal === "termination" && (
        <Modal title="Request Lease Termination" onClose={() => { setModal(""); setSubmitted(false); }}>
          <p className="text-sm text-stone-600">
            You are requesting early termination of the tenancy for <strong>{property.title}</strong>.
            This will be reviewed by DARA and communicated to the tenant with the required{" "}
            <strong>90-day notice period</strong>.
          </p>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Termination requests must comply with Proclamation 1320/2016. Unjustified eviction may result in penalties.
            </p>
          </div>
          {submitted ? (
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="w-5 h-5" /> Request submitted to DARA.
            </div>
          ) : (
            <button
              onClick={() => setSubmitted(true)}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              Confirm Termination Request
            </button>
          )}
        </Modal>
      )}

      {modal === "upscaling" && (
        <Modal title="Request Rent Payment Upscaling" onClose={() => { setModal(""); setSubmitted(false); }}>
          <p className="text-sm text-stone-600">
            You are requesting a rent increase for <strong>{property.title}</strong>.
            Current rent: <strong>{formatCurrency(property.monthlyRent)}/mo</strong>.
          </p>
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Annual increases are capped at <strong>7%</strong> by Proclamation 1320/2016, Art. 12.
              DARA will review and approve the request.
            </p>
          </div>
          {submitted ? (
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="w-5 h-5" /> Upscaling request submitted to DARA.
            </div>
          ) : (
            <button
              onClick={() => setSubmitted(true)}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              Submit Upscaling Request
            </button>
          )}
        </Modal>
      )}

      <main className="flex-1 p-6 overflow-y-auto">
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-primary-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Properties
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="relative h-64 bg-stone-100">
                {property.images[0] ? (
                  <img src={property.images[0]} alt={property.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-stone-300" />
                  </div>
                )}
                {/* Status overlay */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(property.status)}`}>
                    {formatStatus(property.status)}
                  </span>
                </div>
              </div>
              {property.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto border-t border-stone-100 bg-stone-50/80">
                  {property.images.slice(1).map((src, idx) => (
                    <img key={`${src}-${idx}`} src={src} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover border border-stone-200" loading="lazy" />
                  ))}
                </div>
              )}
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-stone-900 mb-1">{property.title}</h2>
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{property.address}, {property.subCity} Sub-City, Woreda {property.woreda}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-stone-100">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-stone-400" />
                    <div><p className="text-sm font-semibold">{property.bedrooms}</p><p className="text-xs text-stone-500">Bedrooms</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-stone-400" />
                    <div><p className="text-sm font-semibold">{property.bathrooms}</p><p className="text-xs text-stone-500">Bathrooms</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-stone-400" />
                    <div><p className="text-sm font-semibold">{property.area} m²</p><p className="text-xs text-stone-500">Area</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-stone-400" />
                    <div><p className="text-sm font-semibold capitalize">{property.propertyType}</p><p className="text-xs text-stone-500">Type</p></div>
                  </div>
                </div>

                {property.description && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-stone-900 mb-2">Description</h3>
                    <p className="text-sm text-stone-600 leading-relaxed">{property.description}</p>
                  </div>
                )}

                {property.amenities.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-stone-900 mb-2">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />{a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {property.homeCondition && (
                  <div className="mt-4 p-3 bg-stone-50 rounded-lg border border-stone-100">
                    <p className="text-xs text-stone-500">
                      Condition: <span className="font-medium text-stone-700 capitalize">{property.homeCondition.replace(/_/g, " ")}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {agreements.length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200">
                <div className="px-6 py-4 border-b border-stone-100">
                  <h3 className="text-sm font-semibold text-stone-900">Tenancy Agreements</h3>
                </div>
                <div className="divide-y divide-stone-100">
                  {agreements.map((agreement) => (
                    <Link key={agreement.id} href={`/dashboard/agreements/${agreement.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-stone-400" />
                        <div>
                          <p className="text-sm font-medium text-stone-900">{agreement.tenantName}</p>
                          <p className="text-xs text-stone-500">{formatDate(agreement.startDate)} – {formatDate(agreement.endDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{formatCurrency(agreement.monthlyRent)}/mo</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agreement.status)}`}>{formatStatus(agreement.status)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <p className="text-sm text-stone-500 mb-1">Monthly Rent</p>
              <p className="text-3xl font-bold text-primary-700">{formatCurrency(property.monthlyRent)}</p>
              <p className="text-xs text-stone-400 mt-1">per month</p>

              {isTenant && isApproved && (
                <Link
                  href={`/dashboard/properties/${property.id}/contract`}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-xl transition-all hover:scale-[1.02] shadow-md shadow-primary-600/20"
                >
                  <FileSignature className="w-5 h-5" /> Sign Contract <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              )}

              {isOwner && isOccupied && (
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Landlord Actions</p>
                  {activeAgreement && (
                    <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-xs text-stone-600 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      Rented since {formatDate(activeAgreement.startDate)} · {monthsOccupied} months
                    </div>
                  )}
                  {!twoYearsMet && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      Termination & upscaling requests unlock after 2 full years of tenancy.
                      Available from <strong className="ml-1">{unlockDate}</strong>.
                    </div>
                  )}
                  <button
                    disabled={!twoYearsMet}
                    onClick={() => setModal("termination")}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      twoYearsMet ? "border-red-300 text-red-700 hover:bg-red-50" : "border-stone-200 text-stone-400 cursor-not-allowed bg-stone-50"
                    }`}
                  >
                    <Scissors className="w-4 h-4" /> Request Termination
                  </button>
                  <button
                    disabled={!twoYearsMet}
                    onClick={() => setModal("upscaling")}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      twoYearsMet ? "border-primary-300 text-primary-700 hover:bg-primary-50" : "border-stone-200 text-stone-400 cursor-not-allowed bg-stone-50"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" /> Request Payment Upscaling
                  </button>
                </div>
              )}

              {isOwner && isApproved && (
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Landlord Actions</p>
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium cursor-default"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Listed on Explore
                  </button>
                  <Link
                    href={`/dashboard/properties/${property.id}/rent-to-tenant`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-all"
                  >
                    <UserSearch className="w-4 h-4" /> Rent to Specific Tenant
                  </Link>
                </div>
              )}

              {isOwner && property.status === "pending_verification" && (
                <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  This property is pending DARA verification. Actions will become available once approved.
                </div>
              )}
            </div>

            {/* Property Owner */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-3">Property Owner</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">{property.landlordName}</p>
                  <p className="text-xs text-stone-500">Verified Landlord</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 mb-1">Timeline</h3>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-stone-400" />
                <span className="text-stone-500">Registered:</span>
                <span className="text-stone-700">{formatDate(property.createdAt)}</span>
              </div>
              {property.verifiedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-stone-500">Verified:</span>
                  <span className="text-stone-700">{formatDate(property.verifiedAt)}</span>
                </div>
              )}
              {activeAgreement && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-primary-400" />
                  <span className="text-stone-500">Rented since:</span>
                  <span className="text-stone-700">{formatDate(activeAgreement.startDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
