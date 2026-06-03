import type { AgreementContacts, TenancyAgreement } from "@/lib/types";

const POST_VERIFICATION_STATUSES: TenancyAgreement["status"][] = [
  "pending_payment",
  "active",
  "extended",
  "extension_requested",
  "termination_requested",
  "terminated",
  "expired",
];

export function isAgreementContactsUnlocked(
  agreement: Pick<TenancyAgreement, "verifiedAt" | "status" | "contactsAvailable">,
): boolean {
  if (agreement.contactsAvailable === true) return true;
  if (agreement.verifiedAt) return true;
  return POST_VERIFICATION_STATUSES.includes(agreement.status);
}

type RawParty = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string | null;
  fullName?: string;
};

/** Build contacts from API payload when nested user fields are still present. */
export function contactsFromAgreementPayload(
  raw: {
    contacts?: AgreementContacts;
    landlord?: RawParty;
    tenant?: RawParty;
  },
  landlordName: string,
  tenantName: string,
): AgreementContacts | undefined {
  if (
    raw.contacts?.landlord?.phone &&
    raw.contacts?.tenant?.phone &&
    raw.contacts.landlord.fullName &&
    raw.contacts.tenant.fullName
  ) {
    return raw.contacts;
  }

  const landlord = raw.landlord;
  const tenant = raw.tenant;
  if (!landlord?.phone || !tenant?.phone) return undefined;

  const landlordFull =
    landlord.fullName ??
    (landlord.firstName && landlord.lastName
      ? `${landlord.firstName} ${landlord.lastName}`.trim()
      : landlordName);
  const tenantFull =
    tenant.fullName ??
    (tenant.firstName && tenant.lastName
      ? `${tenant.firstName} ${tenant.lastName}`.trim()
      : tenantName);

  return {
    landlord: {
      fullName: landlordFull,
      phone: landlord.phone,
      address: landlord.address?.trim() || "Not provided",
    },
    tenant: {
      fullName: tenantFull,
      phone: tenant.phone,
      address: tenant.address?.trim() || "Not provided",
    },
  };
}
