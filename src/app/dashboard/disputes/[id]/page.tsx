"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { getAccessToken, apiGetDisputeById } from "@/lib/api";
import type { Dispute } from "@/lib/types";
import { formatDate, getStatusColor, formatStatus } from "@/lib/utils";
import { VIOLATION_TYPES } from "@/lib/constants";
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DisputeDetailPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const role = user?.role || "tenant";
  const params = useParams();
  const disputeId = String(params.id ?? "");
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !disputeId) {
      setLoading(false);
      return;
    }
    apiGetDisputeById(token, disputeId)
      .then((res) => setDispute(res))
      .finally(() => setLoading(false));
  }, [disputeId]);

  if (loading) {
    return (
      <>
        <Header title="Dispute Details" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-500">Loading dispute...</p>
        </main>
      </>
    );
  }

  if (!dispute) {
    return (
      <>
        <Header title="Dispute Not Found" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-500">Dispute not found.</p>
        </main>
      </>
    );
  }

  const getViolationLabel = (type: string) =>
    VIOLATION_TYPES.find((v) => v.value === type)?.label || type;

  return (
    <>
        <Header title={t("disputes", "disputeDetails")} />
      <main className="flex-1 p-6 overflow-y-auto">
        <Link
          href="/dashboard/disputes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Disputes
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-400 font-mono mb-1">
                    Case #D-{dispute.id.slice(1).padStart(3, "0")}
                  </p>
                  <h2 className="text-xl font-bold text-slate-900">
                    {dispute.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      dispute.priority === "critical"
                        ? "bg-red-100 text-red-700"
                        : dispute.priority === "high"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {dispute.priority}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}
                  >
                    {formatStatus(dispute.status)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  {getViolationLabel(dispute.violationType)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">
                  <Calendar className="w-3 h-3" />
                  Filed: {formatDate(dispute.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">
                  <FileText className="w-3 h-3" />
                  Agreement: {dispute.agreementId.toUpperCase()}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Description
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {dispute.description}
                </p>
              </div>

              {/* Evidence */}
              {dispute.evidence.length > 0 && (
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Submitted Evidence
                  </h3>
                  <div className="space-y-2">
                    {dispute.evidence.map((file) => (
                      <div
                        key={file}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg"
                      >
                        <Paperclip className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution */}
              {dispute.resolution && (
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-semibold text-emerald-800">
                        Resolution
                      </h3>
                    </div>
                    <p className="text-sm text-emerald-700">
                      {dispute.resolution}
                    </p>
                    {dispute.resolvedAt && (
                      <p className="text-xs text-emerald-600 mt-2">
                        Resolved on {formatDate(dispute.resolvedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Authorities only: Response / Resolution actions */}
            {!dispute.resolution && role === "dara_agent" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  <MessageSquare className="w-4 h-4 inline mr-1.5" />
                  Add Response / Resolution
                </h3>
                <textarea
                  rows={4}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm resize-none mb-3"
                  placeholder="Enter your response or resolution notes..."
                />
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
                    Mark as Resolved
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                    Send for Mediation
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                    Escalate
                  </button>
                </div>
              </div>
            )}

            {/* Tenant/Landlord: status info when unresolved */}
            {!dispute.resolution && (role === "tenant" || role === "landlord") && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Under Review</p>
                    <p className="text-xs text-amber-600 mt-1">This dispute is being reviewed by the Authorities. You will be notified once a resolution is reached.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reporter */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Reporter
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {dispute.reporterName}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {dispute.reporterRole}
                  </p>
                </div>
              </div>
            </div>

            {/* Respondent */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Respondent
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {dispute.respondentName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {dispute.reporterRole === "tenant" ? "Landlord" : "Tenant"}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Activity Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      Case Filed
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(dispute.createdAt)}
                    </p>
                  </div>
                </div>
                {dispute.assignedTo && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        Assigned to officer
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(dispute.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}
                {dispute.status === "mediation" && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        Mediation in progress
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(dispute.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}
                {dispute.resolvedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        Case Resolved
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(dispute.resolvedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
