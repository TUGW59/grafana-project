import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { LAND_PATHS } from '../data/worldLandPaths';
import { MOCK_OBSERVATIONS, MONTHS } from '../data/mockFlowers';
import { ALL_FILTERS, filterObservations, mapPoint, type FlowerFilters } from '../utils/flowerFilters';

const st = {
  root: css`display:flex;flex-direction:column;box-sizing:border-box;height:100%;width:100%;overflow:hidden;background:#141b23;color:#e6e9ed;font-family:Inter,Arial,sans-serif;container-type:inline-size;border-radius:4px;`,
  top: css`flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid #33404b;`,
  title: css`font-weight:700;font-size:20px;letter-spacing:-.3px;`,
  badge: css`font-size:12px;color:#dec9f8;border:1px solid #a37ac4;border-radius:16px;padding:5px 10px;white-space:nowrap;`,
  filters: css`display:flex;flex-wrap:wrap;gap:9px 13px;align-items:end;padding:10px 17px;border-bottom:1px solid #33404b;`,
  filterLabel: css`display:flex;flex-direction:column;gap:4px;color:#bec8d0;font-size:11px;`,
  select: css`min-width:110px;max-width:180px;background:#202b35;color:#f0f4f6;border:1px solid #43505c;border-radius:5px;padding:7px;font-size:12px;cursor:pointer;`,
  reset: css`background:#202b35;color:#dde6ec;border:1px solid #43505c;border-radius:5px;padding:7px 11px;cursor:pointer;font-size:12px;`,
  body: css`flex:1;min-height:0;display:flex;overflow:hidden;@container (max-width:700px){flex-direction:column;overflow:auto;}`,
  mapSide: css`flex:1;min-width:0;min-height:180px;background:#131e25;display:flex;align-items:center;justify-content:center;padding:12px;@container (max-width:700px){flex:none;height:270px;}`,
  map: css`display:block;width:100%;max-height:100%;`,
  dot: css`cursor:pointer;outline:none;transition:opacity .15s;:hover{opacity:.8;}:focus-visible{stroke:#fff;stroke-width:3px;}`,
  details: css`flex:0 0 255px;min-width:0;border-left:1px solid #34404a;background:#1b222b;padding:18px;display:flex;flex-direction:column;gap:9px;box-sizing:border-box;overflow:auto;@container (max-width:700px){border-left:0;border-top:1px solid #34404a;flex:none;min-height:200px;}`,
  symbol: css`font-size:62px;text-align:center;line-height:1.25;`,
  scientific: css`font-size:19px;font-weight:700;font-style:italic;margin-top:3px;overflow-wrap:anywhere;`,
  common: css`color:#bec8d0;font-size:13px;`,
  hint: css`color:#c4d1dc;font-size:12px;line-height:1.5;`,
  demo: css`border:1px solid #47604f;background:#23392b;color:#bde6c7;border-radius:10px;padding:4px 9px;font-size:11px;align-self:flex-start;`,
  link: css`background:#aa85d3;color:#171321;border:0;padding:10px;font-weight:700;border-radius:6px;margin-top:auto;font-size:12px;text-decoration:none;display:block;text-align:center;cursor:pointer;`,
  foot: css`flex:0 0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;padding:9px 15px;border-top:1px solid #33404b;font-size:11px;color:#afbbc5;`,
};

const continents = [...new Set(MOCK_OBSERVATIONS.map((o) => o.continent))].sort();
const biomes = [...new Set(MOCK_OBSERVATIONS.map((o) => o.biome))].sort();
const species = [...MOCK_OBSERVATIONS].sort((a,b) => a.scientificName.localeCompare(b.scientificName));

interface Props { width: number; height: number; demoMode: boolean }
export function WorldExplorer({width,height,demoMode}: Props) {
  const [filters, setFilters] = useState<FlowerFilters>(ALL_FILTERS);
  const [selectedId, setSelectedId] = useState('iris-germanica');
  const visible = useMemo(() => filterObservations(MOCK_OBSERVATIONS, filters), [filters]);
  const selected = visible.find((item) => item.flowerId === selectedId) ?? visible[0];
  const setFilter = (name: keyof FlowerFilters, value: string) => setFilters((prev) => ({...prev,[name]:value}));
  const renderSelect = (id: keyof FlowerFilters, label: string, options: Array<{value: string; label: string}>) => (
    <label className={st.filterLabel} key={id}>{label}
      <select className={st.select} aria-label={label} value={filters[id]} onChange={(e) => setFilter(id,e.target.value)}>
        <option value="">All</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
  return <div className={st.root} style={{height,width}}>
    <header className={st.top}>
      <span className={st.title}>❀ World Explorer</span>
      <span className={st.badge}>DEMO DATA · 12 observations</span>
    </header>
    <div className={st.filters}>
      {renderSelect('continent','Continent', continents.map(v => ({value:v,label:v})))}
      {renderSelect('biome','Biome', biomes.map(v => ({value:v,label:v})))}
      {renderSelect('month','Observation month', MONTHS.map((v,i) => ({value:String(i+1),label:v})))}
      {renderSelect('species','Species',species.map(v => ({value:v.flowerId,label:v.scientificName})))}
      <button type="button" className={st.reset} onClick={() => setFilters(ALL_FILTERS)}>↻ Reset</button>
    </div>
    {!demoMode ? <div className={st.body} style={{alignItems:'center',justifyContent:'center',padding:30,textAlign:'center'}}>
      Live observation data is not connected yet. Enable Demo Data in panel options to preview World Explorer.
    </div> : <div className={st.body}>
      <div className={st.mapSide}>
        <svg viewBox="0 0 960 480" preserveAspectRatio="xMidYMid meet" className={st.map} role="img" aria-label="World map with fictional demo flower observation points">
          <rect width="960" height="480" fill="#142029" />
          {Array.from({length:11},(_,i) => <line key={'v'+i} x1={i*96} y1="0" x2={i*96} y2="480" stroke="#34414c" strokeWidth=".65" />)}
          {Array.from({length:7},(_,i) => <line key={'h'+i} x1="0" y1={i*80} x2="960" y2={i*80} stroke="#34414c" strokeWidth=".65" />)}
          {LAND_PATHS.map((d,i) => <path key={i} d={d} fill="#375145" stroke="#52715e" strokeWidth=".5" fillRule="evenodd" />)}
          {visible.map(o => {
            const {x,y}=mapPoint(o.longitude,o.latitude);
            const active=selected?.flowerId === o.flowerId;
            return <g key={o.flowerId} className={st.dot} role="button" tabIndex={0}
              aria-label={'Select '+o.scientificName+' — demo observation in '+o.country}
              onClick={() => setSelectedId(o.flowerId)}
              onKeyDown={(e) => {if(e.key==='Enter' || e.key===' ') {e.preventDefault();setSelectedId(o.flowerId);}}}>
              {active && <circle cx={x} cy={y} r="14" fill="none" stroke="#e7d0ff" strokeWidth="2"/>}
              <circle cx={x} cy={y} r={active?9:7.5} fill={o.color} stroke="#1b232b" strokeWidth="1.7"/>
              <title>{o.scientificName} (demo) · {o.country}</title>
            </g>;
          })}
        </svg>
      </div>
      <aside className={st.details} aria-label="Selected flower information">
        {selected ? <>
          <div className={st.symbol} aria-hidden="true">{selected.symbol}</div>
          <div className={st.scientific}>{selected.scientificName}</div>
          <div className={st.common}>{selected.commonName}</div>
          <span className={st.demo}>Fictional demo observation</span>
          <hr style={{border:0,borderTop:'1px solid #37434e',width:'100%'}} />
          <div className={st.hint}>📍 Country: {selected.country}</div>
          <div className={st.hint}>🌱 Biome: {selected.biome}</div>
          <div className={st.hint}>🗓 Observed: {MONTHS[selected.observationMonth-1]} (demo)</div>
          <a className={st.link} href={`/d/bloomatlas-story-dev/flower-story-dev?var-flowerId=${encodeURIComponent(selected.flowerId)}`}>View Flower Story →</a>
        </> : <>
          <div className={st.scientific}>No matching observations</div>
          <div className={st.hint}>Try another filter combination or reset the filters.</div>
          <button type="button" className={st.reset} onClick={() => setFilters(ALL_FILTERS)}>Reset filters</button>
        </>}
      </aside>
    </div>}
    <footer className={st.foot}>
      <span data-testid="observation-count">{demoMode?`Showing ${visible.length} of ${MOCK_OBSERVATIONS.length} fictional demo observations`:'Live data not connected'} · Map: Natural Earth</span>
      <span data-testid="developer-credit">Developed by Tuğçe Topuz</span>
    </footer>
  </div>;
}
