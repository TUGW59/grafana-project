// Kaynaklı isim kökeni koleksiyonu: gözlem verisinden bağımsızdır.
interface StorySource { publisher: string; url: string; accessedAt: string; }
interface NameOrigin { text: string; scope: string; status: string; sources: StorySource[]; }
interface StoryItem { speciesId: string; scientificName: string; nameOrigin: NameOrigin; }
interface StoryDataset { dataVersion: string; status: string; items: StoryItem[]; }
export function validateStoryDataset(dataset: StoryDataset, species: ReadonlyArray<{ id: string; scientificName: string }>) {
  if (dataset.status !== 'candidate_not_publication_approved' || !dataset.dataVersion || !Array.isArray(dataset.items)) { throw new Error('Invalid story manifest'); }
  const names = new Map(species.map(s => [s.id, s.scientificName]));
  const ids = new Set<string>();
  for (const item of dataset.items) {
    const n = item.nameOrigin;
    if (ids.has(item.speciesId) || names.get(item.speciesId) !== item.scientificName || !n?.text?.trim() || !n.scope?.trim() || n.status !== 'source_checked_draft' || !n.sources?.length) { throw new Error('Invalid story item: ' + item.speciesId); }
    ids.add(item.speciesId);
    for (const source of n.sources) {
      if (!source.publisher?.trim() || !/^https:\/\/[^\s]+$/.test(source.url) || !/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt)) { throw new Error('Invalid story source'); }
    }
  }
  if (ids.size !== names.size) { throw new Error('Story catalogue does not cover the candidate species'); }
  return dataset;
}
export function storyResponse(request: Request, dataset: StoryDataset): Response | undefined {
  const path = new URL(request.url).pathname;
  if (path !== '/v1/stories' && !path.startsWith('/v1/stories/')) { return undefined; }
  const headers = { 'Cache-Control': 'no-store' };
  if (request.method !== 'GET') { return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { ...headers, Allow: 'GET' } }); }
  const id = path === '/v1/stories' ? null : path.slice('/v1/stories/'.length);
  const selected = dataset.items.filter(item => id === null || item.speciesId === id);
  if (id !== null && !selected.length) { return Response.json({ error: 'STORY_NOT_FOUND' }, { status: 404, headers }); }
  // Infinity için kaynak başına düz satır: kaynaklar kaybolmaz, istemcide türe göre gruplanır.
  const items = selected.flatMap(item => item.nameOrigin.sources.map(source => ({ speciesId: item.speciesId, scientificName: item.scientificName, text: item.nameOrigin.text, scope: item.nameOrigin.scope, publisher: source.publisher, sourceUrl: source.url, accessedAt: source.accessedAt, status: item.nameOrigin.status, dataVersion: dataset.dataVersion })));
  return Response.json({ mode: dataset.status, dataVersion: dataset.dataVersion, items }, { headers });
}
