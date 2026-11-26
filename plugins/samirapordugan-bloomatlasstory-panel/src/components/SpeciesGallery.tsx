import React, { useState } from 'react';
import type { GalleryRow } from '../utils/galleryRows';
import { observationPhotoVariants } from '../utils/observationPhotoVariants';

// Tür referansı ile seçilen gözlemin fotoğrafı farklı amaçlara hizmet eder.
export function SpeciesGallery({ rows }: { rows: GalleryRow[] }) {
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const available = rows.filter(row => !failed.includes(row.previewUrl));
  const current = available.find(row => row.rank === selected + 1) ?? available[0];
  return <figure style={{ margin: 0 }} aria-label="Species reference gallery">
    {current ? <>
      <img src={current.previewUrl} alt={`Reference candidate for ${current.scientificName}`} referrerPolicy="no-referrer" onError={() => setFailed(old => [...old, current.previewUrl])} style={{ display: 'block', width: '100%', height: 340, objectFit: 'contain', background: '#e7ede2', borderRadius: 8 }} />
      <figcaption style={{ fontSize: 12, marginTop: 8 }}>
        <strong>Species reference photo · Visual review pending</strong><br />
        {current.artist} · <a href={current.licenseUrl} target="_blank" rel="noreferrer">{current.licenseName}</a> · <a href={current.filePage} target="_blank" rel="noreferrer">Original file and credit ↗</a><br />
        {current.width} × {current.height} · Not the selected field observation.
      </figcaption>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {available.map(row => <button key={row.filePage} type="button" aria-pressed={row.rank === current.rank} onClick={() => setSelected(row.rank - 1)} style={{ padding: '6px 12px', cursor: 'pointer', border: '1px solid currentColor', borderRadius: 5, background: row.rank === current.rank ? '#315f45' : 'transparent', color: row.rank === current.rank ? '#fff' : 'inherit' }}>Photo {row.rank}</button>)}
      </div>
    </> : <p role="status">Reference images unavailable. See the original observation below.</p>}
  </figure>;
}
export function ObservationEvidencePhoto({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const current = observationPhotoVariants(url, true).find(value => !failed.includes(value));
  return current ? <img src={current} alt={`Selected field observation of ${name}`} referrerPolicy="no-referrer" loading="lazy" onError={() => setFailed(old => [...old, current])} style={{ display: 'block', width: '100%', maxWidth: 340, maxHeight: 260, objectFit: 'contain', borderRadius: 8 }} /> : <p role="status">Original observation photo unavailable.</p>;
}
