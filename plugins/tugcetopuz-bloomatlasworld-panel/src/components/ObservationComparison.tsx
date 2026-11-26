import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import type { PreviewObservation } from '../adapters/previewRows';
import { chooseComparison, comparisonChoices } from '../utils/observationComparison';

interface Props {
  observations: PreviewObservation[];
  selected: PreviewObservation;
  scientific: (id: string) => string;
  family: (id: string) => string;
}

const card = css`background:#fffdf7;border:1px solid #d1d9c9;border-radius:12px;padding:16px;min-width:0;`;
const grid = css`display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:12px;`;
const specimen = css`background:#edf1e7;border-radius:8px;padding:12px;min-width:0;overflow-wrap:anywhere;`;
const select = css`display:block;width:100%;margin:5px 0 12px;padding:8px;background:white;color:#263d31;border:1px solid #bac8b5;border-radius:6px;`;
const link = css`color:#245a3b;text-decoration:underline;`;
const details = css`display:grid;grid-template-columns:minmax(85px,1fr) 2fr;gap:6px;font-size:12px;`;

export function ObservationComparison({ observations, selected, scientific, family }: Props) {
  const [requestedId, setRequestedId] = useState('');
  const choices = useMemo(() => comparisonChoices(observations, selected), [observations, selected]);
  const other = chooseComparison(choices, requestedId);
  // Bilinmeyen değerler aynen belirtilir; iki gözlemden botanik benzerlik puanı çıkarılmaz.
  const render = (row: PreviewObservation, heading: string) => <article className={specimen}>
    <small>{heading}</small>
    <h3 style={{ fontFamily: 'Georgia', fontStyle: 'italic', marginTop: 5 }}>{scientific(row.speciesId)}</h3>
    <dl className={details}>
      {[
        ['Family', family(row.speciesId)], ['Country', row.country], ['Continent', row.continent],
        ['Biome', row.biome], ['Ecoregion', row.ecoregion], ['Observation date', row.observedAt],
        ['Observer', row.observer], ['Observation license', row.observationLicense],
        ['Photo license', row.photoLicense], ['Photo credit', row.photoAttribution], ['Record ID', row.id],
      ].map(([label, value]) => <React.Fragment key={label}>
        <dt style={{ fontWeight: 600 }}>{label}</dt><dd style={{ margin: 0 }}>{value || 'Unresolved'}</dd>
      </React.Fragment>)}
    </dl>
    <a className={link} href={row.sourceUrl} target="_blank" rel="noreferrer">Observation source ↗</a>
    {row.photoSourceUrl && <> · <a className={link} href={row.photoSourceUrl} target="_blank" rel="noreferrer">Photo source ↗</a></>}
  </article>;
  return <section className={card} aria-label="Observation comparison">
    <h2 style={{ fontFamily: 'Georgia', marginTop: 0 }}>Compare observations</h2>
    {other ? <>
      <label style={{ fontSize: 12 }}>Compare selected observation with
        <select className={select} value={other.id} onChange={e => setRequestedId(e.target.value)}>
          {choices.map(row => <option key={row.id} value={row.id}>{scientific(row.speciesId)} · {row.country || 'Unknown country'} · {row.observedAt || 'Unknown date'} · {row.id}</option>)}
        </select>
      </label>
      <div className={grid}>{render(selected, 'Selected observation')}{render(other, 'Comparison observation')}</div>
    </> : <p role="status">At least two matching observations are needed. Broaden the filters to compare.</p>}
    <p style={{ fontSize: 12, marginBottom: 0 }}>Comparison describes sampled observations only. It is not a flowering calendar, native range or AI similarity score.</p>
  </section>;
}
