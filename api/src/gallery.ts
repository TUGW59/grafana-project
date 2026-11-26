// Galeri yalnız aday referans fotoğrafları içerir; gözlem kanıtı değildir.
export interface GalleryRow {
  speciesId: string; scientificName: string; rank: number; fileTitle: string; filePage: string;
  previewUrl: string; width: number; height: number; artist: string; credit: string; licenseName: string;
  licenseUrl: string; status: string;
}
function httpsHost(raw: unknown, host: string, path: string): boolean {
  if (typeof raw !== 'string') { return false; }
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && u.hostname === host && !u.username && !u.password && !u.port && u.pathname.startsWith(path);
  } catch { return false; }
}
export function validGalleryRow(row: unknown): row is GalleryRow {
  if (!row || typeof row !== 'object') { return false; }
  const r = row as Record<string, unknown>;
  const license = typeof r.licenseName === 'string' ? /^CC BY(-SA)? (2\.0|2\.5|3\.0|4\.0)$/.exec(r.licenseName) : null;
  const expected = license ? `https://creativecommons.org/licenses/${license[1] ? 'by-sa' : 'by'}/${license[2]}` : '';
  return ['speciesId', 'scientificName', 'fileTitle', 'artist', 'credit'].every(k => typeof r[k] === 'string' && String(r[k]).trim().length > 0)
    && r.status === 'metadata_shortlisted_pending_visual_review'
    && typeof r.rank === 'number' && Number.isInteger(r.rank) && r.rank >= 1 && r.rank <= 2
    && typeof r.width === 'number' && Number.isInteger(r.width) && r.width >= 600
    && typeof r.height === 'number' && Number.isInteger(r.height) && r.height >= 600
    && httpsHost(r.previewUrl, 'upload.wikimedia.org', '/wikipedia/commons/')
    && httpsHost(r.filePage, 'commons.wikimedia.org', '/wiki/File:')
    && !!license && typeof r.licenseUrl === 'string' && r.licenseUrl.replace(/\/$/, '') === expected;
}
interface GalleryDataset { dataVersion: string; status: string; items: GalleryRow[]; }
export function validateGallery(dataset: GalleryDataset, species: ReadonlyArray<{ id: string; scientificName: string }>) {
  if (dataset.status !== 'candidate_not_publication_approved' || !dataset.dataVersion || !Array.isArray(dataset.items)) { throw new Error('Invalid gallery manifest'); }
  const expected = new Map(species.map(s => [s.id, s.scientificName]));
  const keys = new Set<string>();
  const pages = new Set<string>();
  for (const r of dataset.items) {
    if (!validGalleryRow(r) || expected.get(r.speciesId) !== r.scientificName || keys.has(`${r.speciesId}:${r.rank}`) || pages.has(r.filePage)) { throw new Error('Invalid or duplicate gallery row'); }
    keys.add(`${r.speciesId}:${r.rank}`); pages.add(r.filePage);
  }
  for (const id of expected.keys()) { if (!keys.has(`${id}:1`) || !keys.has(`${id}:2`)) { throw new Error('Incomplete gallery'); } }
  return dataset;
}
export function galleryResponse(request: Request, dataset: GalleryDataset): Response | undefined {
  const path = new URL(request.url).pathname;
  if (path !== '/v1/gallery' && !path.startsWith('/v1/gallery/')) { return undefined; }
  const headers = { 'Cache-Control': 'no-store' };
  if (request.method !== 'GET') { return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { ...headers, Allow: 'GET' } }); }
  const id = path === '/v1/gallery' ? null : path.slice('/v1/gallery/'.length);
  const items = dataset.items.filter(r => id === null || r.speciesId === id);
  if (id !== null && !items.length) { return Response.json({ error: 'GALLERY_NOT_FOUND' }, { status: 404, headers }); }
  return Response.json({ mode: dataset.status, dataVersion: dataset.dataVersion, items }, { headers });
}
