// UID tabanlı bağlantılar: slug ve Grafana değişkenlerinin zamanlamasına bağımlı değil.
export function candidateStoryUrl(speciesId: string, observationId: string, filters: Record<string, string>): string {
  const params = new URLSearchParams({ 'var-flowerId': speciesId, 'var-observationId': observationId });
  for (const key of ['continent', 'biome', 'month', 'species']) { params.set(`var-${key}`, filters[key] || '__all__'); }
  return `/d/bloomatlas-story-preview?${params.toString()}`;
}
