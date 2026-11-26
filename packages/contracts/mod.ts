/** BloomAtlas v0.1 contract foundation; works without third-party libraries.
 * Demo fixtures MUST NOT be presented as scientific observations.
 */
export type DatasetMode = 'demo' | 'verified';
export type ObservationSource = 'demo' | 'iNaturalist';

export interface Source {
  name: string;
  url: string;
  license: string | null;
  accessedAt: string | null;
}

export interface Species {
  id: string;
  scientificName: string;
  commonName: string;
  family: string | null;
  sources: Source[];
}

export interface Observation {
  id: string;
  speciesId: string;
  source: ObservationSource;
  demo: boolean;
  latitude: number;
  longitude: number;
  observedAt: string | null;
  observationMonth: number | null;
  country: string | null;
  continent: string | null;
  biome: string | null;
  photoUrl: string | null;
  photoLicense: string | null;
  photoAttribution: string | null;
  observationLicense: string | null;
  sourceUrl: string | null;
}

export interface DataManifest {
  dataVersion: string;
  mode: DatasetMode;
  generatedAt: string | null;
  sourceVersions: Record<string, string>;
}

export interface BloomAtlasSnapshot {
  manifest: DataManifest;
  species: Species[];
  observations: Observation[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Returns precise validation errors instead of throwing or hiding bad data. */
export function validateSnapshot(value: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ['snapshot must be an object'];
  const manifest = value.manifest;
  if (!isRecord(manifest) || !isNonemptyString(manifest.dataVersion) ||
      (manifest.mode !== 'demo' && manifest.mode !== 'verified')) {
    errors.push('manifest must include dataVersion and mode');
  }
  if (!Array.isArray(value.species)) errors.push('species must be an array');
  if (!Array.isArray(value.observations)) errors.push('observations must be an array');
  if (errors.length > 0) return errors;

  const mode = (manifest as Record<string, unknown>).mode;
  const speciesIds = new Set<string>();
  for (const [index, species] of (value.species as unknown[]).entries()) {
    const path = `species[${index}]`;
    if (!isRecord(species) || !isNonemptyString(species.id) ||
        !isNonemptyString(species.scientificName) || !isNonemptyString(species.commonName)) {
      errors.push(`${path}: invalid identity`);
      continue;
    }
    if (speciesIds.has(species.id)) errors.push(`${path}: duplicate species id ${species.id}`);
    speciesIds.add(species.id);
    if (!Array.isArray(species.sources)) errors.push(`${path}: sources must be an array`);
  }

  const observationIds = new Set<string>();
  for (const [index, obs] of (value.observations as unknown[]).entries()) {
    const path = `observations[${index}]`;
    if (!isRecord(obs) || !isNonemptyString(obs.id) || !isNonemptyString(obs.speciesId)) {
      errors.push(`${path}: invalid identity`);
      continue;
    }
    if (observationIds.has(obs.id)) errors.push(`${path}: duplicate observation id ${obs.id}`);
    observationIds.add(obs.id);
    if (!speciesIds.has(obs.speciesId)) errors.push(`${path}: unknown speciesId ${obs.speciesId}`);
    if (typeof obs.latitude !== 'number' || !Number.isFinite(obs.latitude) || obs.latitude < -90 || obs.latitude > 90 ||
        typeof obs.longitude !== 'number' || !Number.isFinite(obs.longitude) || obs.longitude < -180 || obs.longitude > 180) {
      errors.push(`${path}: coordinates out of bounds`);
    }
    if (obs.observationMonth !== null &&
        (typeof obs.observationMonth !== 'number' || !Number.isInteger(obs.observationMonth) || (obs.observationMonth as number) < 1 || (obs.observationMonth as number) > 12)) {
      errors.push(`${path}: invalid observationMonth`);
    }
    if (mode === 'demo' && (obs.demo !== true || obs.source !== 'demo')) {
      errors.push(`${path}: demo snapshot cannot contain scientific records`);
    }
    if (mode === 'verified') {
      if (obs.demo !== false || obs.source === 'demo') errors.push(`${path}: verified snapshot contains a demo record`);
      if (!isNonemptyString(obs.sourceUrl) || !isNonemptyString(obs.observedAt)) {
        errors.push(`${path}: verified observation needs source URL and date`);
      }
      if (obs.photoUrl !== null && (!isNonemptyString(obs.photoLicense) || !isNonemptyString(obs.photoAttribution))) {
        errors.push(`${path}: photo requires license and attribution`);
      }
    }
  }
  return errors;
}
