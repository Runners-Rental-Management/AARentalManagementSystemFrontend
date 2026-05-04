export type UserRole = 'tenant' | 'landlord' | 'admin' | 'dara_agent' | 'system_admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
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
}

export type AgreementStatus =
  | 'draft'
  | 'pending_tenant_signature'
  | 'pending_verification'
  | 'pending_dara_verification'
  | 'active'
  | 'extended'
  | 'terminated'
  | 'expired'
  | 'rejected';

export interface TenancyAgreement {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  landlordId: string;
  landlordName: string;
  tenantId: string;
  tenantName: string;
  monthlyRent: number;
  advancePayment: number;
  startDate: string;
  endDate: string;
  status: AgreementStatus;
  createdAt: string;
  signedAt?: string;
  verifiedAt?: string;
  terminatedAt?: string;
  terminationReason?: string;
  utilities: string[];
}

export type DisputeStatus = 'open' | 'under_review' | 'mediation' | 'resolved' | 'closed' | 'escalated';
export type ViolationType =
  | 'illegal_rent_increase'
  | 'wrongful_eviction'
  | 'maintenance_neglect'
  | 'deposit_withholding'
  | 'harassment'
  | 'lease_violation'
  | 'other';

export interface Dispute {
  id: string;
  agreementId: string;
  reporterId: string;
  reporterName: string;
  reporterRole: 'tenant' | 'landlord';
  respondentId: string;
  respondentName: string;
  violationType: ViolationType;
  title: string;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
  assignedTo?: string;
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
  category: 'agreement' | 'dispute' | 'rent_adjustment' | 'verification' | 'system';
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
  method?: 'cbe_birr' | 'telebirr' | 'bank_transfer' | 'mobile_money' | 'cash' | 'check';
  reference?: string;
}

export interface SupportingDocument {
  id: string;
  uploaderId: string;
  uploaderName: string;
  relatedEntityType: 'agreement' | 'dispute' | 'property' | 'rent_adjustment';
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
  disputeId?: string;
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
  openDisputes: number;
  totalRevenue: number;
  monthlyTrend: { month: string; value: number }[];
}

export interface AnalyticsData {
  rentalTrends: { month: string; averageRent: number; agreements: number }[];
  propertyDistribution: { subCity: string; count: number; avgRent: number }[];
  occupancyRates: { subCity: string; rate: number }[];
  disputeStats: { type: string; count: number }[];
  revenueProjection: { quarter: string; projected: number; actual: number }[];
}
