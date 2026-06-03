export type UserRole = 'tenant' | 'landlord' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  adminSubCities?: string[];
  adminAllLocations?: boolean;
  avatar?: string;
  createdAt: string;
  isVerified: boolean;
  address?: string;
  idNumber?: string;
  fatherName?: string;
  grandfatherName?: string;
  faydaNumber?: string;
  faydaVerified?: boolean;
  faydaVerifiedAt?: string;
}

/** Public tenant profile visible to landlords (via Fayda lookup or profile page). */
export interface TenantPublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  grandfatherName?: string;
  fullName: string;
  phone: string;
  maskedPhone: string;
  address?: string;
  role: 'tenant';
  isVerified: boolean;
  faydaVerified: boolean;
  faydaVerifiedAt?: string;
  maskedFaydaNumber?: string | null;
  createdAt: string;
  agreementCountAsTenant: number;
}

export type HomeCondition =
  | "new_build"
  | "excellent"
  | "good"
  | "fair"
  | "needs_renovation";

export interface Property {
  id: string;
  title: string;
  address: string;
  subCity: string;
  woreda: string;
  propertyType: 'apartment' | 'house' | 'condominium' | 'villa';
  bedrooms: number;
  bathrooms: number;
  area: number; // sqm
  amenities: string[];
  monthlyRent: number;
  status: 'pending_verification' | 'available' | 'rejected' | 'rented';
  landlordId: string;
  landlordName: string;
  images: string[];
  description: string;
  createdAt: string;
  verifiedAt?: string;
  isPostedToExplore?: boolean;
  postedToExploreAt?: string;
  /** Reported condition — used for RAG-assisted pricing at registration */
  homeCondition?: HomeCondition;
}

export type AgreementStatus =
  | 'draft'
  | 'pending_tenant_signature'
  | 'pending_verification'
  | 'pending_dara_verification'
  | 'pending_payment'
  | 'active'
  | 'extension_requested'
  | 'termination_requested'
  | 'extended'
  | 'terminated'
  | 'expired'
  | 'rejected';

export interface AgreementPartyContact {
  fullName: string;
  phone: string;
  address: string;
}

export interface AgreementContacts {
  landlord: AgreementPartyContact;
  tenant: AgreementPartyContact;
}

export interface TenancyAgreement {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  landlordId: string;
  landlordName: string;
  tenantId: string;
  tenantName: string;
  contactsAvailable?: boolean;
  contacts?: AgreementContacts;
  monthlyRent: number;
  advancePayment: number;
  startDate: string;
  endDate: string;
  status: AgreementStatus;
  createdAt: string;
  signedAt?: string;
  tenantSignedAt?: string;
  landlordSignedAt?: string;
  verifiedAt?: string;
  initialPaymentAt?: string;
  proposedEndDate?: string;
  proposedMonthlyRent?: number;
  terminatedAt?: string;
  terminationReason?: string;
  utilities: string[];
}

export type RentAdjustmentStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export interface RentAdjustment {
  id: string;
  agreementId: string;
  propertyTitle: string;
  landlordId: string;
  landlordName: string;
  tenantName: string;
  currentRent: number;
  proposedRent: number;
  increasePercentage: number;
  maxAllowedPercentage: number;
  reason: string;
  status: RentAdjustmentStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface PricingStrategy {
  id: string;
  title: string;
  description: string;
  maxAnnualIncreasePercent: number;
  effectiveFrom: string;
  effectiveTo: string;
  subCityRules: {
    subCity: string;
    maxRentPerSqm: number;
    adjustmentFactor: number;
  }[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  publishedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'agreement' | 'rent_adjustment' | 'verification' | 'system';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';

export interface RentPayment {
  id: string;
  agreementId: string;
  propertyTitle: string;
  payerId: string;
  payerName: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  method?: 'cbe_birr' | 'telebirr' | 'bank_transfer' | 'mobile_money' | 'cash' | 'check' | 'chapa';
  reference?: string;
}

export interface SupportingDocument {
  id: string;
  uploaderId: string;
  uploaderName: string;
  relatedEntityType: 'agreement' | 'property' | 'rent_adjustment';
  relatedEntityId: string;
  relatedEntityTitle: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface PenaltyNotice {
  id: string;
  issuedTo: string;
  issuedToName: string;
  issuedBy: string;
  issuedByName: string;
  agreementId?: string;
  type: 'warning' | 'fine' | 'suspension' | 'legal_action';
  reason: string;
  amount?: number;
  status: 'issued' | 'acknowledged' | 'appealed' | 'enforced' | 'cancelled';
  issuedAt: string;
  deadline?: string;
}

export interface SystemParameter {
  id: string;
  key: string;
  label: string;
  value: string;
  category: 'rental' | 'compliance' | 'system' | 'notification';
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DashboardStats {
  totalProperties: number;
  activeAgreements: number;
  pendingVerifications: number;
  totalRevenue: number;
  monthlyTrend: { month: string; value: number }[];
}

export interface AnalyticsData {
  rentalTrends: { month: string; averageRent: number; agreements: number }[];
  propertyDistribution: { subCity: string; count: number; avgRent: number }[];
  occupancyRates: { subCity: string; rate: number }[];
  revenueProjection: { quarter: string; projected: number; actual: number }[];
}
