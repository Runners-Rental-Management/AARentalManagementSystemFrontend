"use client";

import { useLanguage } from "@/context/language-context";
import { apiGetAgreementContacts } from "@/lib/api";
import { isAgreementContactsUnlocked } from "@/lib/agreement-contacts";
import type { AgreementContacts, AgreementPartyContact, TenancyAgreement } from "@/lib/types";
import {
  Copy,
  Check,
  Lock,
  Loader2,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  agreement: Pick<
    TenancyAgreement,
    "id" | "verifiedAt" | "status" | "contactsAvailable" | "contacts"
  >;
  accessToken: string | null;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={() => void copy()}
      disabled={!value}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-40 transition-colors"
      aria-label={`${label} — ${t("agreementsDetail", "copy")}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-600">{t("agreementsDetail", "copied")}</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>{t("agreementsDetail", "copy")}</span>
        </>
      )}
    </button>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <Icon className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-stone-400 font-medium">
          {label}
        </p>
        <p className="text-sm text-stone-800 break-words">{value || "—"}</p>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}

function PartyCard({
  party,
  role,
  roleLabel,
  avatarClass,
  iconClass,
}: {
  party: AgreementPartyContact;
  role: "landlord" | "tenant";
  roleLabel: string;
  avatarClass: string;
  iconClass: string;
}) {
  const { t } = useLanguage();
  const sectionTitle =
    role === "landlord"
      ? t("agreementsDetail", "landlordInformation")
      : t("agreementsDetail", "tenantInformation");

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-5 flex flex-col gap-4">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
        {sectionTitle}
      </p>
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${avatarClass}`}
        >
          <User className={`w-6 h-6 ${iconClass}`} />
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-stone-900 truncate">
            {party.fullName}
          </p>
          <span
            className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
              role === "landlord"
                ? "bg-blue-100 text-blue-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {roleLabel}
          </span>
        </div>
      </div>
      <div className="space-y-3 pt-1 border-t border-stone-200/80">
        <ContactRow
          icon={User}
          label={t("agreementsDetail", "fullName")}
          value={party.fullName}
        />
        <ContactRow
          icon={Phone}
          label={t("agreementsDetail", "phoneNumber")}
          value={party.phone}
        />
        <ContactRow
          icon={MapPin}
          label={t("agreementsDetail", "address")}
          value={party.address}
        />
      </div>
    </div>
  );
}

export function AgreementContactSection({ agreement, accessToken }: Props) {
  const { t } = useLanguage();
  const unlocked = isAgreementContactsUnlocked(agreement);
  const [contacts, setContacts] = useState<AgreementContacts | undefined>(
    agreement.contacts,
  );
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    setContacts(agreement.contacts);
  }, [agreement.contacts]);

  useEffect(() => {
    if (!unlocked || contacts || !accessToken) return;
    let cancelled = false;
    setLoadingContacts(true);
    void apiGetAgreementContacts(accessToken, agreement.id)
      .then((res) => {
        if (!cancelled && res.contactsAvailable && res.contacts) {
          setContacts(res.contacts);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingContacts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [unlocked, contacts, accessToken, agreement.id]);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6">
      <h3 className="text-sm font-semibold text-stone-900 mb-4">
        {t("agreementsDetail", "contactInformation")}
      </h3>

      {unlocked && loadingContacts && !contacts ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading contact information…
        </div>
      ) : !unlocked || !contacts ? (
        <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-5 py-8 text-center">
          <div className="mx-auto w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-stone-400" />
          </div>
          <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
            {t("agreementsDetail", "contactsLockedMessage")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <PartyCard
            party={contacts.landlord}
            role="landlord"
            roleLabel={t("agreementsDetail", "roleLandlord")}
            avatarClass="bg-blue-100"
            iconClass="text-blue-600"
          />
          <PartyCard
            party={contacts.tenant}
            role="tenant"
            roleLabel={t("agreementsDetail", "roleTenant")}
            avatarClass="bg-emerald-100"
            iconClass="text-emerald-600"
          />
        </div>
      )}
    </div>
  );
}
