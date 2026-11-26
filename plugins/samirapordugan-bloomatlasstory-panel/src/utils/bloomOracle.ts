import type { BotanicalProfile } from '../data/botanicalProfiles';

export interface FeatureEvidence { label: string; left: string; right: string; similarity: number; weight: number; }
export interface OracleNeighbor { profile: BotanicalProfile; similarity: number; coverage: number; evidence: FeatureEvidence[]; }
const totalWeight = 8;
export const oracleMinimumCatalog = 24;
export function rankNeighbors(query: BotanicalProfile, catalog: BotanicalProfile[], k = 3): OracleNeighbor[] {
  // Ağırlıklı karma özellik uzaklığı: 1 - similarity. Bilinmeyen alanlar eşleşme sayılmaz.
  const result: OracleNeighbor[] = [];
  const seen = new Set<string>([query.id]);
  for (const profile of catalog) {
    if (seen.has(profile.id)) { continue; }
    seen.add(profile.id);
    const evidence: FeatureEvidence[] = [];
    const add = (label: string, left: string, right: string, weight: number) => {
      if (left && right) { evidence.push({ label, left, right, similarity: left === right ? 1 : 0, weight }); }
    };
    add('Family', query.family, profile.family, 3);
    add('Growth description', query.growthForm, profile.growthForm, 2);
    add('Broad climate', query.climate, profile.climate, 2);
    if (query.nativeRegions.length && profile.nativeRegions.length) {
      const a = new Set(query.nativeRegions);
      const b = new Set(profile.nativeRegions);
      const overlap = [...a].filter(region => b.has(region)).length;
      evidence.push({ label: 'Native region overlap', left: [...a].join(', '), right: [...b].join(', '), similarity: overlap / new Set([...a, ...b]).size, weight: 1 });
    }
    if (evidence.length < 3) { continue; }
    const weight = evidence.reduce((sum, x) => sum + x.weight, 0);
    const similarity = evidence.reduce((sum, x) => sum + x.weight * x.similarity, 0) / weight;
    // Tamamen farklı kayıtları sırf ilk üçü doldurmak için önerme.
    if (similarity > 0) { result.push({ profile, similarity, coverage: weight / totalWeight, evidence }); }
  }
  return result.sort((a, b) => b.similarity - a.similarity || b.coverage - a.coverage || (a.profile.id < b.profile.id ? -1 : a.profile.id > b.profile.id ? 1 : 0)).slice(0, Math.max(0, Math.floor(k)));
}
