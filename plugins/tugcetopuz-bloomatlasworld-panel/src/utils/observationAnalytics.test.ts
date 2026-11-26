import { groupObservations, summarizeObservations, viewport } from './observationAnalytics';

const a = { id: 'a', speciesId: 'rose', latitude: 46, longitude: 1, country: 'France', continent: 'Europe', biome: 'Forest', observedAt: '2026-11-01' };
const b = { ...a, id: 'b', country: '', continent: '', biome: '', observedAt: '2026-02-30' };
const c = { ...a, id: 'c', speciesId: 'lotus', longitude: 100, observedAt: '2026-04-12' };

describe('Observation analytics', () => {
  it('counts records rather than inferring flowering periods', () => {
    const result = summarizeObservations([a, b, c]);
    expect(result.total).toBe(3);
    expect(result.species).toBe(2);
    expect(result.months[10]).toBe(1);
    expect(result.months[3]).toBe(1);
    expect(result.unknownMonth).toBe(1);
    expect(result.countryKnown).toBe(2);
    expect(result.biomeKnown).toBe(2);
    expect(result.continents).toEqual([['Europe', 2], ['Unresolved', 1]]);
  });
  it('handles zero matches', () => {
    const result = summarizeObservations([]);
    expect(result.total).toBe(0);
    expect(result.months).toEqual(Array(12).fill(0));
    expect(result.continents).toEqual([]);
  });
  it('retains every observation, even identical coordinates', () => {
    for (const zoom of [1, 2, 4, 8]) {
      const groups = groupObservations([a, b, c], zoom);
      expect(groups.flatMap(g => g.items.map(o => o.id)).sort()).toEqual(['a', 'b', 'c']);
      expect(groups.some(g => g.items.length === 2)).toBe(true);
    }
  });
  it('separates nearby observations as zoom increases', () => {
    const near = { ...a, id: 'near', longitude: 4 };
    expect(groupObservations([a, near], 1)).toHaveLength(1);
    expect(groupObservations([a, near], 8)).toHaveLength(2);
  });
  it('clamps zoom and pan to world bounds', () => {
    expect(viewport(-100, 1000, 0)).toEqual({ x: 480, y: 240, zoom: 1 });
    expect(viewport(-100, 1000, 20)).toEqual({ x: 60, y: 450, zoom: 8 });
  });
});
