import { botanicalProfiles } from '../data/botanicalProfiles';
import { benchmark } from './oracleBenchmark';
import { rankNeighbors } from './bloomOracle';
const original = botanicalProfiles.slice(0, 11);
it('keeps the original query species and adds thirteen distinct reference profiles', () => {
  expect(botanicalProfiles).toHaveLength(24);
  expect(new Set(botanicalProfiles.map(p => p.taxonomyUrl)).size).toBe(24);
  expect(original.every(p => botanicalProfiles.slice(11).some(q => q.scientificName.split(' ')[0] === p.scientificName.split(' ')[0]))).toBe(true);
});
it('evaluates all eleven original queries against the fixed catalogue and baseline', () => {
  const result = benchmark(botanicalProfiles, original.map(p => p.id));
  expect(result.queryCount).toBe(11);
  expect(result.cases.every(c => !c.weighted.includes(c.id) && !c.baseline.includes(c.id))).toBe(true);
  for (const m of [result.weighted, result.baseline]) { expect(Object.values(m).every(n => n >= 0 && n <= 1)).toBe(true); }
});
it('returns reference-only candidates without fabricating observations', () => {
  const rows = rankNeighbors(original[1], botanicalProfiles);
  expect(rows.some(r => r.profile.id === 'lavandula-latifolia')).toBe(true);
  expect(rows.every(r => !('observationId' in r.profile))).toBe(true);
});
it('does not count a query without a genus peer in the evaluation denominator', () => {
  expect(benchmark([original[0]], [original[0].id]).queryCount).toBe(0);
});
