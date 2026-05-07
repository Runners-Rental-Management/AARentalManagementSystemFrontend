"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { getAccessToken, apiListAgreements, apiCreateDispute } from "@/lib/api";
import type { TenancyAgreement } from "@/lib/types";
import type { Dispute } from "@/lib/types";
import { VIOLATION_TYPES } from "@/lib/constants";
import { ArrowLeft, Upload, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReportViolationPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [agreements, setAgreements] = useState<TenancyAgreement[]>([]);
  const [agreementId, setAgreementId] = useState("");
  const [violationType, setViolationType] = useState<Dispute["violationType"] | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    apiListAgreements(token).then((res) => setAgreements(res.items));
  }, []);

  const activeAgreements = agreements.filter((a) => a.status === "active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = getAccessToken();
    if (!token) {
      setError("Please log in again.");
      return;
    }
    if (!agreementId || !violationType || !title.trim() || !description.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await apiCreateDispute(token, {
        agreementId,
        violationType,
        title: title.trim(),
        description: description.trim(),
        evidence: evidenceText
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      });
      router.push("/dashboard/disputes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header title={t("disputes", "reportTitle")} />
      <main className="flex-1 p-6 overflow-y-auto">
        <Link
          href="/dashboard/disputes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Disputes
        </Link>

        <div className="max-w-3xl">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Report a Violation
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Submit a formal complaint about a rental violation. Your report
              will be reviewed by the controlling authority.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Related Agreement
                </label>
                <select
                  value={agreementId}
                  onChange={(e) => setAgreementId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                >
                  <option value="">Select your active agreement</option>
                  {activeAgreements.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.propertyTitle} — with {a.landlordName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Violation Type
                </label>
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value as Dispute["violationType"])}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                >
                  <option value="">Select violation type</option>
                  {VIOLATION_TYPES.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  placeholder="Brief title of the violation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm resize-none"
                  placeholder="Describe the violation in detail, including dates, specifics, and impact..."
                />
              </div>

              {/* Evidence Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Supporting Evidence
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    Upload photos, documents, or recordings
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PDF, JPG, PNG, MP3 up to 10MB each
                  </p>
                  <div className="mt-3 text-left">
                    <label className="block text-xs text-slate-500 mb-1">Evidence filenames/links (comma-separated)</label>
                    <input
                      type="text"
                      value={evidenceText}
                      onChange={(e) => setEvidenceText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      placeholder="photo1.jpg, receipt.pdf, https://..."
                    />
                  </div>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Link
                  href="/dashboard/disputes"
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
