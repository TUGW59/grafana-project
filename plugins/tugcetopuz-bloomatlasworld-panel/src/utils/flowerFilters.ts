import type { FlowerObservation } from '../data/mockFlowers';

export interface FlowerFilters {
  continent: string;
  biome: string;
  month: string;
  species: string;
}
export const ALL_FILTERS: FlowerFilters = { continent: '', biome: '', month: '', species: '' };

export function filterObservations(items: readonly FlowerObservation[], filters: FlowerFilters): FlowerObservation[] {
  return items.filter((item) =>
    (!filters.continent || item.continent === filters.continent) &&
    (!filters.biome || item.biome === filters.biome) &&
    (!filters.month || item.observationMonth === Number(filters.month)) &&
    (!filters.species || item.flowerId === filters.species)
  );
}

export function mapPoint(longitude: number, latitude: number): {x: number; y: number} {
  return { x: (longitude + 180) * (960 / 360), y: (90 - latitude) * (480 / 180) };
}
