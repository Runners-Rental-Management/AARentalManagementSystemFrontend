"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { apiInitiateChapaPayment, apiListRentPayments, getAccessToken } from "@/lib/api";
import { RentPayment } from "@/lib/types";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { stashPendingPayment } from "@/lib/payment-flow";
import {
  CreditCard,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function PaymentsPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("unpaid");
  const { user } = useAuth();
  const role = user?.role || "tenant";
  const userId = user?.id || "";

  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setPaymentsLoading(false);
      return;
    }
    apiListRentPayments(token)
      .then((res) => setPayments(res.items))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
  }, [userId]);

  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const roleBasedList =
    role === "tenant"
      ? payments.filter((p) => p.payerId === userId)
      : role === "landlord"
        ? payments.filter((p) => p.recipientId === userId)
        : payments;

  const filtered = roleBasedList.filter((p) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unpaid" && (p.status === "pending" || p.status === "overdue")) ||
      p.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      p.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.payerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPaid = roleBasedList.filter((p) => p.status === "paid").length;
  const pendingCount = roleBasedList.filter((p) => p.status === "pending").length;
  const overdueCount = roleBasedList.filter((p) => p.status === "overdue").length;
  const totalDue = roleBasedList
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const getPayerRecipientDisplay = (p: RentPayment) => {
    if (role === "tenant") return p.recipientName;
    if (role === "landlord") return p.payerName;
    return `${p.payerName} → ${p.recipientName}`;
  };

  const startChapaCheckout = async (payment: RentPayment) => {
    const token = getAccessToken();
    if (!token) {
      setPayError("Please sign in to pay.");
      return;
    }

    setPayingId(payment.id);
    setPayError(null);

    try {
      stashPendingPayment({
        type: "rent",
        paymentId: payment.id,
        method: "chapa",
        amount: payment.amount,
        propertyTitle: payment.propertyTitle,
      });

      const init = await apiInitiateChapaPayment(token, payment.id);
      window.location.assign(init.checkoutUrl);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Failed to open Chapa checkout.");
      setPayingId(null);
    }
  };

  return (
    <>
      <Header title={t("payments", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{totalPaid}</p>
            <p className="text-xs text-stone-500">
              {t("payments", "totalPaid")}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-stone-500">{t("payments", "pending")}</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            <p className="text-xs text-stone-500">{t("payments", "overdue")}</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-5 h-5 text-stone-600" />
            </div>
            <p className="text-2xl font-bold text-stone-900">
              {formatCurrency(totalDue)}
            </p>
            <p className="text-xs text-stone-500">
              {t("payments", "totalDue")}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder={t("common", "search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-stone-200 rounded-lg px-3 py-2 bg-white outline-none"
            >
              <option value="unpaid">Unpaid (Pending &amp; Overdue)</option>
              <option value="all">{t("common", "all")} {t("common", "status")}</option>
              <option value="paid">{t("payments", "paid")}</option>
              <option value="pending">{t("payments", "pending")}</option>
              <option value="overdue">{t("payments", "overdue")}</option>
            </select>
          </div>
        </div>

        {payError && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{payError}</span>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("payments", "property")}
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {role === "tenant"
                      ? t("payments", "recipient")
                      : role === "landlord"
                        ? t("payments", "payer")
                        : `${t("payments", "payer")} / ${t("payments", "recipient")}`}
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("payments", "amount")}
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("payments", "dueDate")}
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("payments", "paidDate")}
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("payments", "method")}
                  </th>
                  <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                    {t("common", "status")}
                  </th>
                  {role === "tenant" && (
                    <th className="text-left text-xs font-medium text-stone-500 px-4 py-3">
                      {t("common", "actions")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paymentsLoading ? (
                  <tr>
                    <td colSpan={role === "tenant" ? 8 : 7} className="px-4 py-12 text-center text-sm text-stone-500">
                      <Loader2 className="w-5 h-5 animate-spin inline-block mr-2 text-primary-600" />
                      Loading payments…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={role === "tenant" ? 8 : 7} className="px-4 py-12 text-center text-sm text-stone-500">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                filtered.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-stone-100 hover:bg-stone-50/50"
                  >
                    <td className="px-4 py-3 text-sm text-stone-900">
                      {payment.propertyTitle}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-700">
                      {getPayerRecipientDisplay(payment)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-stone-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">
                      {formatDate(payment.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">
                      {payment.paidDate
                        ? formatDate(payment.paidDate)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {payment.method ? (
                        <PaymentMethodBadge method={payment.method} t={t} />
                      ) : (
                        <span className="text-sm text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}
                      >
                        {t("payments", payment.status)}
                      </span>
                    </td>
                    {role === "tenant" && (
                      <td className="px-4 py-3">
                        {(payment.status === "pending" || payment.status === "overdue") ? (
                          <button
                            onClick={() => void startChapaCheckout(payment)}
                            disabled={payingId === payment.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-stone-300 disabled:cursor-wait rounded-lg transition-colors"
                          >
                            {payingId === payment.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5" />
                            )}
                            {payingId === payment.id ? "Opening Chapa…" : t("payments", "payNow")}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t("payments", "paid")}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

    </>
  );
}

function PaymentMethodBadge({
  method,
  t,
}: {
  method: string;
  t: (section: "payments", key: string) => string;
}) {
  const config: Record<string, { bg: string; text: string; icon: typeof CreditCard }> = {
    chapa: { bg: "bg-emerald-50", text: "text-emerald-800", icon: CreditCard },
    cbe_birr: { bg: "bg-blue-50", text: "text-blue-700", icon: CreditCard },
    telebirr: { bg: "bg-green-50", text: "text-green-700", icon: CreditCard },
    bank_transfer: { bg: "bg-stone-50", text: "text-stone-700", icon: CreditCard },
    mobile_money: { bg: "bg-purple-50", text: "text-purple-700", icon: CreditCard },
    cash: { bg: "bg-amber-50", text: "text-amber-700", icon: CreditCard },
    check: { bg: "bg-stone-50", text: "text-stone-600", icon: CreditCard },
  };

  const c = config[method] || config.cash;
  const Icon = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${c.bg} ${c.text}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {t("payments", method)}
    </span>
  );
}
