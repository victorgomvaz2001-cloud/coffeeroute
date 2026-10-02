import { activeFilterCount, useFilters } from '../store/filters';

describe('filters store', () => {
  beforeEach(() => useFilters.getState().reset());

  it('toggles values in and out', () => {
    useFilters.getState().toggle('brewMethods', 'espresso');
    useFilters.getState().toggle('brewMethods', 'siphon');
    useFilters.getState().toggle('brewMethods', 'espresso');
    expect(useFilters.getState().brewMethods).toEqual(['siphon']);
  });

  it('counts active filters but not the radius', () => {
    const s = useFilters.getState();
    s.setOpenNow(true);
    s.toggle('amenities', 'wifi');
    s.toggle('priceRange', '€');
    s.setRadius(10);
    expect(activeFilterCount(useFilters.getState())).toBe(3);
  });

  it('reset keeps the chosen radius', () => {
    useFilters.getState().setRadius(25);
    useFilters.getState().toggle('amenities', 'wifi');
    useFilters.getState().reset();
    expect(useFilters.getState()).toMatchObject({ radiusKm: 25, amenities: [] });
  });
});
