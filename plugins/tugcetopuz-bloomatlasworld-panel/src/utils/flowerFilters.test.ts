import { ALL_FILTERS, filterObservations, mapPoint } from './flowerFilters';
import { MOCK_OBSERVATIONS } from '../data/mockFlowers';

describe('World Explorer demo filters', () => {
  it('shows exactly twelve demo observations by default', () => {
    expect(filterObservations(MOCK_OBSERVATIONS, ALL_FILTERS)).toHaveLength(12);
  });
  it('combines filters with AND logic', () => {
    const result = filterObservations(MOCK_OBSERVATIONS, {continent:'Europe',biome:'Mediterranean',month:'7',species:''});
    expect(result.map(item => item.flowerId)).toEqual(['lavandula-angustifolia']);
  });
  it('produces no results for impossible filter combinations', () => {
    expect(filterObservations(MOCK_OBSERVATIONS,{continent:'Oceania',biome:'Alpine',month:'',species:''})).toEqual([]);
  });
  it('projects prime meridian and equator to map center', () => {
    expect(mapPoint(0,0)).toEqual({x:480,y:240});
  });
});
