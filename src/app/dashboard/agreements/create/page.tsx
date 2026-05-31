"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { useProperties } from "@/context/properties-context";
import { getAccessToken, apiCreateAgreement } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { MAX_ADVANCE_MONTHS, MIN_LEASE_YEARS } from "@/lib/constants";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateAgreementPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { userProperties, isLoading } = useProperties();
  const [selectedProperty, setSelectedProperty] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [advancePayment, setAdvancePayment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [utilities, setUtilities] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availableProperties = userProperties.filter((p) => p.status === "available");

  const rent = parseFloat(monthlyRent) || 0;
  const advance = parseFloat(advancePayment) || 0;
  const advanceMonths = rent > 0 ? advance / rent : 0;
  const isAdvanceValid = advanceMonths <= MAX_ADVANCE_MONTHS;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const leaseMonths =
    start && end
      ? (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth())
      : 0;
  const isLeaseValid = leaseMonths >= MIN_LEASE_YEARS * 12;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = getAccessToken();
    if (!token) {
      setError("Please log in again.");
      return;
    }
    if (!selectedProperty || !tenantId.trim()) {
      setError("Property and tenant ID are required.");
      return;
    }
    if (!isAdvanceValid || !isLeaseValid) {
      setError("Please fix agreement validation errors first.");
      return;
    }
    setSubmitting(true);
    try {
      await apiCreateAgreement(token, {
        propertyId: selectedProperty,
        tenantId: tenantId.trim(),
        monthlyRent: rent,
        advancePayment: advance,
        startDate,
        endDate,
        utilities: utilities
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean),
      });
      router.push("/dashboard/agreements");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agreement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header title={t("agreements", "createTitle")} />
      <main className="flex-1 p-6 overflow-y-auto">
        <Link
          href="/dashboard/agreements"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agreements
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              New Tenancy Agreement
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Create a standardized rental agreement. Terms are automatically
              validated against the proclamation.
            </p>

            {/* Proclamation Rules Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Proclamation Requirements
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>
                  &bull; Advance payment must not exceed {MAX_ADVANCE_MONTHS}{" "}
                  months of rent
                </li>
                <li>
                  &bull; Minimum lease term is {MIN_LEASE_YEARS} years for new
                  agreements
                </li>
                <li>
                  &bull; Agreement must be submitted for verification within 30
                  days of signing
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Selection */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  Select Property
                </h3>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Verified Property
                </label>
                <select
                  value={selectedProperty}
                  onChange={(e) => {
                    setSelectedProperty(e.target.value);
                    const prop = availableProperties.find(
                      (p) => p.id === e.target.value
                    );
                    if (prop) setMonthlyRent(prop.monthlyRent.toString());
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                >
                  <option value="">Choose a verified property</option>
                  {isLoading && <option value="">Loading properties...</option>}
                  {availableProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {formatCurrency(p.monthlyRent)}/mo
                    </option>
                  ))}
                </select>
              </div>

              {/* Tenant */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  Tenant Information
                </h3>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tenant ID (registered tenant user id)
                </label>
                <input
                  type="text"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  placeholder="e.g. cm9x..."
                />
              </div>

              {/* Financial Terms */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  Financial Terms
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Monthly Rent (ETB)
                    </label>
                    <input
                      type="number"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Advance Payment (ETB)
                    </label>
                    <input
                      type="number"
                      value={advancePayment}
                      onChange={(e) => setAdvancePayment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                    />
                    {advance > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {isAdvanceValid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span
                          className={`text-xs ${isAdvanceValid ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {advanceMonths.toFixed(1)} months (max{" "}
                          {MAX_ADVANCE_MONTHS})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Lease Duration */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  Lease Duration
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                    />
                    {start && end && (
                      <div className="flex items-center gap-1 mt-1">
                        {isLeaseValid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span
                          className={`text-xs ${isLeaseValid ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {leaseMonths} months (min {MIN_LEASE_YEARS * 12})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Utilities */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Included Utilities
                </label>
                <input
                  type="text"
                  value={utilities}
                  onChange={(e) => setUtilities(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  placeholder="e.g., Water, Electricity (shared)"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Link
                  href="/dashboard/agreements"
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {submitting ? "Creating..." : "Create & Send for Signing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
