"use client";

import {
  PageHeader,
  StatCard,
  FilterBar,
  PaymentTransactionCard,
  EmptyState,
} from "@/components/dashboard/ui";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { apiInitiateChapaPayment, apiListRentPayments, getAccessToken } from "@/lib/api";
import { RentPayment } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { stashPendingPayment } from "@/lib/payment-flow";
import {
  CreditCard,
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
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader title={t("payments", "title")} />

      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title={t("payments", "totalPaid")}
          value={totalPaid}
          icon={CheckCircle2}
          gradient="from-emerald-500 to-teal-600"
        />
        <StatCard
          title={t("payments", "pending")}
          value={pendingCount}
          icon={Clock}
          gradient="from-amber-500 to-orange-600"
        />
        <StatCard
          title={t("payments", "overdue")}
          value={overdueCount}
          icon={AlertCircle}
          gradient="from-rose-500 to-red-600"
        />
        <StatCard
          title={t("payments", "totalDue")}
          value={formatCurrency(totalDue)}
          icon={CreditCard}
          gradient="from-slate-500 to-stone-600"
        />
      </div>

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("common", "search")}
        exportLabel={t("dashboardUi", "export")}
        onExport={() => {
          /* CSV export hook */
        }}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none"
          >
            <option value="unpaid">Unpaid (Pending &amp; Overdue)</option>
            <option value="all">
              {t("common", "all")} {t("common", "status")}
            </option>
            <option value="paid">{t("payments", "paid")}</option>
            <option value="pending">{t("payments", "pending")}</option>
            <option value="overdue">{t("payments", "overdue")}</option>
          </select>
        }
      />

      {payError && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{payError}</span>
        </div>
      )}

      {paymentsLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          Loading payments…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t("payments", "title")}
          description={t("dashboardUi", "searchHint")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((payment) => (
            <PaymentTransactionCard
              key={payment.id}
              payment={payment}
              counterparty={getPayerRecipientDisplay(payment)}
              statusLabel={t("payments", payment.status)}
              showPay={role === "tenant"}
              paying={payingId === payment.id}
              payLabel={t("payments", "payNow")}
              onPay={() => void startChapaCheckout(payment)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
