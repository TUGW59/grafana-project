import type { BotanicalProfile } from '../data/botanicalProfiles';
import { rankNeighbors } from './bloomOracle';

// Genus ismi sıralama algoritmasının dört özelliğinde kullanılmaz.
// Ancak familya ile ilişkili olduğu için bu deney bağımsız botanik doğruluk ölçümü değildir.
const genus = (p: BotanicalProfile) => p.scientificName.split(' ')[0];
export function benchmark(catalog: BotanicalProfile[], queryIds: string[]) {
  const cases = queryIds.map(id => {
    const query = catalog.find(p => p.id === id);
    if (!query) { throw new Error(`Missing query ${id}`); }
    const relevant = catalog.filter(p => p.id !== id && genus(p) === genus(query));
    const weighted = rankNeighbors(query, catalog).map(n => n.profile.id);
    const baseline = catalog.filter(p => p.id !== id).sort((a, b) => Number(b.family === query.family) - Number(a.family === query.family) || a.id.localeCompare(b.id)).slice(0, 3).map(p => p.id);
    const metrics = (ids: string[]) => {
      const flags = ids.map(x => relevant.some(p => p.id === x));
      const first = flags.indexOf(true);
      return { hit: Number(first >= 0), precision: flags.filter(Boolean).length / 3, reciprocalRank: first < 0 ? 0 : 1 / (first + 1) };
    };
    return { id, relevant: relevant.map(p => p.id), weighted, baseline, weightedMetrics: metrics(weighted), baselineMetrics: metrics(baseline) };
  }).filter(c => c.relevant.length > 0);
  const summarize = (key: 'weightedMetrics' | 'baselineMetrics') => ({ hitAt3: cases.reduce((s, c) => s + c[key].hit, 0) / (cases.length || 1), precisionAt3: cases.reduce((s, c) => s + c[key].precision, 0) / (cases.length || 1), mrrAt3: cases.reduce((s, c) => s + c[key].reciprocalRank, 0) / (cases.length || 1) });
  return { queryCount: cases.length, weighted: summarize('weightedMetrics'), baseline: summarize('baselineMetrics'), cases };
}
