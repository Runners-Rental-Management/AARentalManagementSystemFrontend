import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800',
    verified: 'bg-emerald-100 text-emerald-800',
    approved: 'bg-emerald-100 text-emerald-800',
    resolved: 'bg-emerald-100 text-emerald-800',
    published: 'bg-emerald-100 text-emerald-800',
    available: 'bg-blue-100 text-blue-800',
    open: 'bg-blue-100 text-blue-800',
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-amber-100 text-amber-800',
    pending_verification: 'bg-amber-100 text-amber-800',
    pending_tenant_signature: 'bg-amber-100 text-amber-800',
    pending_dara_verification: 'bg-amber-100 text-amber-800',
    pending_payment: 'bg-amber-100 text-amber-800',
    extension_requested: 'bg-primary-100 text-primary-800',
    termination_requested: 'bg-red-100 text-red-800',
    under_review: 'bg-purple-100 text-purple-800',
    mediation: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
    terminated: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-600',
    closed: 'bg-gray-100 text-gray-600',
    escalated: 'bg-red-100 text-red-800',
    rented: 'bg-primary-100 text-primary-800',
    archived: 'bg-gray-100 text-gray-600',
    paid: 'bg-emerald-100 text-emerald-800',
    overdue: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
