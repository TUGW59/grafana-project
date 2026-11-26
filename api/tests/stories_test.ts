import { storyResponse, validateStoryDataset } from '../src/stories.ts';
const species = [{ id: 'test-plant', scientificName: 'Test plant' }];
const fixture = { dataVersion: 'test', status: 'candidate_not_publication_approved', items: [{ speciesId: 'test-plant', scientificName: 'Test plant', nameOrigin: { text: 'Example', scope: 'Naming', status: 'source_checked_draft', sources: [{ publisher: 'Example', url: 'https://example.org', accessedAt: '2026-11-27' }] } }] };
function assert(value: unknown) { if (!value) { throw new Error('Assertion failed'); } }
Deno.test('story dataset requires exact species and valid evidence', () => {
  assert(validateStoryDataset(fixture, species) === fixture);
  let rejected = false;
  try { validateStoryDataset(fixture, [{ id: 'test-plant', scientificName: 'Wrong' }]); } catch { rejected = true; }
  assert(rejected);
});
Deno.test('story endpoint returns sourced rows and preserves candidate status', async () => {
  const res = storyResponse(new Request('http://localhost/v1/stories/test-plant'), fixture)!;
  const data = await res.json();
  assert(res.status === 200 && data.items.length === 1 && data.items[0].sourceUrl === 'https://example.org' && data.mode === fixture.status);
});
Deno.test('story list, missing story, unrelated route and method', async () => {
  assert((await storyResponse(new Request('http://localhost/v1/stories'), fixture)!.json()).items.length === 1);
  assert(storyResponse(new Request('http://localhost/v1/stories/nope'), fixture)?.status === 404);
  assert(storyResponse(new Request('http://localhost/v1/stories', { method: 'POST' }), fixture)?.status === 405);
  assert(storyResponse(new Request('http://localhost/v1/health'), fixture) === undefined);
});
