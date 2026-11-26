import { chooseComparison, comparisonChoices } from './observationComparison';

const a = { id: 'a', speciesId: 'rose' };
const b = { id: 'b', speciesId: 'rose' };
const c = { id: 'c', speciesId: 'lotus' };

describe('Observation comparison', () => {
  it('excludes the selected record and prefers another species', () => {
    expect(comparisonChoices([a, b, c], a)).toEqual([c, b]);
  });
  it('preserves an available manual choice', () => {
    expect(chooseComparison(comparisonChoices([a, b, c], a), 'b')).toEqual(b);
  });
  it('falls back to an available choice after filtering', () => {
    expect(chooseComparison(comparisonChoices([a, c], a), 'b')).toEqual(c);
  });
  it('does not invent a second record', () => {
    expect(chooseComparison(comparisonChoices([a], a), 'b')).toBeUndefined();
  });
});
