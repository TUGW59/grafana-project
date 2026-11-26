import React, { useMemo, useState } from 'react';
import type { PanelData } from '@grafana/data';
import { css } from '@emotion/css';
import { LAND_PATHS } from '../data/worldLandPaths';
import { mapPoint } from '../utils/flowerFilters';
import { buildStoryUrl } from '../utils/storyNavigation';
import { finiteNum, frameRows, str } from '../adapters/frameRows';

interface Props { data: PanelData; width: number; height: number }
interface ObservationRow {
  id: string; speciesId: string; latitude: number; longitude: number;
  country: string; continent: string; biome: string; observationMonth: number | null;
}
interface SpeciesRow { id: string; commonName: string; scientificName: string }

const s = {
  root: css`display:flex;flex-direction:column;height:100%;box-sizing:border-box;overflow:auto;background:#141b23;color:#e6e9ed;font-family:Arial,sans-serif;`,
  head: css`padding:16px 20px;border-bottom:1px solid #34404a;display:flex;gap:12px;justify-content:space-between;flex-wrap:wrap;align-items:center;`,
  marker: css`cursor:pointer;:focus-visible{outline:3px solid white;}`,
  body: css`display:flex;flex:1;min-height:240px;flex-wrap:wrap;`,
  map: css`flex:2 1 470px;min-width:290px;background:#131e25;padding:12px;box-sizing:border-box;`,
  aside: css`flex:1 1 260px;min-width:220px;padding:20px;box-sizing:border-box;background:#1b222b;display:flex;flex-direction:column;gap:10px;`,
  foot: css`display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:9px 16px;border-top:1px solid #34404a;font-size:11px;color:#bac5d0;`,
  link: css`margin-top:auto;display:block;padding:11px 13px;color:#1b1822;background:#c3a1e8;text-align:center;text-decoration:none;border-radius:6px;font-weight:bold;`,
  badge: css`border:1px solid #bb9b63;border-radius:16px;padding:5px 11px;color:#e3c88e;font-size:12px;`,
};

export function WorldExplorerApi({ data, width, height }: Props) {
  // API kayıtlarını alırken yalnız gerekli alanları doğrula; invalid koordinatı haritaya çizme.
  const observations = useMemo<ObservationRow[]>(() => frameRows(data, 'A').flatMap((row) => {
    const latitude = finiteNum(row.latitude);
    const longitude = finiteNum(row.longitude);
    const id = str(row.id); const speciesId = str(row.speciesId);
    if (latitude === null || longitude === null || !id || !speciesId || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return [];
    }
    return [{ id, speciesId, latitude, longitude, country: str(row.country), continent: str(row.continent),
      biome: str(row.biome), observationMonth: finiteNum(row.observationMonth) }];
  }), [data]);
  const species = useMemo(() => new Map<string, SpeciesRow>(frameRows(data, 'B').flatMap((row) => {
    const id = str(row.id);
    if (!id) {
      return [];
    }
    return [[id, { id, commonName: str(row.commonName), scientificName: str(row.scientificName) }] as [string, SpeciesRow]];
  })), [data]);
  const [selectedObservationId, setSelectedObservationId] = useState<string | null>(null);
  const selected = observations.find((o) => o.id === selectedObservationId) ?? observations[0];
  const selectedSpecies = selected ? species.get(selected.speciesId) : undefined;
  const loading = data.state === 'Loading';
  const hasErrors = (data.errors?.length ?? 0) > 0 || data.state === 'Error';

  return <div className={s.root} style={{ width, height }}>
    <div className={s.head}>
      <strong style={{fontSize:20}}>✿ World Explorer · API</strong>
      <span className={s.badge}>DEMO SNAPSHOT · Deno → Infinity → DataFrame</span>
    </div>
    {loading ? <p style={{padding:20}}>Loading observations from Grafana datasource…</p> :
     hasErrors ? <p style={{padding:20}}>BloomAtlas data could not be loaded. Check Grafana query errors.</p> :
     observations.length === 0 ? <p style={{padding:20}}>No observations were returned by the datasource.</p> :
     <div className={s.body}>
      <div className={s.map}>
        <svg viewBox="0 0 960 480" role="img" aria-label="World map of fictional API demo observations" style={{width:'100%',height:'100%',maxHeight:550}}>
          <rect width="960" height="480" fill="#142029" />
          {LAND_PATHS.map((d,i) => <path key={i} d={d} fill="#375145" stroke="#52715e" strokeWidth=".5" fillRule="evenodd" />)}
          {observations.map(o => {
            const { x, y } = mapPoint(o.longitude, o.latitude);
            const active = selected?.id === o.id;
            const label = species.get(o.speciesId)?.scientificName || o.speciesId;
            return <g key={o.id} className={s.marker} role="button" tabIndex={0}
              aria-label={`Select ${label}, fictional observation in ${o.country}`}
              onClick={() => setSelectedObservationId(o.id)}
              onKeyDown={(e) => { if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedObservationId(o.id);} }}>
              {active && <circle cx={x} cy={y} r={14} fill="none" stroke="#e7d0ff" strokeWidth={2}/>}
              <circle cx={x} cy={y} r={active?9:7} fill="#c7a6e8" stroke="#16212b" strokeWidth={2}/>
              <title>{label} · {o.country} (fictional demo)</title>
            </g>;
          })}
        </svg>
      </div>
      <aside className={s.aside}>
        <strong style={{fontSize:19,fontStyle:'italic'}}>{selectedSpecies?.scientificName ?? selected.speciesId}</strong>
        <span>{selectedSpecies?.commonName ?? 'No common name provided'}</span>
        <small>Country: {selected.country || 'Unavailable'} · Continent: {selected.continent || 'Unavailable'}</small>
        <small>Biome: {selected.biome || 'Not provided'}</small>
        <small>Observation month: {selected.observationMonth ?? 'Unknown'} (fictional demo)</small>
        <small>Observation ID: {selected.id}</small>
        <a className={s.link} href={buildStoryUrl(selected.speciesId, selected.id, window.location.search)}>View Flower Story →</a>
      </aside>
    </div>}
    <footer className={s.foot}><span>Showing {observations.length} fictional observations · Grafana datasource</span><span data-testid="developer-credit">Developed by Tuğçe Topuz</span></footer>
  </div>;
}
