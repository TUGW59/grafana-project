import { MOCK_SPECIES } from '../data/mockData';
import { findObservation, findSpecies, getLayout, resolveFlowerId } from './story';

describe('resolveFlowerId', () => {
  it('uses the default flower when the variable is missing or empty', () => {
    expect(resolveFlowerId('${flowerId}')).toBe('rosa-canina');
    expect(resolveFlowerId('  ')).toBe('rosa-canina');
  });

  it('keeps a real flower ID', () => {
    expect(resolveFlowerId('protea-cynaroides')).toBe('protea-cynaroides');
  });
});

describe('findSpecies', () => {
  it('finds a flower by its ID', () => {
    expect(findSpecies('rosa-canina')?.scientificName).toBe('Rosa canina');
  });

  it('returns nothing for an unknown ID', () => {
    expect(findSpecies('invalid-flower')).toBeUndefined();
  });

  it('has a unique ID for every mock flower', () => {
    const ids = MOCK_SPECIES.map((species) => species.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('findObservation', () => {
  it('returns nothing when a flower has no observation', () => {
    expect(findObservation('passiflora-caerulea')).toBeUndefined();
  });
});

describe('getLayout', () => {
  it('picks the layout from the panel width', () => {
    expect(getLayout(1200)).toBe('wide');
    expect(getLayout(800)).toBe('medium');
    expect(getLayout(500)).toBe('narrow');
  });
});
