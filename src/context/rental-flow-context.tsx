"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { users } from "@/lib/dummy-data";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type LiveStatus =
  | "landlord_initiated"   // landlord signed first, waiting for tenant acceptance
  | "tenant_signed"        // tenant signed first (tenant-initiated flow)
  | "landlord_signed"      // both parties signed — awaiting DARA verification
  | "dara_approved"        // DARA approved — awaiting advance payment
  | "paid"                 // advance paid — contract active
  | "rejected"             // tenant declined landlord-initiated contract
  | "tenant_cancelled"     // tenant cancelled after signing, before payment
  | "landlord_cancelled";  // landlord cancelled before payment was made

export interface LiveAgreement {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  landlordId: string;
  landlordName: string;
  tenantId: string;
  tenantName: string;
  tenantFaydaNumber?: string;
  monthlyRent: number;
  advanceAmount: number;
  status: LiveStatus;
  tenantSignedAt: string;
  landlordSignedAt?: string;
  daraApprovedAt?: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentRef?: string;
  initiatedByLandlord?: boolean;
}

export type NotifRecipient = "landlord" | "dara_agent" | "tenant";

/* Extension ---------------------------------------------------------- */
export type ExtensionStatus =
  | "pending_tenant_sign"
  | "pending_dara"
  | "dara_approved"
  | "tenant_rejected"
  | "dara_rejected";

export interface ExtensionRequest {
  id: string;
  agreementId: string;
  propertyTitle: string;
  landlordId: string;
  landlordName: string;
  tenantId: string;
  tenantName: string;
  newEndDate: string;
  newMonthlyRent?: number;
  extensionFeeRef: string;
  status: ExtensionStatus;
  requestedAt: string;
  tenantSignedAt?: string;
  daraApprovedAt?: string;
}

/* Termination -------------------------------------------------------- */
export interface TerminationRequest {
  id: string;
  agreementId: string;
  propertyTitle: string;
  landlordId: string;
  landlordName: string;
  tenantId: string;
  tenantName: string;
  requestedAt: string;
  reason: string;
}

export interface LiveNotif {
  id: string;
  recipient: NotifRecipient;
  title: string;
  message: string;
  agreementId: string;
  isRead: boolean;
  createdAt: string;
}

interface RentalFlowCtx {
  agreements: LiveAgreement[];
  notifs: LiveNotif[];
  extensionRequests: ExtensionRequest[];
  terminationRequests: TerminationRequest[];
  createAgreement: (
    data: Omit<LiveAgreement, "id" | "status" | "tenantSignedAt">
  ) => string;
  landlordSign: (id: string) => void;
  landlordInitiateContract: (
    data: Omit<LiveAgreement, "id" | "status" | "tenantSignedAt"> & { tenantFaydaNumber: string }
  ) => string;
  tenantAcceptContract: (id: string) => void;
  tenantDeclineContract: (id: string) => void;
  tenantCancelAgreement: (id: string) => void;
  landlordCancelAgreement: (id: string) => void;
  daraApprove: (id: string) => void;
  recordPayment: (id: string, method: string, ref: string) => void;
  getLandlordPhone: (landlordId: string, agreementId: string) => string | null;
  getPropertyLiveStatus: (propertyId: string) => LiveStatus | null;
  markRead: (notifId: string) => void;
  unreadFor: (role: NotifRecipient) => number;
  /* Extension */
  requestExtension: (
    agreementId: string,
    newEndDate: string,
    newMonthlyRent: number | undefined,
    extensionFeeRef: string
  ) => void;
  tenantSignExtension: (extensionId: string) => void;
  tenantRejectExtension: (extensionId: string) => void;
  daraApproveExtension: (extensionId: string) => void;
  /* Termination */
  requestTermination: (agreementId: string, reason: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const AGREEMENTS_KEY   = "rf_live_agreements";
const NOTIFS_KEY       = "rf_live_notifs";
const EXTENSIONS_KEY   = "rf_extensions";
const TERMINATIONS_KEY = "rf_terminations";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return `la_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const Ctx = createContext<RentalFlowCtx | undefined>(undefined);

export function RentalFlowProvider({ children }: { children: ReactNode }) {
  const [agreements, setAgreements] = useState<LiveAgreement[]>(() =>
    load(AGREEMENTS_KEY, [])
  );
  const [notifs, setNotifs] = useState<LiveNotif[]>(() =>
    load(NOTIFS_KEY, [])
  );
  const [extensionRequests, setExtensionRequests] = useState<ExtensionRequest[]>(() =>
    load(EXTENSIONS_KEY, [])
  );
  const [terminationRequests, setTerminationRequests] = useState<TerminationRequest[]>(() =>
    load(TERMINATIONS_KEY, [])
  );

  const addNotif = useCallback(
    (
      recipient: NotifRecipient,
      title: string,
      message: string,
      agreementId: string
    ) => {
      const n: LiveNotif = {
        id: uid(),
        recipient,
        title,
        message,
        agreementId,
        isRead: false,
        createdAt: now(),
      };
      setNotifs((prev) => {
        const next = [n, ...prev];
        save(NOTIFS_KEY, next);
        return next;
      });
    },
    []
  );

  const createAgreement = useCallback(
    (data: Omit<LiveAgreement, "id" | "status" | "tenantSignedAt">) => {
      const id = uid();
      const agreement: LiveAgreement = {
        ...data,
        id,
        status: "tenant_signed",
        tenantSignedAt: now(),
      };
      setAgreements((prev) => {
        const next = [agreement, ...prev];
        save(AGREEMENTS_KEY, next);
        return next;
      });
      addNotif("landlord", "New Rental Agreement Awaiting Your Signature",
        `${data.tenantName} has signed a contract for ${data.propertyTitle}. Please review and counter-sign.`, id);
      addNotif("tenant", "Contract Submitted Successfully",
        `Your signed contract for ${data.propertyTitle} has been sent to the landlord for counter-signature.`, id);
      addNotif("dara_agent", "New Tenant-Initiated Agreement",
        `A new rental contract for ${data.propertyTitle} has been submitted by tenant ${data.tenantName} and is awaiting landlord counter-signature.`, id);
      return id;
    },
    [addNotif]
  );

  const landlordSign = useCallback(
    (id: string) => {
      setAgreements((prev) => {
        const next = prev.map((a) =>
          a.id === id
            ? { ...a, status: "landlord_signed" as LiveStatus, landlordSignedAt: now() }
            : a
        );
        save(AGREEMENTS_KEY, next);
        return next;
      });
      const a = agreements.find((x) => x.id === id);
      if (a) {
        addNotif("dara_agent", "Agreement Requires DARA Verification",
          `A rental contract for ${a.propertyTitle} has been signed by both parties and awaits your review.`, id);
        addNotif("tenant", "Landlord Counter-Signed — Awaiting DARA Verification",
          `${a.landlordName} has counter-signed the contract for ${a.propertyTitle}. The agreement is now with DARA for compliance verification.`, id);
        addNotif("landlord", "You Counter-Signed the Agreement",
          `Your counter-signature for ${a.propertyTitle} has been recorded. DARA is now reviewing the agreement.`, id);
      }
    },
    [agreements, addNotif]
  );

  const landlordInitiateContract = useCallback(
    (data: Omit<LiveAgreement, "id" | "status" | "tenantSignedAt"> & { tenantFaydaNumber: string }) => {
      const id = uid();
      const agreement: LiveAgreement = {
        ...data,
        id,
        status: "landlord_initiated",
        tenantSignedAt: "",
        landlordSignedAt: now(),
        initiatedByLandlord: true,
      };
      setAgreements((prev) => {
        const next = [agreement, ...prev];
        save(AGREEMENTS_KEY, next);
        return next;
      });
      addNotif("tenant", "New Rental Contract Request",
        `${data.landlordName} has sent you a signed rental contract for ${data.propertyTitle}. Go to My Agreements to review and sign.`, id);
      addNotif("landlord", "Contract Sent to Tenant",
        `Your signed contract for ${data.propertyTitle} has been sent to ${data.tenantName}. You will be notified when they accept.`, id);
      addNotif("dara_agent", "Landlord-Initiated Contract Pending Tenant Acceptance",
        `A contract for ${data.propertyTitle} has been signed by landlord ${data.landlordName} and is awaiting tenant acceptance.`, id);
      return id;
    },
    [addNotif]
  );

  const tenantAcceptContract = useCallback(
    (id: string) => {
      setAgreements((prev) => {
        const next = prev.map((a) =>
          a.id === id
            ? { ...a, status: "landlord_signed" as LiveStatus, tenantSignedAt: now() }
            : a
        );
        save(AGREEMENTS_KEY, next);
        return next;
      });
      const a = agreements.find((x) => x.id === id);
      if (a) {
        addNotif("dara_agent", "Agreement Requires DARA Verification",
          `Both parties have signed the contract for ${a.propertyTitle}. Awaiting your compliance review.`, id);
        addNotif("landlord", "Tenant Accepted and Signed the Contract",
          `${a.tenantName} has signed the contract for ${a.propertyTitle}. The agreement is now with DARA for verification.`, id);
        addNotif("tenant", "Contract Signed — Pending Officer Verification",
          `You have successfully signed the contract for ${a.propertyTitle}. A DARA officer will now verify compliance.`, id);
      }
    },
    [agreements, addNotif]
  );

  const tenantDeclineContract = useCallback(
    (id: string) => {
      setAgreements((prev) => {
        const next = prev.map((a) =>
          a.id === id
            ? { ...a, status: "rejected" as LiveStatus }
            : a
        );
        save(AGREEMENTS_KEY, next);
        return next;
      });
      const a = agreements.find((x) => x.id === id);
      if (a) {
        addNotif("landlord", "Tenant Declined Your Contract",
          `${a.tenantName} has declined the rental contract for ${a.propertyTitle}. The property is now available again.`, id);
        addNotif("tenant", "You Declined the Contract",
          `You have declined the rental contract for ${a.propertyTitle}. No further action is required.`, id);
        addNotif("dara_agent", "Contract Declined by Tenant",
          `The rental contract for ${a.propertyTitle} was declined by tenant ${a.tenantName}.`, id);
      }
    },
    [agreements, addNotif]
  );

  const tenantCancelAgreement = useCallback(
    (id: string) => {
      setAgreements((prev) => {
        const next = prev.map((a) =>
          a.id === id
            ? { ...a, status: "tenant_cancelled" as LiveStatus }
            : a
        );
        save(AGREEMENTS_KEY, next);
        return next;
      });
      const a = agreements.find((x) => x.id === id);
      if (a) {
        addNotif("landlord", "Tenant Cancelled the Agreement",
          `${a.tenantName} has cancelled the rental agreement for ${a.propertyTitle} before payment was made. The property is now available again.`, id);
        addNotif("tenant", "Agreement Cancelled",
          `You have cancelled the rental agreement for ${a.propertyTitle}. The landlord and DARA have been notified.`, id);
        addNotif("dara_agent", "Agreement Cancelled by Tenant",
          `The rental agreement for ${a.propertyTitle} (Tenant: ${a.tenantName}) was cancelled by the tenant before payment. No further action required.`, id);
      }
    },
    [agreements, addNotif]
  );

  const landlordCancelAgreement = useCallback(
    (id: string) => {
      setAgreements((prev) => {
        const next = prev.map((a) =>
          a.id === id
            ? { ...a, status: "landlord_cancelled" as LiveStatus }
            : a
        );
        save(AGREEMENTS_KEY, next);
        return next;
      });
      const a = agreements.find((x) => x.id === id);
      if (a) {
        addNotif("tenant", "Landlord Cancelled the Agreement",
          `${a.landlordName} has cancelled the rental agreement for ${a.propertyTitle} before payment was made. The property is no longer reserved for you.`, id);
        addNotif("landlord", "You Cancelled the Agreement",
          `You have cancelled the rental agreement for ${a.propertyTitle}. The tenant (${a.tenantName}) and DARA have been notified.`, id);
        addNotif("dara_agent", "Agreement Cancelled by Landlord",
          `The rental agreement for ${a.propertyTitle} (Tenant: ${a.tenantName}) was cancelled by landlord ${a.landlordName} before payment. No further action required.`, id);
      }
    },
    [agreements, addNotif]
  );

  // Returns the active live agreement status for a property (null if none active)
  const getPropertyLiveStatus = useCallback(
    (propertyId: string): LiveStatus | null => {
      const terminated: LiveStatus[] = ["rejected", "tenant_cancelled", "landlord_cancelled"];
      const active = agreements.find(
        (a) => a.propertyId === propertyId && !terminated.includes(a.status)
      );
      return active?.status ?? null;
    },
    [agreements]
  );

  const daraApprove = useCallback(
    (id: string) => {
      setAgreements((prev) => {
        const next = prev.map((a) =>
          a.id === id
            ? { ...a, status: "dara_approved" as LiveStatus, daraApprovedAt: now() }
            : a
        );
        save(AGREEMENTS_KEY, next);
        return next;
      });
      const a = agreements.find((x) => x.id === id);
      if (a) {
        addNotif("tenant", "Agreement Approved — Payment Required",
          `Your rental agreement for ${a.propertyTitle} has been approved by DARA. Please complete the advance payment of ETB ${a.advanceAmount.toLocaleString()} to activate your contract.`, id);
        addNotif("landlord", "Agreement Approved by DARA",
          `The rental agreement for ${a.propertyTitle} (Tenant: ${a.tenantName}) has been verified and approved by DARA. Awaiting advance payment from tenant.`, id);
        addNotif("dara_agent", "Verification Submitted",
          `You have approved the rental agreement for ${a.propertyTitle}. Both parties have been notified.`, id);
      }
    },
    [agreements, addNotif]
  );

  const recordPayment = useCallback(
    (id: string, method: string, ref: string) => {
      setAgreements((prev) => {
        const next = prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: "paid" as LiveStatus,
                paidAt: now(),
                paymentMethod: method,
                paymentRef: ref,
              }
            : a
        );
        save(AGREEMENTS_KEY, next);
        return next;
      });
      const a = agreements.find((x) => x.id === id);
      if (a) {
        addNotif("landlord", "Advance Payment Received — Contract Active",
          `${a.tenantName} has paid the advance (ETB ${a.advanceAmount.toLocaleString()}) via ${method}. The rental contract for ${a.propertyTitle} is now active.`, id);
        addNotif("tenant", "Payment Confirmed — Contract Active",
          `Your advance payment for ${a.propertyTitle} has been received. Your rental contract is now active. You may contact your landlord directly.`, id);
        addNotif("dara_agent", "Rental Contract Activated",
          `Advance payment received for ${a.propertyTitle}. Tenant: ${a.tenantName}. Contract is now fully active.`, id);
      }
    },
    [agreements, addNotif]
  );

  // Reveal landlord phone only after payment
  const getLandlordPhone = useCallback(
    (landlordId: string, agreementId: string) => {
      const agreement = agreements.find((a) => a.id === agreementId);
      if (!agreement || agreement.status !== "paid") return null;
      const landlord = users.find((u) => u.id === landlordId);
      return landlord?.phone ?? null;
    },
    [agreements]
  );

  const markRead = useCallback((notifId: string) => {
    setNotifs((prev) => {
      const next = prev.map((n) =>
        n.id === notifId ? { ...n, isRead: true } : n
      );
      save(NOTIFS_KEY, next);
      return next;
    });
  }, []);

  const unreadFor = useCallback(
    (role: NotifRecipient) =>
      notifs.filter((n) => n.recipient === role && !n.isRead).length,
    [notifs]
  );

  /* ── Extension ── */
  const requestExtension = useCallback(
    (agreementId: string, newEndDate: string, newMonthlyRent: number | undefined, extensionFeeRef: string) => {
      const a = agreements.find((x) => x.id === agreementId);
      if (!a) return;
      const ext: ExtensionRequest = {
        id: uid(),
        agreementId,
        propertyTitle: a.propertyTitle,
        landlordId: a.landlordId,
        landlordName: a.landlordName,
        tenantId: a.tenantId,
        tenantName: a.tenantName,
        newEndDate,
        newMonthlyRent,
        extensionFeeRef,
        status: "pending_tenant_sign",
        requestedAt: now(),
      };
      setExtensionRequests((prev) => {
        const next = [ext, ...prev];
        save(EXTENSIONS_KEY, next);
        return next;
      });
      addNotif("tenant", "Contract Extension Request",
        `${a.landlordName} has requested to extend your tenancy at ${a.propertyTitle} to ${new Date(newEndDate).toLocaleDateString()}. Please review and sign.`, agreementId);
      addNotif("landlord", "Extension Request Sent to Tenant",
        `Your extension request for ${a.propertyTitle} has been sent to ${a.tenantName} for signature.`, agreementId);
      addNotif("dara_agent", "Tenancy Extension Requested",
        `Landlord ${a.landlordName} has requested an extension for ${a.propertyTitle} (Tenant: ${a.tenantName}).`, agreementId);
    },
    [agreements, addNotif]
  );

  const tenantSignExtension = useCallback(
    (extensionId: string) => {
      const ext = extensionRequests.find((e) => e.id === extensionId);
      if (!ext) return;
      setExtensionRequests((prev) => {
        const next = prev.map((e) =>
          e.id === extensionId
            ? { ...e, status: "pending_dara" as ExtensionStatus, tenantSignedAt: now() }
            : e
        );
        save(EXTENSIONS_KEY, next);
        return next;
      });
      addNotif("landlord", "Tenant Signed the Extension",
        `${ext.tenantName} has signed the extension request for ${ext.propertyTitle}. Forwarded to DARA for verification.`, ext.agreementId);
      addNotif("dara_agent", "Extension Requires Verification",
        `Both parties have signed an extension for ${ext.propertyTitle}. Please review and approve.`, ext.agreementId);
      addNotif("tenant", "Extension Signed — Awaiting DARA Approval",
        `You have signed the extension for ${ext.propertyTitle}. DARA is now reviewing the request.`, ext.agreementId);
    },
    [extensionRequests, addNotif]
  );

  const tenantRejectExtension = useCallback(
    (extensionId: string) => {
      const ext = extensionRequests.find((e) => e.id === extensionId);
      if (!ext) return;
      setExtensionRequests((prev) => {
        const next = prev.map((e) =>
          e.id === extensionId ? { ...e, status: "tenant_rejected" as ExtensionStatus } : e
        );
        save(EXTENSIONS_KEY, next);
        return next;
      });
      addNotif("landlord", "Tenant Rejected the Extension",
        `${ext.tenantName} has rejected the extension request for ${ext.propertyTitle}.`, ext.agreementId);
      addNotif("tenant", "Extension Rejected",
        `You have rejected the extension request for ${ext.propertyTitle}. The landlord has been notified.`, ext.agreementId);
    },
    [extensionRequests, addNotif]
  );

  const daraApproveExtension = useCallback(
    (extensionId: string) => {
      const ext = extensionRequests.find((e) => e.id === extensionId);
      if (!ext) return;
      setExtensionRequests((prev) => {
        const next = prev.map((e) =>
          e.id === extensionId
            ? { ...e, status: "dara_approved" as ExtensionStatus, daraApprovedAt: now() }
            : e
        );
        save(EXTENSIONS_KEY, next);
        return next;
      });
      addNotif("landlord", "Extension Approved by DARA",
        `The tenancy extension for ${ext.propertyTitle} has been officially approved. New end date: ${new Date(ext.newEndDate).toLocaleDateString()}.`, ext.agreementId);
      addNotif("tenant", "Tenancy Extended — DARA Approved",
        `Your tenancy at ${ext.propertyTitle} has been extended to ${new Date(ext.newEndDate).toLocaleDateString()} by DARA.`, ext.agreementId);
    },
    [extensionRequests, addNotif]
  );

  /* ── Termination ── */
  const requestTermination = useCallback(
    (agreementId: string, reason: string) => {
      const a = agreements.find((x) => x.id === agreementId);
      if (!a) return;
      const req: TerminationRequest = {
        id: uid(),
        agreementId,
        propertyTitle: a.propertyTitle,
        landlordId: a.landlordId,
        landlordName: a.landlordName,
        tenantId: a.tenantId,
        tenantName: a.tenantName,
        requestedAt: now(),
        reason,
      };
      setTerminationRequests((prev) => {
        const next = [req, ...prev];
        save(TERMINATIONS_KEY, next);
        return next;
      });
      addNotif("tenant", "Termination Notice Received",
        `${a.landlordName} has filed a termination request for the tenancy at ${a.propertyTitle}. Reason: ${reason}. DARA has been notified.`, agreementId);
      addNotif("landlord", "Termination Request Submitted",
        `Your termination request for ${a.propertyTitle} has been submitted and sent to ${a.tenantName} and DARA.`, agreementId);
      addNotif("dara_agent", "Tenancy Termination Requested",
        `Landlord ${a.landlordName} has requested termination of the tenancy at ${a.propertyTitle} (Tenant: ${a.tenantName}). Reason: ${reason}.`, agreementId);
    },
    [agreements, addNotif]
  );

  return (
    <Ctx.Provider
      value={{
        agreements,
        notifs,
        extensionRequests,
        terminationRequests,
        createAgreement,
        landlordSign,
        landlordInitiateContract,
        tenantAcceptContract,
        tenantDeclineContract,
        tenantCancelAgreement,
        landlordCancelAgreement,
        daraApprove,
        recordPayment,
        getLandlordPhone,
        getPropertyLiveStatus,
        markRead,
        unreadFor,
        requestExtension,
        tenantSignExtension,
        tenantRejectExtension,
        daraApproveExtension,
        requestTermination,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useRentalFlow() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRentalFlow must be inside RentalFlowProvider");
  return ctx;
}
