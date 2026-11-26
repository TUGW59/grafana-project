import { type BloomAtlasSnapshot } from '../../packages/contracts/mod.ts';
import { createApp } from '../src/app.ts';

const fixture = new URL('../../data/fixtures/demo.snapshot.json', import.meta.url);
const data = JSON.parse(await Deno.readTextFile(fixture)) as BloomAtlasSnapshot;
const app = createApp(data);

function expect(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
async function get(path: string): Promise<{ status: number; body: any }> {
  const response = app(new Request(`http://localhost:8000${path}`));
  return { status: response.status, body: await response.json() };
}

Deno.test('health and metadata expose demo provenance', async () => {
  const h = await get('/health');
  const m = await get('/v1/metadata');
  expect(h.status === 200 && h.body.status === 'ok', 'health failed');
  expect(m.status === 200 && m.body.manifest.mode === 'demo', 'dataset mode hidden');
  expect(m.body.counts.species === 12 && m.body.counts.observations === 12, 'count mismatch');
});
Deno.test('species list contains 12 and supports pagination', async () => {
  const full = await get('/v1/species');
  const page = await get('/v1/species?limit=3&offset=2');
  expect(full.status === 200 && full.body.total === 12, 'unexpected species count');
  expect(page.status === 200 && page.body.items.length === 3 && page.body.offset === 2, 'bad pagination');
});
Deno.test('a known species can be fetched by canonical ID', async () => {
  const r = await get('/v1/species/rosa-canina');
  expect(r.status === 200 && r.body.item.scientificName === 'Rosa canina', 'wrong species');
});
Deno.test('unknown species returns 404 with stable error code', async () => {
  const r = await get('/v1/species/not-a-species');
  expect(r.status === 404 && r.body.error.code === 'SPECIES_NOT_FOUND', 'wrong 404');
});
Deno.test('observations filters apply AND semantics', async () => {
  const r = await get('/v1/observations?continent=Europe&month=6&speciesId=rosa-canina');
  expect(r.status === 200 && r.body.total === 1, 'expected single rose');
  expect(r.body.items[0].speciesId === 'rosa-canina', 'wrong filtered item');
});
Deno.test('valid filters with no matches return 200 and empty list', async () => {
  const r = await get('/v1/observations?continent=Oceania&speciesId=rosa-canina');
  expect(r.status === 200 && r.body.total === 0 && r.body.items.length === 0, 'empty state failed');
});
Deno.test('bad month and bad pagination return 400', async () => {
  const month = await get('/v1/observations?month=13');
  const page = await get('/v1/species?limit=9999');
  expect(month.status === 400 && month.body.error.code === 'INVALID_MONTH', 'invalid month accepted');
  expect(page.status === 400 && page.body.error.code === 'INVALID_PAGINATION', 'invalid page accepted');
});
Deno.test('filters endpoint is derived from snapshot', async () => {
  const r = await get('/v1/filters');
  expect(r.status === 200 && r.body.mode === 'demo', 'filters mode missing');
  expect(r.body.continents.includes('Asia') && r.body.species.length === 12, 'filters incorrect');
});
Deno.test('unsupported path and method fail safely', async () => {
  const p = await get('/v1/unknown');
  const method = app(new Request('http://localhost:8000/v1/species', { method: 'POST' }));
  expect(p.status === 404 && p.body.error.code === 'NOT_FOUND', 'unknown path accepted');
  expect(method.status === 405, 'POST unexpectedly accepted');
});
Deno.test('invalid dataset cannot start the API', () => {
  const invalid = structuredClone(data);
  invalid.observations[0].speciesId = 'nonexistent';
  let rejected = false;
  try { createApp(invalid); } catch { rejected = true; }
  expect(rejected, 'invalid dataset accepted');
});
