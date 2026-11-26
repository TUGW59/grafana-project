import type { PanelData } from '@grafana/data';
import { finiteNum, frameRows, str } from './frameRows';

export interface PreviewObservation {
  id: string; speciesId: string; latitude: number; longitude: number;
  country: string; continent: string; biome: string; observedAt: string;
  photoUrl: string; photoLicense: string; photoAttribution: string; observer: string;
  observationLicense: string; sourceUrl: string; photoSourceUrl: string; ecoregion: string;
}
// Harici bağlantılar yalnız beklenen HTTPS kaynaklarına yönelir.
export function sourceLink(value: unknown, type: 'observation' | 'photo' | 'image' | 'taxonomy'): string {
  const text = str(value);
  const patterns = {
    observation: /^https:\/\/www\.inaturalist\.org\/observations\/\d+$/,
    photo: /^https:\/\/www\.inaturalist\.org\/photos\/\d+$/,
    image: /^https:\/\/inaturalist-open-data\.s3\.amazonaws\.com\/photos\/\d+\/(square|small|medium|large)\.jpg$/,
    taxonomy: /^https:\/\/powo\.science\.kew\.org\/taxon\/[\w.-]+$/,
  };
  return patterns[type].test(text) ? text : '';
}
export function previewObservations(data: PanelData): PreviewObservation[] {
  const seen = new Set<string>();
  return frameRows(data, 'A').flatMap(row => {
    const id = str(row.id); const speciesId = str(row.speciesId);
    const latitude = finiteNum(row.latitude); const longitude = finiteNum(row.longitude);
    // Aday önizlemede kurgusal kayıtları veya geçersiz koordinatı kabul etme.
    if (!/^inat-\d+$/.test(id) || seen.has(id) || !speciesId || latitude === null || longitude === null || Math.abs(latitude)>90 || Math.abs(longitude)>180 || !sourceLink(row.sourceUrl, 'observation')) {
      return [];
    }
    seen.add(id);
    return [{ id, speciesId, latitude, longitude, country:str(row.country), continent:str(row.continent), biome:str(row.biome), observedAt:str(row.observedAt), photoUrl:sourceLink(row.photoUrl,'image'), photoLicense:str(row.photoLicense), photoAttribution:str(row.photoAttribution), observer:str(row.observer), observationLicense:str(row.observationLicense), sourceUrl:sourceLink(row.sourceUrl,'observation'), photoSourceUrl:sourceLink(row.photoSourceUrl,'photo'), ecoregion:str(row.ecoregion) }];
  });
}
