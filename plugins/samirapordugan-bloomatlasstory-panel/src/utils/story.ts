import { DEFAULT_FLOWER_ID } from '../constants';
import { MOCK_OBSERVATIONS, MOCK_SPECIES } from '../data/mockData';
import { Observation, Species } from '../data/model';

export type Layout = 'wide' | 'medium' | 'narrow';

export function resolveFlowerId(raw: string): string {
  const value = raw.trim();
  if (value === '' || value.startsWith('$')) {
    return DEFAULT_FLOWER_ID;
  }
  return value;
}

export function findSpecies(id: string): Species | undefined {
  return MOCK_SPECIES.find((species) => species.id === id);
}

export function findObservation(speciesId: string): Observation | undefined {
  return MOCK_OBSERVATIONS.find((observation) => observation.speciesId === speciesId);
}

export function getLayout(width: number): Layout {
  if (width >= 1100) {
    return 'wide';
  }
  if (width >= 700) {
    return 'medium';
  }
  return 'narrow';
}
