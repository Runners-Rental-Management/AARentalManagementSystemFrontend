"use client";

import { useState, useCallback, useEffect } from "react";

/* ── helpers ── */
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
function maskAccount(acc: string): string {
  if (acc.length <= 4) return acc;
  return acc[0] + "****" + acc.slice(-4);
}
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
  Loader2,
  MessageSquare,
  Phone,
  Printer,
  ShieldCheck,
  Smartphone,
  FileSignature,
  User,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRentalFlow, type LiveAgreement } from "@/context/rental-flow-context";
import { useLoading } from "@/context/loading-context";
import { users } from "@/lib/dummy-data";
import { AgreementContactSection } from "@/components/dashboard/agreement-contact-section";
import { ViewTenantProfileLink } from "@/components/dashboard/tenant-public-profile";
import type { AgreementContacts } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Stage pipeline (order depends on who initiated)                  */
/* ------------------------------------------------------------------ */

type StageDef = { label: string; who: string };

function getAgreementStages(agreement: LiveAgreement): StageDef[] {
  if (agreement.initiatedByLandlord) {
    return [
      { label: "Landlord Signed", who: "Landlord" },
      { label: "Tenant Signed", who: "Tenant" },
      { label: "DARA Approved", who: "DARA Officer" },
      { label: "Payment Confirmed", who: "Tenant" },
    ];
  }
  return [
    { label: "Tenant Signed", who: "Tenant" },
    { label: "Landlord Signed", who: "Landlord" },
    { label: "DARA Approved", who: "DARA Officer" },
    { label: "Payment Confirmed", who: "Tenant" },
  ];
}

/** Active stage index; when status is `paid`, all stages are complete. */
function getAgreementStageIndex(agreement: LiveAgreement): number {
  const { status, initiatedByLandlord } = agreement;
  if (status === "paid") return 4;
  if (status === "dara_approved") return 3;
  if (status === "landlord_signed") return 2;
  if (initiatedByLandlord && status === "landlord_initiated") return 0;
  if (!initiatedByLandlord && status === "tenant_signed") return 0;
  return 0;
}

/* ------------------------------------------------------------------ */
/*  Payment methods                                                    */
/* ------------------------------------------------------------------ */

type PayMethod = "cbe_birr" | "telebirr";

const PAY_METHODS: {
  id: PayMethod;
  label: string;
  pinLabel: string;
  icon: typeof Landmark;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "cbe_birr",
    label: "CBE Birr",
    pinLabel: "CBE Birr",
    icon: Landmark,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-300",
  },
  {
    id: "telebirr",
    label: "Telebirr",
    pinLabel: "Telebirr",
    icon: Smartphone,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-300",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtCur(n: number) {
  return `ETB ${n.toLocaleString()}`;
}

/* ------------------------------------------------------------------ */
/*  Stage tracker                                                      */
/* ------------------------------------------------------------------ */

function StageTracker({ agreement }: { agreement: LiveAgreement }) {
  const stages = getAgreementStages(agreement);
  const idx = getAgreementStageIndex(agreement);
  const allDone = agreement.status === "paid";
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      <h3 className="text-sm font-semibold text-stone-700 mb-5">
        Agreement Progress
        <span className="ml-2 text-xs font-normal text-stone-400">
          {agreement.initiatedByLandlord ? "Landlord → Tenant → DARA" : "Tenant → Landlord → DARA"}
        </span>
      </h3>
      <div className="flex items-start gap-0">
        {stages.map((stage, i) => {
          const done = allDone || i < idx;
          const active = !allDone && i === idx;
          return (
            <div key={`${stage.label}-${i}`} className="flex items-center flex-1">
              <div className="flex flex-col items-center min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    done
                      ? active
                        ? "bg-primary-600 ring-4 ring-primary-100"
                        : "bg-emerald-500"
                      : "bg-stone-100"
                  }`}
                >
                  {done && !active ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : active ? (
                    <Clock className="w-4 h-4 text-white animate-pulse" />
                  ) : (
                    <span className="text-xs font-bold text-stone-400">
                      {i + 1}
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] font-semibold mt-1.5 text-center leading-tight max-w-[72px] ${
                    done
                      ? active
                        ? "text-primary-700"
                        : "text-emerald-700"
                      : "text-stone-400"
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-[10px] text-stone-400 text-center">
                  {stage.who}
                </p>
              </div>
              {i < stages.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-22px] transition-colors ${
                    i < idx ? "bg-emerald-400" : "bg-stone-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Payment modal — with PIN step                                      */
/* ------------------------------------------------------------------ */

type PayStep = "select" | "account" | "pin" | "confirm" | "processing" | "receipt";

/* SMS notification toast */
function SmsToast({ phone, amount, ref, method }: { phone: string; amount: number; ref: string; method: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] w-80 animate-fade-in-up">
      <div className="bg-stone-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 bg-green-600 px-4 py-2">
          <MessageSquare className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-xs font-bold">SMS Notification Sent</span>
          <button onClick={() => setVisible(false)} className="ml-auto text-white/70 hover:text-white">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] text-stone-400 mb-1">To: {phone}</p>
          <p className="text-xs text-white leading-relaxed">
            {method === "cbe_birr"
              ? `CBE Birr: Your payment of ETB ${amount.toLocaleString()} was successful. Ref: ${ref}. DARA Rental System — advance rent confirmed.`
              : `Telebirr: Paid ETB ${amount.toLocaleString()} for advance rent. TxnRef: ${ref}. DARA Rental Platform — transaction complete.`}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Transaction receipt — CBE format */
function Receipt({
  amount, method, account, ref, paidAt, propertyTitle, landlordName, tenantName,
  onConfirm,
}: {
  amount: number; method: PayMethod; account: string; ref: string; paidAt: string;
  propertyTitle: string; landlordName: string; tenantName: string;
  onClose: () => void; onConfirm: () => void;
}) {
  const commission  = 0.50;
  const vat         = parseFloat((commission * 0.15).toFixed(2));
  const totalDebited = amount + commission + vat;
  const maskedAcc   = maskAccount(account);
  const payDateStr  = new Date(paidAt).toLocaleString("en-US", {
    month: "numeric", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });

  const downloadReceipt = () => {
    const col = (label: string, value: string) => label.padEnd(40) + value;
    const lines = [
      "Commercial Bank of Ethiopia",
      "VAT Invoice / Customer Receipt",
      "",
      "Company Address & Other Information",
      col("Country:",               "Ethiopia"),
      col("City:",                  "Addis Ababa"),
      col("Address:",               "Ras Desta Damtew St, 01, Kirkos"),
      col("Postal code:",           "255"),
      col("SWIFT Code::",           "CBETETAA"),
      col("Email:",                 "info@cbe.com.et"),
      col("Tel:",                   "251-551-50-04"),
      col("Fax:",                   "251-551-45-22"),
      col("Tin:",                   "0000006966"),
      col("VAT Receipt No:",        ref),
      col("VAT Registration No:",   "011140"),
      col("VAT Registration Date:", "01/01/2003"),
      "",
      "Customer Information",
      col("Customer Name:",         tenantName.toUpperCase()),
      col("Region:",                "Addis Ababa"),
      col("City:",                  "Addis Ababa"),
      col("Sub City:",              "_"),
      col("Wereda/Kebele:",         "_"),
      col("VAT Registration No:",   "_"),
      col("VAT Registration Date:", "_"),
      col("TIN (TAX ID):",          "_"),
      col("Branch:",                "Mobile Banking"),
      "",
      "Payment / Transaction Information",
      col("Payer",                  tenantName.toUpperCase()),
      col("Account",                maskedAcc),
      col("Receiver",               landlordName.toUpperCase()),
      col("Account",                "DARA Rental Platform"),
      col("Payment Date & Time",    payDateStr),
      col("Reference No. (VAT Invoice No)", ref),
      col("Reason / Type of service", "Advance Rent (2 months) — " + propertyTitle + " via " + method.replace("_"," ")),
      col("Transferred Amount",     amount.toFixed(2) + " ETB"),
      col("Commission or Service Charge", commission.toFixed(2) + " ETB"),
      col("15% VAT on Commission",  vat.toFixed(2) + " ETB"),
      col("Total amount debited from customers account", totalDebited.toFixed(2) + " ETB"),
      col("Amount in Word",         amountToWords(totalDebited)),
      "",
      "The Bank you can always rely on.",
      "© " + new Date().getFullYear() + " Commercial Bank of Ethiopia. All rights reserved.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `CBE_Receipt_${ref}.txt`;
    a.click();
  };

  return (
    <div className="p-6">
      {/* CBE-styled receipt */}
      <div className="border border-stone-200 rounded-2xl overflow-hidden mb-4 text-xs" style={{ fontFamily: "'Courier New', monospace" }}>
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

        {/* Company info */}
        <div className="px-4 py-3 border-b border-dashed border-stone-200 bg-stone-50">
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Company Address &amp; Other Information</p>
          {[
            ["Country",              "Ethiopia"],
            ["City",                 "Addis Ababa"],
            ["Address",              "Ras Desta Damtew St, 01, Kirkos"],
            ["SWIFT Code",           "CBETETAA"],
            ["Email",                "info@cbe.com.et"],
            ["Tel",                  "251-551-50-04"],
            ["VAT Receipt No",       ref],
            ["VAT Registration No",  "011140"],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between py-0.5">
              <span className="text-stone-400 shrink-0 w-36">{l}:</span>
              <span className="text-stone-700 font-semibold text-right">{v}</span>
            </div>
          ))}
        </div>

        {/* Customer info */}
        <div className="px-4 py-3 border-b border-dashed border-stone-200">
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Customer Information</p>
          {[
            ["Customer Name",  tenantName.toUpperCase()],
            ["Region",         "Addis Ababa"],
            ["City",           "Addis Ababa"],
            ["Sub City",       "_"],
            ["Wereda/Kebele",  "_"],
            ["TIN (TAX ID)",   "_"],
            ["Branch",         "Mobile Banking"],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between py-0.5">
              <span className="text-stone-400 shrink-0 w-36">{l}:</span>
              <span className="text-stone-700 font-semibold text-right">{v}</span>
            </div>
          ))}
        </div>

        {/* Transaction info */}
        <div className="px-4 py-3 border-b border-dashed border-stone-200">
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Payment / Transaction Information</p>
          {[
            ["Payer",                  tenantName.toUpperCase()],
            ["Account",                maskedAcc],
            ["Receiver",               landlordName.toUpperCase()],
            ["Account",                "DARA Rental Platform"],
            ["Payment Date & Time",    payDateStr],
            ["Reference No.",          ref],
            ["Reason / Type",          "Advance Rent (2 mo.) — " + propertyTitle],
            ["Transferred Amount",     amount.toFixed(2) + " ETB"],
            ["Commission",             commission.toFixed(2) + " ETB"],
            ["15% VAT on Commission",  vat.toFixed(2) + " ETB"],
            ["Total Debited",          totalDebited.toFixed(2) + " ETB"],
          ].map(([l, v]) => (
            <div key={l} className={`flex justify-between py-0.5 ${l === "Total Debited" ? "font-black text-stone-900 pt-2 border-t border-stone-200 mt-1" : ""}`}>
              <span className={`shrink-0 w-44 ${l === "Total Debited" ? "text-stone-700" : "text-stone-400"}`}>{l}:</span>
              <span className="font-semibold text-stone-800 text-right">{v}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-stone-100">
            <p className="text-stone-400">Amount in Word:</p>
            <p className="text-stone-700 font-semibold mt-0.5">{amountToWords(totalDebited)}</p>
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
          className="flex-1 flex items-center justify-center gap-2 border border-stone-200 text-stone-700 py-2.5 rounded-xl hover:bg-stone-50 text-sm font-medium transition-colors"
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
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" /> Done
        </button>
      </div>
    </div>
  );
}

function PaymentModal({
  amount, propertyTitle, landlordName, tenantName, onPaid, onClose,
}: {
  amount: number; propertyTitle: string; landlordName: string; tenantName: string;
  onPaid: (method: string, ref: string) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<PayStep>("select");
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [account, setAccount] = useState("");   // CBE account number or Telebirr phone
  const [pin, setPin] = useState("");
  const [pinVisible, setPinVisible] = useState(false);
  const [pinError, setPinError] = useState("");
  const [ref, setRef] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [showSms, setShowSms] = useState(false);

  const methodInfo = PAY_METHODS.find((m) => m.id === method);
  const isCbe = method === "cbe_birr";

  const handlePinNext = () => {
    if (pin.length < 4) { setPinError("PIN must be at least 4 digits."); return; }
    setPinError("");
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!method) return;
    setStep("processing");
    await new Promise((r) => setTimeout(r, 2800));
    const txRef = `TXN-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    setRef(txRef);
    setPaidAt(now);
    setShowSms(true);
    setStep("receipt");
  };

  const STEPS_BAR = ["select", "account", "pin", "confirm"] as const;
  const STEP_LABELS = ["Method", "Account", "Passkey", "Confirm"];

  return (
    <>
      {showSms && method && (
        <SmsToast phone={account} amount={amount} ref={ref} method={method} />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-700 to-primary-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">
                {step === "receipt" ? "Transaction Receipt" : "Advance Payment Gateway"}
              </span>
            </div>
            {step !== "processing" && step !== "receipt" && (
              <button onClick={onClose} className="text-white/70 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Step bar */}
          {!["processing", "receipt"].includes(step) && (
            <div className="flex border-b border-stone-100">
              {STEPS_BAR.map((s, i) => (
                <div
                  key={s}
                  className={`flex-1 py-2 text-center text-[10px] font-semibold transition-colors ${
                    step === s
                      ? "text-primary-700 border-b-2 border-primary-600"
                      : STEPS_BAR.indexOf(step as (typeof STEPS_BAR)[number]) > i
                        ? "text-emerald-600"
                        : "text-stone-400"
                  }`}
                >
                  {i + 1}. {STEP_LABELS[i]}
                </div>
              ))}
            </div>
          )}

          <div className="p-6">
            {/* ── Step 1: Choose method ── */}
            {step === "select" && (
              <>
                <p className="text-xs text-stone-500 mb-0.5">Amount Due</p>
                <p className="text-3xl font-bold text-stone-900 mb-5">{fmtCur(amount)}</p>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
                  Choose Payment Method
                </p>
                <div className="space-y-3 mb-6">
                  {PAY_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all ${
                        method === m.id ? `${m.border} ${m.bg}` : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                        <m.icon className={`w-5 h-5 ${m.color}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold text-sm ${m.color}`}>{m.label}</p>
                        <p className="text-[11px] text-stone-400">
                          {m.id === "cbe_birr" ? "CBE bank account number" : "Registered Telebirr phone"}
                        </p>
                      </div>
                      {method === m.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep("account")}
                  disabled={!method}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Continue
                </button>
              </>
            )}

            {/* ── Step 2: Account / Phone ── */}
            {step === "account" && methodInfo && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl ${methodInfo.bg} flex items-center justify-center`}>
                    <methodInfo.icon className={`w-6 h-6 ${methodInfo.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 text-sm">{methodInfo.label}</p>
                    <p className="text-xs text-stone-500">
                      {isCbe ? "Enter your CBE account number" : "Enter your Telebirr phone number"}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">
                    {isCbe ? "CBE Account Number" : "Telebirr Phone Number"}
                  </label>
                  <div className="relative">
                    {isCbe
                      ? <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      : <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    }
                    <input
                      type={isCbe ? "text" : "tel"}
                      value={account}
                      onChange={(e) => setAccount(isCbe ? e.target.value.replace(/\D/g, "") : e.target.value)}
                      placeholder={isCbe ? "1000XXXXXXXXX" : "+251 9XX XXX XXX"}
                      className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1.5">
                    {isCbe
                      ? "Your 13-digit CBE Birr account number linked to this device."
                      : "The phone number registered with your Telebirr wallet."}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 mb-5">
                  An SMS confirmation will be sent to this account after payment is processed.
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("select")}
                    className="flex-1 border border-stone-200 text-stone-700 font-semibold py-2.5 rounded-xl hover:bg-stone-50 transition-colors text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep("pin")}
                    disabled={account.trim().length < 7}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* ── Step 3: PIN ── */}
            {step === "pin" && methodInfo && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl ${methodInfo.bg} flex items-center justify-center`}>
                    <KeyRound className={`w-6 h-6 ${methodInfo.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 text-sm">
                      Enter your {methodInfo.pinLabel} PIN
                    </p>
                    <p className="text-xs text-stone-500">{account}</p>
                  </div>
                </div>

                <div className="mb-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">
                    {isCbe ? "CBE Birr PIN" : "Telebirr Passkey"}
                  </label>
                  <div className="relative">
                    <input
                      type={pinVisible ? "text" : "password"}
                      inputMode="numeric"
                      value={pin}
                      onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(""); }}
                      placeholder="••••••"
                      maxLength={6}
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary-400 pr-12 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setPinVisible((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {pinVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pinError && <p className="text-xs text-red-600 mt-1.5">{pinError}</p>}
                </div>

                <p className="text-xs text-stone-400 mt-2 mb-5">
                  Your PIN is encrypted and sent directly to {methodInfo.label}. It is never stored by DARA.
                </p>

                <div className="flex gap-3">
                  <button onClick={() => setStep("account")} className="flex-1 border border-stone-200 text-stone-700 font-semibold py-2.5 rounded-xl hover:bg-stone-50 transition-colors text-sm">
                    Back
                  </button>
                  <button onClick={handlePinNext} disabled={pin.length < 4} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                    Authorise
                  </button>
                </div>
              </>
            )}

            {/* ── Step 4: Confirm ── */}
            {step === "confirm" && methodInfo && (
              <>
                <p className="text-sm font-bold text-stone-900 mb-4">Review & Confirm Payment</p>
                <div className="bg-stone-50 rounded-xl p-4 space-y-2.5 text-sm mb-2">
                  {[
                    ["Amount", <span key="a" className="font-black text-stone-900 text-base">{fmtCur(amount)}</span>],
                    ["Method", methodInfo.label],
                    [isCbe ? "Account No." : "Phone", account],
                    ["PIN", <span key="p" className="tracking-widest">{"•".repeat(pin.length)}</span>],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between items-center">
                      <span className="text-stone-500">{label}</span>
                      <span className="font-semibold text-stone-800">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800 mb-5">
                  After payment an <strong>SMS confirmation</strong> will be sent to your {isCbe ? "account" : "phone"} and a <strong>transaction receipt</strong> will be generated.
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("pin")} className="flex-1 border border-stone-200 text-stone-700 font-semibold py-2.5 rounded-xl hover:bg-stone-50 transition-colors text-sm">Back</button>
                  <button onClick={handleConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" /> Pay {fmtCur(amount)}
                  </button>
                </div>
              </>
            )}

            {/* ── Processing ── */}
            {step === "processing" && (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="relative w-20 h-20 mb-5">
                  <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-40" />
                  <div className="relative w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                    <Loader2 className="w-9 h-9 text-primary-600 animate-spin" />
                  </div>
                </div>
                <p className="font-bold text-stone-900 text-lg">Processing Payment…</p>
                <p className="text-sm text-stone-500 mt-1">Connecting to {methodInfo?.label}…</p>
                <p className="text-xs text-stone-400 mt-3">Please do not close this window.</p>
              </div>
            )}

            {/* ── Receipt ── */}
            {step === "receipt" && method && (
              <Receipt
                amount={amount}
                method={method}
                account={account}
                ref={ref}
                paidAt={paidAt}
                propertyTitle={propertyTitle}
                landlordName={landlordName}
                tenantName={tenantName}
                onClose={onClose}
                onConfirm={() => { onPaid(method, ref); onClose(); }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function LiveAgreementPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const {
    agreements,
    notifs,
    daraApprove,
    recordPayment,
    getLandlordPhone,
    tenantCancelAgreement,
    landlordCancelAgreement,
    markRead,
  } = useRentalFlow();

  const { withLoading } = useLoading();
  const [showPayModal, setShowPayModal] = useState(false);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [daraLoading, setDaraLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showLandlordCancelConfirm, setShowLandlordCancelConfirm] = useState(false);

  const agreement = agreements.find(
    (a) => a.id === params.id
  ) as LiveAgreement | undefined;

  const myNotifs = notifs.filter((n) => n.agreementId === params.id);

  const doDaraApprove = useCallback(async () => {
    if (!agreement) return;
    setDaraLoading(true);
    await withLoading(async () => {
      await new Promise((r) => setTimeout(r, 1200));
      daraApprove(agreement.id);
      myNotifs.forEach((n) => markRead(n.id));
    }, "Processing DARA approval…");
    setDaraLoading(false);
  }, [agreement, daraApprove, myNotifs, markRead, withLoading]);

  const handlePaid = useCallback(
    (method: string, ref: string) => {
      if (!agreement) return;
      recordPayment(agreement.id, method, ref);
      setShowPayModal(false);
    },
    [agreement, recordPayment]
  );

  if (!agreement) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4">Agreement not found.</p>
          <Link
            href="/dashboard/agreements"
            className="text-primary-600 hover:underline text-sm"
          >
            View all agreements
          </Link>
        </div>
      </main>
    );
  }

  const role = user?.role ?? "tenant";
  const isTenant = role === "tenant";
  const isLandlord = role === "landlord";
  const isAuthority = role === "admin";
  const stageIdx = getAgreementStageIndex(agreement);
  const progressStages = getAgreementStages(agreement);

  const landlordPhone = getLandlordPhone(agreement.landlordId, agreement.id);
  const landlordUser = users.find((u) => u.id === agreement.landlordId);
  const tenantUser = users.find((u) => u.id === agreement.tenantId);
  const liveContactsUnlocked =
    agreement.status === "dara_approved" || agreement.status === "paid";
  const liveContacts: AgreementContacts | undefined =
    liveContactsUnlocked && landlordUser && tenantUser
      ? {
          landlord: {
            fullName: `${landlordUser.firstName} ${landlordUser.lastName}`.trim(),
            phone: landlordUser.phone,
            address: landlordUser.address ?? "Not provided",
          },
          tenant: {
            fullName: `${tenantUser.firstName} ${tenantUser.lastName}`.trim(),
            phone: tenantUser.phone,
            address: tenantUser.address ?? "Not provided",
          },
        }
      : undefined;

  /* Terminal cancelled / rejected screens */
  if (
    agreement.status === "tenant_cancelled" ||
    agreement.status === "landlord_cancelled" ||
    agreement.status === "rejected"
  ) {
    const isLandlordCancelled = agreement.status === "landlord_cancelled";
    const isDeclined = agreement.status === "rejected";
    return (
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">
            {isDeclined ? "Contract Declined" : "Agreement Cancelled"}
          </h2>
          <p className="text-stone-600 mb-6">
            {isDeclined
              ? "This contract was declined by the tenant. No further action is required."
              : isLandlordCancelled
                ? "The landlord cancelled this rental agreement before payment was made. The tenant and DARA have been notified."
                : "The tenant cancelled this rental agreement before payment was made. The property is now available again."}
          </p>
          <Link
            href="/dashboard/agreements"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Agreements
          </Link>
        </div>
      </main>
    );
  }

  const canTenantCancel = isTenant && agreement.status !== "paid";
  const canLandlordCancel = isLandlord && agreement.status !== "paid";

  const handleTenantCancel = async () => {
    await withLoading(async () => {
      await new Promise((r) => setTimeout(r, 600));
      tenantCancelAgreement(agreement.id);
    }, "Cancelling agreement…");
    setShowCancelConfirm(false);
  };

  const handleLandlordCancel = async () => {
    await withLoading(async () => {
      await new Promise((r) => setTimeout(r, 600));
      landlordCancelAgreement(agreement.id);
    }, "Cancelling agreement…");
    setShowLandlordCancelConfirm(false);
  };

  return (
    <>
      {showPayModal && (
        <PaymentModal
          amount={agreement.advanceAmount}
          propertyTitle={agreement.propertyTitle}
          landlordName={agreement.landlordName}
          tenantName={agreement.tenantName}
          onPaid={handlePaid}
          onClose={() => setShowPayModal(false)}
        />
      )}

      {/* Tenant cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 text-center mb-2">
              Withdraw Agreement?
            </h3>
            <p className="text-sm text-stone-600 text-center mb-6">
              Are you sure you want to withdraw from the rental agreement for{" "}
              <strong>{agreement.propertyTitle}</strong>? This action cannot be undone. The landlord and DARA will be notified.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-sm transition-colors"
              >
                Keep Agreement
              </button>
              <button
                onClick={handleTenantCancel}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
              >
                Yes, Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Landlord cancel confirmation modal */}
      {showLandlordCancelConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 text-center mb-2">
              Cancel Agreement?
            </h3>
            <p className="text-sm text-stone-600 text-center mb-6">
              Are you sure you want to cancel the rental agreement for{" "}
              <strong>{agreement.propertyTitle}</strong>? This action cannot be undone.{" "}
              <strong>{agreement.tenantName}</strong> will be notified immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLandlordCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-sm transition-colors"
              >
                Keep Agreement
              </button>
              <button
                onClick={handleLandlordCancel}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 bg-stone-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-primary-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3">
              Live Agreement Tracker
            </div>
            <h1 className="text-2xl font-bold text-stone-900">
              {agreement.propertyTitle}
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              {agreement.propertyAddress}
            </p>
          </div>

          <div className="mb-4">
            <StageTracker agreement={agreement} />
          </div>

          {/* Tenant status banner */}
          {isTenant && (
            <div className={`mb-6 rounded-xl px-5 py-3.5 flex items-center justify-between gap-4 border ${
              agreement.status === "landlord_initiated"
                ? "bg-violet-50 border-violet-200"
                : agreement.status === "landlord_signed"
                  ? "bg-primary-50 border-primary-200"
                  : agreement.status === "dara_approved"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50 border-emerald-200"
            }`}>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${
                  agreement.status === "landlord_initiated" ? "text-violet-600"
                  : agreement.status === "landlord_signed" ? "text-primary-600"
                  : agreement.status === "dara_approved" ? "text-amber-600"
                  : "text-emerald-600"
                }`}>
                  {agreement.status === "landlord_initiated" && "Pending Your Signature"}
                  {agreement.status === "tenant_signed" && "Awaiting Landlord Signature"}
                  {agreement.status === "landlord_signed" && "Pending Officer Verification"}
                  {agreement.status === "dara_approved" && "Awaiting Your Payment"}
                  {agreement.status === "paid" && "Agreement Active"}
                </p>
                <p className="text-xs text-stone-600">
                  {agreement.status === "landlord_initiated" && "Review and sign the contract to proceed."}
                  {agreement.status === "tenant_signed" && "The landlord is reviewing your signature."}
                  {agreement.status === "landlord_signed" && "A DARA officer is reviewing this agreement for compliance."}
                  {agreement.status === "dara_approved" && "Your agreement was approved. Complete the advance payment to activate it."}
                  {agreement.status === "paid" && "Your contract is active. Welcome to your new home!"}
                </p>
              </div>
              {canTenantCancel && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Withdraw
                </button>
              )}
            </div>
          )}

          {/* Landlord status banner */}
          {isLandlord && (
            <div className={`mb-6 rounded-xl px-5 py-3.5 flex items-center justify-between gap-4 border ${
              agreement.status === "landlord_initiated"
                ? "bg-violet-50 border-violet-200"
                : agreement.status === "tenant_signed"
                  ? "bg-amber-50 border-amber-200"
                  : agreement.status === "landlord_signed"
                    ? "bg-primary-50 border-primary-200"
                    : agreement.status === "dara_approved"
                      ? "bg-sky-50 border-sky-200"
                      : "bg-emerald-50 border-emerald-200"
            }`}>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${
                  agreement.status === "landlord_initiated" ? "text-violet-600"
                  : agreement.status === "tenant_signed" ? "text-amber-600"
                  : agreement.status === "landlord_signed" ? "text-primary-600"
                  : agreement.status === "dara_approved" ? "text-sky-600"
                  : "text-emerald-600"
                }`}>
                  {agreement.status === "landlord_initiated" && "Awaiting Tenant Signature"}
                  {agreement.status === "tenant_signed" && "Tenant Signed — Review Pending"}
                  {agreement.status === "landlord_signed" && "Pending DARA Verification"}
                  {agreement.status === "dara_approved" && "Awaiting Tenant Payment"}
                  {agreement.status === "paid" && "Contract Active"}
                </p>
                <p className="text-xs text-stone-600">
                  {agreement.status === "landlord_initiated" && `${agreement.tenantName} has received your contract and must sign it.`}
                  {agreement.status === "tenant_signed" && "Review the tenant's signature and counter-sign or reject."}
                  {agreement.status === "landlord_signed" && "Both parties have signed. A DARA officer is reviewing compliance."}
                  {agreement.status === "dara_approved" && "DARA approved the agreement. Waiting for tenant advance payment."}
                  {agreement.status === "paid" && "Advance payment received. The rental is now fully active."}
                </p>
              </div>
              {canLandlordCancel && (
                <button
                  onClick={() => setShowLandlordCancelConfirm(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel Agreement
                </button>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">

              {/* Tenant signed — landlord must counter-sign */}
              {agreement.status === "tenant_signed" && isLandlord && (
                <div className="bg-white rounded-2xl border-2 border-amber-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                      <FileSignature className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-stone-900 mb-1">
                        Tenant Signed — Your Action Required
                      </h2>
                      <p className="text-sm text-stone-600 mb-4">
                        <strong>{agreement.tenantName}</strong> has signed the rental contract
                        for <strong>{agreement.propertyTitle}</strong>. Review the terms, then
                        counter-sign to send the agreement to DARA for verification, or reject
                        to cancel the request.
                      </p>
                      <ViewTenantProfileLink
                        tenantId={agreement.tenantId}
                        className="mb-4 inline-flex"
                        label="View tenant profile"
                      />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                          href={`/dashboard/agreements/live/${agreement.id}/counter-sign`}
                          className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                        >
                          <FileSignature className="w-4 h-4" />
                          Review & Counter-Sign
                        </Link>
                        <button
                          onClick={() => setShowLandlordCancelConfirm(true)}
                          className="inline-flex items-center justify-center gap-2 border border-red-300 text-red-700 hover:bg-red-50 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Agreement
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tenant signed — tenant waiting for landlord */}
              {agreement.status === "tenant_signed" && isTenant && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-stone-900 mb-1">
                        Awaiting Landlord Counter-Signature
                      </h2>
                      <p className="text-sm text-stone-600">
                        {agreement.landlordName} has been notified and must review and
                        counter-sign before DARA can verify the agreement.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Landlord initiated — tenant must sign */}
              {agreement.status === "landlord_initiated" && isTenant && (
                <div className="bg-white rounded-2xl border-2 border-violet-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
                      <FileSignature className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-stone-900 mb-1">
                        Landlord Signed — Your Action Required
                      </h2>
                      <p className="text-sm text-stone-600 mb-4">
                        {agreement.landlordName} has signed this contract and sent it to you.
                        Review the full agreement and sign to proceed to DARA verification.
                      </p>
                      <Link
                        href={`/dashboard/agreements/live/${agreement.id}/sign`}
                        className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                      >
                        <FileSignature className="w-4 h-4" />
                        Review & Sign Contract
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {agreement.status === "landlord_initiated" && isLandlord && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-stone-900 mb-1">
                        Awaiting Tenant Signature
                      </h2>
                      <p className="text-sm text-stone-600">
                        You signed first. {agreement.tenantName} must review and sign the
                        contract before it goes to DARA.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Both signed — DARA must act */}
              {agreement.status === "landlord_signed" && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-stone-900 mb-1">
                        Awaiting DARA Government Verification
                      </h2>
                      <p className="text-sm text-stone-600 mb-4">
                        Both parties have signed. The agreement is forwarded to
                        a DARA officer for compliance review and official
                        approval.
                      </p>
                      <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 text-xs text-primary-800 mb-4">
                        <strong>Compliance check:</strong> Advance ≤ 2 months ✓
                        · Minimum 2-year term ✓ · Both parties Fayda-verified ✓
                      </div>
                      {isAuthority && (
                        <button
                          onClick={doDaraApprove}
                          disabled={daraLoading}
                          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                        >
                          {daraLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          Approve Agreement
                        </button>
                      )}
                      {!isAuthority && (
                        <div className="inline-flex items-center gap-2 bg-stone-100 text-stone-500 px-4 py-2.5 rounded-xl text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          Waiting for DARA officer review…
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {/* ③ DARA approved — tenant pays */}
              {agreement.status === "dara_approved" && (
                <div className="bg-white rounded-2xl border border-stone-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-stone-900 mb-1">
                        Payment Required to Activate Contract
                      </h2>
                      <p className="text-sm text-stone-600 mb-2">
                        Your agreement has been approved by DARA. Complete the
                        advance payment to receive the landlord&apos;s contact
                        information and activate your contract.
                      </p>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-900 mb-4">
                        <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wide block mb-1">
                          Amount Due
                        </span>
                        <span className="text-2xl font-bold">
                          {fmtCur(agreement.advanceAmount)}
                        </span>
                        <span className="text-xs text-emerald-600 ml-2">
                          (2 months advance)
                        </span>
                      </div>
                      <button
                        onClick={() => setShowPayModal(true)}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay via CBE Birr / Telebirr
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ④ Paid — contract active */}
              {agreement.status === "paid" && (
                <div className="bg-white rounded-2xl border border-emerald-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-emerald-900 mb-1">
                        Contract Active — Welcome to Your New Home!
                      </h2>
                      <p className="text-sm text-stone-600 mb-4">
                        Payment confirmed. Your rental contract is now fully
                        active. You can contact your landlord directly below.
                      </p>

                      {/* Landlord contact reveal */}
                      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3">
                          Landlord Contact Details
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-emerald-700" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <p className="font-bold text-stone-900 text-base">
                              {landlordUser?.firstName} {landlordUser?.lastName}
                            </p>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-stone-400" />
                              <span
                                className={`text-sm font-mono ${
                                  phoneVisible
                                    ? "text-stone-900"
                                    : "text-stone-400 tracking-widest"
                                }`}
                              >
                                {phoneVisible
                                  ? landlordPhone ?? "+251 — — —"
                                  : "+251 ●●● ●●● ●●●"}
                              </span>
                              <button
                                onClick={() => setPhoneVisible((v) => !v)}
                                className="ml-1 text-primary-600 hover:text-primary-700"
                                title={phoneVisible ? "Hide" : "Reveal phone"}
                              >
                                {phoneVisible ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {agreement.paidAt && (
                        <div className="mt-4 bg-stone-50 rounded-xl px-4 py-3 text-xs text-stone-700 space-y-2">
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Transaction Summary</p>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Method</span>
                            <span className="font-semibold">
                              {agreement.paymentMethod?.toUpperCase().replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Reference</span>
                            <span className="font-mono font-semibold text-primary-700">
                              {agreement.paymentRef}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Paid on</span>
                            <span className="font-semibold">{fmtDate(agreement.paidAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Amount</span>
                            <span className="font-bold text-emerald-700">{fmtCur(agreement.advanceAmount)}</span>
                          </div>
                          <button
                            onClick={() => {
                              const amt   = agreement.advanceAmount;
                              const comm  = 0.50;
                              const vat   = parseFloat((comm * 0.15).toFixed(2));
                              const total = amt + comm + vat;
                              const ref   = agreement.paymentRef ?? "";
                              const date  = agreement.paidAt
                                ? new Date(agreement.paidAt).toLocaleString("en-US", {
                                    month: "numeric", day: "numeric", year: "numeric",
                                    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
                                  })
                                : "";
                              const col = (l: string, v: string) => l.padEnd(40) + v;
                              const lines = [
                                "Commercial Bank of Ethiopia",
                                "VAT Invoice / Customer Receipt",
                                "",
                                "Company Address & Other Information",
                                col("Country:",               "Ethiopia"),
                                col("City:",                  "Addis Ababa"),
                                col("Address:",               "Ras Desta Damtew St, 01, Kirkos"),
                                col("Postal code:",           "255"),
                                col("SWIFT Code::",           "CBETETAA"),
                                col("Email:",                 "info@cbe.com.et"),
                                col("Tel:",                   "251-551-50-04"),
                                col("Fax:",                   "251-551-45-22"),
                                col("Tin:",                   "0000006966"),
                                col("VAT Receipt No:",        ref),
                                col("VAT Registration No:",   "011140"),
                                col("VAT Registration Date:", "01/01/2003"),
                                "",
                                "Customer Information",
                                col("Customer Name:",         agreement.tenantName.toUpperCase()),
                                col("Region:",                "Addis Ababa"),
                                col("City:",                  "Addis Ababa"),
                                col("Sub City:",              "_"),
                                col("Wereda/Kebele:",         "_"),
                                col("VAT Registration No:",   "_"),
                                col("VAT Registration Date:", "_"),
                                col("TIN (TAX ID):",          "_"),
                                col("Branch:",                "Mobile Banking"),
                                "",
                                "Payment / Transaction Information",
                                col("Payer",                  agreement.tenantName.toUpperCase()),
                                col("Account",                "****"),
                                col("Receiver",               agreement.landlordName.toUpperCase()),
                                col("Account",                "DARA Rental Platform"),
                                col("Payment Date & Time",    date),
                                col("Reference No. (VAT Invoice No)", ref),
                                col("Reason / Type of service", "Advance Rent (2 months) — " + agreement.propertyTitle),
                                col("Transferred Amount",     amt.toFixed(2) + " ETB"),
                                col("Commission or Service Charge", comm.toFixed(2) + " ETB"),
                                col("15% VAT on Commission",  vat.toFixed(2) + " ETB"),
                                col("Total amount debited from customers account", total.toFixed(2) + " ETB"),
                                col("Amount in Word",         amountToWords(total)),
                                "",
                                "The Bank you can always rely on.",
                                "© " + new Date().getFullYear() + " Commercial Bank of Ethiopia. All rights reserved.",
                              ];
                              const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                              const a = document.createElement("a");
                              a.href = URL.createObjectURL(blob);
                              a.download = `CBE_Receipt_${ref}.txt`;
                              a.click();
                            }}
                            className="mt-2 w-full flex items-center justify-center gap-2 bg-[#1a3a6b] hover:bg-[#15305c] text-white py-2 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> Download CBE Receipt
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Activity timeline */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <h3 className="text-sm font-semibold text-stone-700 mb-4">
                  Activity Timeline
                </h3>
                <ol className="relative border-l border-stone-200 space-y-4 ml-3">
                  {agreement.initiatedByLandlord && agreement.landlordSignedAt && (
                    <li className="pl-5">
                      <div className="absolute w-3 h-3 bg-emerald-400 rounded-full -left-1.5 top-0.5" />
                      <p className="text-sm font-medium text-stone-900">
                        Landlord signed the agreement
                      </p>
                      <p className="text-xs text-stone-500">
                        {fmtDate(agreement.landlordSignedAt)} · {agreement.landlordName}
                      </p>
                    </li>
                  )}
                  {!agreement.initiatedByLandlord && agreement.tenantSignedAt && (
                    <li className="pl-5">
                      <div className="absolute w-3 h-3 bg-emerald-400 rounded-full -left-1.5 top-0.5" />
                      <p className="text-sm font-medium text-stone-900">
                        Tenant signed the agreement
                      </p>
                      <p className="text-xs text-stone-500">
                        {fmtDate(agreement.tenantSignedAt)} · {agreement.tenantName}
                      </p>
                    </li>
                  )}
                  {agreement.initiatedByLandlord && agreement.tenantSignedAt && (
                    <li className="pl-5">
                      <div className="absolute w-3 h-3 bg-emerald-400 rounded-full -left-1.5" />
                      <p className="text-sm font-medium text-stone-900">
                        Tenant signed the agreement
                      </p>
                      <p className="text-xs text-stone-500">
                        {fmtDate(agreement.tenantSignedAt)} · {agreement.tenantName}
                      </p>
                    </li>
                  )}
                  {!agreement.initiatedByLandlord && agreement.landlordSignedAt && (
                    <li className="pl-5">
                      <div className="absolute w-3 h-3 bg-emerald-400 rounded-full -left-1.5" />
                      <p className="text-sm font-medium text-stone-900">
                        Landlord counter-signed
                      </p>
                      <p className="text-xs text-stone-500">
                        {fmtDate(agreement.landlordSignedAt)} · {agreement.landlordName}
                      </p>
                    </li>
                  )}
                  {agreement.daraApprovedAt && (
                    <li className="pl-5">
                      <div className="absolute w-3 h-3 bg-emerald-400 rounded-full -left-1.5" />
                      <p className="text-sm font-medium text-stone-900">
                        DARA officer approved the agreement
                      </p>
                      <p className="text-xs text-stone-500">
                        {fmtDate(agreement.daraApprovedAt)} · Government Officer
                      </p>
                    </li>
                  )}
                  {agreement.paidAt && (
                    <li className="pl-5">
                      <div className="absolute w-3 h-3 bg-primary-500 rounded-full -left-1.5" />
                      <p className="text-sm font-medium text-stone-900">
                        Advance payment confirmed
                      </p>
                      <p className="text-xs text-stone-500">
                        {fmtDate(agreement.paidAt)} ·{" "}
                        {fmtCur(agreement.advanceAmount)} via{" "}
                        {agreement.paymentMethod?.replace("_", " ")}
                      </p>
                    </li>
                  )}
                  {!agreement.landlordSignedAt &&
                    !agreement.initiatedByLandlord &&
                    agreement.status === "tenant_signed" && (
                    <li className="pl-5 opacity-40">
                      <div className="absolute w-3 h-3 bg-stone-300 rounded-full -left-1.5" />
                      <p className="text-sm text-stone-500">
                        Waiting for landlord counter-signature…
                      </p>
                    </li>
                  )}
                  {agreement.initiatedByLandlord &&
                    agreement.status === "landlord_initiated" && (
                    <li className="pl-5 opacity-40">
                      <div className="absolute w-3 h-3 bg-stone-300 rounded-full -left-1.5" />
                      <p className="text-sm text-stone-500">
                        Waiting for tenant signature…
                      </p>
                    </li>
                  )}
                  {agreement.landlordSignedAt && !agreement.daraApprovedAt && (
                    <li className="pl-5 opacity-40">
                      <div className="absolute w-3 h-3 bg-stone-300 rounded-full -left-1.5" />
                      <p className="text-sm text-stone-500">
                        Waiting for DARA approval…
                      </p>
                    </li>
                  )}
                  {agreement.daraApprovedAt && !agreement.paidAt && (
                    <li className="pl-5 opacity-40">
                      <div className="absolute w-3 h-3 bg-stone-300 rounded-full -left-1.5" />
                      <p className="text-sm text-stone-500">
                        Waiting for advance payment…
                      </p>
                    </li>
                  )}
                </ol>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-2">
                  Current Status
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                    agreement.status === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : stageIdx >= 2
                        ? "bg-primary-100 text-primary-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {agreement.status === "paid" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {agreement.status === "paid"
                    ? "Payment Confirmed"
                    : agreement.status === "dara_approved"
                      ? "Payment Required"
                      : agreement.status === "landlord_signed"
                        ? "Pending DARA Verification"
                        : agreement.status === "tenant_signed"
                          ? agreement.initiatedByLandlord
                            ? progressStages[1]?.label ?? "Tenant Signed"
                            : progressStages[0]?.label ?? "Tenant Signed"
                          : agreement.status === "landlord_initiated"
                            ? progressStages[0]?.label ?? "Landlord Signed"
                            : progressStages[Math.min(stageIdx, progressStages.length - 1)]?.label ?? "In Progress"}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-stone-700">
                  Agreement Summary
                </h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Monthly Rent</span>
                    <span className="font-semibold text-stone-900">
                      {fmtCur(agreement.monthlyRent)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Advance (2 mo.)</span>
                    <span className="font-semibold text-stone-900">
                      {fmtCur(agreement.advanceAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <AgreementContactSection
                agreement={{
                  id: agreement.id,
                  status: liveContactsUnlocked ? "pending_payment" : "pending_verification",
                  verifiedAt: liveContactsUnlocked ? agreement.daraApprovedAt : undefined,
                  contactsAvailable: liveContactsUnlocked,
                  contacts: liveContacts,
                }}
                accessToken={null}
              />

              <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-stone-700">
                  Parties
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {agreement.landlordName}
                    </p>
                    <p className="text-xs text-stone-500">Landlord</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {agreement.tenantName}
                    </p>
                    <p className="text-xs text-stone-500">Tenant</p>
                    {isLandlord && (
                      <ViewTenantProfileLink
                        tenantId={agreement.tenantId}
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <h3 className="text-sm font-semibold text-stone-700 mb-3">
                  Property
                </h3>
                <Link
                  href={`/dashboard/properties/${agreement.propertyId}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-stone-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900 group-hover:text-primary-600 transition-colors">
                      {agreement.propertyTitle}
                    </p>
                    <p className="text-xs text-stone-500">
                      {agreement.propertyAddress}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
