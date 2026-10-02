import {
  type Amenity,
  type BrewMethod,
  DEFAULT_RADIUS_KM,
  type PriceRange,
} from '@coffeeroute/shared';
import { create } from 'zustand';

export interface Filters {
  openNow: boolean;
  brewMethods: BrewMethod[];
  amenities: Amenity[];
  priceRange: PriceRange[];
  radiusKm: number;
}

const DEFAULT_FILTERS: Filters = {
  openNow: false,
  brewMethods: [],
  amenities: [],
  priceRange: [],
  radiusKm: DEFAULT_RADIUS_KM,
};

interface FiltersState extends Filters {
  toggle: <K extends 'brewMethods' | 'amenities' | 'priceRange'>(key: K, value: Filters[K][number]) => void;
  setOpenNow: (value: boolean) => void;
  setRadius: (km: number) => void;
  reset: () => void;
}

export const useFilters = create<FiltersState>((set) => ({
  ...DEFAULT_FILTERS,
  toggle: (key, value) =>
    set((state) => {
      const current = state[key] as string[];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { [key]: next } as Partial<Filters>;
    }),
  setOpenNow: (openNow) => set({ openNow }),
  setRadius: (radiusKm) => set({ radiusKm }),
  // Radius is a search setting rather than a filter, so "clear filters" keeps it.
  reset: () => set((state) => ({ ...DEFAULT_FILTERS, radiusKm: state.radiusKm })),
}));

/** Number of active filters, shown as a badge on the filter button. */
export const activeFilterCount = (f: Filters) =>
  (f.openNow ? 1 : 0) + f.brewMethods.length + f.amenities.length + f.priceRange.length;
