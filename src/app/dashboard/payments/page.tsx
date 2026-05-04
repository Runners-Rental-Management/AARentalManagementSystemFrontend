"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { rentPayments } from "@/lib/dummy-data";
import { RentPayment } from "@/lib/types";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import {
  CreditCard,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Smartphone,
  Landmark,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  MessageSquare,
  Download,
  Printer,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

/* ── Amount → words (ETB style) ── */
function amountToWords(amount: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tensW = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function h(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tensW[Math.floor(n/10)] + (n%10 ? " " + ones[n%10] : "");
    return ones[Math.floor(n/100)] + " Hundred" + (n%100 ? " " + h(n%100) : "");
  }
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  let out = "";
  if (whole >= 1000000) out += h(Math.floor(whole/1000000)) + " Million ";
  if (whole >= 1000)    out += h(Math.floor((whole%1000000)/1000)) + " Thousand ";
  out += h(whole % 1000);
  if (cents > 0) out += " & " + h(cents) + " Cent" + (cents !== 1 ? "s" : "");
  return "ETB " + out.trim();
}

/* ── Mask account number ── */
function maskAccount(acc: string): string {
  if (acc.length <= 4) return acc;
  return acc[0] + "****" + acc.slice(-4);
}

type PaymentMethodId = "cbe_birr" | "telebirr";

const PAYMENT_METHODS: {
  id: PaymentMethodId;
  label: string;
  amLabel: string;
  icon: typeof Landmark;
  color: string;
  bg: string;
  border: string;
  desc: string;
}[] = [
  {
    id: "cbe_birr",
    label: "CBE Birr",
    amLabel: "ሲቢኢ ብር",
    icon: Landmark,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-300",
    desc: "Commercial Bank of Ethiopia mobile banking",
  },
  {
    id: "telebirr",
    label: "Telebirr",
    amLabel: "ቴሌብር",
    icon: Smartphone,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-300",
    desc: "Ethio Telecom mobile money service",
  },
];

type ModalStep = "select" | "account" | "pin" | "confirm" | "processing" | "receipt";

/* ── SMS toast ── */
function SmsToast({ phone, amount, txRef, method, onDismiss }: {
  phone: string; amount: number; txRef: string; method: PaymentMethodId; onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="fixed bottom-6 right-6 z-[60] w-80 animate-fade-in-up">
      <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 bg-green-600 px-4 py-2">
          <MessageSquare className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-xs font-bold">SMS Notification Sent</span>
          <button onClick={onDismiss} className="ml-auto text-white/70 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] text-slate-400 mb-1">To: {phone}</p>
          <p className="text-xs text-white leading-relaxed">
            {method === "cbe_birr"
              ? `CBE Birr: Your rent payment of ETB ${amount.toLocaleString()} was successful. Ref: ${txRef}. DARA Rental System.`
              : `Telebirr: Rent payment of ETB ${amount.toLocaleString()} confirmed. TxnRef: ${txRef}. DARA Rental Platform.`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("unpaid");
  const { user } = useAuth();
  const role = user?.role || "tenant";
  const userId = user?.id || "";

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>("select");

  /* new fields */
  const [account, setAccount] = useState("");
  const [pin, setPin]     = useState("");
  const [pinVisible, setPinVisible] = useState(false);
  const [pinError, setPinError]     = useState("");
  const [txRef, setTxRef]   = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [showSms, setShowSms] = useState(false);

  const roleBasedList =
    role === "tenant"
      ? rentPayments.filter((p) => p.payerId === userId)
      : role === "landlord"
        ? rentPayments.filter((p) => p.recipientId === userId)
        : rentPayments;

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

  const getPayerRecipientDisplay = (p: (typeof rentPayments)[0]) => {
    if (role === "tenant") return p.recipientName;
    if (role === "landlord") return p.payerName;
    return `${p.payerName} → ${p.recipientName}`;
  };

  const openPayModal = (payment: RentPayment) => {
    setSelectedPayment(payment);
    setSelectedMethod(null);
    setModalStep("select");
    setAccount("");
    setPin("");
    setPinVisible(false);
    setPinError("");
    setTxRef("");
    setPaidAt("");
    setShowSms(false);
    setPayModalOpen(true);
  };

  const closePayModal = () => {
    setPayModalOpen(false);
    setSelectedPayment(null);
  };

  const handlePinNext = () => {
    if (pin.length < 4) { setPinError("PIN must be at least 4 digits."); return; }
    setPinError("");
    setModalStep("confirm");
  };

  const handleConfirmPayment = async () => {
    setModalStep("processing");
    await new Promise((r) => setTimeout(r, 2400));
    const ref = `TXN-${Date.now().toString(36).toUpperCase()}`;
    setTxRef(ref);
    setPaidAt(new Date().toISOString());
    setShowSms(true);
    setModalStep("receipt");
  };

  const isCbe = selectedMethod === "cbe_birr";
  const methodInfo = PAYMENT_METHODS.find((m) => m.id === selectedMethod);

  const STEPS_BAR = ["select", "account", "pin", "confirm"] as const;
  const STEP_LABELS = ["Method", "Account", "Passkey", "Confirm"];

  return (
    <>
      <Header title={t("payments", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{totalPaid}</p>
            <p className="text-xs text-slate-500">
              {t("payments", "totalPaid")}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-slate-500">{t("payments", "pending")}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            <p className="text-xs text-slate-500">{t("payments", "overdue")}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalDue)}
            </p>
            <p className="text-xs text-slate-500">
              {t("payments", "totalDue")}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t("common", "search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none"
            >
              <option value="unpaid">Unpaid (Pending &amp; Overdue)</option>
              <option value="all">{t("common", "all")} {t("common", "status")}</option>
              <option value="paid">{t("payments", "paid")}</option>
              <option value="pending">{t("payments", "pending")}</option>
              <option value="overdue">{t("payments", "overdue")}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                    {t("payments", "property")}
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                    {role === "tenant"
                      ? t("payments", "recipient")
                      : role === "landlord"
                        ? t("payments", "payer")
                        : `${t("payments", "payer")} / ${t("payments", "recipient")}`}
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                    {t("payments", "amount")}
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                    {t("payments", "dueDate")}
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                    {t("payments", "paidDate")}
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                    {t("payments", "method")}
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                    {t("common", "status")}
                  </th>
                  {role === "tenant" && (
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">
                      {t("common", "actions")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {payment.propertyTitle}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {getPayerRecipientDisplay(payment)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(payment.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {payment.paidDate
                        ? formatDate(payment.paidDate)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {payment.method ? (
                        <PaymentMethodBadge method={payment.method} t={t} />
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
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
                            onClick={() => openPayModal(payment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {t("payments", "payNow")}
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
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">
                {t("payments", "noPayments")}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* SMS Toast */}
      {showSms && selectedMethod && (
        <SmsToast
          phone={account}
          amount={selectedPayment?.amount ?? 0}
          txRef={txRef}
          method={selectedMethod}
          onDismiss={() => setShowSms(false)}
        />
      )}

      {/* Payment Modal */}
      {payModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="bg-gradient-to-r from-primary-700 to-indigo-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-sm">
                  {modalStep === "receipt" ? "Transaction Receipt" : "Payment Gateway"}
                </span>
              </div>
              {modalStep !== "processing" && modalStep !== "receipt" && (
                <button onClick={closePayModal} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Step bar */}
            {!["processing", "receipt"].includes(modalStep) && (
              <div className="flex border-b border-slate-100">
                {STEPS_BAR.map((s, i) => (
                  <div
                    key={s}
                    className={`flex-1 py-2 text-center text-[10px] font-semibold transition-colors ${
                      modalStep === s
                        ? "text-primary-700 border-b-2 border-primary-600"
                        : STEPS_BAR.indexOf(modalStep as (typeof STEPS_BAR)[number]) > i
                          ? "text-emerald-600"
                          : "text-slate-400"
                    }`}
                  >
                    {i + 1}. {STEP_LABELS[i]}
                  </div>
                ))}
              </div>
            )}

            <div className="p-6">
              {/* Amount summary strip */}
              {!["processing", "receipt"].includes(modalStep) && (
                <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 mb-0.5">Paying for</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedPayment.propertyTitle}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Due: {formatDate(selectedPayment.dueDate)}
                  </p>
                </div>
              )}

              {/* ── Step 1: Select method ── */}
              {modalStep === "select" && (
                <>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Choose Payment Method
                  </p>
                  <div className="space-y-3 mb-5">
                    {PAYMENT_METHODS.map((m) => {
                      const isSelected = selectedMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMethod(m.id)}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            isSelected ? `${m.border} ${m.bg}` : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-11 h-11 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}>
                            <m.icon className={`w-5 h-5 ${m.color}`} />
                          </div>
                          <div className="text-left flex-1">
                            <p className={`font-semibold text-sm ${isSelected ? m.color : "text-slate-900"}`}>
                              {locale === "am" ? m.amLabel : m.label}
                            </p>
                            <p className="text-[11px] text-slate-400">{m.desc}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    disabled={!selectedMethod}
                    onClick={() => setModalStep("account")}
                    className="w-full py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-colors"
                  >
                    Continue
                  </button>
                </>
              )}

              {/* ── Step 2: Account ── */}
              {modalStep === "account" && methodInfo && (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-2xl ${methodInfo.bg} flex items-center justify-center`}>
                      <methodInfo.icon className={`w-6 h-6 ${methodInfo.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{locale === "am" ? methodInfo.amLabel : methodInfo.label}</p>
                      <p className="text-xs text-slate-500">
                        {isCbe ? "Enter your CBE account number" : "Enter your Telebirr phone number"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                      {isCbe ? "CBE Account Number" : "Telebirr Phone Number"}
                    </label>
                    <div className="relative">
                      {isCbe
                        ? <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        : <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      }
                      <input
                        type={isCbe ? "text" : "tel"}
                        value={account}
                        onChange={(e) => setAccount(isCbe ? e.target.value.replace(/\D/g, "") : e.target.value)}
                        placeholder={isCbe ? "1000XXXXXXXXX" : "+251 9XX XXX XXX"}
                        className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {isCbe
                        ? "Your 13-digit CBE Birr account number."
                        : "The phone number registered with your Telebirr wallet."}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-700 mb-5">
                    An SMS confirmation will be sent to this account after payment.
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setModalStep("select")} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors">
                      Back
                    </button>
                    <button
                      onClick={() => setModalStep("pin")}
                      disabled={account.trim().length < 7}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}

              {/* ── Step 3: PIN ── */}
              {modalStep === "pin" && methodInfo && (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-2xl ${methodInfo.bg} flex items-center justify-center`}>
                      <KeyRound className={`w-6 h-6 ${methodInfo.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        Enter your {isCbe ? "CBE Birr" : "Telebirr"} PIN
                      </p>
                      <p className="text-xs text-slate-500">{account}</p>
                    </div>
                  </div>

                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                    {isCbe ? "CBE Birr PIN" : "Telebirr Passkey"}
                  </label>
                  <div className="relative mb-1">
                    <input
                      type={pinVisible ? "text" : "password"}
                      inputMode="numeric"
                      value={pin}
                      onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(""); }}
                      placeholder="••••••"
                      maxLength={6}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary-400 pr-12 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setPinVisible((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {pinVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pinError && <p className="text-xs text-red-600 mt-1">{pinError}</p>}

                  <p className="text-xs text-slate-400 mt-2 mb-5">
                    Your PIN is encrypted and sent directly to {isCbe ? "CBE Birr" : "Telebirr"}. It is never stored by DARA.
                  </p>

                  <div className="flex gap-3">
                    <button onClick={() => setModalStep("account")} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors">Back</button>
                    <button onClick={handlePinNext} disabled={pin.length < 4} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">Authorise</button>
                  </div>
                </>
              )}

              {/* ── Step 4: Confirm ── */}
              {modalStep === "confirm" && methodInfo && (
                <>
                  <p className="text-sm font-bold text-slate-900 mb-4">Review & Confirm</p>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-sm mb-2">
                    {[
                      ["Amount",            formatCurrency(selectedPayment.amount)],
                      ["Property",          selectedPayment.propertyTitle],
                      ["Method",            locale === "am" ? methodInfo.amLabel : methodInfo.label],
                      [isCbe ? "Account" : "Phone", account],
                      ["PIN",               "•".repeat(pin.length)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold text-slate-800 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 mb-5">
                    After payment an <strong>SMS confirmation</strong> will be sent and a <strong>transaction receipt</strong> will be generated.
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setModalStep("pin")} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors">Back</button>
                    <button
                      onClick={handleConfirmPayment}
                      className={`flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isCbe ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
                    >
                      <CreditCard className="w-4 h-4" /> Pay {formatCurrency(selectedPayment.amount)}
                    </button>
                  </div>
                </>
              )}

              {/* ── Processing ── */}
              {modalStep === "processing" && (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="relative w-20 h-20 mb-5">
                    <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-40" />
                    <div className="relative w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                      <Loader2 className="w-9 h-9 text-primary-600 animate-spin" />
                    </div>
                  </div>
                  <p className="font-bold text-slate-900 text-lg">Processing Payment…</p>
                  <p className="text-sm text-slate-500 mt-1">Connecting to {methodInfo?.label ?? "payment provider"}…</p>
                  <p className="text-xs text-slate-400 mt-3">Please do not close this window.</p>
                </div>
              )}

              {/* ── Receipt (CBE format) ── */}
              {modalStep === "receipt" && selectedMethod && methodInfo && txRef && (() => {
                const commission  = 0.50;
                const vat         = parseFloat((commission * 0.15).toFixed(2));
                const totalDebited = selectedPayment.amount + commission + vat;
                const maskedAcc   = isCbe ? maskAccount(account) : account;
                const payDateStr  = new Date(paidAt).toLocaleString("en-US", {
                  month: "numeric", day: "numeric", year: "numeric",
                  hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
                });

                const downloadReceipt = () => {
                  const col = (label: string, value: string) =>
                    label.padEnd(35) + value;
                  const lines = [
                    "Commercial Bank of Ethiopia",
                    "VAT Invoice / Customer Receipt",
                    "",
                    "Company Address & Other Information",
                    col("Country:",              "Ethiopia"),
                    col("City:",                 "Addis Ababa"),
                    col("Address:",              "Ras Desta Damtew St, 01, Kirkos"),
                    col("Postal code:",          "255"),
                    col("SWIFT Code:",           "CBETETAA"),
                    col("Email:",                "info@cbe.com.et"),
                    col("Tel:",                  "251-551-50-04"),
                    col("Fax:",                  "251-551-45-22"),
                    col("Tin:",                  "0000006966"),
                    col("VAT Receipt No:",       txRef),
                    col("VAT Registration No:",  "011140"),
                    col("VAT Registration Date:","01/01/2003"),
                    "",
                    "Customer Information",
                    col("Customer Name:",        (user?.firstName ?? "") + " " + (user?.lastName ?? "")),
                    col("Region:",               "Addis Ababa"),
                    col("City:",                 "Addis Ababa"),
                    col("Sub City:",             "_"),
                    col("Wereda/Kebele:",        "_"),
                    col("VAT Registration No:",  "_"),
                    col("VAT Registration Date:","_"),
                    col("TIN (TAX ID):",         "_"),
                    col("Branch:",               "Mobile Banking"),
                    "",
                    "Payment / Transaction Information",
                    col("Payer",                 (user?.firstName ?? "") + " " + (user?.lastName ?? "")),
                    col("Account",               maskedAcc),
                    col("Receiver",              selectedPayment.recipientName),
                    col("Account",               "DARA Rental Platform"),
                    col("Payment Date & Time",   payDateStr),
                    col("Reference No. (VAT Invoice No)", txRef),
                    col("Reason / Type of service", "Rent payment — " + selectedPayment.propertyTitle + " via " + methodInfo.label),
                    col("Transferred Amount",    selectedPayment.amount.toFixed(2) + " ETB"),
                    col("Commission or Service Charge", commission.toFixed(2) + " ETB"),
                    col("15% VAT on Commission", vat.toFixed(2) + " ETB"),
                    col("Total amount debited from customers account", totalDebited.toFixed(2) + " ETB"),
                    col("Amount in Word",        amountToWords(totalDebited)),
                    "",
                    "The Bank you can always rely on.",
                    "© " + new Date().getFullYear() + " Commercial Bank of Ethiopia. All rights reserved.",
                  ];
                  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `CBE_Receipt_${txRef}.txt`;
                  a.click();
                };

                return (
                  <>
                    {/* ── CBE-styled receipt ── */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden mb-4 text-xs" style={{ fontFamily: "'Courier New', monospace" }}>
                      {/* Bank header */}
                      <div className="bg-[#1a3a6b] px-5 py-4 text-center">
                        <p className="text-white font-black text-base tracking-wide">Commercial Bank of Ethiopia</p>
                        <p className="text-blue-200 text-[11px] mt-0.5 font-semibold">VAT Invoice / Customer Receipt</p>
                      </div>

                      {/* Amount hero */}
                      <div className="bg-emerald-600 py-3 text-center">
                        <p className="text-emerald-100 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Total Amount Debited</p>
                        <p className="text-white font-black text-2xl">{totalDebited.toFixed(2)} ETB</p>
                        <p className="text-emerald-200 text-[10px] mt-0.5">✓ Transaction Successful</p>
                      </div>

                      {/* Section: Company */}
                      <div className="px-4 py-3 border-b border-dashed border-slate-200 bg-slate-50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Company Address &amp; Other Information</p>
                        {[
                          ["Country",               "Ethiopia"],
                          ["City",                  "Addis Ababa"],
                          ["Address",               "Ras Desta Damtew St, 01, Kirkos"],
                          ["SWIFT Code",            "CBETETAA"],
                          ["Email",                 "info@cbe.com.et"],
                          ["Tel",                   "251-551-50-04"],
                          ["VAT Receipt No",        txRef],
                          ["VAT Registration No",   "011140"],
                        ].map(([l, v]) => (
                          <div key={l} className="flex justify-between py-0.5">
                            <span className="text-slate-400 shrink-0 w-36">{l}:</span>
                            <span className="text-slate-700 font-semibold text-right">{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Section: Customer */}
                      <div className="px-4 py-3 border-b border-dashed border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer Information</p>
                        {[
                          ["Customer Name",  ((user?.firstName ?? "") + " " + (user?.lastName ?? "")).toUpperCase()],
                          ["Region",         "Addis Ababa"],
                          ["City",           "Addis Ababa"],
                          ["Sub City",       "_"],
                          ["Wereda/Kebele",  "_"],
                          ["TIN (TAX ID)",   "_"],
                          ["Branch",         "Mobile Banking"],
                        ].map(([l, v]) => (
                          <div key={l} className="flex justify-between py-0.5">
                            <span className="text-slate-400 shrink-0 w-36">{l}:</span>
                            <span className="text-slate-700 font-semibold text-right">{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Section: Transaction */}
                      <div className="px-4 py-3 border-b border-dashed border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment / Transaction Information</p>
                        {[
                          ["Payer",                   ((user?.firstName ?? "") + " " + (user?.lastName ?? "")).toUpperCase()],
                          ["Account",                 maskedAcc],
                          ["Receiver",                selectedPayment.recipientName.toUpperCase()],
                          ["Account",                 "DARA Rental Platform"],
                          ["Payment Date & Time",     payDateStr],
                          ["Reference No.",           txRef],
                          ["Reason / Type",           "Rent — " + selectedPayment.propertyTitle],
                          ["Transferred Amount",      selectedPayment.amount.toFixed(2) + " ETB"],
                          ["Commission",              commission.toFixed(2) + " ETB"],
                          ["15% VAT on Commission",   vat.toFixed(2) + " ETB"],
                          ["Total Debited",           totalDebited.toFixed(2) + " ETB"],
                        ].map(([l, v]) => (
                          <div key={l} className={`flex justify-between py-0.5 ${l === "Total Debited" ? "font-black text-slate-900 pt-2 border-t border-slate-200 mt-1" : ""}`}>
                            <span className={`shrink-0 w-40 ${l === "Total Debited" ? "text-slate-700" : "text-slate-400"}`}>{l}:</span>
                            <span className="font-semibold text-slate-800 text-right">{v}</span>
                          </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="text-slate-400">Amount in Word:</p>
                          <p className="text-slate-700 font-semibold mt-0.5">{amountToWords(totalDebited)}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="bg-[#1a3a6b] px-4 py-3 text-center">
                        <p className="text-blue-200 text-[10px] italic">The Bank you can always rely on.</p>
                        <p className="text-blue-300/60 text-[9px] mt-1">© {new Date().getFullYear()} Commercial Bank of Ethiopia. All rights reserved.</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.print()}
                        className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors"
                      >
                        <Printer className="w-4 h-4" /> Print
                      </button>
                      <button
                        onClick={downloadReceipt}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#1a3a6b] hover:bg-[#15305c] text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                      <button
                        onClick={closePayModal}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Done
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
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
  const config: Record<string, { bg: string; text: string; icon: typeof Landmark }> = {
    cbe_birr: { bg: "bg-blue-50", text: "text-blue-700", icon: Landmark },
    telebirr: { bg: "bg-green-50", text: "text-green-700", icon: Smartphone },
    bank_transfer: { bg: "bg-slate-50", text: "text-slate-700", icon: Landmark },
    mobile_money: { bg: "bg-purple-50", text: "text-purple-700", icon: Smartphone },
    cash: { bg: "bg-amber-50", text: "text-amber-700", icon: CreditCard },
    check: { bg: "bg-slate-50", text: "text-slate-600", icon: CreditCard },
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
