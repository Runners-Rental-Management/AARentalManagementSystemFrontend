export const SUB_CITIES = [
  'Addis Ketema',
  'Akaky Kaliti',
  'Arada',
  'Bole',
  'Gullele',
  'Kirkos',
  'Kolfe Keranio',
  'Lideta',
  'Nifas Silk-Lafto',
  'Yeka',
  'Lemi Kura',
] as const;

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'condominium', label: 'Condominium' },
  { value: 'villa', label: 'Villa' },
] as const;

export const AMENITIES = [
  'Parking',
  'Guard/Security',
  'Water Tank',
  'Generator',
  'Garden',
  'Balcony',
  'Elevator',
  'Furnished',
  'Internet',
  'Satellite TV',
  'Laundry Room',
  'Storage Room',
] as const;

export const MAX_ADVANCE_MONTHS = 2;
export const MIN_LEASE_YEARS = 2;
// Placeholder — actual percentage is determined by the regulatory body's
// published pricing strategy and is not hardcoded in the proclamation.
export const MAX_ANNUAL_RENT_INCREASE_PERCENT = 7;

export const ROLE_LABELS: Record<string, string> = {
  tenant: 'Tenant',
  landlord: 'Landlord',
  admin: 'Government Administrator',
};
