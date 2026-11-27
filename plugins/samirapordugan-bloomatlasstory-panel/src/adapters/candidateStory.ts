import type { Observation, Species } from '../data/model';
import { finiteNum, str } from './frameRows';

type Row = Record<string, unknown>;
export function selectCandidate(rows: Row[], flowerId: string, observationId: string): Row | undefined {
  const matches = rows.filter(r => str(r.speciesId) === flowerId && /^inat-\d+$/.test(str(r.id)));
  // Açıkça istenen gözlem bulunamazsa başka bir gözlemi onun yerine göstermeyiz.
  return observationId ? matches.find(r => str(r.id) === observationId) : matches[0];
}
export function candidateSpecies(row: Row): Species {
  const taxonomy = str(row.taxonomyUrl);
  return { id: str(row.id), commonName: str(row.commonName), scientificName: str(row.scientificName), family: str(row.family) || 'Unresolved', continents: [], bloomMonths: [], inatTaxonId: null, habitat: null, cultivation: null, culturalStory: null, traditionalUse: null, sources: /^https:\/\/powo\.science\.kew\.org\/taxon\/[\w.-]+$/.test(taxonomy) ? [{ name: 'Kew taxonomy', url: taxonomy, license: 'License review pending' }] : [] };
}
export function candidateObservation(row: Row): Observation | undefined {
  const latitude = finiteNum(row.latitude);
  const longitude = finiteNum(row.longitude);
  const month = finiteNum(row.observationMonth);
  const sourceUrl = str(row.sourceUrl);
  if (latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || month === null || month < 1 || month > 12 || !/^https:\/\/www\.inaturalist\.org\/observations\/\d+$/.test(sourceUrl)) {
    return undefined;
  }
  const image = str(row.photoUrl);
  return { id: str(row.id), speciesId: str(row.speciesId), latitude, longitude, observedAt: str(row.observedAt), month, country: str(row.country) || 'Unresolved', continent: str(row.continent) || 'Unresolved', photoUrl: /^https:\/\/inaturalist-open-data\.s3\.amazonaws\.com\/photos\/\d+\/(square|small|medium|large)\.(jpg|jpeg|png)$/.test(image) ? image : null, photoLicense: str(row.photoLicense), photoAttribution: str(row.photoAttribution), sourceUrl };
}
export function worldReturnUrl(search: string, observationId: string): string {
  const input = new URLSearchParams(search);
  const output = new URLSearchParams();
  for (const key of ['continent', 'biome', 'month', 'species']) {
    output.set('var-' + key, input.get('var-' + key) || '__all__');
  }
  if (observationId) { output.set('var-observationId', observationId); }
  return '/d/bloomatlas-world-preview?' + output.toString();
}
