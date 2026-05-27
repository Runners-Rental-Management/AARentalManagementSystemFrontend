"use client";

import { Header } from "@/components/dashboard/header";
import { ViewTenantProfileLink } from "@/components/dashboard/tenant-public-profile";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { getAccessToken, apiListAgreements } from "@/lib/api";
import {
  useRentalFlow,
  type LiveAgreement, type LiveStatus,
  type ExtensionRequest,
} from "@/context/rental-flow-context";
import type { TenancyAgreement } from "@/lib/types";
import { formatCurrency, formatDate, getStatusColor, formatStatus } from "@/lib/utils";
import {
  Clock, FileText, Plus, Search, Calendar, ArrowRight, Zap,
  XCircle, Send, Building2, User, FileSignature, AlertTriangle,
  Home, Loader2, ListFilter, RefreshCw, CreditCard, CheckCircle2,
  Eye, EyeOff, KeyRound, Landmark, Smartphone, MessageSquare,
  Download, Printer, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

/* ── amount helpers (same as payments page) ── */
function amountToWords(amount: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tensW = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function h(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tensW[Math.floor(n/10)] + (n%10 ? " "+ones[n%10] : "");
    return ones[Math.floor(n/100)]+" Hundred"+(n%100 ? " "+h(n%100) : "");
  }
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  let out = "";
  if (whole >= 1000000) out += h(Math.floor(whole/1000000))+" Million ";
  if (whole >= 1000)    out += h(Math.floor((whole%1000000)/1000))+" Thousand ";
  out += h(whole % 1000);
  if (cents > 0) out += " & "+h(cents)+" Cent"+(cents!==1?"s":"");
  return "ETB "+out.trim();
}
function maskAccount(acc: string): string {
  if (acc.length <= 4) return acc;
  return acc[0]+"****"+acc.slice(-4);
}

const EXT_FEE = 500; /* ETB processing fee for extension */

/* ── Payment methods (mini, for extension fee) ── */
type PayMethod = "cbe_birr" | "telebirr";
const PAY_METHODS = [
  { id: "cbe_birr" as PayMethod, label: "CBE Birr",  icon: Landmark,   color: "text-blue-700",  bg: "bg-blue-50",  border: "border-blue-300",  acctLabel: "CBE Account Number",  placeholder: "1000XXXXXXXXX" },
  { id: "telebirr" as PayMethod, label: "Telebirr",  icon: Smartphone, color: "text-green-700", bg: "bg-green-50", border: "border-green-300", acctLabel: "Telebirr Phone",      placeholder: "+251 9XX XXX XXX" },
];

/* ── SMS Toast ── */
function SmsToast({ phone, onDismiss }: { phone: string; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 7000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <div className="fixed bottom-6 right-6 z-[60] w-72 animate-fade-in-up">
      <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 bg-green-600 px-3 py-1.5">
          <MessageSquare className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-bold">SMS Notification Sent</span>
          <button onClick={onDismiss} className="ml-auto text-white/70"><XCircle className="w-3 h-3" /></button>
        </div>
        <p className="px-3 py-2 text-xs text-white">Extension fee of ETB {EXT_FEE.toFixed(2)} confirmed. Ref: {phone}. Extension request sent to tenant for signature.</p>
      </div>
    </div>
  );
}

/* ── Extension Modal ── */
type ExtStep = "details" | "method" | "account" | "pin" | "confirm" | "processing" | "receipt" | "done";

function ExtensionModal({
  agreement,
  onClose,
  onSubmit,
}: {
  agreement: LiveAgreement;
  onClose: () => void;
  onSubmit: (newEndDate: string, newMonthlyRent: number | undefined, feeRef: string) => void;
}) {
  const [step, setStep]               = useState<ExtStep>("details");
  const [newEndDate, setNewEndDate]   = useState("");
  const [adjustRent, setAdjustRent]   = useState(false);
  const [newRent, setNewRent]         = useState(agreement.monthlyRent);
  const [method, setMethod]           = useState<PayMethod | null>(null);
  const [account, setAccount]         = useState("");
  const [pin, setPin]                 = useState("");
  const [pinVisible, setPinVisible]   = useState(false);
  const [pinError, setPinError]       = useState("");
  const [feeRef, setFeeRef]           = useState("");
  const [paidAt, setPaidAt]           = useState("");
  const [showSms, setShowSms]         = useState(false);

  const methodInfo = PAY_METHODS.find((m) => m.id === method);
  const isCbe = method === "cbe_birr";

  const handlePinNext = () => {
    if (pin.length < 4) { setPinError("PIN must be at least 4 digits."); return; }
    setPinError(""); setStep("confirm");
  };
  const handleConfirm = async () => {
    setStep("processing");
    await new Promise((r) => setTimeout(r, 2400));
    const ref = `EXT-${Date.now().toString(36).toUpperCase()}`;
    setFeeRef(ref); setPaidAt(new Date().toISOString());
    setShowSms(true); setStep("receipt");
  };

  const commission = 0.50;
  const vat        = parseFloat((commission * 0.15).toFixed(2));
  const totalPaid  = EXT_FEE + commission + vat;

  const STEPS_BAR = ["details","method","account","pin","confirm"] as const;
  const STEP_LBLS = ["Details","Method","Account","Passkey","Confirm"];

  return (
    <>
      {showSms && feeRef && <SmsToast phone={feeRef} onDismiss={() => setShowSms(false)} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-primary-700 px-5 py-4 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">
                {step === "receipt" ? "Extension Fee Receipt" : step === "done" ? "Request Submitted" : "Request Extension"}
              </span>
            </div>
            {!["processing","receipt","done"].includes(step) && (
              <button onClick={onClose} className="text-white/70 hover:text-white"><XCircle className="w-4 h-4" /></button>
            )}
          </div>

          {/* Step bar */}
          {!["processing","receipt","done"].includes(step) && (
            <div className="flex border-b border-slate-100">
              {STEPS_BAR.map((s, i) => (
                <div key={s} className={`flex-1 py-1.5 text-center text-[10px] font-semibold transition-colors ${
                  step === s ? "text-primary-700 border-b-2 border-primary-600"
                  : STEPS_BAR.indexOf(step as typeof STEPS_BAR[number]) > i ? "text-emerald-600" : "text-slate-400"
                }`}>
                  {i+1}. {STEP_LBLS[i]}
                </div>
              ))}
            </div>
          )}

          <div className="p-5">
            {/* ── Step 1: Details ── */}
            {step === "details" && (
              <>
                <p className="text-sm font-bold text-slate-800 mb-4">Extension Details</p>
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 mb-4 space-y-1">
                  <p><span className="font-semibold">Property:</span> {agreement.propertyTitle}</p>
                  <p><span className="font-semibold">Tenant:</span> {agreement.tenantName}</p>
                  <p><span className="font-semibold">Current rent:</span> ETB {agreement.monthlyRent.toLocaleString()}/mo</p>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">New End Date *</label>
                  <input
                    type="date"
                    value={newEndDate}
                    min={new Date(Date.now() + 30*24*3600*1000).toISOString().split("T")[0]}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>

                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input type="checkbox" checked={adjustRent} onChange={(e) => setAdjustRent(e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-700">Also adjust monthly rent</span>
                </label>

                {adjustRent && (
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">New Monthly Rent (ETB)</label>
                    <input
                      type="number"
                      value={newRent}
                      min={1}
                      onChange={(e) => setNewRent(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Rent adjustment must comply with DARA pricing policy.</p>
                  </div>
                )}

                <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3 text-xs text-indigo-700 mb-4">
                  <strong>Extension fee:</strong> ETB {EXT_FEE.toFixed(2)} processing charge applies. Both parties must sign. DARA will verify before approval.
                </div>

                <button
                  onClick={() => setStep("method")}
                  disabled={!newEndDate}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Continue to Payment
                </button>
              </>
            )}

            {/* ── Step 2: Payment method ── */}
            {step === "method" && (
              <>
                <p className="text-xs text-slate-500 mb-0.5">Extension Processing Fee</p>
                <p className="text-3xl font-black text-slate-900 mb-4">ETB {EXT_FEE.toFixed(2)}</p>
                <div className="space-y-3 mb-5">
                  {PAY_METHODS.map((m) => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${method===m.id ? `${m.border} ${m.bg}` : "border-slate-200 hover:border-slate-300"}`}>
                      <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center`}>
                        <m.icon className={`w-4 h-4 ${m.color}`} />
                      </div>
                      <span className={`font-semibold text-sm ${m.color}`}>{m.label}</span>
                      {method===m.id && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("details")} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium">Back</button>
                  <button onClick={() => setStep("account")} disabled={!method} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold">Continue</button>
                </div>
              </>
            )}

            {/* ── Step 3: Account ── */}
            {step === "account" && methodInfo && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${methodInfo.bg} flex items-center justify-center`}>
                    <methodInfo.icon className={`w-5 h-5 ${methodInfo.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{methodInfo.label}</p>
                    <p className="text-xs text-slate-500">{isCbe ? "Enter your CBE account number" : "Enter your Telebirr phone number"}</p>
                  </div>
                </div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">{methodInfo.acctLabel}</label>
                <div className="relative mb-4">
                  <methodInfo.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={isCbe ? "text" : "tel"}
                    value={account}
                    onChange={(e) => setAccount(isCbe ? e.target.value.replace(/\D/g,"") : e.target.value)}
                    placeholder={methodInfo.placeholder}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("method")} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium">Back</button>
                  <button onClick={() => setStep("pin")} disabled={account.trim().length < 7} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold">Continue</button>
                </div>
              </>
            )}

            {/* ── Step 4: PIN ── */}
            {step === "pin" && methodInfo && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${methodInfo.bg} flex items-center justify-center`}>
                    <KeyRound className={`w-5 h-5 ${methodInfo.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Enter {methodInfo.label} PIN</p>
                    <p className="text-xs text-slate-500">{account}</p>
                  </div>
                </div>
                <div className="relative mb-1">
                  <input
                    type={pinVisible ? "text" : "password"} inputMode="numeric" value={pin} maxLength={6}
                    onChange={(e) => { setPin(e.target.value.replace(/\D/g,"").slice(0,6)); setPinError(""); }}
                    placeholder="••••••"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary-400 pr-12 text-center"
                  />
                  <button type="button" onClick={() => setPinVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {pinVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinError && <p className="text-xs text-red-600 mt-1">{pinError}</p>}
                <p className="text-xs text-slate-400 mt-2 mb-4">PIN never stored by DARA — sent directly to {methodInfo.label}.</p>
                <div className="flex gap-3">
                  <button onClick={() => setStep("account")} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium">Back</button>
                  <button onClick={handlePinNext} disabled={pin.length < 4} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold">Authorise</button>
                </div>
              </>
            )}

            {/* ── Step 5: Confirm ── */}
            {step === "confirm" && methodInfo && (
              <>
                <p className="text-sm font-bold text-slate-900 mb-3">Confirm Extension Fee Payment</p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm mb-3">
                  {[
                    ["Fee Amount",  `ETB ${EXT_FEE.toFixed(2)}`],
                    ["Method",      methodInfo.label],
                    [isCbe ? "Account" : "Phone", account],
                    ["PIN",         "•".repeat(pin.length)],
                    ["New End Date", new Date(newEndDate).toLocaleDateString()],
                    ...(adjustRent ? [["New Monthly Rent", `ETB ${newRent.toLocaleString()}`]] : []),
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between"><span className="text-slate-500">{l}</span><span className="font-semibold text-slate-800">{v}</span></div>
                  ))}
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-xs text-emerald-800 mb-4">
                  After payment the extension request is sent to <strong>{agreement.tenantName}</strong> for signature, then to DARA for approval.
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("pin")} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium">Back</button>
                  <button onClick={handleConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Pay &amp; Submit
                  </button>
                </div>
              </>
            )}

            {/* ── Processing ── */}
            {step === "processing" && (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-40" />
                  <div className="relative w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
                  </div>
                </div>
                <p className="font-bold text-slate-900">Processing Payment…</p>
                <p className="text-sm text-slate-500 mt-1">Please do not close this window.</p>
              </div>
            )}

            {/* ── Receipt (CBE format) ── */}
            {step === "receipt" && method && feeRef && (
              <>
                <div className="border border-slate-200 rounded-2xl overflow-hidden mb-4 text-xs" style={{ fontFamily:"'Courier New', monospace" }}>
                  <div className="bg-[#1a3a6b] px-5 py-3 text-center">
                    <p className="text-white font-black text-sm">Commercial Bank of Ethiopia</p>
                    <p className="text-blue-200 text-[10px]">VAT Invoice / Customer Receipt</p>
                  </div>
                  <div className="bg-emerald-600 py-2.5 text-center">
                    <p className="text-emerald-100 text-[9px] uppercase tracking-widest mb-0.5">Total Amount Debited</p>
                    <p className="text-white font-black text-xl">{totalPaid.toFixed(2)} ETB</p>
                    <p className="text-emerald-200 text-[9px] mt-0.5">✓ Extension Fee Paid</p>
                  </div>
                  <div className="px-4 py-3 border-b border-dashed border-slate-200 bg-slate-50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Company Address &amp; Other Information</p>
                    {[["Country","Ethiopia"],["City","Addis Ababa"],["SWIFT Code","CBETETAA"],["VAT Receipt No",feeRef],["VAT Registration No","011140"]].map(([l,v]) => (
                      <div key={l} className="flex justify-between py-0.5"><span className="text-slate-400 w-32 shrink-0">{l}:</span><span className="text-slate-700 font-semibold text-right">{v}</span></div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-b border-dashed border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment / Transaction Information</p>
                    {[
                      ["Payer", agreement.landlordName.toUpperCase()],
                      ["Account", maskAccount(account)],
                      ["Receiver","DARA Rental Platform"],
                      ["Payment Date", new Date(paidAt).toLocaleString()],
                      ["Reference No.", feeRef],
                      ["Reason","Extension Processing Fee — "+agreement.propertyTitle],
                      ["Fee Amount", EXT_FEE.toFixed(2)+" ETB"],
                      ["Commission", commission.toFixed(2)+" ETB"],
                      ["15% VAT", vat.toFixed(2)+" ETB"],
                      ["Total Debited", totalPaid.toFixed(2)+" ETB"],
                    ].map(([l,v]) => (
                      <div key={l} className={`flex justify-between py-0.5 ${l==="Total Debited"?"font-black border-t border-slate-200 mt-1 pt-1":""}`}>
                        <span className="text-slate-400 w-28 shrink-0">{l}:</span><span className="text-slate-800 font-semibold text-right">{v}</span>
                      </div>
                    ))}
                    <div className="mt-2 pt-1 border-t border-slate-100">
                      <p className="text-slate-400">Amount in Word:</p>
                      <p className="text-slate-700 font-semibold mt-0.5">{amountToWords(totalPaid)}</p>
                    </div>
                  </div>
                  <div className="bg-[#1a3a6b] px-4 py-2 text-center">
                    <p className="text-blue-200 text-[9px] italic">The Bank you can always rely on.</p>
                    <p className="text-blue-300/60 text-[9px]">© {new Date().getFullYear()} Commercial Bank of Ethiopia. All rights reserved.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium">
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([`CBE Receipt\nRef: ${feeRef}\nAmount: ETB ${totalPaid.toFixed(2)}\nProperty: ${agreement.propertyTitle}\nDate: ${new Date(paidAt).toLocaleString()}`], {type:"text/plain"});
                      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `CBE_Receipt_${feeRef}.txt`; a.click();
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#1a3a6b] hover:bg-[#15305c] text-white py-2 rounded-xl text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button
                    onClick={() => { onSubmit(newEndDate, adjustRent ? newRent : undefined, feeRef); setStep("done"); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-semibold"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </>
            )}

            {/* ── Done ── */}
            {step === "done" && (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="font-black text-slate-900 text-lg">Extension Request Sent!</p>
                <p className="text-sm text-slate-500 mt-2 mb-1">Sent to <strong>{agreement.tenantName}</strong> for signature.</p>
                <p className="text-xs text-slate-400 mb-6">After both parties sign, DARA will verify and approve the extension.</p>
                <button onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">Close</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Termination Modal ── */
const TERMINATION_GROUNDS = [
  { value: "", label: "Select grounds for termination…" },
  { value: "end_of_term",       label: "End of agreed contract term" },
  { value: "owner_occupation",  label: "Owner or immediate family occupation" },
  { value: "property_sale",     label: "Sale of the property" },
  { value: "major_renovation",  label: "Major renovation / demolition approved by authority" },
  { value: "tenant_breach",     label: "Tenant breach of contract obligations" },
  { value: "non_payment",       label: "Persistent non-payment of rent" },
  { value: "other",             label: "Other (explain below)" },
];

type TermStep = "form" | "submitted";

function TerminationModal({ agreement, onClose, onSubmit }: {
  agreement: LiveAgreement; onClose: () => void; onSubmit: (reason: string) => void;
}) {
  const paidAt = agreement.paidAt ? new Date(agreement.paidAt) : new Date();
  const twoYearsLater = new Date(paidAt.getTime() + 2 * 365.25 * 24 * 3600 * 1000);
  const canTerminate   = new Date() >= twoYearsLater;
  const daysLeft       = Math.ceil((twoYearsLater.getTime() - Date.now()) / (24 * 3600 * 1000));

  /* form fields */
  const [step, setStep]                   = useState<TermStep>("form");
  const [grounds, setGrounds]             = useState("");
  const [description, setDescription]     = useState("");
  const [vacateDate, setVacateDate]       = useState("");
  const [noticePeriod, setNoticePeriod]   = useState(false);
  const [declaration, setDeclaration]     = useState(false);
  const [notifyTenant, setNotifyTenant]   = useState(true);

  /* min vacate date = 3 months from today */
  const minVacate = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split("T")[0];

  const isEarly = !canTerminate;
  const canSubmit =
    grounds !== "" &&
    description.trim().length >= 20 &&
    vacateDate !== "" &&
    noticePeriod &&
    declaration;

  const handleSubmit = () => {
    const fullReason = `[${TERMINATION_GROUNDS.find(g => g.value === grounds)?.label ?? grounds}]${isEarly ? " [EARLY — DARA REVIEW REQUIRED]" : ""} | Description: ${description} | Expected vacate: ${vacateDate} | Notify tenant: ${notifyTenant ? "Yes" : "No"}`;
    onSubmit(fullReason);
    setStep("submitted");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between rounded-t-2xl ${isEarly ? "bg-amber-600" : "bg-red-600"}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">
              {isEarly ? "Early Termination Notice (Restricted)" : "Termination Notice"}
            </span>
          </div>
          {step !== "submitted" && (
            <button onClick={onClose} className="text-white/70 hover:text-white"><XCircle className="w-4 h-4" /></button>
          )}
        </div>

        <div className="p-6">
          {step === "submitted" ? (
            /* ── Submitted confirmation ── */
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-black text-slate-900 text-lg mb-2">Termination Notice Submitted</p>
              {isEarly && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 mb-3 text-left">
                  <strong>Early termination notice filed.</strong> Because the contract is under 2 years, DARA must review and approve this request before it becomes effective.
                </div>
              )}
              <p className="text-sm text-slate-500 mb-1">
                {notifyTenant
                  ? <><strong>{agreement.tenantName}</strong> has been notified and DARA has received the request.</>
                  : <>The request has been forwarded to DARA. The tenant will be informed by DARA.</>}
              </p>
              <p className="text-xs text-slate-400 mb-6">Expected vacate date: <strong>{new Date(vacateDate).toLocaleDateString()}</strong></p>
              <button onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Close</button>
            </div>
          ) : (
            <>
              {/* ── Early restriction banner (non-blocking) ── */}
              {isEarly && (
                <div className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-4 mb-5">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Contract Under 2 Years — DARA Review Required</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Ethiopian rental law (Proclamation No. 1320/2016) restricts standard terminations to after <strong>2 years</strong> from contract start.
                        Your contract qualifies for standard termination in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong> ({twoYearsLater.toLocaleDateString()}).
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        You may still file an <strong>early termination notice</strong>, but it will require <strong>DARA special approval</strong> and the tenant will be notified immediately.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Property summary */}
              <div className="bg-slate-50 rounded-xl p-3 mb-5 text-xs text-slate-600 space-y-1">
                <p><span className="font-semibold text-slate-700">Property:</span> {agreement.propertyTitle}</p>
                <p><span className="font-semibold text-slate-700">Tenant:</span> {agreement.tenantName}</p>
                <p><span className="font-semibold text-slate-700">Contract active since:</span> {paidAt.toLocaleDateString()}</p>
                <p><span className="font-semibold text-slate-700">Monthly rent:</span> ETB {agreement.monthlyRent.toLocaleString()}</p>
              </div>

              {/* ── Form fields ── */}
              <div className="space-y-4">

                {/* Grounds */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Legal Grounds for Termination <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={grounds}
                    onChange={(e) => setGrounds(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                  >
                    {TERMINATION_GROUNDS.map((g) => (
                      <option key={g.value} value={g.value} disabled={g.value === ""}>{g.label}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Detailed Description <span className="text-red-500">*</span>
                    <span className="normal-case font-normal text-slate-400 ml-1">(min. 20 characters)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the specific circumstances that necessitate termination. Be as detailed as possible — this will be reviewed by DARA..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                  <p className={`text-[11px] mt-1 ${description.trim().length >= 20 ? "text-emerald-600" : "text-slate-400"}`}>
                    {description.trim().length} / 20 characters minimum
                  </p>
                </div>

                {/* Expected vacate date */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Expected Vacate Date <span className="text-red-500">*</span>
                    <span className="normal-case font-normal text-slate-400 ml-1">(min. 90 days notice required)</span>
                  </label>
                  <input
                    type="date"
                    value={vacateDate}
                    min={minVacate}
                    onChange={(e) => setVacateDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                </div>

                {/* Notify tenant toggle */}
                <div className="rounded-xl border border-slate-200 px-4 py-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyTenant}
                      onChange={(e) => setNotifyTenant(e.target.checked)}
                      className="mt-0.5 rounded accent-red-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Notify tenant immediately</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {agreement.tenantName} will receive a notification upon submission.
                        If unchecked, DARA will inform the tenant after review.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Notice period acknowledgement */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.checked)}
                      className="mt-0.5 rounded accent-amber-600"
                    />
                    <p className="text-xs text-amber-700">
                      I acknowledge that a minimum <strong>90-day notice period</strong> is required under Ethiopian rental law and that the tenant is entitled to remain in the property until the vacate date.
                    </p>
                  </label>
                </div>

                {/* Legal declaration */}
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={declaration}
                      onChange={(e) => setDeclaration(e.target.checked)}
                      className="mt-0.5 rounded accent-red-600"
                    />
                    <p className="text-xs text-red-700">
                      I declare that the information provided is accurate and complete. I understand that filing a false termination notice is a punishable offence under Proclamation No. 1320/2016 and subjects me to DARA disciplinary action.
                    </p>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isEarly
                      ? "bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400"
                      : "bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {isEarly ? "Submit Early Notice" : "Submit Termination Notice"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live agreement helpers                                             */
/* ------------------------------------------------------------------ */

const LIVE_STATUS_LABEL: Record<LiveStatus, string> = {
  landlord_initiated:  "Awaiting Your Signature",
  tenant_signed:       "Awaiting Landlord Signature",
  landlord_signed:     "Pending Officer Verification",
  dara_approved:       "Payment Required",
  paid:                "Active",
  rejected:            "Declined",
  tenant_cancelled:    "Withdrawn by Tenant",
  landlord_cancelled:  "Cancelled by Landlord",
};

const LIVE_STATUS_COLOR: Record<LiveStatus, string> = {
  landlord_initiated:  "bg-violet-100 text-violet-700",
  tenant_signed:       "bg-amber-100 text-amber-700",
  landlord_signed:     "bg-indigo-100 text-indigo-700",
  dara_approved:       "bg-emerald-100 text-emerald-700",
  paid:                "bg-primary-100 text-primary-700",
  rejected:            "bg-red-100 text-red-700",
  tenant_cancelled:    "bg-red-100 text-red-700",
  landlord_cancelled:  "bg-red-100 text-red-700",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const STATUS_TABS = [
  { value: "active",       label: "Active Homes",   icon: Home },
  { value: "in_progress",  label: "In Progress",    icon: Loader2 },
  { value: "all",          label: "All",            icon: ListFilter },
  { value: "rejected",     label: "Rejected / Ended", icon: XCircle },
] as const;

export default function AgreementsPage() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [extensionTarget, setExtensionTarget]   = useState<LiveAgreement | null>(null);
  const [terminationTarget, setTerminationTarget] = useState<LiveAgreement | null>(null);
  const [backendAgreements, setBackendAgreements] = useState<TenancyAgreement[]>([]);
  const { user } = useAuth();
  const router = useRouter();
  const {
    agreements: liveAgreements,
    extensionRequests,
    tenantDeclineContract,
    requestExtension,
    tenantSignExtension,
    tenantRejectExtension,
    requestTermination,
  } = useRentalFlow();

  const role = user?.role || "tenant";
  const userId = user?.id || "";

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    apiListAgreements(token)
      .then((res) => setBackendAgreements(res.items))
      .catch(() => setBackendAgreements([]));
  }, []);

  /* Live agreements filtered for current user/role */
  const IN_PROGRESS_LIVE: LiveStatus[] = [
    "landlord_initiated", "tenant_signed", "landlord_signed", "dara_approved",
  ];
  const REJECTED_LIVE: LiveStatus[] = ["rejected", "tenant_cancelled", "landlord_cancelled"];

  const liveFiltered: LiveAgreement[] = liveAgreements.filter((a) => {
    const roleMatch =
      role === "landlord"
        ? a.landlordId === userId
        : role === "tenant"
          ? a.tenantId === userId
          : true;

    const searchMatch =
      searchQuery === "" ||
      a.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.landlordName.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active"      && a.status === "paid") ||
      (statusFilter === "in_progress" && IN_PROGRESS_LIVE.includes(a.status)) ||
      (statusFilter === "rejected"    && REJECTED_LIVE.includes(a.status));

    return roleMatch && searchMatch && statusMatch;
  });

  /* Dummy/static agreements filtered for current user/role */
  const roleBasedList =
    role === "landlord"
      ? backendAgreements.filter((a) => a.landlordId === userId)
      : role === "tenant"
        ? backendAgreements.filter((a) => a.tenantId === userId)
        : backendAgreements;

  const staticFiltered = roleBasedList.filter((a) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active"      && a.status === "active") ||
      (statusFilter === "in_progress" && ["pending_tenant_signature", "pending_verification", "pending_dara_verification"].includes(a.status)) ||
      (statusFilter === "rejected"    && ["rejected", "terminated", "expired"].includes(a.status));

    const matchesSearch =
      searchQuery === "" ||
      a.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.landlordName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  /* Incoming landlord-initiated contracts waiting for this tenant */
  const incomingRequests = role === "tenant"
    ? liveAgreements.filter((a) => a.tenantId === userId && a.status === "landlord_initiated")
    : [];

  /* Tenant-signed contracts waiting for landlord counter-signature */
  const pendingLandlordSign = role === "landlord"
    ? liveAgreements.filter((a) => a.landlordId === userId && a.status === "tenant_signed")
    : [];

  /* Incoming extension requests for tenant to sign */
  const incomingExtensions: ExtensionRequest[] = role === "tenant"
    ? extensionRequests.filter((e) => e.tenantId === userId && e.status === "pending_tenant_sign")
    : [];

  const showNewAgreementButton = role === "landlord" || role === "tenant";
  const totalCount = liveFiltered.length + staticFiltered.length;

  return (
    <>
      {/* Modals */}
      {extensionTarget && (
        <ExtensionModal
          agreement={extensionTarget}
          onClose={() => setExtensionTarget(null)}
          onSubmit={(newEndDate, newMonthlyRent, feeRef) => {
            requestExtension(extensionTarget.id, newEndDate, newMonthlyRent, feeRef);
          }}
        />
      )}
      {terminationTarget && (
        <TerminationModal
          agreement={terminationTarget}
          onClose={() => setTerminationTarget(null)}
          onSubmit={(reason) => requestTermination(terminationTarget.id, reason)}
        />
      )}

      <Header title={t("agreements", "title")} />
      <main className="flex-1 p-6 overflow-y-auto">

        {/* Incoming extension requests for tenant */}
        {incomingExtensions.length > 0 && (
          <div className="mb-6 space-y-3">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-500" />
              Extension Requests ({incomingExtensions.length})
            </p>
            {incomingExtensions.map((ext) => (
              <div key={ext.id} className="bg-white border-2 border-indigo-200 rounded-2xl p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{ext.propertyTitle}</p>
                    <p className="text-sm text-slate-500">From: {ext.landlordName}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> New end date: <strong>{new Date(ext.newEndDate).toLocaleDateString()}</strong></span>
                      {ext.newMonthlyRent && <span className="flex items-center gap-1"><Info className="w-3 h-3" /> New rent: <strong>ETB {ext.newMonthlyRent.toLocaleString()}/mo</strong></span>}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-700 mb-4">
                  Your landlord has requested to extend your tenancy. Review and sign to proceed to DARA verification.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => tenantRejectExtension(ext.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => tenantSignExtension(ext.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                  >
                    <FileSignature className="w-4 h-4" /> Sign Extension
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Incoming contract requests for tenant */}
        {incomingRequests.length > 0 && (
          <div className="mb-6 space-y-3">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Send className="w-4 h-4 text-violet-500" />
              Rental Contract Requests ({incomingRequests.length})
            </p>
            {incomingRequests.map((req) => (
              <div key={req.id} className="bg-white border-2 border-violet-200 rounded-2xl p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{req.propertyTitle}</p>
                    <p className="text-sm text-slate-500">{req.propertyAddress}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {req.landlordName}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Sent {new Date(req.landlordSignedAt ?? "").toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary-700">{formatCurrency(req.monthlyRent)}/mo</p>
                    <p className="text-xs text-slate-400 mt-0.5">Advance: {formatCurrency(req.advanceAmount)}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 text-xs text-violet-700 mb-4">
                  The landlord has signed this contract and sent it to you for review. You must read the contract and apply your e-signature to complete acceptance.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => tenantDeclineContract(req.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Decline
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/agreements/live/${req.id}/sign`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
                  >
                    <FileSignature className="w-4 h-4" /> Review &amp; Sign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tenant-signed contracts awaiting landlord counter-signature */}
        {pendingLandlordSign.length > 0 && (
          <div className="mb-6 space-y-3">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-amber-500" />
              Awaiting Your Counter-Signature ({pendingLandlordSign.length})
            </p>
            {pendingLandlordSign.map((req) => (
              <div key={req.id} className="bg-white border-2 border-amber-200 rounded-2xl p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{req.propertyTitle}</p>
                    <p className="text-sm text-slate-500">{req.propertyAddress}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {req.tenantName}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Signed {new Date(req.tenantSignedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary-700">{formatCurrency(req.monthlyRent)}/mo</p>
                    <p className="text-xs text-slate-400 mt-0.5">Advance: {formatCurrency(req.advanceAmount)}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 mb-4">
                  {req.tenantName} has signed this rental contract. Review it and counter-sign to forward the agreement to DARA, or reject to cancel.
                </div>
                <ViewTenantProfileLink tenantId={req.tenantId} className="mb-4 inline-flex" />
                <Link
                  href={`/dashboard/agreements/live/${req.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
                >
                  <FileSignature className="w-4 h-4" /> Review &amp; Counter-Sign
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Status tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-600/20"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-700"
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${isActive ? "" : "text-slate-400"}`} />
                {tab.label}
                {/* badge counts */}
                {tab.value === "active" && (
                  <span className={`ml-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                    {liveAgreements.filter(a => (role === "tenant" ? a.tenantId === userId : a.landlordId === userId) && a.status === "paid").length
                      + roleBasedList.filter(a => a.status === "active").length}
                  </span>
                )}
                {tab.value === "in_progress" && (
                  <span className={`ml-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"}`}>
                    {liveAgreements.filter(a => (role === "tenant" ? a.tenantId === userId : a.landlordId === userId) && IN_PROGRESS_LIVE.includes(a.status)).length
                      + roleBasedList.filter(a => ["pending_tenant_signature","pending_verification","pending_dara_verification"].includes(a.status)).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + new agreement */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search agreements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1"
            />
          </div>
          {showNewAgreementButton && (
            <Link
              href="/dashboard/agreements/create"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("agreements", "newAgreement")}
            </Link>
          )}
        </div>

        {/* Agreements Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Property
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Parties
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Duration / Signed
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Rent
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">

                {/* ── Live / in-progress agreements ── */}
                {liveFiltered.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-primary-50/40 transition-colors bg-primary-50/20"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-white" />
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                            <Zap className="w-2 h-2 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                            {a.propertyTitle}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {a.propertyAddress}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">{a.landlordName}</p>
                      <p className="text-xs text-slate-500">→ {a.tenantName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(a.tenantSignedAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 ml-5">Tenant signed</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(a.monthlyRent)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Adv: {formatCurrency(a.advanceAmount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${LIVE_STATUS_COLOR[a.status]}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            a.status === "paid" ? "bg-primary-500" : "bg-current animate-pulse"
                          }`}
                        />
                        {LIVE_STATUS_LABEL[a.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {/* Landlord actions on active paid agreements */}
                      {role === "landlord" && a.status === "paid" ? (
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => setExtensionTarget(a)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                          >
                            <RefreshCw className="w-3 h-3" /> Request Extension
                          </button>
                          <button
                            onClick={() => setTerminationTarget(a)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                          >
                            <AlertTriangle className="w-3 h-3" /> Termination
                          </button>
                        </div>
                      ) : role === "landlord" && a.status === "tenant_signed" ? (
                        <Link
                          href={`/dashboard/agreements/live/${a.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          <FileSignature className="w-3 h-3" /> Counter-Sign
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/agreements/live/${a.id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}

                {/* ── Static / dummy agreements ── */}
                {staticFiltered.map((agreement) => (
                  <tr
                    key={agreement.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                            {agreement.propertyTitle}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {agreement.propertyAddress}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">
                        {agreement.landlordName}
                      </p>
                      <p className="text-xs text-slate-500">
                        → {agreement.tenantName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(agreement.startDate)}</span>
                      </div>
                      <p className="text-xs text-slate-400 ml-5">
                        to {formatDate(agreement.endDate)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(agreement.monthlyRent)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Adv: {formatCurrency(agreement.advancePayment)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agreement.status)}`}
                      >
                        {formatStatus(agreement.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/agreements/${agreement.id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalCount === 0 && (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                {statusFilter === "active"
                  ? <Home className="w-7 h-7 text-slate-400" />
                  : <FileText className="w-7 h-7 text-slate-400" />}
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">
                {statusFilter === "active"
                  ? "No active tenancies"
                  : statusFilter === "in_progress"
                    ? "No agreements in progress"
                    : "No agreements found"}
              </p>
              <p className="text-xs text-slate-400">
                {statusFilter === "active"
                  ? "Your confirmed, paid tenancies will appear here."
                  : "Try selecting a different status above."}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
