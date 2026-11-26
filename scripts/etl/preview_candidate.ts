import { createApp } from '../../api/src/app.ts';
import { type BloomAtlasSnapshot, validateSnapshot } from '../../packages/contracts/mod.ts';

// Aday veriyi mevcut API ile geçici loopback sunucusunda test et.
// Üretim/demo main.ts ve Docker ayarları değiştirilmez.
const path = Deno.args[0];
if (!path) throw new Error('Aday JSON yolu gerekli');
const snapshot = JSON.parse(await Deno.readTextFile(path)) as BloomAtlasSnapshot;
const errors = validateSnapshot(snapshot);
if (errors.length || snapshot.manifest.mode !== 'verified' || !snapshot.observations.length) {
  throw new Error(`Geçersiz aday: ${errors.join('; ')}`);
}
const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => {} }, createApp(snapshot));
const base = `http://127.0.0.1:${server.addr.port}`;
function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`[OK] ${message}`);
}
async function get(route: string) {
  const response = await fetch(base + route);
  if (!response.ok) throw new Error(`${route}: ${response.status}`);
  return await response.json();
}
try {
  const meta = await get('/v1/metadata');
  assert(meta.counts.species === snapshot.species.length && meta.counts.observations === snapshot.observations.length, 'API aday metadata sayıları');
  const species = await get('/v1/species?limit=200');
  assert(species.total === snapshot.species.length && species.items.every((s: {family: string | null}) => !!s.family), 'Tür kataloğu ve familyalar');
  const obs = await get('/v1/observations?limit=200');
  assert(obs.total === snapshot.observations.length && obs.items.length === snapshot.observations.length && obs.items.every((o: {demo: boolean}) => o.demo === false), 'Gerçek aday gözlem listesi; demo kayıt yok');
  const example = snapshot.observations.find(o => o.biome && o.continent) ?? snapshot.observations[0];
  const params = new URLSearchParams({speciesId:example.speciesId,limit:'200'});
  if (example.biome) params.set('biome',example.biome);
  if (example.continent) params.set('continent',example.continent);
  const expected = snapshot.observations.filter(o => o.speciesId === example.speciesId && (!example.biome || o.biome === example.biome) && (!example.continent || o.continent === example.continent));
  const filtered = await get('/v1/observations?' + params.toString());
  assert(filtered.total === expected.length && filtered.items.map((o:{id:string}) => o.id).sort().join(',') === expected.map(o => o.id).sort().join(','), 'Tür/biyom/kıta birleşik filtre');
  const filters = await get('/v1/filters');
  assert(filters.biomes.length === new Set(snapshot.observations.map(o=>o.biome).filter(Boolean)).size, 'Biyom seçenekleri API verisinden türetiliyor');
  const empty = await get('/v1/observations?speciesId=nonexistent-candidate-test');
  assert(empty.total === 0 && empty.items.length === 0, 'Boş sonuç doğru');
} finally {
  await server.shutdown();
}
console.log('[PASS] Aday veri için izole HTTP smoke testi. Yayın/üretim onayı değildir.');
