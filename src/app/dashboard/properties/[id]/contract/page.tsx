"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  Download,
  Eraser,
  FileSignature,
  Loader2,
  LockKeyhole,
  Pen,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLoading } from "@/context/loading-context";
import { useLanguage } from "@/context/language-context";
import { apiGetProperty, apiTenantRequestAgreement, getAccessToken } from "@/lib/api";
import type { Property } from "@/lib/types";
import { ContractBody } from "@/components/dashboard/contract-body";

/* ------------------------------------------------------------------ */
/*  Canvas e-signature pad                                             */
/* ------------------------------------------------------------------ */
function SignaturePad({
  canvasRef,
  onSigned,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onSigned: (signed: boolean) => void;
}) {
  const drawing = useRef(false);
  const hasStrokes = useRef(false);

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
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

  const endDraw = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    onSigned(false);
  };

  const exportSignature = () => {
    const canvas = canvasRef.current!;
    // Draw onto a white-background copy so the PNG isn't transparent
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement("a");
    link.download = "esignature.png";
    link.href = offscreen.toDataURL("image/png");
    link.click();
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
          <p className="text-center text-[10px] text-slate-400 mt-0.5 tracking-wide">
            SIGN HERE
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" />
          Clear
        </button>
        <button
          type="button"
          onClick={exportSignature}
          disabled={!hasStrokes.current}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export as PNG
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */
export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const { withLoading } = useLoading();
  const { locale, t } = useLanguage();
  const ct = (key: string) => t("contract", key);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [agreed, setAgreed] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agreementId, setAgreementId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasReadContract, setHasReadContract] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const contractScrollRef = useRef<HTMLDivElement>(null);

  const handleContractScroll = useCallback(() => {
    const el = contractScrollRef.current;
    if (!el) return;
    const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    setScrollPct(Math.min(pct, 100));
    if (pct >= 90) setHasReadContract(true);
  }, []);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const tenantName = user
    ? [user.firstName, user.fatherName, user.grandfatherName]
        .filter(Boolean)
        .join(" ")
    : "—";

  const tenantAddress = user?.address ?? "Addis Ababa";

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !id) return;
    setLoading(true);
    setLoadError(null);
    apiGetProperty(token, id)
      .then(setProperty)
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : "Property not found"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (submitted && agreementId) {
      const id = window.setTimeout(
        () => router.replace(`/dashboard/agreements/${agreementId}`),
        2200
      );
      return () => window.clearTimeout(id);
    }
  }, [submitted, agreementId, router]);

  if (loading) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading property…</p>
        </div>
      </main>
    );
  }

  if (loadError || !property) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">{loadError ?? "Property not found."}</p>
          <Link
            href={`/dashboard/properties/${id}`}
            className="mt-3 inline-block text-primary-600 text-sm hover:underline"
          >
            Back to Property
          </Link>
        </div>
      </main>
    );
  }

  const canSign = property.status === "available";

  const monthlyRent = property.monthlyRent.toLocaleString();
  const advanceMonths = 2;
  const advanceAmount = (property.monthlyRent * advanceMonths).toLocaleString();
  const leaseDuration = 2;
  const paymentDeadlineDay = 5;

  const handleSubmit = async () => {
    if (!agreed || !hasSig || !user) return;
    const token = getAccessToken();
    if (!token) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await withLoading(async () => {
        const agreement = await apiTenantRequestAgreement(token, {
          propertyId: property.id,
        });
        setAgreementId(agreement.id);
      }, "Submitting your contract…");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit contract",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {locale === "am" ? "ውሉ ተፈርሟል!" : "Contract Signed!"}
          </h2>
          <p className="text-slate-600">
            {locale === "am"
              ? "ፊርማዎ ተመዝግቧል። አከራዩ ውሉን ለመፈረም ተነጋርቷቸዋል።"
              : "Your e-signature has been recorded. The landlord has been notified to review and counter-sign the agreement."}
          </p>
          <p className="text-xs text-slate-400 mt-4">
            {locale === "am" ? "የስምምነት መከታተያ እየተከፈተ ነው…" : "Opening your agreement tracker…"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          href={`/dashboard/properties/${property.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {ct("backToProperty")}
        </Link>

        {/* Page title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3">
            <FileSignature className="w-4 h-4" />
            {ct("officialTemplate")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {property.title}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {ct("readCarefully")}
          </p>
        </div>

        {!canSign && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
            <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              {ct("notAccepting")} <strong>{property.status}</strong> {ct("notAcceptingPost")}
            </p>
          </div>
        )}

        {/* Contract viewer */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          {/* Contract header strip */}
          <div className="bg-gradient-to-r from-primary-700 to-indigo-700 px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                የመኖሪያ ቤት ኪራይ ሞዴል ውል
              </p>
              <p className="text-primary-200 text-xs">
                Residential Lease Agreement · Proclamation 1320/2016
              </p>
            </div>
            <span className="ml-auto text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
              {locale === "am" ? "ኦፊሴላዊ ቅጽ" : "Official Template"}
            </span>
          </div>

          {/* Read progress bar */}
          <div className="px-6 pt-3 pb-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {locale === "am" ? "የንባብ ሂደት" : "Reading progress"}
              </span>
              <span className={`text-xs font-semibold ${hasReadContract ? "text-emerald-600" : "text-slate-400"}`}>
                {hasReadContract
                  ? (locale === "am" ? "✓ ተነቢቧል" : "✓ Read")
                  : `${scrollPct}%`}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${hasReadContract ? "bg-emerald-500" : "bg-primary-500"}`}
                style={{ width: `${scrollPct}%` }}
              />
            </div>
            {!hasReadContract && (
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <ChevronDown className="w-3 h-3 animate-bounce" />
                {locale === "am"
                  ? "ወደ ታች ሸብልሉ — ሙሉ ውሉን ካነበቡ በኋላ ፊርማ ክፍሉ ይከፈታል"
                  : "Scroll to the end of the contract to unlock the signing section"}
              </p>
            )}
          </div>

          {/* Scrollable body */}
          <div
            ref={contractScrollRef}
            onScroll={handleContractScroll}
            className="px-8 py-6 max-h-[520px] overflow-y-auto scroll-smooth"
            style={{ scrollbarWidth: "thin" }}
          >
            <ContractBody
              locale={locale}
              today={today}
              landlordName={property.landlordName}
              landlordAddress={`${property.subCity} Sub-City, Woreda ${property.woreda}, Addis Ababa`}
              tenantName={tenantName}
              tenantAddress={tenantAddress}
              propertyAddress={`${property.address}, ${property.subCity} Sub-City, Woreda ${property.woreda}`}
              propertyType={property.propertyType}
              monthlyRent={monthlyRent}
              advanceMonths={advanceMonths}
              advanceAmount={advanceAmount}
              leaseDuration={leaseDuration}
              paymentDeadlineDay={paymentDeadlineDay}
            />
          </div>

          {/* Signature rows at bottom of doc */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-8 py-5 grid sm:grid-cols-2 gap-6 text-sm font-[Georgia,serif] text-slate-700">
            <div>
              <p className="font-bold mb-3">አከራይ{locale !== "am" && " (Landlord)"}</p>
              <p>ስም፡ <span className="border-b border-slate-400 inline-block w-40">{property.landlordName}</span></p>
              <p className="mt-2">ፊርማ፡ <span className="border-b border-slate-300 inline-block w-36 text-slate-400 italic text-xs">
                {locale === "am" ? "ቅድሚያ ፊርማ ሲጠበቅ" : "Pending counter-sign"}
              </span></p>
              <p className="mt-2">ቀን፡ <span className="border-b border-slate-300 inline-block w-28">&nbsp;</span></p>
            </div>
            <div>
              <p className="font-bold mb-3">ተከራይ{locale !== "am" && " (Tenant)"}</p>
              <p>ስም፡ <span className="border-b border-slate-400 inline-block w-40">{tenantName}</span></p>
              <p className="mt-2">ፊርማ፡ <span className="border-b border-slate-300 inline-block w-36 text-slate-400 italic text-xs">
                {locale === "am" ? "ከዚህ በታች ፊርማ ይመልከቱ" : "See e-signature below"}
              </span></p>
              <p className="mt-2">ቀን፡ <span className="border-b border-slate-400 inline-block w-28">{today}</span></p>
            </div>
          </div>
        </div>

        {/* Read gate — signing section locked until contract is fully scrolled */}
        {!hasReadContract ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center">
              <LockKeyhole className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">
              {locale === "am" ? "ፊርማ ክፍሉ ተዘግቷል" : "Signing section locked"}
            </p>
            <p className="text-sm text-slate-500 max-w-sm">
              {locale === "am"
                ? "ከዚህ በላይ ያለውን ሙሉ ውል አንብበው ወደ ታች ሸብልሉ። ሲጨርሱ ፊርማ ክፍሉ ይከፈታል።"
                : "Scroll through the full contract above to unlock the signing section. You must read it before you can sign."}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-40 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${scrollPct}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-8">{scrollPct}%</span>
            </div>
            <Link
              href={`/dashboard/properties/${property.id}`}
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" /> {ct("cancel")}
            </Link>
          </div>
        ) : (
          <>
            {/* E-sign section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              {/* Unlocked badge */}
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold mb-5 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg w-fit">
                <CheckCircle2 className="w-4 h-4" />
                {locale === "am" ? "ውሉን አንብበዋል — ፊርማ ክፍሉ ተከፈተ" : "Contract read — signing section unlocked"}
              </div>

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
                <span>
                  {ct("eSignLegal").replace("{name}", tenantName)}{" "}
                  {locale !== "am" && <>(<strong>{tenantName}</strong>)</>}
                </span>
              </div>
            </div>

            {/* Agreement checkbox + submit */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <label className="flex items-start gap-3 cursor-pointer mb-6 group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-sm text-slate-700 leading-relaxed group-hover:text-slate-900">
                  {ct("declarationTenant")}
                </span>
              </label>

              {(!agreed || !hasSig) && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2 text-xs text-amber-800">
                  <LockKeyhole className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {!hasSig && !agreed
                      ? ct("lockBoth")
                      : !hasSig
                        ? ct("lockSig")
                        : ct("lockCheck")}
                  </span>
                </div>
              )}

              {submitError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/dashboard/properties/${property.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {ct("cancel")}
                </Link>
                <button
                  onClick={handleSubmit}
                  disabled={!agreed || !hasSig || !canSign || submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-primary-600/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {ct("submitting")}
                    </>
                  ) : (
                    <>
                      <FileSignature className="w-4 h-4" />
                      {ct("signSubmit")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
