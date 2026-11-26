import { galleryResponse, validateGallery } from '../src/gallery.ts';
const row = { speciesId: 'test', scientificName: 'Test plant', rank: 1, fileTitle: 'File:Test.jpg', filePage: 'https://commons.wikimedia.org/wiki/File:Test.jpg', previewUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Test.jpg', width: 900, height: 800, artist: 'Example', credit: 'Own work', licenseName: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0', status: 'metadata_shortlisted_pending_visual_review' };
const species = [{ id: 'test', scientificName: 'Test plant' }];
const dataset = { dataVersion: 'test', status: 'candidate_not_publication_approved', items: [row, { ...row, rank: 2, filePage: 'https://commons.wikimedia.org/wiki/File:Test2.jpg' }] };
function assert(ok: unknown) { if (!ok) { throw new Error('Assertion failed'); } }
Deno.test('gallery covers exact species and rejects duplicates', () => {
  assert(validateGallery(dataset, species) === dataset);
  let rejected = false;
  try { validateGallery({ ...dataset, items: [row, row] }, species); } catch { rejected = true; }
  assert(rejected);
});
Deno.test('gallery endpoint preserves candidate status and attribution', async () => {
  const result = await galleryResponse(new Request('http://localhost/v1/gallery/test'), dataset)!.json();
  assert(result.mode === dataset.status && result.items.length === 2 && result.items[0].artist === 'Example');
});
Deno.test('gallery missing species, non-GET and unrelated route', () => {
  assert(galleryResponse(new Request('http://localhost/v1/gallery/nope'), dataset)?.status === 404);
  assert(galleryResponse(new Request('http://localhost/v1/gallery', { method: 'POST' }), dataset)?.status === 405);
  assert(galleryResponse(new Request('http://localhost/v1/stories'), dataset) === undefined);
});
