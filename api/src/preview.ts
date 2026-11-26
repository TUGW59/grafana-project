import { createApp } from './app.ts';
import { serveReplay } from './replay.ts';
import { storyResponse, validateStoryDataset } from './stories.ts';
import { galleryResponse, validateGallery } from './gallery.ts';
import gallerySeed from '../../data/story/gallery.candidate.json' with { type: 'json' };
import storySeed from '../../data/story/name-origins.candidate.json' with { type: 'json' };
import { type BloomAtlasSnapshot, validateSnapshot } from '../../packages/contracts/mod.ts';

// Bu giriş noktası yalnız yerel aday önizleme ortamına aittir.
const path = Deno.args[0];
if (!path) { throw new Error('Aday snapshot yolu gerekli'); }
const snapshot = JSON.parse(await Deno.readTextFile(path)) as BloomAtlasSnapshot;
const errors = validateSnapshot(snapshot);
if (errors.length || snapshot.manifest.mode !== 'verified' || !snapshot.manifest.dataVersion.includes('candidate') || !snapshot.observations.length) {
  throw new Error(`Geçersiz aday snapshot: ${errors.join('; ')}`);
}
const stories = validateStoryDataset(storySeed, snapshot.species);
const gallery = validateGallery(gallerySeed, snapshot.species);
const app = createApp(snapshot);
const values = (items: Array<string | null>) => [...new Set(items.filter((x): x is string => !!x))].sort();
const filters = [
  ...values(snapshot.observations.map(o => o.continent)).map(value => ({ kind: 'continent', value, label: value })),
  ...values(snapshot.observations.map(o => o.biome)).map(value => ({ kind: 'biome', value, label: value })),
  ...[...new Set(snapshot.observations.map(o => o.observationMonth).filter((x): x is number => x !== null))].sort((a,b) => a-b)
    .map(month => ({ kind: 'month', value: String(month), label: new Date(Date.UTC(2026, month-1, 1)).toLocaleString('en', {month:'long', timeZone:'UTC'}) })),
  ...snapshot.species.map(s => ({kind:'species', value:s.id, label:s.scientificName})).sort((a,b) => a.label.localeCompare(b.label)),
  { kind: 'manifest', value: snapshot.manifest.dataVersion, label: 'Local candidate — not publication approved' },
];
Deno.serve({hostname:'0.0.0.0', port:8000}, request => {
  const galleryResult = galleryResponse(request, gallery);
  if (galleryResult) { return galleryResult; }
  const story = storyResponse(request, stories);
  if (story) { return story; }
  if (new URL(request.url).pathname === '/v1/replay') { return serveReplay(request, snapshot.observations); }
  // Aynı DataFrame sorgusu filtre seçeneklerini ve aday sürüm bilgisini getirir.
  if (request.method === 'GET' && new URL(request.url).pathname === '/v1/preview-options') {
    return Response.json({ items: filters }, {headers:{'Cache-Control':'no-store'}});
  }
  return app(request);
});
