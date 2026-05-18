"use client";

import { Header } from "@/components/dashboard/header";
import { PricingPanel } from "@/components/dashboard/pricing-panel";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useAlert } from "@/context/alert-context";
import { useLoading } from "@/context/loading-context";
import { useProperties } from "@/context/properties-context";
import { formatErrorForUser } from "@/lib/api-error";
import { SUB_CITIES, PROPERTY_TYPES, AMENITIES } from "@/lib/constants";
import { computeListingRange, classifyRent } from "@/lib/addis-rent-benchmarks";
import type { Property, HomeCondition } from "@/lib/types";
import { ArrowLeft, Upload, Plus, ImageIcon, Lock, Landmark, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MIN_PHOTOS = 3;
const MIN_OWNERSHIP = 1;
/** Matches backend CreatePropertyDto @Length(20, 6000) */
const MIN_DESCRIPTION = 20;

type PropertyType = Property["propertyType"];

const HOME_CONDITION_OPTIONS: { value: HomeCondition; labelKey: string }[] = [
  { value: "new_build", labelKey: "homeConditionNew" },
  { value: "excellent", labelKey: "homeConditionExcellent" },
  { value: "good", labelKey: "homeConditionGood" },
  { value: "fair", labelKey: "homeConditionFair" },
  { value: "needs_renovation", labelKey: "homeConditionNeeds" },
];

type RagSuggestResponse = {
  suggestedMin: number;
  suggestedMax: number;
  suggestedMid: number;
  summary: string;
  source: string;
  retrievedChunkIds: string[];
  conditionMultiplier: number;
  amenityBump: number;
};

export default function RegisterPropertyPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();
  const { withLoading } = useLoading();
  const { showError } = useAlert();
  const { addProperty, userProperties, refreshProperties } = useProperties();
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [monthlyRent, setMonthlyRent] = useState<number>(0);
  const [address, setAddress] = useState("");
  const [subCity, setSubCity] = useState("");
  const [woreda, setWoreda] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [homeCondition, setHomeCondition] = useState<HomeCondition>("good");
  const [ragSuggestion, setRagSuggestion] = useState<RagSuggestResponse | null>(
    null
  );
  const [ragLoading, setRagLoading] = useState(false);
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null]);
  const [photoPreviews, setPhotoPreviews] = useState<(string | null)[]>([null, null, null]);
  const [ownershipFiles, setOwnershipFiles] = useState<File[]>([]);
  const [acknowledgeAtypicalRent, setAcknowledgeAtypicalRent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const areaNum = parseFloat(area.replace(/,/g, "")) || 0;

  /* ── Government policy-driven pricing range ── */
  const listingRange = useMemo(
    () =>
      subCity && propertyType && areaNum > 0
        ? computeListingRange(subCity, propertyType, areaNum)
        : null,
    [subCity, propertyType, areaNum]
  );

  /* When the range becomes available, default the rent to the suggested mid-point */
  useEffect(() => {
    if (listingRange && monthlyRent === 0) {
      setMonthlyRent(listingRange.mid);
    }
    if (listingRange) {
      // Clamp to band on range change
      if (monthlyRent < listingRange.floor) setMonthlyRent(listingRange.floor);
      if (monthlyRent > listingRange.ceiling) setMonthlyRent(listingRange.ceiling);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingRange?.floor, listingRange?.ceiling]);

  const rentClassification = useMemo(
    () =>
      listingRange && monthlyRent > 0
        ? classifyRent(monthlyRent, listingRange)
        : null,
    [listingRange, monthlyRent]
  );

  const isRentBlocked =
    rentClassification === "below_floor" || rentClassification === "above_ceiling";
  const isRentWarned =
    rentClassification === "below_band" || rentClassification === "above_band";

  const setPhotoAt = useCallback((index: number, file: File | null) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  }, []);

  useEffect(() => {
    const urls = photos.map((f) => (f ? URL.createObjectURL(f) : null));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [photos]);

  const photoCount = photos.filter(Boolean).length;

  useEffect(() => {
    if (rentClassification === "within_band") setAcknowledgeAtypicalRent(false);
  }, [rentClassification]);

  /* RAG rent suggestion — retrieval over local knowledge + optional OpenAI summary */
  useEffect(() => {
    if (!listingRange || !subCity || !propertyType || areaNum <= 0) {
      setRagSuggestion(null);
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setRagLoading(true);
      try {
        const res = await fetch("/api/rag/suggest-rent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            subCity,
            propertyType,
            areaSqm: areaNum,
            homeCondition,
            bedrooms: parseInt(bedrooms || "0", 10) || undefined,
            bathrooms: parseInt(bathrooms || "0", 10) || undefined,
            amenities: selectedAmenities,
            description: description.trim(),
          }),
        });
        if (!res.ok) {
          setRagSuggestion(null);
          return;
        }
        const data = (await res.json()) as RagSuggestResponse;
        setRagSuggestion(data);
      } catch {
        if (!ctrl.signal.aborted) setRagSuggestion(null);
      } finally {
        if (!ctrl.signal.aborted) setRagLoading(false);
      }
    }, 500);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [
    listingRange,
    subCity,
    propertyType,
    areaNum,
    homeCondition,
    bedrooms,
    bathrooms,
    selectedAmenities,
    description,
  ]);

  const submitDisabled =
    !title.trim() ||
    !propertyType ||
    !subCity ||
    !address.trim() ||
    !woreda.trim() ||
    areaNum <= 0 ||
    monthlyRent <= 0 ||
    !listingRange ||
    photoCount < MIN_PHOTOS ||
    ownershipFiles.length < MIN_OWNERSHIP ||
    isRentBlocked ||
    (isRentWarned && !acknowledgeAtypicalRent);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const onPickPhoto = (index: number, fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      setPhotoAt(index, null);
      return;
    }
    if (file.size > MAX_FILE_BYTES) return;
    if (!file.type.startsWith("image/")) return;
    setPhotoAt(index, file);
  };

  const onPickOwnership = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next: File[] = [...ownershipFiles];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (f.size > MAX_FILE_BYTES) continue;
      next.push(f);
    }
    setOwnershipFiles(next);
  };

  const removeOwnership = (index: number) => {
    setOwnershipFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (photoCount < MIN_PHOTOS) {
      setSubmitError(t("properties", "minPhotosError"));
      return;
    }
    if (ownershipFiles.length < MIN_OWNERSHIP) {
      setSubmitError(t("properties", "minOwnershipError"));
      return;
    }
    if (!listingRange) {
      setSubmitError(t("properties", "rentHardBlock"));
      return;
    }
    if (isRentBlocked) {
      setSubmitError(t("properties", "rentHardBlock"));
      return;
    }
    if (isRentWarned && !acknowledgeAtypicalRent) {
      setSubmitError(t("properties", "acknowledgeNonTypicalRent"));
      return;
    }
    if (description.trim().length < MIN_DESCRIPTION) {
      setSubmitError(t("properties", "descriptionMinLength"));
      return;
    }
    if (!user || !propertyType) return;

    try {
      await withLoading(async () => {
        await addProperty({
          title: title.trim(),
          propertyType: propertyType as Property["propertyType"],
          address: address.trim(),
          subCity,
          woreda: woreda.trim(),
          bedrooms: parseInt(bedrooms || "0", 10),
          bathrooms: parseInt(bathrooms || "0", 10),
          area: areaNum,
          amenities: selectedAmenities,
          monthlyRent,
          landlordId: user.id,
          landlordName: `${user.firstName} ${user.lastName}`.trim() || "Landlord",
          description: description.trim(),
          homeCondition,
          images: photoPreviews.filter((p): p is string => Boolean(p)),
        });
      }, "Submitting for verification…");

      await refreshProperties();
      router.push("/dashboard/properties");
    } catch (err) {
      const translate = (ns: string, key: string) =>
        t(ns as "properties" | "common" | "auth", key);
      const formatted = formatErrorForUser(err, translate, {
        namespace: "properties",
        titleKey: "submitFailed",
      });
      setSubmitError(formatted.message);
      showError(err, translate, {
        titleKey: "submitFailed",
        namespace: "properties",
      });
    }
  };

  const photoLabels = [
    t("properties", "photoDirection1"),
    t("properties", "photoDirection2"),
    t("properties", "photoDirection3"),
  ];

  const isFirstProperty =
    user?.role === "landlord" &&
    !userProperties.some((p) => p.landlordId === user.id);

  return (
    <>
      <Header title={t("properties", "registerProperty")} />
      <main className="flex-1 p-6 overflow-y-auto">
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("properties", "backToProperties")}
        </Link>

        <div className="max-w-3xl">
          {isFirstProperty && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">
                {t("properties", "landlordOnboardingTitle")}
              </p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {t("properties", "landlordOnboardingDesc")}
              </p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">{t("properties", "registerNew")}</h2>
            <p className="text-sm text-slate-500 mb-2">{t("properties", "registerDesc")}</p>
            <p className="text-xs text-slate-500 leading-relaxed border-l-2 border-primary-200 pl-3 mb-6">
              {t("properties", "registerBenchmarkFootnote")}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  {t("properties", "basicInfo")}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t("properties", "propertyTitle")}
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                      placeholder={t("properties", "propertyTitle")}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t("properties", "propertyType")}
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType((e.target.value || "") as PropertyType | "")}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                    >
                      <option value="">{t("properties", "selectType")}</option>
                      {PROPERTY_TYPES.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                          {pt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                      Title and type are landlord-defined. The monthly rent is set later
                      using the government-approved range based on your area &amp; sub-city.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  {t("properties", "location")}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t("properties", "streetAddress")}
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t("properties", "subCity")}
                    </label>
                    <select
                      value={subCity}
                      onChange={(e) => setSubCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                    >
                      <option value="">{t("properties", "selectSubCity")}</option>
                      {SUB_CITIES.map((sc) => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t("properties", "woreda")}</label>
                    <input
                      type="text"
                      value={woreda}
                      onChange={(e) => setWoreda(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                      placeholder="03"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  {t("properties", "propertyDetails")}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t("properties", "bedrooms")}</label>
                    <input
                      type="number"
                      min={0}
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t("properties", "bathrooms")}</label>
                    <input
                      type="number"
                      min={0}
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t("properties", "area")} (m²)</label>
                    <input
                      type="number"
                      min={1}
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4 sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("properties", "homeCondition")}
                  </label>
                  <select
                    value={homeCondition}
                    onChange={(e) =>
                      setHomeCondition(e.target.value as HomeCondition)
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm"
                  >
                    {HOME_CONDITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t("properties", opt.labelKey)}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    {t("properties", "homeConditionHint")}
                  </p>
                </div>
              </div>

              {/* ── Government policy-driven pricing ── */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  Pricing &amp; Government Policy
                </h3>

                {!listingRange && (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 mx-auto flex items-center justify-center mb-3">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      Pricing locked
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                      The monthly rent slider unlocks once you fill in
                      <strong className="text-slate-700"> property type</strong>,
                      <strong className="text-slate-700"> sub-city</strong>, and
                      <strong className="text-slate-700"> area (m²)</strong>. The
                      government regulator publishes annual indicative bands per
                      sub-city and property type — your allowed range is computed
                      from those.
                    </p>
                  </div>
                )}

                {listingRange && (
                  <>
                    <PricingPanel
                      range={listingRange}
                      subCity={subCity}
                      propertyType={
                        PROPERTY_TYPES.find((p) => p.value === propertyType)?.label ??
                        propertyType
                      }
                      areaSqm={areaNum}
                      value={monthlyRent}
                      onChange={setMonthlyRent}
                    />

                    <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                        <h4 className="text-sm font-semibold text-violet-900">
                          {t("properties", "ragTitle")}
                        </h4>
                      </div>
                      {ragLoading && (
                        <p className="text-xs text-violet-800 animate-pulse">
                          {t("properties", "ragLoading")}
                        </p>
                      )}
                      {!ragLoading && ragSuggestion && (
                        <>
                          <p className="text-xs text-violet-950/90 leading-relaxed mb-3">
                            {ragSuggestion.summary}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-xs font-semibold text-violet-900">
                              {ragSuggestion.suggestedMid.toLocaleString()} ETB/mo
                            </span>
                            <span className="text-[10px] text-violet-700 bg-white/70 px-2 py-0.5 rounded border border-violet-100">
                              {ragSuggestion.source}
                            </span>
                          </div>
                          {ragSuggestion.retrievedChunkIds.length > 0 && (
                            <p className="text-[10px] text-violet-700 mb-3">
                              <span className="font-semibold">
                                {t("properties", "ragSources")}:
                              </span>{" "}
                              {ragSuggestion.retrievedChunkIds.join(", ")}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setMonthlyRent(ragSuggestion.suggestedMid)
                            }
                            className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-2 rounded-lg transition-colors"
                          >
                            {t("properties", "ragApply")}
                          </button>
                          <p className="text-[10px] text-violet-600/90 mt-2">
                            {t("properties", "ragPowered")}
                          </p>
                        </>
                      )}
                    </div>
                    {isRentWarned && (
                      <label className="flex items-start gap-2 text-sm text-slate-800 cursor-pointer mt-3 px-1">
                        <input
                          type="checkbox"
                          checked={acknowledgeAtypicalRent}
                          onChange={(e) => setAcknowledgeAtypicalRent(e.target.checked)}
                          className="mt-1 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs leading-relaxed">
                          I understand my chosen rent is outside the regulator&apos;s
                          recommended band and accept that the DARA officer will
                          manually review this listing before activation.
                        </span>
                      </label>
                    )}
                  </>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  {t("properties", "propertyPhotos")}
                </h3>
                <p className="text-xs text-slate-500 mb-4">{t("properties", "propertyPhotosDesc")}</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                      <div className="aspect-[4/3] relative bg-slate-200">
                        {photoPreviews[i] ? (
                          <img src={photoPreviews[i]!} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                            <ImageIcon className="w-8 h-8 mb-1 opacity-60" />
                            <span className="text-[10px] font-medium text-slate-500 leading-tight">{photoLabels[i]}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 border-t border-slate-100 bg-white">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center justify-center gap-1 w-full py-2 text-xs font-semibold text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            {photos[i] ? t("properties", "replacePhoto") : t("properties", "browseFiles")}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onPickPhoto(i, e.target.files)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                {photoCount < MIN_PHOTOS && (
                  <p className="text-xs text-rose-600 mt-2">{t("properties", "minPhotosError")}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  {t("properties", "amenities")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                        selectedAmenities.includes(amenity)
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("properties", "description")}</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minLength={MIN_DESCRIPTION}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {t("properties", "descriptionHint")} ({description.trim().length}/{MIN_DESCRIPTION})
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  {t("properties", "ownershipProofTitle")}
                </h3>
                <p className="text-xs text-slate-600 mb-3">{t("properties", "ownershipProofDesc")}</p>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 mb-3">{t("properties", "ownershipProofHint")}</p>
                  <label className="inline-flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700 cursor-pointer">
                    <Plus className="w-4 h-4" />
                    {t("properties", "browseFiles")}
                    <input
                      type="file"
                      multiple
                      accept=".pdf,image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => onPickOwnership(e.target.files)}
                    />
                  </label>
                </div>
                {ownershipFiles.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {ownershipFiles.map((f, idx) => (
                      <li
                        key={`${f.name}-${idx}`}
                        className="flex items-center justify-between text-sm bg-white border border-slate-200 rounded-lg px-3 py-2"
                      >
                        <span className="truncate text-slate-700">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => removeOwnership(idx)}
                          className="text-rose-600 text-xs font-semibold hover:underline shrink-0 ml-2"
                        >
                          {t("properties", "removeFile")}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {ownershipFiles.length < MIN_OWNERSHIP && (
                  <p className="text-xs text-rose-600 mt-2">{t("properties", "minOwnershipError")}</p>
                )}
              </div>

              {submitError && <p className="text-sm text-rose-600">{submitError}</p>}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-slate-100">
                {submitDisabled && (
                  <p className="text-xs text-slate-500 sm:mr-auto">{t("properties", "submitBlocked")}</p>
                )}
                <Link
                  href="/dashboard/properties"
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-center"
                >
                  {t("properties", "cancel")}
                </Link>
                <button
                  type="submit"
                  disabled={submitDisabled}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("properties", "submitForVerification")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
