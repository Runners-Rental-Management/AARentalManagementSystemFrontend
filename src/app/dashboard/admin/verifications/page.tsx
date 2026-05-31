"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { useRentalFlow, type LiveAgreement } from "@/context/rental-flow-context";
import { ContractBody, type ContractBodyProps } from "@/components/dashboard/contract-body";
import { properties, agreements as staticAgreements, users } from "@/lib/dummy-data";
import type { TenancyAgreement } from "@/lib/types";
import { formatCurrency, formatDate, getStatusColor, formatStatus } from "@/lib/utils";
import { proceduralSignatureDataUrl } from "@/lib/procedural-signature";
import {
  ShieldCheck,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  FileSignature,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Tab = "properties" | "agreements";

type AgreementReviewItem =
  | { kind: "static"; agreement: TenancyAgreement }
  | { kind: "live"; agreement: LiveAgreement };

function leaseYearsBetween(startDate: string, endDate: string): number {
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return 2;
  const years = Math.round((e - s) / (365.25 * 86400000));
  return Math.max(1, years);
}

function buildContractReviewProps(
  item: AgreementReviewItem,
  locale: string
): ContractBodyProps {
  const landlord = users.find((u) => u.id === item.agreement.landlordId);
  const tenant = users.find((u) => u.id === item.agreement.tenantId);
  const property = properties.find((p) => p.id === item.agreement.propertyId);
  const monthlyRent = item.agreement.monthlyRent;
  const advance =
    item.kind === "static"
      ? item.agreement.advancePayment
      : item.agreement.advanceAmount;
  const advanceMonths = Math.max(1, Math.round(advance / monthlyRent));

  let startDate: string;
  let endDate: string;
  if (item.kind === "static") {
    startDate = item.agreement.startDate;
    endDate = item.agreement.endDate;
  } else {
    const base =
      item.agreement.landlordSignedAt ||
      item.agreement.tenantSignedAt ||
      new Date().toISOString();
    const d0 = new Date(base);
    startDate = d0.toISOString().slice(0, 10);
    const d1 = new Date(d0);
    d1.setFullYear(d1.getFullYear() + 2);
    endDate = d1.toISOString().slice(0, 10);
  }

  const leaseDuration = leaseYearsBetween(startDate, endDate);
  const todayFmt = new Date(startDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return {
    locale,
    today: todayFmt,
    landlordName: item.agreement.landlordName,
    landlordAddress: landlord?.address ?? "Addis Ababa",
    tenantName: item.agreement.tenantName,
    tenantAddress: tenant?.address ?? "Addis Ababa",
    propertyAddress: item.agreement.propertyAddress,
    propertyType: property?.propertyType ?? "house",
    monthlyRent: monthlyRent.toLocaleString(),
    advanceMonths,
    advanceAmount: advance.toLocaleString(),
    leaseDuration,
    paymentDeadlineDay: 5,
  };
}

function ESignatureCard({
  roleLabel,
  name,
  signedAt,
  imageSrc,
}: {
  roleLabel: string;
  name: string;
  signedAt: string;
  imageSrc: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-3">
      <div className="flex items-center gap-2 text-stone-500">
        <User className="w-4 h-4 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {roleLabel}
        </span>
      </div>
      <p className="text-sm font-semibold text-stone-900">{name}</p>
      <div className="min-h-[108px] rounded-lg border border-dashed border-stone-300 bg-white flex items-center justify-center p-3">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={`${roleLabel} e-signature`}
            className="max-h-[100px] w-full object-contain object-center"
          />
        ) : (
          <p className="text-xs text-stone-400">No signature image</p>
        )}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
        <FileSignature className="w-3.5 h-3.5 shrink-0" />
        E-signature (PNG) · {formatDate(signedAt)}
      </p>
    </div>
  );
}

export default function VerificationsPage() {
  const { t, locale } = useLanguage();
  const {
    agreements: liveAgreements,
    daraApprove,
    daraReject,
    notifyStaticAgreementVerification,
  } = useRentalFlow();

  const [tab, setTab] = useState<Tab>("properties");
  const [reviewItem, setReviewItem] = useState<AgreementReviewItem | null>(null);
  const [staticOutcome, setStaticOutcome] = useState<
    Record<string, "approved" | "rejected">
  >({});

  const pendingProperties = properties.filter(
    (p) => p.status === "pending_verification"
  );

  const pendingAgreementItems = useMemo((): AgreementReviewItem[] => {
    const staticPending = staticAgreements.filter(
      (a) =>
        ["pending_verification", "pending_dara_verification"].includes(a.status) &&
        !staticOutcome[a.id]
    );
    const livePending = liveAgreements.filter((a) => a.status === "landlord_signed");
    return [
      ...staticPending.map((agreement) => ({ kind: "static" as const, agreement })),
      ...livePending.map((agreement) => ({ kind: "live" as const, agreement })),
    ];
  }, [staticOutcome, liveAgreements]);

  const openReview = (item: AgreementReviewItem) => setReviewItem(item);
  const closeReview = () => setReviewItem(null);

  const reviewContractProps = useMemo(
    () => (reviewItem ? buildContractReviewProps(reviewItem, locale) : null),
    [reviewItem, locale]
  );

  const signatureBitmaps = useMemo(() => {
    if (!reviewItem) return null;
    const tn = reviewItem.agreement.tenantName;
    const ln = reviewItem.agreement.landlordName;
    const tenantStored =
      reviewItem.kind === "live"
        ? reviewItem.agreement.tenantSignatureDataUrl
        : undefined;
    const landlordStored =
      reviewItem.kind === "live"
        ? reviewItem.agreement.landlordSignatureDataUrl
        : undefined;
    return {
      tenant: tenantStored ?? proceduralSignatureDataUrl(tn, "tenant"),
      landlord: landlordStored ?? proceduralSignatureDataUrl(ln, "landlord"),
    };
  }, [reviewItem]);

  const handleApprove = () => {
    if (!reviewItem) return;
    if (reviewItem.kind === "live") {
      daraApprove(reviewItem.agreement.id);
    } else {
      const a = reviewItem.agreement;
      setStaticOutcome((prev) => ({ ...prev, [a.id]: "approved" }));
      notifyStaticAgreementVerification(a.id, true, {
        propertyTitle: a.propertyTitle,
        tenantName: a.tenantName,
        landlordName: a.landlordName,
      });
    }
    closeReview();
  };

  const handleReject = () => {
    if (!reviewItem) return;
    if (reviewItem.kind === "live") {
      daraReject(reviewItem.agreement.id);
    } else {
      const a = reviewItem.agreement;
      setStaticOutcome((prev) => ({ ...prev, [a.id]: "rejected" }));
      notifyStaticAgreementVerification(a.id, false, {
        propertyTitle: a.propertyTitle,
        tenantName: a.tenantName,
        landlordName: a.landlordName,
      });
    }
    closeReview();
  };

  const tenantLandlordDates = (
    item: AgreementReviewItem
  ): { tenantAt: string; landlordAt: string } => {
    if (item.kind === "live") {
      const a = item.agreement;
      const tAt = a.tenantSignedAt || a.landlordSignedAt || "";
      const lAt = a.landlordSignedAt || a.tenantSignedAt || "";
      return {
        tenantAt: tAt || new Date().toISOString(),
        landlordAt: lAt || tAt || new Date().toISOString(),
      };
    }
    const a = item.agreement;
    const tAt = a.tenantSignedAt || a.signedAt || a.createdAt;
    const lAt = a.landlordSignedAt || a.signedAt || a.createdAt;
    return { tenantAt: tAt, landlordAt: lAt };
  };

  return (
    <>
      <Header title={t("admin", "verificationTitle")} />
      <main className="flex-1 p-6 overflow-y-auto relative">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-500 mb-1">
              Pending Properties
            </p>
            <p className="text-2xl font-bold text-amber-600">
              {pendingProperties.length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-500 mb-1">
              Pending Agreements
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {pendingAgreementItems.length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-500 mb-1">
              Verified Today
            </p>
            <p className="text-2xl font-bold text-emerald-600">3</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-500 mb-1">
              Rejected Today
            </p>
            <p className="text-2xl font-bold text-red-600">1</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => setTab("properties")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "properties"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-1.5" />
            Properties ({pendingProperties.length})
          </button>
          <button
            onClick={() => setTab("agreements")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "agreements"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1.5" />
            Agreements ({pendingAgreementItems.length})
          </button>
        </div>

        {/* Properties Tab */}
        {tab === "properties" && (
          <div className="space-y-4">
            {pendingProperties.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
                <ShieldCheck className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-500 text-sm">
                  No properties pending verification
                </p>
              </div>
            )}
            {pendingProperties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-xl border border-stone-200 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-stone-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-stone-900">
                          {property.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}
                        >
                          {formatStatus(property.status)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mb-2">
                        {property.address}, {property.subCity} Sub-City
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-stone-500">
                        <span>Owner: {property.landlordName}</span>
                        <span>Type: {property.propertyType}</span>
                        <span>
                          Rent: {formatCurrency(property.monthlyRent)}/mo
                        </span>
                        <span>
                          <Clock className="w-3 h-3 inline" /> Submitted:{" "}
                          {formatDate(property.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="p-2 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Verify
                    </button>
                    <button className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agreements Tab */}
        {tab === "agreements" && (
          <div className="space-y-4">
            {pendingAgreementItems.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
                <ShieldCheck className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-500 text-sm">
                  No agreements pending verification
                </p>
              </div>
            )}
            {pendingAgreementItems.map((item) => {
              const id = item.agreement.id;
              const status =
                item.kind === "static"
                  ? item.agreement.status
                  : "pending_dara_verification";
              const propertyTitle = item.agreement.propertyTitle;
              const landlordName = item.agreement.landlordName;
              const tenantName = item.agreement.tenantName;
              const monthlyRent = item.agreement.monthlyRent;
              const advancePayment =
                item.kind === "static"
                  ? item.agreement.advancePayment
                  : item.agreement.advanceAmount;

              return (
                <div
                  key={`${item.kind}-${id}`}
                  className="bg-white rounded-xl border border-stone-200 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-stone-900">
                            {propertyTitle}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}
                          >
                            {formatStatus(status)}
                          </span>
                          {item.kind === "live" && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                              Live flow
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mb-2">
                          {landlordName} → {tenantName}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-stone-500">
                          <span>
                            Rent: {formatCurrency(monthlyRent)}/mo
                          </span>
                          <span>
                            Advance: {formatCurrency(advancePayment)} (
                            {Math.round(
                              advancePayment / monthlyRent
                            )}{" "}
                            months)
                          </span>
                          {item.kind === "static" && (
                            <span>
                              Term: {formatDate(item.agreement.startDate)} –{" "}
                              {formatDate(item.agreement.endDate)}
                            </span>
                          )}
                        </div>

                        {item.kind === "static" && (
                          <div className="flex items-center gap-3 mt-2">
                            {item.agreement.advancePayment <=
                            item.agreement.monthlyRent * 2 ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="w-3 h-3" />
                                Advance OK
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-600">
                                <XCircle className="w-3 h-3" />
                                Advance exceeds limit
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openReview(item)}
                        title="View full agreement and signatures"
                        className="p-2 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openReview(item)}
                        className="px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => openReview(item)}
                        className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Agreement review: full contract body + e-signature PNGs */}
        {reviewItem && reviewContractProps && signatureBitmaps && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agreement-review-title"
            onClick={closeReview}
          >
            <div
              className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-4xl w-full max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-4 border-b border-stone-100 bg-white rounded-t-2xl">
                <div>
                  <h2
                    id="agreement-review-title"
                    className="text-base font-semibold text-stone-900"
                  >
                    {reviewItem.agreement.propertyTitle}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    {reviewItem.agreement.landlordName} →{" "}
                    {reviewItem.agreement.tenantName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeReview}
                  className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-3">
                    Full agreement (official template)
                  </h3>
                  <div className="rounded-xl border border-stone-200 overflow-hidden bg-white">
                    <div className="bg-gradient-to-r from-primary-700 to-primary-700 px-5 py-3 flex items-center gap-3 shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                        <FileSignature className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">
                          የመኖሪያ ቤት ኪራይ ሞዴል ውል
                        </p>
                        <p className="text-primary-200 text-xs">
                          Addis Ababa Rental Control · Proclamation 1320/2016
                        </p>
                      </div>
                      <span className="ml-auto text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
                        Review copy
                      </span>
                    </div>
                    <div
                      className="px-4 sm:px-6 py-5 max-h-[min(52vh,520px)] overflow-y-auto bg-stone-50/50"
                      style={{ scrollbarWidth: "thin" }}
                    >
                      <ContractBody {...reviewContractProps} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-2">
                    Parties&apos; e-signatures
                  </h3>
                  <p className="text-xs text-stone-500 mb-4">
                    Images captured from the signing flow (or system-generated
                    counter-signature when the landlord line is auto-completed).
                    Compare with the signers named in the contract above.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(() => {
                      const { tenantAt, landlordAt } =
                        tenantLandlordDates(reviewItem);
                      return (
                        <>
                          <ESignatureCard
                            roleLabel="Tenant"
                            name={reviewItem.agreement.tenantName}
                            signedAt={tenantAt}
                            imageSrc={signatureBitmaps.tenant}
                          />
                          <ESignatureCard
                            roleLabel="Landlord"
                            name={reviewItem.agreement.landlordName}
                            signedAt={landlordAt}
                            imageSrc={signatureBitmaps.landlord}
                          />
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-end px-6 py-4 border-t border-stone-100 bg-stone-50/80 rounded-b-2xl sticky bottom-0">
                <button
                  type="button"
                  onClick={closeReview}
                  className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-200/80 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2.5 text-sm font-medium text-red-700 border border-red-200 bg-white rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve &amp; continue
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
