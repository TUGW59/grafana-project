import { validateSnapshot, type BloomAtlasSnapshot } from '../mod.ts';
const fixtureUrl = new URL('../../../data/fixtures/demo.snapshot.json', import.meta.url);
async function fixture(): Promise<BloomAtlasSnapshot> {
  return JSON.parse(await Deno.readTextFile(fixtureUrl));
}
function assert(test: boolean, message: string): void {
  if (!test) throw new Error(message);
}
Deno.test('12-species fictional demo snapshot passes schema and references', async () => {
  const data = await fixture();
  assert(data.species.length === 12, 'expected 12 species');
  assert(data.observations.length === 12, 'expected 12 demo observations');
  assert(validateSnapshot(data).length === 0, validateSnapshot(data).join('\n'));
});
Deno.test('orphan species references are rejected', async () => {
  const data = await fixture();
  data.observations[0].speciesId = 'missing-id';
  assert(validateSnapshot(data).some((e) => e.includes('unknown speciesId')), 'orphan was accepted');
});
Deno.test('duplicate observations are rejected', async () => {
  const data = await fixture();
  data.observations[1].id = data.observations[0].id;
  assert(validateSnapshot(data).some((e) => e.includes('duplicate observation id')), 'duplicate was accepted');
});
Deno.test('incorrect coordinates are rejected', async () => {
  const data = await fixture();
  data.observations[0].latitude = 999;
  assert(validateSnapshot(data).some((e) => e.includes('coordinates out of bounds')), 'invalid coordinates accepted');
});
Deno.test('demo data cannot masquerade as verified', async () => {
  const data = await fixture();
  data.manifest.mode = 'verified';
  assert(validateSnapshot(data).some((e) => e.includes('verified snapshot contains a demo record')), 'false provenance accepted');
});
