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
export function galleryRows(rows: unknown[], id: string, scientificName: string): GalleryRow[] {
  return rows.filter(validGalleryRow).filter(r => r.speciesId === id && r.scientificName === scientificName).sort((a, b) => a.rank - b.rank);
}
