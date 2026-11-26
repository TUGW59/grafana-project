// URL parametresi varsa kullan; yoksa Grafana interpolasyonuna dön. Yanlış kimliği demo türe çevirmeyiz.
export function readCandidateSelection(search: string, flower: string, observation: string) {
  const params = new URLSearchParams(search);
  const rawFlower = params.get('var-flowerId') ?? flower;
  const rawObservation = params.get('var-observationId') ?? observation;
  return { flowerId: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawFlower) ? rawFlower : '', observationId: rawObservation === '${observationId}' || rawObservation === '__all__' ? '' : rawObservation };
}
export function nameOriginRows(rows: Array<Record<string, unknown>>, id: string, scientificName: string) {
  return rows.filter(row => row.speciesId === id && row.scientificName === scientificName && row.status === 'source_checked_draft' && typeof row.text === 'string' && typeof row.scope === 'string' && typeof row.publisher === 'string' && typeof row.accessedAt === 'string' && typeof row.sourceUrl === 'string' && /^https:\/\/[^\s]+$/.test(row.sourceUrl));
}
