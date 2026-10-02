import {
  type CafeSummary,
  DEFAULT_VISIT_MINUTES,
  MAX_ROUTE_CAFES,
  type RouteDetail,
} from '@coffeeroute/shared';
import { create } from 'zustand';

/** The route being built or edited (UC2). Lives across Explore, café detail and the editor. */
interface RouteDraftState {
  /** Set when editing an existing route instead of creating one. */
  routeId: string | null;
  name: string;
  visitMinutes: number;
  cafes: CafeSummary[];
  notes: Record<string, string>;
  has: (cafeId: string) => boolean;
  /** Returns false when the route is already full. */
  toggle: (cafe: CafeSummary) => boolean;
  remove: (cafeId: string) => void;
  move: (cafeId: string, direction: -1 | 1) => void;
  setOrder: (cafeIds: string[]) => void;
  setNote: (cafeId: string, note: string) => void;
  setName: (name: string) => void;
  setVisitMinutes: (minutes: number) => void;
  loadRoute: (route: RouteDetail) => void;
  reset: () => void;
}

const EMPTY = {
  routeId: null,
  name: '',
  visitMinutes: DEFAULT_VISIT_MINUTES,
  cafes: [],
  notes: {},
};

export const useRouteDraft = create<RouteDraftState>((set, get) => ({
  ...EMPTY,
  has: (cafeId) => get().cafes.some((c) => c.id === cafeId),
  toggle: (cafe) => {
    const { cafes } = get();
    if (cafes.some((c) => c.id === cafe.id)) {
      set({ cafes: cafes.filter((c) => c.id !== cafe.id) });
      return true;
    }
    if (cafes.length >= MAX_ROUTE_CAFES) return false;
    set({ cafes: [...cafes, cafe] });
    return true;
  },
  remove: (cafeId) => set((s) => ({ cafes: s.cafes.filter((c) => c.id !== cafeId) })),
  move: (cafeId, direction) =>
    set((s) => {
      const from = s.cafes.findIndex((c) => c.id === cafeId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= s.cafes.length) return s;
      const cafes = [...s.cafes];
      [cafes[from], cafes[to]] = [cafes[to]!, cafes[from]!];
      return { cafes };
    }),
  setOrder: (cafeIds) =>
    set((s) => {
      const byId = new Map(s.cafes.map((c) => [c.id, c]));
      return { cafes: cafeIds.map((id) => byId.get(id)).filter((c): c is CafeSummary => !!c) };
    }),
  setNote: (cafeId, note) => set((s) => ({ notes: { ...s.notes, [cafeId]: note } })),
  setName: (name) => set({ name }),
  setVisitMinutes: (visitMinutes) => set({ visitMinutes }),
  loadRoute: (route) =>
    set({
      routeId: route.id,
      name: route.name,
      visitMinutes: route.visitMinutes,
      // Closed cafés can't be re-saved; the editor shows them so the user can remove them.
      cafes: route.stops.map((s) => s.cafe),
      notes: Object.fromEntries(
        route.stops.filter((s) => s.notes).map((s) => [s.cafe.id, s.notes!]),
      ),
    }),
  reset: () => set(EMPTY),
}));
