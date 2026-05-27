"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Search, UserCheck, FileSignature, CheckCircle2,
  Send, AlertCircle, Phone, User, Building2, Calendar,
  ChevronRight, Loader2, Info, Pen, Eraser, Download,
  ShieldCheck, LockKeyhole,
} from "lucide-react";
import { Header } from "@/components/dashboard/header";
import { useAuth } from "@/context/auth-context";
import { useRentalFlow } from "@/context/rental-flow-context";
import { useLoading } from "@/context/loading-context";
import { useLanguage } from "@/context/language-context";
import { properties } from "@/lib/dummy-data";
import { formatCurrency } from "@/lib/utils";
import { lookupTenantByFaydaNumber, DEMO_FAYDA_HINTS, type TenantLookupResult } from "@/lib/fayda-lookup";
import { ViewTenantProfileLink } from "@/components/dashboard/tenant-public-profile";
import { getAccessToken } from "@/lib/api";
import { ContractBody } from "@/components/dashboard/contract-body";
import { exportCanvasSignaturePng } from "@/lib/procedural-signature";

/* ------------------------------------------------------------------ */
/*  Canvas e-signature pad (same as tenant contract page)             */
/* ------------------------------------------------------------------ */
function SignaturePad({
  canvasRef,
  onSigned,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onSigned: (signed: boolean) => void;
}) {
  const drawing = useRef(false);
  const hasStrokes = useRef(false);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e3a5f";
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasStrokes.current = true;
    onSigned(true);
  };

  const endDraw = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    onSigned(false);
  };

  const exportSig = () => {
    const canvas = canvasRef.current!;
    const off = document.createElement("canvas");
    off.width = canvas.width; off.height = canvas.height;
    const ctx = off.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, off.width, off.height);
    ctx.drawImage(canvas, 0, 0);
    const a = document.createElement("a");
    a.download = "esignature.png"; a.href = off.toDataURL("image/png"); a.click();
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={700}
          height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="w-48 h-px bg-slate-300" />
          <p className="text-center text-[10px] text-slate-400 mt-0.5 tracking-wide">SIGN HERE</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors">
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
        <button type="button" onClick={exportSig} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary-600 transition-colors">
          <Download className="w-3.5 h-3.5" /> Export as PNG
        </button>
      </div>
    </div>
  );
}

type Step = "lookup" | "confirm_tenant" | "sign_contract" | "done";

const STEP_ORDER: Step[] = ["lookup", "confirm_tenant", "sign_contract", "done"];

function StepDot({ label, step, current }: { label: string; step: Step; current: Step }) {
  const idx = STEP_ORDER.indexOf(step);
  const cur = STEP_ORDER.indexOf(current);
  const done = idx < cur;
  const active = idx === cur;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
        done  ? "bg-emerald-500 border-emerald-500 text-white" :
        active ? "bg-primary-600 border-primary-600 text-white" :
                 "bg-white border-slate-300 text-slate-400"
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
      </div>
      <span className={`text-xs font-medium ${active ? "text-primary-600" : done ? "text-emerald-600" : "text-slate-400"}`}>
        {label}
      </span>
    </div>
  );
}

export default function RentToTenantPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { landlordInitiateContract } = useRentalFlow();
  const { withLoading } = useLoading();
  const { locale, t } = useLanguage();
  const ct = (key: string) => t("contract", key);

  const property = properties.find((p) => p.id === params.id);

  const [step, setStep] = useState<Step>("lookup");
  const [faydaInput, setFaydaInput] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [foundTenant, setFoundTenant] = useState<TenantLookupResult | null>(null);
  const [landlordSigned, setLandlordSigned] = useState(false);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [createdAgreementId, setCreatedAgreementId] = useState("");

  if (!property) {
    return (
      <>
        <Header title="Rent to Specific Tenant" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-500">Property not found.</p>
        </main>
      </>
    );
  }

  const isOwner = user?.id === property.landlordId;
  if (!isOwner) {
    return (
      <>
        <Header title="Rent to Specific Tenant" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-slate-500">You do not own this property.</p>
        </main>
      </>
    );
  }

  /* ── Step handlers ─────────────────────────────────────── */

  const handleLookup = async () => {
    const clean = faydaInput.replace(/\s/g, "");
    if (clean.length !== 16 || !/^\d+$/.test(clean)) {
      setLookupError(t("contract", "invalidFan"));
      return;
    }
    setLookupError("");
    setLookupLoading(true);
    try {
      const token = getAccessToken();
      const result = await lookupTenantByFaydaNumber(clean, token);
      if (!result) {
        setLookupError(t("contract", "fanNotFound"));
        return;
      }
      setFoundTenant(result);
      setStep("confirm_tenant");
    } catch (e) {
      setLookupError(
        e instanceof Error && e.message === "invalid_fayda_number"
          ? t("contract", "invalidFan")
          : t("contract", "fanNotFound"),
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const handleLandlordSign = async () => {
    if (!foundTenant || !declarationChecked || !hasSig) return;
    await withLoading(async () => {
      await new Promise((r) => setTimeout(r, 900));
    }, "Applying your e-signature…");
    setLandlordSigned(true);
  };

  const handleSendToTenant = async () => {
    if (!foundTenant || !user) return;
    await withLoading(async () => {
      await new Promise((r) => setTimeout(r, 1000));
      const landlordSignatureDataUrl = exportCanvasSignaturePng(canvasRef.current);
      const id = landlordInitiateContract({
        propertyId: property.id,
        propertyTitle: property.title,
        propertyAddress: `${property.address}, ${property.subCity}`,
        landlordId: user.id,
        landlordName: `${user.firstName} ${user.lastName}`,
        tenantId: foundTenant.userId ?? `fayda_${foundTenant.faydaNumber}`,
        tenantName: foundTenant.fullName,
        tenantFaydaNumber: foundTenant.faydaNumber,
        monthlyRent: property.monthlyRent,
        advanceAmount: property.monthlyRent * 2,
        initiatedByLandlord: true,
        ...(landlordSignatureDataUrl ? { landlordSignatureDataUrl } : {}),
      });
      setCreatedAgreementId(id);
    }, "Sending contract to tenant…");
    setStep("done");
  };

  /* ── Start date / end date helpers ──────────────────────── */
  const today = new Date();
  const startStr = today.toISOString().split("T")[0];
  const end = new Date(today);
  end.setFullYear(end.getFullYear() + 2);
  const endStr = end.toISOString().split("T")[0];

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
      <Header title="Rent to Specific Tenant" />
      <main className="flex-1 p-6 overflow-y-auto">
        <Link
          href={`/dashboard/properties/${property.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> {ct("backToProperty")}
        </Link>

        {/* Progress stepper */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <StepDot label={ct("stepFind")} step="lookup" current={step} />
          <div className="flex-1 max-w-[60px] h-px bg-slate-200" />
          <StepDot label={ct("stepConfirm")} step="confirm_tenant" current={step} />
          <div className="flex-1 max-w-[60px] h-px bg-slate-200" />
          <StepDot label={ct("stepSign")} step="sign_contract" current={step} />
          <div className="flex-1 max-w-[60px] h-px bg-slate-200" />
          <StepDot label={ct("stepDone")} step="done" current={step} />
        </div>

        <div className="max-w-xl mx-auto space-y-6">

          {/* Property summary card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{property.title}</p>
              <p className="text-sm text-slate-500">{property.address}, {property.subCity}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-primary-700">{formatCurrency(property.monthlyRent)}</p>
              <p className="text-xs text-slate-400">{ct("perMonth")}</p>
            </div>
          </div>

          {/* ── STEP 1: Fayda Lookup ── */}
          {step === "lookup" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">{ct("findTitle")}</h2>
                <p className="text-sm text-slate-500">{ct("findDesc")}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {ct("fanLabel")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={faydaInput}
                    onChange={(e) => { setFaydaInput(e.target.value); setLookupError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    maxLength={16}
                    placeholder="1234567890123456"
                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-mono tracking-widest outline-none focus:ring-2 transition-all ${
                      lookupError
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-300 focus:border-primary-500 focus:ring-primary-500/20"
                    }`}
                  />
                  <button
                    onClick={handleLookup}
                    disabled={lookupLoading}
                    className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-60 transition-colors"
                  >
                    {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {lookupLoading ? ct("searching") : ct("lookup")}
                  </button>
                </div>
                {lookupError && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />{lookupError}
                  </p>
                )}
              </div>

              {/* Demo hints */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Demo Fayda Numbers
                </p>
                <div className="space-y-1">
                  {DEMO_FAYDA_HINTS.map((h) => (
                    <button
                      key={h.fan}
                      onClick={() => setFaydaInput(h.fan)}
                      className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-2 w-full text-left"
                    >
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <span className="font-mono">{h.fan}</span>
                      <span className="text-amber-600">→ {h.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Confirm Tenant ── */}
          {step === "confirm_tenant" && foundTenant && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">{ct("tenantFound")}</h2>
                <p className="text-sm text-slate-500">{ct("verifyCorrect")}</p>
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6 text-emerald-600" />
                </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{tenant.fullName}</p>
                    <p className="text-sm text-slate-500 font-mono">FAN: {foundTenant.faydaNumber}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm text-slate-500">{foundTenant.maskedPhone}</p>
                    <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded font-medium">
                      {locale === "am" ? "ፋይዳ ተረጋግጧል" : "Fayda Verified"}
                    </span>
                  </div>
                  <ViewTenantProfileLink
                    tenantId={foundTenant.userId}
                    className="mt-2"
                    label={t("explore", "viewProfile")}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep("lookup"); setFoundTenant(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  {ct("searchAgain")}
                </button>
                <button
                  onClick={() => setStep("sign_contract")}
                  className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <FileSignature className="w-4 h-4" /> {ct("reviewSignBtn")}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Contract Preview + Landlord Sign + Send ── */}
          {step === "sign_contract" && foundTenant && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  {landlordSigned ? ct("contractSignedReady") : ct("reviewSign")}
                </h2>
                <p className="text-sm text-slate-500">
                  {landlordSigned ? ct("signedReadyDesc") : ct("reviewSignDesc")}
                </p>
              </div>

              {/* Contract preview — full bilingual contract */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {/* Contract header strip */}
                <div className="bg-gradient-to-r from-primary-700 to-indigo-700 px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <FileSignature className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">የመኖሪያ ቤት ኪራይ ሞዴል ውል</p>
                    <p className="text-primary-200 text-xs">
                      {locale === "am" ? "አዲስ አበባ ኪራይ ቁጥጥር ስርዓት" : "Addis Ababa Rental Control System · Proclamation 1320/2016"}
                    </p>
                  </div>
                  <span className="ml-auto text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
                    {locale === "am" ? "ኦፊሴላዊ ቅጽ" : "Official Template"}
                  </span>
                </div>

                {/* Scrollable contract body */}
                <div className="px-6 py-5 max-h-[420px] overflow-y-auto bg-white" style={{ scrollbarWidth: "thin" }}>
                  <ContractBody
                    locale={locale}
                    today={startStr}
                    landlordName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
                    landlordAddress={`${property.subCity} Sub-City, Woreda ${property.woreda}, Addis Ababa`}
                    tenantName={foundTenant.fullName}
                    tenantAddress="Addis Ababa"
                    propertyAddress={`${property.address}, ${property.subCity} Sub-City, Woreda ${property.woreda}`}
                    propertyType={property.propertyType}
                    monthlyRent={property.monthlyRent.toLocaleString()}
                    advanceMonths={2}
                    advanceAmount={(property.monthlyRent * 2).toLocaleString()}
                    leaseDuration={2}
                    paymentDeadlineDay={5}
                  />
                </div>

                {/* Signature row at bottom of doc */}
                <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 grid sm:grid-cols-2 gap-4 text-sm font-[Georgia,serif] text-slate-700">
                  <div>
                    <p className="font-bold mb-2">አከራይ{locale !== "am" && " (Landlord)"}</p>
                    <p>ስም፡ <span className="border-b border-slate-400 inline-block w-36">{user?.firstName} {user?.lastName}</span></p>
                    <p className="mt-1.5">ፊርማ፡ <span className={`border-b inline-block w-32 text-xs italic ${landlordSigned ? "border-emerald-400 text-emerald-600 font-semibold" : "border-slate-300 text-slate-400"}`}>
                      {landlordSigned
                        ? (locale === "am" ? "✓ ተፈርሟል" : "✓ Signed")
                        : (locale === "am" ? "ሲጠበቅ..." : "Pending...")}
                    </span></p>
                    <p className="mt-1.5">ቀን፡ <span className="border-b border-slate-400 inline-block w-24">{startStr}</span></p>
                  </div>
                  <div>
                    <p className="font-bold mb-2">ተከራይ{locale !== "am" && " (Tenant)"}</p>
                    <p>ስም፡ <span className="border-b border-slate-400 inline-block w-36">{foundTenant.fullName}</span></p>
                    <p className="mt-1.5">ፊርማ፡ <span className="border-b border-slate-300 inline-block w-32 text-slate-400 italic text-xs">
                      {locale === "am" ? "ተከራዩ ሲቀበሉ..." : "Awaiting tenant..."}
                    </span></p>
                    <p className="mt-1.5">ቀን፡ <span className="border-b border-slate-300 inline-block w-24">&nbsp;</span></p>
                  </div>
                </div>
              </div>

              {/* Signing section — shown before signing */}
              {!landlordSigned && (
                <div className="space-y-4">
                  {/* Signature pad */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                        <Pen className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{ct("eSignTitle")}</h3>
                        <p className="text-xs text-slate-500">{ct("eSignDraw")}</p>
                      </div>
                    </div>

                    <SignaturePad canvasRef={canvasRef} onSigned={setHasSig} />

                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
                      <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                      <span>{ct("eSignLegal")}</span>
                    </div>
                  </div>

                  {/* Declaration checkbox */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={declarationChecked}
                        onChange={(e) => setDeclarationChecked(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 leading-relaxed group-hover:text-slate-900">
                        {ct("declarationLandlord")}
                      </span>
                    </label>

                    {(!hasSig || !declarationChecked) && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2 text-xs text-amber-800">
                        <LockKeyhole className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          {!hasSig && !declarationChecked
                            ? ct("lockBoth")
                            : !hasSig
                              ? ct("lockSig")
                              : ct("lockCheck")}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleLandlordSign}
                      disabled={!declarationChecked || !hasSig}
                      className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                        declarationChecked && hasSig
                          ? "bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <FileSignature className="w-5 h-5" /> {ct("signButton")}
                    </button>
                  </div>
                </div>
              )}

              {/* Send section — shown after signing */}
              {landlordSigned && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-700 font-medium">{ct("sigApplied")}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700">{ct("tenantNotifInfo")}</p>
                  </div>
                  <button
                    onClick={handleSendToTenant}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-600/20"
                  >
                    <Send className="w-5 h-5" /> {ct("sendToTenant")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Done ── */}
          {step === "done" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{ct("contractSentTitle")}</h2>
                <p className="text-sm text-slate-500">
                  {ct("contractSentDescPre")} <strong>{foundTenant?.fullName}</strong>.{" "}
                  {ct("contractSentDescPost")}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{ct("whatsNext")}</p>
                <Step label={ct("next1")} icon={<User className="w-3.5 h-3.5" />} />
                <Step label={ct("next2")} icon={<FileSignature className="w-3.5 h-3.5" />} />
                <Step label={ct("next3")} icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
                <Step label={ct("next4")} icon={<Calendar className="w-3.5 h-3.5" />} />
              </div>
              <div className="flex gap-3 pt-2">
                <Link
                  href="/dashboard/agreements"
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm text-center transition-colors"
                >
                  {ct("viewAgreements")}
                </Link>
                <Link
                  href="/dashboard/properties"
                  className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm text-center transition-colors"
                >
                  {ct("backToProperties")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Step({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600">
      <span className="text-primary-500">{icon}</span>
      {label}
    </div>
  );
}
