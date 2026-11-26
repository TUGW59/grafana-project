import React, { useMemo } from 'react';
import type { PanelData } from '@grafana/data';
import { css } from '@emotion/css';
import { finiteNum, frameRows, str } from '../adapters/frameRows';

interface Props { data: PanelData; flowerId: string; width: number; height: number; showSources: boolean }
const s = {
  root: css`box-sizing:border-box;display:flex;flex-direction:column;gap:18px;padding:22px;width:100%;height:100%;overflow:auto;font-family:Arial,sans-serif;`,
  muted: css`color:#8793a4;`,
  card: css`border:1px solid #69707b55;padding:14px;border-radius:9px;`,
  badge: css`font-size:12px;border:1px solid #bca269;padding:5px 11px;border-radius:16px;`,
  foot: css`font-size:12px;margin-top:auto;padding-top:12px;border-top:1px solid #69707b55;`,
};
export function FlowerStoryApi({data, flowerId, width, height, showSources}: Props) {
  const species = useMemo(() => frameRows(data, 'A').find((r) => str(r.id) === flowerId), [data, flowerId]);
  const observations = useMemo(() => frameRows(data, 'B').filter((r) => str(r.speciesId) === flowerId), [data, flowerId]);
  const loading = data.state === 'Loading';
  const error = data.state === 'Error' || (data.errors?.length ?? 0) > 0;
  const selectedObservation = observations[0];
  return <div className={s.root} style={{width,height}}>
    <nav><a href="/d/bloomatlas-world-api/world-explorer-api-demo">← Back to World Explorer</a></nav>
    <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12}}>
      <strong>BloomAtlas · Flower Story</strong><span className={s.badge}>DEMO SNAPSHOT · Infinity DataFrame</span>
    </div>
    {loading ? <p>Loading species from Grafana datasource…</p> : error ? <p>BloomAtlas data could not be loaded.</p> :
     !species ? <div className={s.card}><h2>This flower could not be found.</h2><p>Unknown species ID: {flowerId}</p></div> : <>
      <section>
        <h2 style={{marginBottom:4}}>{str(species.commonName) || flowerId}</h2>
        <p style={{fontStyle:'italic',marginTop:0}} data-testid="scientific-name">{str(species.scientificName)}</p>
        <p className={s.muted}>Family: {str(species.family) || 'Not verified in demo snapshot'}</p>
        <p className={s.muted}>Species ID: {flowerId}</p>
      </section>
      <div className={s.card}>
        <h3>Observation context</h3>
        {selectedObservation ? <>
          <p>Fictional demo observation in {str(selectedObservation.country) || 'unknown country'}, {str(selectedObservation.continent) || 'unknown continent'}.</p>
          <p>Observation month: {finiteNum(selectedObservation.observationMonth) ?? 'Unknown'} — not flowering evidence.</p>
          <p>Coordinates: {finiteNum(selectedObservation.latitude) ?? '—'}, {finiteNum(selectedObservation.longitude) ?? '—'} (fictional demo).</p>
        </> : <p>No observation returned for this species.</p>}
      </div>
      <div className={s.card}>
        <h3>Habitat · Cultural Story · Flowering Evidence</h3>
        <p>No verified record available. These sections will be enabled only when sourced botanical data is loaded.</p>
      </div>
    </>}
    <footer className={s.foot}>
      {showSources && <p className={s.muted}>Datasource: Deno demo snapshot via Grafana Infinity. No scientific photo or historical-use claim is made by this demo.</p>}
      <p data-testid="developer-credit">Developed by Samira Porduğan</p>
    </footer>
  </div>;
}
