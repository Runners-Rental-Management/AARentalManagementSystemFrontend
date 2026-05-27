"use client";

import { Header } from "@/components/dashboard/header";
import { ViewTenantProfileLink } from "@/components/dashboard/tenant-public-profile";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { getAccessToken, apiGetAgreementById, apiLandlordSignAgreement, apiTenantSignAgreement } from "@/lib/api";
import type { TenancyAgreement } from "@/lib/types";
import { formatCurrency, formatDate, getStatusColor, formatStatus } from "@/lib/utils";
import {
  ArrowLeft, FileText, User, Building2, Calendar, DollarSign,
  CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, Send,
  Eye, EyeOff, KeyRound, Landmark, Smartphone, CreditCard,
  Loader2, Download, Printer, MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

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
  {value:"",              label:"Select grounds…"},
  {value:"end_of_term",  label:"End of agreed contract term"},
  {value:"owner_occ",    label:"Owner or immediate family occupation"},
  {value:"sale",         label:"Sale of the property"},
  {value:"renovation",   label:"Major renovation / demolition"},
  {value:"breach",       label:"Tenant breach of contract"},
  {value:"non_payment",  label:"Persistent non-payment of rent"},
  {value:"other",        label:"Other (explain below)"},
];
type PayMethod = "cbe_birr"|"telebirr";
const PAY_METHODS = [
  {id:"cbe_birr" as PayMethod, label:"CBE Birr", icon:Landmark,   color:"text-blue-700",  bg:"bg-blue-50",  border:"border-blue-300",  ph:"1000XXXXXXXXX"},
  {id:"telebirr" as PayMethod, label:"Telebirr", icon:Smartphone, color:"text-green-700", bg:"bg-green-50", border:"border-green-300", ph:"+251 9XX XXX XXX"},
];

/* ─── Extension Modal ─── */
type ExtStep = "details"|"method"|"account"|"pin"|"confirm"|"processing"|"receipt"|"done";
function ExtensionModal({ tenantName, propertyTitle, monthlyRent, onClose }:{
  tenantName:string; propertyTitle:string; monthlyRent:number; onClose:()=>void;
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
    await new Promise(r=>setTimeout(r,2400));
    const ref=`EXT-${Date.now().toString(36).toUpperCase()}`;
    setFeeRef(ref); setPaidAt(new Date().toISOString()); setShowSms(true); setStep("receipt");
  };

  const SBAR=["details","method","account","pin","confirm"] as const;
  const SLBL=["Details","Method","Account","Passkey","Confirm"];

  useEffect(()=>{ if(showSms){ const t=setTimeout(()=>setShowSms(false),7000); return ()=>clearTimeout(t); } },[showSms]);

  return (
    <>
      {showSms&&feeRef&&(
        <div className="fixed bottom-6 right-6 z-[60] w-72 animate-fade-in-up">
          <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
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
          <div className="bg-gradient-to-r from-indigo-700 to-primary-700 px-5 py-4 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-white"/>
              <span className="text-white font-bold text-sm">{step==="receipt"?"Extension Fee Receipt":step==="done"?"Request Submitted":"Request Extension"}</span>
            </div>
            {!["processing","receipt","done"].includes(step)&&<button onClick={onClose} className="text-white/70 hover:text-white"><XCircle className="w-4 h-4"/></button>}
          </div>

          {!["processing","receipt","done"].includes(step)&&(
            <div className="flex border-b border-slate-100">
              {SBAR.map((s,i)=>(
                <div key={s} className={`flex-1 py-1.5 text-center text-[10px] font-semibold transition-colors ${step===s?"text-primary-700 border-b-2 border-primary-600":SBAR.indexOf(step as typeof SBAR[number])>i?"text-emerald-600":"text-slate-400"}`}>
                  {i+1}. {SLBL[i]}
                </div>
              ))}
            </div>
          )}

          <div className="p-5">
            {/* Details */}
            {step==="details"&&(
              <>
                <p className="text-sm font-bold text-slate-800 mb-4">Extension Details</p>
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 mb-4 space-y-1">
                  <p><span className="font-semibold">Property:</span> {propertyTitle}</p>
                  <p><span className="font-semibold">Tenant:</span> {tenantName}</p>
                  <p><span className="font-semibold">Current rent:</span> ETB {monthlyRent.toLocaleString()}/mo</p>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">New End Date *</label>
                  <input type="date" value={newEndDate} min={new Date(Date.now()+30*24*3600*1000).toISOString().split("T")[0]}
                    onChange={e=>setNewEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"/>
                </div>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input type="checkbox" checked={adjustRent} onChange={e=>setAdjustRent(e.target.checked)} className="rounded"/>
                  <span className="text-sm text-slate-700">Also adjust monthly rent</span>
                </label>
                {adjustRent&&(
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">New Monthly Rent (ETB)</label>
                    <input type="number" value={newRent} min={1} onChange={e=>setNewRent(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"/>
                  </div>
                )}
                <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3 text-xs text-indigo-700 mb-4">
                  <strong>Extension fee:</strong> ETB {EXT_FEE} processing charge applies. Both parties must sign. DARA will verify.
                </div>
                <button onClick={()=>setStep("method")} disabled={!newEndDate}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                  Continue to Payment
                </button>
              </>
            )}

            {/* Method */}
            {step==="method"&&(
              <>
                <p className="text-xs text-slate-500 mb-0.5">Extension Processing Fee</p>
                <p className="text-3xl font-black text-slate-900 mb-4">ETB {EXT_FEE}.00</p>
                <div className="space-y-3 mb-5">
                  {PAY_METHODS.map(m=>(
                    <button key={m.id} onClick={()=>setMethod(m.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${method===m.id?`${m.border} ${m.bg}`:"border-slate-200 hover:border-slate-300"}`}>
                      <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center`}><m.icon className={`w-4 h-4 ${m.color}`}/></div>
                      <span className={`font-semibold text-sm ${m.color}`}>{m.label}</span>
                      {method===m.id&&<CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto"/>}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>setStep("details")} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm">Back</button>
                  <button onClick={()=>setStep("account")} disabled={!method} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold">Continue</button>
                </div>
              </>
            )}

            {/* Account */}
            {step==="account"&&mi&&(
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${mi.bg} flex items-center justify-center`}><mi.icon className={`w-5 h-5 ${mi.color}`}/></div>
                  <div><p className="font-bold text-slate-900 text-sm">{mi.label}</p><p className="text-xs text-slate-500">{isCbe?"CBE account number":"Telebirr phone"}</p></div>
                </div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">{isCbe?"CBE Account Number":"Telebirr Phone Number"}</label>
                <div className="relative mb-4">
                  <mi.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                  <input type={isCbe?"text":"tel"} value={account} onChange={e=>setAccount(isCbe?e.target.value.replace(/\D/g,""):e.target.value)}
                    placeholder={mi.ph} className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono"/>
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>setStep("method")} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm">Back</button>
                  <button onClick={()=>setStep("pin")} disabled={account.trim().length<7} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold">Continue</button>
                </div>
              </>
            )}

            {/* PIN */}
            {step==="pin"&&mi&&(
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${mi.bg} flex items-center justify-center`}><KeyRound className={`w-5 h-5 ${mi.color}`}/></div>
                  <div><p className="font-bold text-slate-900 text-sm">Enter {mi.label} PIN</p><p className="text-xs text-slate-500">{account}</p></div>
                </div>
                <div className="relative mb-1">
                  <input type={pinVis?"text":"password"} inputMode="numeric" value={pin} maxLength={6}
                    onChange={e=>{setPin(e.target.value.replace(/\D/g,"").slice(0,6));setPinErr("");}} placeholder="••••••"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary-400 pr-12 text-center"/>
                  <button type="button" onClick={()=>setPinVis(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {pinVis?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
                {pinErr&&<p className="text-xs text-red-600 mt-1">{pinErr}</p>}
                <p className="text-xs text-slate-400 mt-2 mb-4">PIN never stored — sent directly to {mi.label}.</p>
                <div className="flex gap-3">
                  <button onClick={()=>setStep("account")} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm">Back</button>
                  <button onClick={handlePinNext} disabled={pin.length<4} className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold">Authorise</button>
                </div>
              </>
            )}

            {/* Confirm */}
            {step==="confirm"&&mi&&(
              <>
                <p className="text-sm font-bold text-slate-900 mb-3">Confirm Extension Fee Payment</p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm mb-3">
                  {[["Fee",`ETB ${EXT_FEE}.00`],["Method",mi.label],[isCbe?"Account":"Phone",account],["PIN","•".repeat(pin.length)],["New End Date",new Date(newEndDate).toLocaleDateString()],...(adjustRent?[["New Rent",`ETB ${newRent.toLocaleString()}/mo`]]:[])].map(([l,v])=>(
                    <div key={l} className="flex justify-between"><span className="text-slate-500">{l}</span><span className="font-semibold">{v}</span></div>
                  ))}
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-xs text-emerald-800 mb-4">
                  After payment the request is sent to <strong>{tenantName}</strong> for signature, then DARA for approval.
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>setStep("pin")} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm">Back</button>
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
                <p className="font-bold text-slate-900">Processing Payment…</p>
                <p className="text-sm text-slate-500 mt-1">Please do not close this window.</p>
              </div>
            )}

            {/* Receipt */}
            {step==="receipt"&&method&&mi&&feeRef&&(
              <>
                <div className="border border-slate-200 rounded-2xl overflow-hidden mb-4 text-xs" style={{fontFamily:"'Courier New',monospace"}}>
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
                      <div key={l} className="flex justify-between"><span className="text-slate-400 w-28 shrink-0">{l}:</span><span className="text-slate-800 font-semibold text-right">{v}</span></div>
                    ))}
                    <div className="pt-1 border-t border-slate-100"><p className="text-slate-400">Amount in Word:</p><p className="text-slate-700 font-semibold">{amountToWords(total)}</p></div>
                  </div>
                  <div className="bg-[#1a3a6b] px-4 py-2 text-center">
                    <p className="text-blue-200 text-[9px] italic">The Bank you can always rely on.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>window.print()} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 py-2 rounded-xl hover:bg-slate-50 text-xs font-medium"><Printer className="w-3.5 h-3.5"/> Print</button>
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
                <p className="font-black text-slate-900 text-lg">Extension Request Sent!</p>
                <p className="text-sm text-slate-500 mt-2 mb-6">Sent to <strong>{tenantName}</strong> for signature. After both sign, DARA will verify.</p>
                <button onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Close</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Termination Modal ─── */
type TermStep = "form"|"submitted";
function TerminationModal({ tenantName, propertyTitle, startDate, monthlyRent, onClose }:{
  tenantName:string; propertyTitle:string; startDate:string; monthlyRent:number; onClose:()=>void;
}) {
  const start = new Date(startDate);
  const twoYears = new Date(start.getTime()+2*365.25*24*3600*1000);
  const isEarly = new Date()<twoYears;
  const daysLeft = Math.ceil((twoYears.getTime()-Date.now())/(24*3600*1000));
  const minVacate = new Date(Date.now()+90*24*3600*1000).toISOString().split("T")[0];

  const [step,setStep]             = useState<TermStep>("form");
  const [grounds,setGrounds]       = useState("");
  const [description,setDescription] = useState("");
  const [vacateDate,setVacateDate] = useState("");
  const [notifyTenant,setNotifyTenant] = useState(true);
  const [noticePeriod,setNoticePeriod] = useState(false);
  const [declaration,setDeclaration] = useState(false);

  const canSubmit = grounds!==""&&description.trim().length>=20&&vacateDate!==""&&noticePeriod&&declaration;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className={`px-6 py-4 flex items-center justify-between rounded-t-2xl ${isEarly?"bg-amber-600":"bg-red-600"}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white"/>
            <span className="text-white font-bold text-sm">{isEarly?"Early Termination Notice":"Termination Notice"}</span>
          </div>
          {step!=="submitted"&&<button onClick={onClose} className="text-white/70 hover:text-white"><XCircle className="w-4 h-4"/></button>}
        </div>

        <div className="p-6">
          {step==="submitted"?(
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-600"/></div>
              <p className="font-black text-slate-900 text-lg mb-2">Termination Notice Submitted</p>
              {isEarly&&<div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 mb-3">DARA must review and approve this early termination request before it becomes effective.</div>}
              <p className="text-sm text-slate-500 mb-1">{notifyTenant?<><strong>{tenantName}</strong> has been notified.</>:<>DARA will inform the tenant after review.</>}</p>
              <p className="text-xs text-slate-400 mb-6">Expected vacate: <strong>{new Date(vacateDate).toLocaleDateString()}</strong></p>
              <button onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Close</button>
            </div>
          ):(
            <>
              {isEarly&&(
                <div className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-4 mb-5">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-sm font-bold text-amber-800">Contract Under 2 Years — DARA Review Required</p>
                      <p className="text-xs text-amber-700 mt-1">Standard termination is allowed after <strong>2 years</strong>. Available in <strong>{daysLeft} day{daysLeft!==1?"s":""}</strong> ({twoYears.toLocaleDateString()}). You may file an early notice subject to DARA approval.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-3 mb-5 text-xs text-slate-600 space-y-1">
                <p><span className="font-semibold">Property:</span> {propertyTitle}</p>
                <p><span className="font-semibold">Tenant:</span> {tenantName}</p>
                <p><span className="font-semibold">Contract since:</span> {start.toLocaleDateString()}</p>
                <p><span className="font-semibold">Monthly rent:</span> ETB {monthlyRent.toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Legal Grounds <span className="text-red-500">*</span></label>
                  <select value={grounds} onChange={e=>setGrounds(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white">
                    {TERM_GROUNDS.map(g=><option key={g.value} value={g.value} disabled={g.value===""}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Detailed Description <span className="text-red-500">*</span> <span className="normal-case font-normal text-slate-400">(min. 20 chars)</span></label>
                  <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4}
                    placeholder="Describe the specific circumstances that necessitate termination..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"/>
                  <p className={`text-[11px] mt-1 ${description.trim().length>=20?"text-emerald-600":"text-slate-400"}`}>{description.trim().length} / 20 minimum</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Expected Vacate Date <span className="text-red-500">*</span> <span className="normal-case font-normal text-slate-400">(min. 90 days)</span></label>
                  <input type="date" value={vacateDate} min={minVacate} onChange={e=>setVacateDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/>
                </div>
                <div className="rounded-xl border border-slate-200 px-4 py-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={notifyTenant} onChange={e=>setNotifyTenant(e.target.checked)} className="mt-0.5 rounded accent-red-600"/>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Notify tenant immediately</p>
                      <p className="text-xs text-slate-400 mt-0.5">{tenantName} will receive a notification upon submission. If unchecked, DARA will inform them after review.</p>
                    </div>
                  </label>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={noticePeriod} onChange={e=>setNoticePeriod(e.target.checked)} className="mt-0.5 rounded accent-amber-600"/>
                    <p className="text-xs text-amber-700">I acknowledge that a minimum <strong>90-day notice period</strong> is required and the tenant is entitled to remain until the vacate date.</p>
                  </label>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={declaration} onChange={e=>setDeclaration(e.target.checked)} className="mt-0.5 rounded accent-red-600"/>
                    <p className="text-xs text-red-700">I declare this information is accurate. Filing a false notice is an offence under Proclamation No. 1320/2016.</p>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium">Cancel</button>
                <button onClick={()=>setStep("submitted")} disabled={!canSubmit}
                  className={`flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isEarly?"bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400":"bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400"}`}>
                  <Send className="w-4 h-4"/>{isEarly?"Submit Early Notice":"Submit Termination Notice"}
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
  const [showExtension,   setShowExtension]   = useState(false);
  const [showTermination, setShowTermination] = useState(false);
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

  if (loading) {
    return (
      <>
        <Header title="Agreement Details" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-500">Loading agreement...</p>
        </main>
      </>
    );
  }

  if (!agreement) {
    return (
      <>
        <Header title="Agreement Not Found" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-500">Agreement not found.</p>
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
      date: agreement.signedAt,
      done: !!agreement.signedAt,
      icon: CheckCircle2,
    },
    {
      label: "Verified",
      date: agreement.verifiedAt,
      done: !!agreement.verifiedAt,
      icon: CheckCircle2,
    },
    {
      label: agreement.status === "terminated" ? "Terminated" : "Active",
      date: agreement.verifiedAt || undefined,
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
          onClose={() => setShowExtension(false)}
        />
      )}
      {showTermination && (
        <TerminationModal
          tenantName={agreement.tenantName}
          propertyTitle={agreement.propertyTitle}
          startDate={agreement.startDate}
          monthlyRent={agreement.monthlyRent}
          onClose={() => setShowTermination(false)}
        />
      )}
        <Header title={t("agreements", "agreementDetails")} />
      <main className="flex-1 p-6 overflow-y-auto">
        <Link
          href="/dashboard/agreements"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agreements
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-slate-400 font-mono mb-1">
                    Agreement #{agreement.id.toUpperCase()}
                  </p>
                  <h2 className="text-xl font-bold text-slate-900">
                    {agreement.propertyTitle}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
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
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <step.icon className="w-4 h-4" />
                      </div>
                      <p
                        className={`text-xs mt-1 ${step.done ? "text-slate-700 font-medium" : "text-slate-400"}`}
                      >
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-[10px] text-slate-400">
                          {formatDate(step.date)}
                        </p>
                      )}
                    </div>
                    {i < statusTimeline.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 ${
                          statusTimeline[i + 1].done
                            ? "bg-emerald-300"
                            : "bg-slate-200"
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
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Agreement Terms
              </h3>
              <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Monthly Rent</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(agreement.monthlyRent)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Advance Payment</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(agreement.advancePayment)}
                      <span className="text-xs text-slate-400 ml-1">
                        ({Math.round(agreement.advancePayment / agreement.monthlyRent)} months)
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(agreement.startDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">End Date</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(agreement.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              {agreement.utilities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">
                    Included Utilities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {agreement.utilities.map((u) => (
                      <span
                        key={u}
                        className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs"
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
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Landlord
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {agreement.landlordName}
                  </p>
                  <p className="text-xs text-slate-500">Property Owner</p>
                </div>
              </div>
            </div>

            {/* Tenant */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Tenant
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {agreement.tenantName}
                  </p>
                  <p className="text-xs text-slate-500">Registered Tenant</p>
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
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Property
              </h3>
              <Link
                href={`/dashboard/properties/${agreement.propertyId}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors">
                    {agreement.propertyTitle}
                  </p>
                  <p className="text-xs text-slate-500">
                    {agreement.propertyAddress}
                  </p>
                </div>
              </Link>
            </div>

            {/* Landlord counter-sign when tenant signed first */}
            {agreement.status === "draft" &&
              role === "landlord" &&
              agreement.tenantSignedAt && (
              <div className="bg-white rounded-xl border border-indigo-200 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Counter-Sign Agreement
                </h3>
                <p className="text-xs text-slate-500">
                  The tenant has signed this contract. Review the terms and counter-sign to submit for authority verification.
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
                      await apiLandlordSignAgreement(token, agreement.id);
                      await reloadAgreement();
                    } catch (err) {
                      setSignError(
                        err instanceof Error ? err.message : "Counter-sign failed",
                      );
                    } finally {
                      setSigning(false);
                    }
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                >
                  {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Counter-Sign Agreement
                </button>
              </div>
            )}

            {/* Tenant sign when landlord initiated */}
            {agreement.status === "pending_tenant_signature" && role === "tenant" && (
              <div className="bg-white rounded-xl border border-emerald-200 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Sign Agreement
                </h3>
                <p className="text-xs text-slate-500">
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
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2"
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

            {/* Tenant & Landlord: Extension / Termination */}
            {agreement.status === "active" && (role === "tenant" || role === "landlord") && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {t("common", "actions")}
                </h3>
                <button
                  onClick={() => setShowExtension(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-700 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Request Extension
                </button>
                <button
                  onClick={() => setShowTermination(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" /> Request Termination
                </button>
              </div>
            )}

            {/* Authorities only: Approve / Reject */}
            {(agreement.status === "pending_verification" ||
              agreement.status === "pending_dara_verification") &&
              role === "dara_agent" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
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
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
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
                  <span className="text-xs text-slate-600">
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
                  <span className="text-xs text-slate-600">
                    Minimum 2-year term
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {agreement.signedAt ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-xs text-slate-600">
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
