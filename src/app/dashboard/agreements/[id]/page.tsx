"use client";

import { Header } from "@/components/dashboard/header";
import { ViewTenantProfileLink } from "@/components/dashboard/tenant-public-profile";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { getAccessToken, apiGetAgreementById, apiTenantSignAgreement, apiWithdrawAgreement, apiRequestAgreementTermination, apiRequestAgreementExtension } from "@/lib/api";
import type { TenancyAgreement } from "@/lib/types";
import { formatCurrency, formatDate, getStatusColor, formatStatus } from "@/lib/utils";
import {
  ArrowLeft, FileText, User, Building2, Calendar, DollarSign,
  CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, Send,
  Eye, EyeOff, KeyRound, Landmark, Smartphone, CreditCard,
  Loader2, Download, Printer, MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  buildPaymentCompleteUrl,
  stashPendingPayment,
  type PaymentMethodId,
} from "@/lib/payment-flow";

/* ─── small helpers ─── */
function amountToWords(n: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tensW = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function h(x: number): string {
    if (x===0) return "";
    if (x<20) return ones[x];
    if (x<100) return tensW[Math.floor(x/10)]+(x%10?" "+ones[x%10]:"");
    return ones[Math.floor(x/100)]+" Hundred"+(x%100?" "+h(x%100):"");
  }
  const w=Math.floor(n), c=Math.round((n-w)*100);
  let o="";
  if(w>=1000) o+=h(Math.floor(w/1000))+" Thousand ";
  o+=h(w%1000);
  if(c>0) o+=" & "+h(c)+" Cent"+(c!==1?"s":"");
  return "ETB "+o.trim();
}
function maskAcc(a: string) { return a.length<=4?a:a[0]+"****"+a.slice(-4); }

const EXT_FEE = 500;
const TERM_GROUNDS = [
  { value: "", label: "Select grounds…" },
  { value: "end_of_term", label: "End of agreed contract term" },
  { value: "owner_occ", label: "Owner or immediate family occupation" },
  { value: "sale", label: "Sale of the property" },
  { value: "renovation", label: "Major renovation / demolition" },
  { value: "breach", label: "Tenant breach of contract" },
  { value: "non_payment", label: "Persistent non-payment of rent" },
  { value: "other", label: "Other (explain below)" },
];
type PayMethod = "cbe_birr"|"telebirr";
const PAY_METHODS = [
  {id:"cbe_birr" as PayMethod, label:"CBE Birr", icon:Landmark,   color:"text-blue-700",  bg:"bg-blue-50",  border:"border-blue-300",  ph:"1000XXXXXXXXX"},
  {id:"telebirr" as PayMethod, label:"Telebirr", icon:Smartphone, color:"text-green-700", bg:"bg-green-50", border:"border-green-300", ph:"+251 9XX XXX XXX"},
];

const WITHDRAWABLE_STATUSES = [
  "draft",
  "pending_tenant_signature",
  "pending_verification",
  "pending_dara_verification",
  "pending_payment",
] as const;

function canWithdraw(status: string) {
  return (WITHDRAWABLE_STATUSES as readonly string[]).includes(status);
}

function isActiveTenancy(status: string) {
  return status === "active" || status === "extended";
}

function isPendingAuthorityAction(status: string) {
  return status === "extension_requested" || status === "termination_requested";
}

function landlordTerminationEligible(startDate: string) {
  const twoYears = new Date(startDate);
  twoYears.setFullYear(twoYears.getFullYear() + 2);
  return new Date() >= twoYears;
}

function landlordTerminationAvailableFrom(startDate: string) {
  const d = new Date(startDate);
  d.setFullYear(d.getFullYear() + 2);
  return d;
}

function bothPartiesSigned(agreement: TenancyAgreement) {
  return !!(agreement.tenantSignedAt && agreement.landlordSignedAt);
}

function signedAtDate(agreement: TenancyAgreement) {
  const dates = [agreement.landlordSignedAt, agreement.tenantSignedAt, agreement.signedAt].filter(Boolean) as string[];
  if (dates.length === 0) return undefined;
  return dates.sort().at(-1);
}

/* ─── Advance Payment Modal (placeholder for payment gateway) ─── */
type PayStep = "method"|"account"|"pin"|"confirm"|"processing"|"done";
function AdvancePaymentModal({
  agreementId,
  amount,
  propertyTitle,
  onClose,
}: {
  agreementId: string;
  amount: number;
  propertyTitle: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<PayStep>("method");
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [account, setAccount] = useState("");
  const [pin, setPin] = useState("");
  const [pinVis, setPinVis] = useState(false);
  const [pinErr, setPinErr] = useState("");
  const [payErr, setPayErr] = useState<string | null>(null);

  const mi = PAY_METHODS.find((m) => m.id === method);

  const handleConfirm = async () => {
    if (!method) return;
    setStep("processing");
    setPayErr(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const ref = `PAY-${Date.now().toString(36).toUpperCase()}`;
      const params = {
        type: "agreement" as const,
        agreementId,
        method: method as PaymentMethodId,
        reference: ref,
        amount,
        propertyTitle,
      };
      stashPendingPayment(params);
      router.push(buildPaymentCompleteUrl(params));
    } catch (err) {
      setPayErr(err instanceof Error ? err.message : "Payment failed");
      setStep("confirm");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 bg-emerald-600 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <CreditCard className="w-5 h-5" />
            <span className="font-bold text-sm">Pay Advance Rent</span>
          </div>
          {step !== "processing" && (
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-6">
          {step === "method" && (
            <>
              <p className="text-sm text-stone-600 mb-1">{propertyTitle}</p>
              <p className="text-2xl font-black text-stone-900 mb-4">{formatCurrency(amount)}</p>
              <p className="text-xs text-stone-500 mb-3">Select payment method. Your real payment gateway can be wired to this step later.</p>
              <div className="space-y-2">
                {PAY_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setMethod(m.id); setStep("account"); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border ${m.border} ${m.bg} hover:opacity-90 transition-opacity`}
                  >
                    <m.icon className={`w-5 h-5 ${m.color}`} />
                    <span className={`text-sm font-semibold ${m.color}`}>{m.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === "account" && mi && (
            <>
              <p className="text-sm font-semibold text-stone-900 mb-3">{mi.label} account</p>
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder={mi.ph}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm mb-4"
              />
              <button
                disabled={account.trim().length < 5}
                onClick={() => setStep("pin")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white py-2.5 rounded-xl text-sm font-semibold"
              >
                Continue
              </button>
            </>
          )}
          {step === "pin" && (
            <>
              <p className="text-sm font-semibold text-stone-900 mb-3">Enter PIN</p>
              <div className="relative mb-1">
                <input
                  type={pinVis ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm pr-10"
                />
                <button type="button" onClick={() => setPinVis(!pinVis)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                  {pinVis ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinErr && <p className="text-xs text-red-600 mb-3">{pinErr}</p>}
              <button
                onClick={() => {
                  if (pin.length < 4) { setPinErr("PIN must be at least 4 digits."); return; }
                  setPinErr("");
                  setStep("confirm");
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold mt-3"
              >
                Review payment
              </button>
            </>
          )}
          {step === "confirm" && (
            <>
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm space-y-2 mb-4">
                <div className="flex justify-between"><span className="text-stone-500">Amount</span><span className="font-bold">{formatCurrency(amount)}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Method</span><span className="font-medium">{mi?.label}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Account</span><span className="font-medium">{maskAcc(account)}</span></div>
              </div>
              {payErr && <p className="text-xs text-red-600 mb-3">{payErr}</p>}
              <button onClick={handleConfirm} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold">
                Confirm & Pay
              </button>
            </>
          )}
          {step === "processing" && (
            <div className="flex flex-col items-center py-10 text-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
              <p className="font-semibold text-stone-900">Redirecting to confirmation…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Extension Modal ─── */
type ExtStep = "details"|"method"|"account"|"pin"|"confirm"|"processing"|"receipt"|"done";
function ExtensionModal({ tenantName, propertyTitle, monthlyRent, onClose, onComplete }:{
  tenantName:string; propertyTitle:string; monthlyRent:number;
  onClose:()=>void;
  onComplete:(payload:{ newEndDate:string; newMonthlyRent?:number; reference:string })=>Promise<void>;
}) {
  const [step,setStep]             = useState<ExtStep>("details");
  const [newEndDate,setNewEndDate] = useState("");
  const [adjustRent,setAdjustRent] = useState(false);
  const [newRent,setNewRent]       = useState(monthlyRent);
  const [method,setMethod]         = useState<PayMethod|null>(null);
  const [account,setAccount]       = useState("");
  const [pin,setPin]               = useState("");
  const [pinVis,setPinVis]         = useState(false);
  const [pinErr,setPinErr]         = useState("");
  const [feeRef,setFeeRef]         = useState("");
  const [paidAt,setPaidAt]         = useState("");
  const [showSms,setShowSms]       = useState(false);

  const mi = PAY_METHODS.find(m=>m.id===method);
  const isCbe = method==="cbe_birr";
  const comm=0.50, vat=parseFloat((comm*0.15).toFixed(2)), total=EXT_FEE+comm+vat;

  const handlePinNext=()=>{ if(pin.length<4){setPinErr("PIN must be at least 4 digits.");return;} setPinErr("");setStep("confirm"); };
  const handleConfirm=async()=>{
    setStep("processing");
    const ref=`EXT-${Date.now().toString(36).toUpperCase()}`;
    try {
      await onComplete({
        newEndDate,
        newMonthlyRent: adjustRent ? newRent : undefined,
        reference: ref,
      });
      setFeeRef(ref); setPaidAt(new Date().toISOString()); setShowSms(true); setStep("receipt");
    } catch {
      setStep("confirm");
    }
  };

  const SBAR=["details","method","account","pin","confirm"] as const;
  const SLBL=["Details","Method","Account","Passkey","Confirm"];

  useEffect(()=>{ if(showSms){ const t=setTimeout(()=>setShowSms(false),7000); return ()=>clearTimeout(t); } },[showSms]);

  return (
    <>
      {showSms&&feeRef&&(
        <div className="fixed bottom-6 right-6 z-[60] w-72 animate-fade-in-up">
          <div className="bg-stone-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 bg-green-600 px-3 py-1.5">
              <MessageSquare className="w-3 h-3 text-white"/>
              <span className="text-white text-xs font-bold">SMS Notification Sent</span>
            </div>
            <p className="px-3 py-2 text-xs text-white">Extension fee ETB {EXT_FEE} confirmed. Ref: {feeRef}. Request sent to tenant for signature.</p>
          </div>
        </div>
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-primary-700 to-primary-700 px-5 py-4 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-white"/>
              <span className="text-white font-bold text-sm">{step==="receipt"?"Extension Fee Receipt":step==="done"?"Request Submitted":"Request Extension"}</span>
            </div>
            {!["processing","receipt","done"].includes(step)&&<button onClick={onClose} className="text-white/70 hover:text-white"><XCircle className="w-4 h-4"/></button>}
          </div>

          {!["processing","receipt","done"].includes(step)&&(
            <div className="flex border-b border-stone-100">
              {SBAR.map((s,i)=>(
                <div key={s} className={`flex-1 py-1.5 text-center text-[10px] font-semibold transition-colors ${step===s?"text-primary-700 border-b-2 border-primary-600":SBAR.indexOf(step as typeof SBAR[number])>i?"text-emerald-600":"text-stone-400"}`}>
                  {i+1}. {SLBL[i]}
                </div>
              ))}
            </div>
          )}

          <div className="p-5">
            {/* Details */}
            {step==="details"&&(
              <>
                <p className="text-sm font-bold text-stone-800 mb-4">Extension Details</p>
                <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-600 mb-4 space-y-1">
                  <p><span className="font-semibold">Property:</span> {propertyTitle}</p>
                  <p><span className="font-semibold">Tenant:</span> {tenantName}</p>
                  <p><span className="font-semibold">Current rent:</span> ETB {monthlyRent.toLocaleString()}/mo</p>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">New End Date *</label>
                  <input type="date" value={newEndDate} min={new Date(Date.now()+30*24*3600*1000).toISOString().split("T")[0]}
                    onChange={e=>setNewEndDate(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"/>
                </div>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input type="checkbox" checked={adjustRent} onChange={e=>setAdjustRent(e.target.checked)} className="rounded"/>
                  <span className="text-sm text-stone-700">Also adjust monthly rent</span>
                </label>
                {adjustRent&&(
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">New Monthly Rent (ETB)</label>
                    <input type="number" value={newRent} min={1} onChange={e=>setNewRent(Number(e.target.value))}
                      className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"/>
                  </div>
                )}
                <div className="rounded-xl bg-primary-50 border border-primary-200 px-4 py-3 text-xs text-primary-700 mb-4">
                  <strong>Extension fee:</strong> ETB {EXT_FEE} processing charge applies. Both parties must sign. DARA will verify.
                </div>
                <button onClick={()=>setStep("method")} disabled={!newEndDate}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                  Continue to Payment
                </button>
              </>
            )}

            {/* Method */}
            {step==="method"&&(
              <>
                <p className="text-xs text-stone-500 mb-0.5">Extension Processing Fee</p>
                <p className="text-3xl font-black text-stone-900 mb-4">ETB {EXT_FEE}.00</p>
                <div className="space-y-3 mb-5">
                  {PAY_METHODS.map(m=>(
                    <button key={m.id} onClick={()=>setMethod(m.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${method===m.id?`${m.border} ${m.bg}`:"border-stone-200 hover:border-stone-300"}`}>
                      <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center`}><m.icon className={`w-4 h-4 ${m.color}`}/></div>
                      <span className={`font-semibold text-sm ${m.color}`}>{m.label}</span>
                      {method===m.id&&<CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto"/>}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>setStep("details")} className="flex-1 border border-stone-200 text-stone-700 py-2.5 rounded-xl hover:bg-stone-50 text-sm">Back</button>
                  <button onClick={()=>setStep("account")} disabled={!method} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-stone-200 disabled:text-stone-400 text-white py-2.5 rounded-xl text-sm font-semibold">Continue</button>
                </div>
              </>
            )}

            {/* Account */}
            {step==="account"&&mi&&(
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${mi.bg} flex items-center justify-center`}><mi.icon className={`w-5 h-5 ${mi.color}`}/></div>
                  <div><p className="font-bold text-stone-900 text-sm">{mi.label}</p><p className="text-xs text-stone-500">{isCbe?"CBE account number":"Telebirr phone"}</p></div>
                </div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">{isCbe?"CBE Account Number":"Telebirr Phone Number"}</label>
                <div className="relative mb-4">
                  <mi.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"/>
                  <input type={isCbe?"text":"tel"} value={account} onChange={e=>setAccount(isCbe?e.target.value.replace(/\D/g,""):e.target.value)}
                    placeholder={mi.ph} className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"/>
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>setStep("method")} className="flex-1 border border-stone-200 text-stone-700 py-2.5 rounded-xl hover:bg-stone-50 text-sm">Back</button>
                  <button onClick={()=>setStep("pin")} disabled={account.trim().length<7} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-stone-200 disabled:text-stone-400 text-white py-2.5 rounded-xl text-sm font-semibold">Continue</button>
                </div>
              </>
            )}

            {/* PIN */}
            {step==="pin"&&mi&&(
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${mi.bg} flex items-center justify-center`}><KeyRound className={`w-5 h-5 ${mi.color}`}/></div>
                  <div><p className="font-bold text-stone-900 text-sm">Enter {mi.label} PIN</p><p className="text-xs text-stone-500">{account}</p></div>
                </div>
                <div className="relative mb-1">
                  <input type={pinVis?"text":"password"} inputMode="numeric" value={pin} maxLength={6}
                    onChange={e=>{setPin(e.target.value.replace(/\D/g,"").slice(0,6));setPinErr("");}} placeholder="••••••"
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary-400 pr-12 text-center"/>
                  <button type="button" onClick={()=>setPinVis(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    {pinVis?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
                {pinErr&&<p className="text-xs text-red-600 mt-1">{pinErr}</p>}
                <p className="text-xs text-stone-400 mt-2 mb-4">PIN never stored — sent directly to {mi.label}.</p>
                <div className="flex gap-3">
                  <button onClick={()=>setStep("account")} className="flex-1 border border-stone-200 text-stone-700 py-2.5 rounded-xl hover:bg-stone-50 text-sm">Back</button>
                  <button onClick={handlePinNext} disabled={pin.length<4} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-stone-200 disabled:text-stone-400 text-white py-2.5 rounded-xl text-sm font-semibold">Authorise</button>
                </div>
              </>
            )}

            {/* Confirm */}
            {step==="confirm"&&mi&&(
              <>
                <p className="text-sm font-bold text-stone-900 mb-3">Confirm Extension Fee Payment</p>
                <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm mb-3">
                  {[["Fee",`ETB ${EXT_FEE}.00`],["Method",mi.label],[isCbe?"Account":"Phone",account],["PIN","•".repeat(pin.length)],["New End Date",new Date(newEndDate).toLocaleDateString()],...(adjustRent?[["New Rent",`ETB ${newRent.toLocaleString()}/mo`]]:[])].map(([l,v])=>(
                    <div key={l} className="flex justify-between"><span className="text-stone-500">{l}</span><span className="font-semibold">{v}</span></div>
                  ))}
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-xs text-emerald-800 mb-4">
                  After payment the request is sent to <strong>{tenantName}</strong> for signature, then DARA for approval.
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>setStep("pin")} className="flex-1 border border-stone-200 text-stone-700 py-2.5 rounded-xl hover:bg-stone-50 text-sm">Back</button>
                  <button onClick={handleConfirm} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5"/> Pay &amp; Submit
                  </button>
                </div>
              </>
            )}

            {/* Processing */}
            {step==="processing"&&(
              <div className="flex flex-col items-center py-10 text-center">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-40"/>
                  <div className="relative w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center"><Loader2 className="w-7 h-7 text-primary-600 animate-spin"/></div>
                </div>
                <p className="font-bold text-stone-900">Processing Payment…</p>
                <p className="text-sm text-stone-500 mt-1">Please do not close this window.</p>
              </div>
            )}

            {/* Receipt */}
            {step==="receipt"&&method&&mi&&feeRef&&(
              <>
                <div className="border border-stone-200 rounded-2xl overflow-hidden mb-4 text-xs" style={{fontFamily:"'Courier New',monospace"}}>
                  <div className="bg-[#1a3a6b] px-5 py-3 text-center">
                    <p className="text-white font-black text-sm">Commercial Bank of Ethiopia</p>
                    <p className="text-blue-200 text-[10px]">VAT Invoice / Customer Receipt</p>
                  </div>
                  <div className="bg-emerald-600 py-2.5 text-center">
                    <p className="text-emerald-100 text-[9px] uppercase tracking-widest mb-0.5">Total Amount Debited</p>
                    <p className="text-white font-black text-xl">{total.toFixed(2)} ETB</p>
                    <p className="text-emerald-200 text-[9px]">✓ Extension Fee Paid</p>
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    {[["VAT Receipt No",feeRef],["Date",new Date(paidAt).toLocaleString()],["Payer","Landlord"],["Account",maskAcc(account)],["Receiver","DARA Rental Platform"],["Reason","Extension Fee — "+propertyTitle],["Fee",EXT_FEE.toFixed(2)+" ETB"],["Commission",comm.toFixed(2)+" ETB"],["15% VAT",vat.toFixed(2)+" ETB"],["Total",total.toFixed(2)+" ETB"]].map(([l,v])=>(
                      <div key={l} className="flex justify-between"><span className="text-stone-400 w-28 shrink-0">{l}:</span><span className="text-stone-800 font-semibold text-right">{v}</span></div>
                    ))}
                    <div className="pt-1 border-t border-stone-100"><p className="text-stone-400">Amount in Word:</p><p className="text-stone-700 font-semibold">{amountToWords(total)}</p></div>
                  </div>
                  <div className="bg-[#1a3a6b] px-4 py-2 text-center">
                    <p className="text-blue-200 text-[9px] italic">The Bank you can always rely on.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>window.print()} className="flex-1 flex items-center justify-center gap-1.5 border border-stone-200 text-stone-700 py-2 rounded-xl hover:bg-stone-50 text-xs font-medium"><Printer className="w-3.5 h-3.5"/> Print</button>
                  <button onClick={()=>{const b=new Blob([`CBE Receipt\nRef:${feeRef}\nAmount:ETB ${total.toFixed(2)}\nDate:${new Date(paidAt).toLocaleString()}`],{type:"text/plain"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`CBE_Receipt_${feeRef}.txt`;a.click();}}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#1a3a6b] hover:bg-[#15305c] text-white py-2 rounded-xl text-xs font-semibold"><Download className="w-3.5 h-3.5"/> Download</button>
                  <button onClick={()=>setStep("done")} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-semibold"><Send className="w-3.5 h-3.5"/> Send</button>
                </div>
              </>
            )}

            {/* Done */}
            {step==="done"&&(
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-600"/></div>
                <p className="font-black text-stone-900 text-lg">Extension Request Sent!</p>
                <p className="text-sm text-stone-500 mt-2 mb-6">Your extension request has been submitted to the authority for review.</p>
                <button onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Close</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Withdraw Agreement Modal (before tenant payment only) ─── */
type WithdrawStep = "form" | "submitted";
function WithdrawAgreementModal({
  propertyTitle,
  otherPartyName,
  onClose,
  onSubmit,
}: {
  propertyTitle: string;
  otherPartyName: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [step, setStep] = useState<WithdrawStep>("form");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const canSubmit = reason.trim().length >= 10 && confirmed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 bg-amber-600 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">Withdraw from Agreement</span>
          </div>
          {step !== "submitted" && (
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6">
          {step === "submitted" ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-3" />
              <p className="font-black text-stone-900 text-lg mb-2">Agreement Withdrawn</p>
              <p className="text-sm text-stone-500 mb-6">
                <strong>{otherPartyName}</strong> has been notified. This agreement is no longer active.
              </p>
              <button onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-stone-600 mb-1">{propertyTitle}</p>
              <p className="text-xs text-stone-500 mb-4">
                You may withdraw before the tenant pays the advance rent. After payment, withdrawal is no longer available.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">
                    Reason for withdrawal <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Briefly explain why you are withdrawing from this agreement…"
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                  />
                  <p className={`text-[11px] mt-1 ${reason.trim().length >= 10 ? "text-emerald-600" : "text-stone-400"}`}>
                    {reason.trim().length} / 10 minimum
                  </p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 rounded accent-amber-600"
                  />
                  <p className="text-xs text-amber-800">
                    I understand this will cancel the agreement before tenancy is activated.
                  </p>
                </label>
              </div>
              {submitErr && <p className="text-xs text-red-600 mt-3">{submitErr}</p>}
              <div className="flex gap-3 mt-5">
                <button onClick={onClose} className="flex-1 border border-stone-200 text-stone-700 py-2.5 rounded-xl hover:bg-stone-50 text-sm font-medium">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!canSubmit) return;
                    setSubmitting(true);
                    setSubmitErr(null);
                    try {
                      await onSubmit(reason.trim());
                      setStep("submitted");
                    } catch (err) {
                      setSubmitErr(err instanceof Error ? err.message : "Withdrawal failed");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={!canSubmit || submitting}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Confirm Withdrawal
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Request Termination Modal (after payment — tenant anytime, landlord after 2 years) ─── */
type TermStep = "form" | "submitted";
function TerminationRequestModal({
  tenantName,
  propertyTitle,
  startDate,
  monthlyRent,
  role,
  onClose,
  onSubmit,
}: {
  tenantName: string;
  propertyTitle: string;
  startDate: string;
  monthlyRent: number;
  role: "tenant" | "landlord";
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const start = new Date(startDate);
  const minVacate = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split("T")[0];

  const [step, setStep] = useState<TermStep>("form");
  const [grounds, setGrounds] = useState("");
  const [description, setDescription] = useState("");
  const [vacateDate, setVacateDate] = useState("");
  const [noticePeriod, setNoticePeriod] = useState(false);
  const [declaration, setDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const canSubmit =
    grounds !== "" &&
    description.trim().length >= 20 &&
    vacateDate !== "" &&
    noticePeriod &&
    declaration;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 flex items-center justify-between rounded-t-2xl bg-red-600">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">Request Termination</span>
          </div>
          {step !== "submitted" && (
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6">
          {step === "submitted" ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-3" />
              <p className="font-black text-stone-900 text-lg mb-2">Termination Request Submitted</p>
              <p className="text-sm text-stone-500 mb-2">
                The {role === "tenant" ? "landlord" : "tenant"} and the authority have been notified.
              </p>
              <p className="text-xs text-stone-400 mb-6">
                Expected vacate: <strong>{new Date(vacateDate).toLocaleDateString()}</strong>
              </p>
              <button onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="bg-stone-50 rounded-xl p-3 mb-5 text-xs text-stone-600 space-y-1">
                <p><span className="font-semibold">Property:</span> {propertyTitle}</p>
                <p><span className="font-semibold">Tenant:</span> {tenantName}</p>
                <p><span className="font-semibold">Tenancy since:</span> {start.toLocaleDateString()}</p>
                <p><span className="font-semibold">Monthly rent:</span> ETB {monthlyRent.toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">
                    Legal Grounds <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={grounds}
                    onChange={(e) => setGrounds(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                  >
                    {TERM_GROUNDS.map((g) => (
                      <option key={g.value} value={g.value} disabled={g.value === ""}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the circumstances for this termination request…"
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                  <p className={`text-[11px] mt-1 ${description.trim().length >= 20 ? "text-emerald-600" : "text-stone-400"}`}>
                    {description.trim().length} / 20 minimum
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">
                    Expected Vacate Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={vacateDate}
                    min={minVacate}
                    onChange={(e) => setVacateDate(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.checked)}
                    className="mt-0.5 rounded accent-amber-600"
                  />
                  <p className="text-xs text-amber-700">
                    I acknowledge the required notice period and that the other party will be informed.
                  </p>
                </label>
                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={declaration}
                    onChange={(e) => setDeclaration(e.target.checked)}
                    className="mt-0.5 rounded accent-red-600"
                  />
                  <p className="text-xs text-red-700">
                    I declare this information is accurate. This request will be reviewed by the authority.
                  </p>
                </label>
              </div>

              {submitErr && <p className="text-xs text-red-600 mt-3">{submitErr}</p>}
              <div className="flex gap-3 mt-5">
                <button onClick={onClose} className="flex-1 border border-stone-200 text-stone-700 py-2.5 rounded-xl hover:bg-stone-50 text-sm font-medium">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!canSubmit) return;
                    const groundsLabel = TERM_GROUNDS.find((g) => g.value === grounds)?.label ?? grounds;
                    const reason = `[${groundsLabel}] Expected vacate: ${vacateDate}. ${description.trim()}`;
                    setSubmitting(true);
                    setSubmitErr(null);
                    try {
                      await onSubmit(reason);
                      setStep("submitted");
                    } catch (err) {
                      setSubmitErr(err instanceof Error ? err.message : "Request failed");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={!canSubmit || submitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-stone-200 disabled:text-stone-400 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Termination Request
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgreementDetailPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const role = user?.role || "tenant";
  const params = useParams();
  const [agreement, setAgreement] = useState<TenancyAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const agreementId = String(params.id ?? "");
  const [showExtension, setShowExtension] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTerminationRequest, setShowTerminationRequest] = useState(false);
  const [showAdvancePayment, setShowAdvancePayment] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  const reloadAgreement = useCallback(() => {
    const token = getAccessToken();
    if (!token || !agreementId) return Promise.resolve();
    return apiGetAgreementById(token, agreementId).then((data) => setAgreement(data));
  }, [agreementId]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !agreementId) {
      setLoading(false);
      return;
    }
    apiGetAgreementById(token, agreementId)
      .then((data) => setAgreement(data))
      .finally(() => setLoading(false));
  }, [agreementId]);

  useEffect(() => {
    const refresh = () => {
      void reloadAgreement();
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [reloadAgreement]);

  if (loading) {
    return (
      <>
        <Header title="Agreement Details" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-stone-500">Loading agreement...</p>
        </main>
      </>
    );
  }

  if (!agreement) {
    return (
      <>
        <Header title="Agreement Not Found" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-stone-500">Agreement not found.</p>
        </main>
      </>
    );
  }

  const statusTimeline = [
    {
      label: "Created",
      date: agreement.createdAt,
      done: true,
      icon: FileText,
    },
    {
      label: "Signed",
      date: signedAtDate(agreement),
      done: bothPartiesSigned(agreement),
      icon: CheckCircle2,
    },
    {
      label: "Verified",
      date: agreement.verifiedAt,
      done: !!agreement.verifiedAt,
      icon: CheckCircle2,
    },
    {
      label: "Pending Payment",
      date: agreement.initialPaymentAt,
      done: agreement.status === "active" || agreement.status === "terminated",
      icon: CreditCard,
    },
    {
      label: agreement.status === "terminated" ? "Terminated" : "Active",
      date: agreement.status === "active"
        ? agreement.initialPaymentAt
        : agreement.terminatedAt,
      done: agreement.status === "active" || agreement.status === "terminated",
      icon: agreement.status === "terminated" ? XCircle : CheckCircle2,
    },
  ];

  return (
    <>
      {showExtension && (
        <ExtensionModal
          tenantName={agreement.tenantName}
          propertyTitle={agreement.propertyTitle}
          monthlyRent={agreement.monthlyRent}
          onClose={async () => {
            setShowExtension(false);
            await reloadAgreement();
          }}
          onComplete={async (payload) => {
            const token = getAccessToken();
            if (!token) throw new Error("Not signed in");
            await apiRequestAgreementExtension(token, agreement.id, payload);
            await reloadAgreement();
          }}
        />
      )}
      {showWithdraw && (
        <WithdrawAgreementModal
          propertyTitle={agreement.propertyTitle}
          otherPartyName={role === "tenant" ? agreement.landlordName : agreement.tenantName}
          onClose={() => setShowWithdraw(false)}
          onSubmit={async (reason) => {
            const token = getAccessToken();
            if (!token) throw new Error("Not signed in");
            await apiWithdrawAgreement(token, agreement.id, reason);
            await reloadAgreement();
            setShowWithdraw(false);
          }}
        />
      )}
      {showTerminationRequest && (
        <TerminationRequestModal
          tenantName={agreement.tenantName}
          propertyTitle={agreement.propertyTitle}
          startDate={agreement.startDate}
          monthlyRent={agreement.monthlyRent}
          role={role === "landlord" ? "landlord" : "tenant"}
          onClose={() => setShowTerminationRequest(false)}
          onSubmit={async (reason) => {
            const token = getAccessToken();
            if (!token) throw new Error("Not signed in");
            await apiRequestAgreementTermination(token, agreement.id, reason);
            await reloadAgreement();
          }}
        />
      )}
      {showAdvancePayment && (
        <AdvancePaymentModal
          agreementId={agreement.id}
          amount={agreement.advancePayment}
          propertyTitle={agreement.propertyTitle}
          onClose={() => setShowAdvancePayment(false)}
        />
      )}
        <Header title={t("agreements", "agreementDetails")} />
      <main className="flex-1 p-6 overflow-y-auto">
        <Link
          href="/dashboard/agreements"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agreements
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-stone-400 font-mono mb-1">
                    Agreement #{agreement.id.toUpperCase()}
                  </p>
                  <h2 className="text-xl font-bold text-stone-900">
                    {agreement.propertyTitle}
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    {agreement.propertyAddress}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agreement.status)}`}
                >
                  {formatStatus(agreement.status)}
                </span>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-0 mb-6">
                {statusTimeline.map((step, i) => (
                  <div key={step.label} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.done
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        <step.icon className="w-4 h-4" />
                      </div>
                      <p
                        className={`text-xs mt-1 ${step.done ? "text-stone-700 font-medium" : "text-stone-400"}`}
                      >
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-[10px] text-stone-400">
                          {formatDate(step.date)}
                        </p>
                      )}
                    </div>
                    {i < statusTimeline.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          statusTimeline[i + 1].done
                            ? "bg-emerald-300"
                            : "bg-stone-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Rejected Reason */}
              {agreement.status === "rejected" && agreement.terminationReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Agreement Rejected
                    </p>
                    <p className="text-sm text-red-600 mt-0.5">
                      {agreement.terminationReason}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Agreement Details */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-4">
                Agreement Terms
              </h3>
              <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-500">Monthly Rent</p>
                    <p className="text-sm font-semibold text-stone-900">
                      {formatCurrency(agreement.monthlyRent)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-500">Advance Payment</p>
                    <p className="text-sm font-semibold text-stone-900">
                      {formatCurrency(agreement.advancePayment)}
                      <span className="text-xs text-stone-400 ml-1">
                        ({Math.round(agreement.advancePayment / agreement.monthlyRent)} months)
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-500">Start Date</p>
                    <p className="text-sm font-semibold text-stone-900">
                      {formatDate(agreement.startDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-xs text-stone-500">End Date</p>
                    <p className="text-sm font-semibold text-stone-900">
                      {formatDate(agreement.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              {agreement.utilities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <p className="text-xs text-stone-500 mb-2">
                    Included Utilities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {agreement.utilities.map((u) => (
                      <span
                        key={u}
                        className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded text-xs"
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Landlord */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-3">
                Landlord
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {agreement.landlordName}
                  </p>
                  <p className="text-xs text-stone-500">Property Owner</p>
                </div>
              </div>
            </div>

            {/* Tenant */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-3">
                Tenant
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {agreement.tenantName}
                  </p>
                  <p className="text-xs text-stone-500">Registered Tenant</p>
                  {role === "landlord" && (
                    <ViewTenantProfileLink
                      tenantId={agreement.tenantId}
                      className="mt-1"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Property */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-3">
                Property
              </h3>
              <Link
                href={`/dashboard/properties/${agreement.propertyId}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-stone-500" />
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

            {/* Landlord counter-sign when tenant signed first */}
            {agreement.status === "draft" &&
              role === "landlord" &&
              agreement.tenantSignedAt && (
              <div className="bg-white rounded-xl border border-primary-200 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-stone-900">
                  Counter-Sign Agreement
                </h3>
                <p className="text-xs text-stone-500">
                  The tenant has signed this contract. Review the terms and apply your e-signature to counter-sign.
                </p>
                <Link
                  href={`/dashboard/agreements/${agreement.id}/counter-sign`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Review & Counter-Sign
                </Link>
              </div>
            )}

            {/* Tenant sign when landlord initiated */}
            {agreement.status === "pending_tenant_signature" && role === "tenant" && (
              <div className="bg-white rounded-xl border border-emerald-200 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-stone-900">
                  Sign Agreement
                </h3>
                <p className="text-xs text-stone-500">
                  Your landlord has sent you this agreement. Sign to submit it for authority verification.
                </p>
                {signError && (
                  <p className="text-xs text-red-600">{signError}</p>
                )}
                <button
                  disabled={signing}
                  onClick={async () => {
                    const token = getAccessToken();
                    if (!token) return;
                    setSigning(true);
                    setSignError(null);
                    try {
                      await apiTenantSignAgreement(token, agreement.id);
                      await reloadAgreement();
                    } catch (err) {
                      setSignError(
                        err instanceof Error ? err.message : "Sign failed",
                      );
                    } finally {
                      setSigning(false);
                    }
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:bg-stone-300 transition-colors flex items-center justify-center gap-2"
                >
                  {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Sign Agreement
                </button>
              </div>
            )}

            {/* Tenant waiting for landlord */}
            {agreement.status === "draft" && role === "tenant" && agreement.tenantSignedAt && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Awaiting Landlord Counter-Signature</p>
                    <p className="text-xs text-amber-600 mt-1">
                      You have signed this agreement. The landlord has been notified to review and counter-sign.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tenant: pay advance after authority verification */}
            {agreement.status === "pending_payment" && role === "tenant" && (
              <div className="bg-white rounded-xl border border-emerald-200 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-stone-900">
                  Pay Advance Rent
                </h3>
                <p className="text-xs text-stone-500">
                  Your agreement has been verified by the authority. Pay the advance rent of{" "}
                  <strong>{formatCurrency(agreement.advancePayment)}</strong> to activate your tenancy.
                </p>
                <button
                  onClick={() => setShowAdvancePayment(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <CreditCard className="w-4 h-4" /> Pay Now
                </button>
              </div>
            )}

            {/* Landlord: waiting for tenant payment */}
            {agreement.status === "pending_payment" && role === "landlord" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Awaiting Tenant Payment</p>
                    <p className="text-xs text-amber-600 mt-1">
                      The agreement is verified. The tenant has been notified to pay the advance rent before the tenancy becomes active.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending extension / termination review */}
            {isPendingAuthorityAction(agreement.status) && (role === "tenant" || role === "landlord") && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary-800">
                      {agreement.status === "extension_requested"
                        ? "Extension Request Pending"
                        : "Termination Request Pending"}
                    </p>
                    <p className="text-xs text-primary-600 mt-1">
                      The authority is reviewing this request. You will be notified once a decision is made.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Active tenancy actions (after payment) */}
            {isActiveTenancy(agreement.status) && (role === "tenant" || role === "landlord") && (
              <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-stone-900">
                  Active Tenancy
                </h3>
                <p className="text-xs text-stone-500">
                  Withdrawal is no longer available. Use the options below to manage your active tenancy.
                </p>

                {/* Extension — landlord only, anytime */}
                {role === "landlord" && (
                  <button
                    onClick={() => setShowExtension(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-700 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Request Extension
                  </button>
                )}

                {/* Termination — tenant anytime; landlord after 2 years */}
                {role === "tenant" && (
                  <button
                    onClick={() => setShowTerminationRequest(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" /> Request Termination
                  </button>
                )}
                {role === "landlord" && landlordTerminationEligible(agreement.startDate) && (
                  <button
                    onClick={() => setShowTerminationRequest(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" /> Request Termination
                  </button>
                )}
                {role === "landlord" && !landlordTerminationEligible(agreement.startDate) && (
                  <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 text-xs text-stone-600">
                    <p className="font-semibold text-stone-700 mb-1">Request Termination</p>
                    <p>
                      Available from{" "}
                      <strong>{landlordTerminationAvailableFrom(agreement.startDate).toLocaleDateString()}</strong>{" "}
                      (after 2 years of the tenancy). You can request an extension at any time.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Withdraw before tenant payment */}
            {canWithdraw(agreement.status) && (role === "tenant" || role === "landlord") && (
              <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-stone-900">
                  Withdraw from Agreement
                </h3>
                <p className="text-xs text-stone-500">
                  Either party may withdraw until the tenant pays the advance rent and the tenancy is activated.
                </p>
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-50 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" /> Withdraw from Agreement
                </button>
              </div>
            )}

            {/* Authorities only: Approve / Reject */}
            {(agreement.status === "pending_verification" ||
              agreement.status === "pending_dara_verification") &&
              role === "admin" && (
              <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-stone-900">
                  {t("agreements", "verificationActions")}
                </h3>
                <button className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
                  {t("agreements", "approveAgreement")}
                </button>
                <button className="w-full px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  {t("agreements", "rejectAgreement")}
                </button>
              </div>
            )}

            {/* Pending status info for tenant/landlord */}
            {(agreement.status === "pending_verification" ||
              agreement.status === "pending_dara_verification") &&
              (role === "tenant" || role === "landlord") && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">{formatStatus(agreement.status)}</p>
                    <p className="text-xs text-amber-600 mt-1">This agreement is awaiting review and approval by the Authorities.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Check */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-3">
                Compliance Check
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  {agreement.advancePayment <=
                  agreement.monthlyRent * 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-stone-600">
                    Advance &le; 2 months rent
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const start = new Date(agreement.startDate);
                    const end = new Date(agreement.endDate);
                    const months =
                      (end.getFullYear() - start.getFullYear()) * 12 +
                      (end.getMonth() - start.getMonth());
                    return months >= 24;
                  })() ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-stone-600">
                    Minimum 2-year term
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {bothPartiesSigned(agreement) ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-xs text-stone-600">
                    Digitally signed by both parties
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
