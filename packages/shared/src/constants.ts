export const BREW_METHODS = [
  'espresso',
  'pour-over',
  'aeropress',
  'chemex',
  'batch-brew',
  'cold-brew',
  'siphon',
  'french-press',
] as const;
export type BrewMethod = (typeof BREW_METHODS)[number];

export const BREW_METHOD_LABELS: Record<BrewMethod, string> = {
  espresso: 'Espresso',
  'pour-over': 'Pour-over',
  aeropress: 'AeroPress',
  chemex: 'Chemex',
  'batch-brew': 'Batch brew',
  'cold-brew': 'Cold brew',
  siphon: 'Sifón',
  'french-press': 'Prensa francesa',
};

export const AMENITIES = [
  'wifi',
  'laptop-friendly',
  'power-outlets',
  'outdoor-seating',
  'pet-friendly',
  'vegan-options',
  'accessible',
] as const;
export type Amenity = (typeof AMENITIES)[number];

export const AMENITY_LABELS: Record<Amenity, string> = {
  wifi: 'Wifi',
  'laptop-friendly': 'Laptop-friendly',
  'power-outlets': 'Enchufes',
  'outdoor-seating': 'Terraza',
  'pet-friendly': 'Admite mascotas',
  'vegan-options': 'Opciones veganas',
  accessible: 'Accesible',
};

export const PRICE_RANGES = ['€', '€€', '€€€'] as const;
export type PriceRange = (typeof PRICE_RANGES)[number];

export const CAFE_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;
export type CafeStatus = (typeof CAFE_STATUSES)[number];

export const USER_ROLES = ['USER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export const DEFAULT_RADIUS_KM = 5;
export const MAX_RADIUS_KM = 50;
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
