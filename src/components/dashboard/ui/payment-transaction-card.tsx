"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
} from "lucide-react";
import type { RentPayment } from "@/lib/types";
import { cn, formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

type PaymentTransactionCardProps = {
  payment: RentPayment;
  counterparty: string;
  statusLabel: string;
  onPay?: () => void;
  paying?: boolean;
  payLabel?: string;
  showPay?: boolean;
};

export function PaymentTransactionCard({
  payment,
  counterparty,
  statusLabel,
  onPay,
  paying,
  payLabel = "Pay now",
  showPay,
}: PaymentTransactionCardProps) {
  const isDue =
    payment.status === "pending" || payment.status === "overdue";

  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_rgba(28,25,23,0.05)] transition-all hover:border-primary-200/80 hover:shadow-[0_12px_28px_rgba(13,148,136,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
              payment.status === "paid"
                ? "bg-emerald-50 text-emerald-600"
                : payment.status === "overdue"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-amber-50 text-amber-600"
            )}
          >
            {payment.status === "paid" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : payment.status === "overdue" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Clock className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-stone-900 truncate">
              {payment.propertyTitle}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">{counterparty}</p>
            <p className="text-xs text-stone-400 mt-1">
              Due {formatDate(payment.dueDate)}
              {payment.paidDate && ` · Paid ${formatDate(payment.paidDate)}`}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-xl font-bold text-stone-900 tabular-nums">
            {formatCurrency(payment.amount)}
          </p>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
              getStatusColor(payment.status)
            )}
          >
            {statusLabel}
          </span>
        </div>
        {showPay && isDue && onPay && (
          <button
            type="button"
            onClick={onPay}
            disabled={paying}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {paying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {paying ? "…" : payLabel}
          </button>
        )}
      </div>
    </div>
  );
}
