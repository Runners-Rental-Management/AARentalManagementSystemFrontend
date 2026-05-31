"use client";

import { Header } from "@/components/dashboard/header";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { useAlert } from "@/context/alert-context";
import { useLoading } from "@/context/loading-context";
import { useProperties } from "@/context/properties-context";
import { formatErrorForUser } from "@/lib/api-error";
import { apiUploadFiles, getAccessToken } from "@/lib/api";
import { SUB_CITIES, PROPERTY_TYPES, AMENITIES } from "@/lib/constants";
import type { Property, HomeCondition } from "@/lib/types";
import { ArrowLeft, Upload, Plus, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null]);
  const [photoPreviews, setPhotoPreviews] = useState<(string | null)[]>([null, null, null]);
  const [ownershipFiles, setOwnershipFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const areaNum = parseFloat(area.replace(/,/g, "")) || 0;

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

  const submitDisabled =
    !title.trim() ||
    !propertyType ||
    !subCity ||
    !address.trim() ||
    !woreda.trim() ||
    areaNum <= 0 ||
    monthlyRent <= 0 ||
    photoCount < MIN_PHOTOS ||
    ownershipFiles.length < MIN_OWNERSHIP;

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
    if (monthlyRent <= 0) {
      setSubmitError("Please enter a valid monthly rent.");
      return;
    }
    if (description.trim().length < MIN_DESCRIPTION) {
      setSubmitError(t("properties", "descriptionMinLength"));
      return;
    }
    if (!user || !propertyType) return;

    try {
      await withLoading(async () => {
        const token = getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const photoFiles = photos.filter((f): f is File => Boolean(f));
        const uploadedPhotos = await apiUploadFiles(token, photoFiles, "photos");

        const uploadedDocs =
          ownershipFiles.length > 0
            ? await apiUploadFiles(token, ownershipFiles, "ownership")
            : [];

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
          images: uploadedPhotos.map((f) => f.url),
          ownershipDocuments: uploadedDocs,
        });
      }, "Uploading files and submitting…");

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

        <div className="max-w-4xl mx-auto">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
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
                      Choose a clear title and property type so tenants can find your listing easily.
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

              {/* ── Monthly rent ── */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-100">
                  Monthly Rent
                </h3>
                <div className="max-w-md mx-auto">
                  <label
                    htmlFor="monthly-rent"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Set your monthly rent
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <span className="text-sm font-semibold text-slate-400 shrink-0">
                        ETB
                      </span>
                      <input
                        id="monthly-rent"
                        type="number"
                        min={1}
                        step={1}
                        value={monthlyRent || ""}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setMonthlyRent(Number.isFinite(n) && n > 0 ? n : 0);
                        }}
                        placeholder="0"
                        className="flex-1 min-w-0 text-2xl font-bold text-slate-900 bg-transparent outline-none tabular-nums placeholder:text-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-500 shrink-0">
                        / month
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Enter the amount you want to charge tenants each month.
                  </p>
                </div>
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
