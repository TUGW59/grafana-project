import React, { useMemo, useState } from 'react';
import type { PanelData } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { css } from '@emotion/css';
import { frameRows, str } from '../adapters/frameRows';
import { previewObservations, sourceLink } from '../adapters/previewRows';
import { ObservationMap } from './ObservationMap';
import { candidateStoryUrl } from '../utils/candidateStoryUrl';
import { observationPhotoVariants } from '../utils/observationPhotoVariants';
import { ObservationReplay } from './ObservationReplay';
import { ObservationSummary } from './ObservationSummary';
import { ObservationComparison } from './ObservationComparison';
import { explorerFilterOptions, resolveExplorerView, type ExplorerView } from '../utils/explorerPresentation';

const names = ['continent', 'biome', 'month', 'species'] as const;
export type PreviewFilters = Record<(typeof names)[number], string>;
interface Props { data: PanelData; width: number; height: number; filters: PreviewFilters; showInsights?: boolean; showComparison?: boolean; }
const labels = ['Continent', 'Biome', 'Observation month', 'Species'];
const s = {
  root: css`box-sizing:border-box;overflow:auto;background:#f4f3e9;color:#263d31;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;padding:clamp(12px, 2%, 24px);display:flex;flex-direction:column;gap:16px;
    & > *{flex-shrink:0;}
    && select{box-sizing:border-box;min-height:40px !important;height:auto !important;line-height:1.4 !important;padding:8px 10px !important;font-size:14px;color:#263d31 !important;background-color:#fff !important;color-scheme:light;}
    && select option{color:#263d31;background-color:#fff;}
    & button:focus-visible,& select:focus-visible,& a:focus-visible{outline:2px solid #81552b;outline-offset:2px;}
    & small{font-size:12px;line-height:1.45;}
    & h2{font-size:21px;line-height:1.25;}
    & section[aria-label="Observation replay"] {border-color:#d1d9c9 !important;border-radius:12px !important;padding:14px 16px !important;}
    & section[aria-label="Observation replay"] h2 {font-family:Georgia,serif;color:#244d38;margin-bottom:4px;}
    & section[aria-label="Observation replay"] button {border:1px solid #aebfa9;border-radius:6px;color:#244d38;background:#fffdf7;min-height:36px;cursor:pointer;}
    & section[aria-label="Observation replay"] button:disabled {opacity:.55;cursor:not-allowed;}
    & section[aria-label="Observation replay"] progress {accent-color:#315f45;width:clamp(100px, 22%, 240px);height:12px;color-scheme:light;}
    & section[aria-label="Observation replay"] [role="status"] {color:#476655;}
    & [data-ba-story-card] {display:grid;gap:10px;margin-top:20px;padding:16px;border:1px solid #b7c8af;border-radius:12px;background:#edf2e7;max-width:620px;box-sizing:border-box;min-width:0;}
    & [data-ba-story-card] [data-ba-story-kicker] {font-size:10px;letter-spacing:1.6px;font-weight:700;color:#476655;}
    & [data-ba-story-card] strong {font-family:Georgia,serif;font-size:21px;line-height:1.25;color:#244d38;font-weight:500;}
    & [data-ba-story-card] [data-ba-story-description] {font-size:13px;color:#3e5748;}
    && a[data-ba-story-link], && a[data-ba-story-link]:visited {display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;box-sizing:border-box;padding:12px 16px;border:1px solid #315f45;border-radius:8px;background:#315f45;color:#fff;text-decoration:none;font-weight:700;min-height:48px;cursor:pointer;}
    && a[data-ba-story-link]:hover {background:#244d38;border-color:#244d38;color:#fff;text-decoration:none;}
    && a[data-ba-story-link]:focus-visible {outline:3px solid #81552b;outline-offset:3px;}
    & [data-ba-story-card] small {margin:0;color:#476655;}
    & [aria-label="Observation filters"] label {font-weight:600;color:#365344;}
    & [aria-label="Observation filters"] select {font-weight:400;}
    & [aria-label="Map controls"] button {min-height:34px;}
    & [aria-label="World observation map"] {border:1px solid #cbd4c7;box-sizing:border-box;}
    & [aria-label="Matching observation analytics"], & [aria-label="Compare observations"] {border-radius:14px;padding:18px;}
    & [aria-label="Matching observation analytics"] strong {font-family:Georgia,serif;color:#244d38;font-size:26px !important;font-weight:500;}
    & section[aria-label="Observation replay"] button:first-of-type {background:#315f45;color:white;}
    & section[aria-label="Observation replay"] button:not(:first-of-type) {background:#fffdf7;color:#244d38;}
    & section[aria-label="Observation replay"] button:disabled {background:#e8eae1;color:#526052;}
    & [data-ba-map-legend] {display:flex;gap:12px;flex-wrap:wrap;align-items:center;font-size:12px;color:#476655;margin:8px 0 0;}
    & [data-ba-map-legend] span {display:inline-flex;gap:5px;align-items:center;}
    & [data-ba-map-legend] i {width:10px;height:10px;display:inline-block;border-radius:50%;}
    & [data-ba-map-legend] [data-kind="single"] {background:#be8553;}
    & [data-ba-map-legend] [data-kind="cluster"] {background:#315f45;}
    & [data-ba-map-legend] [data-kind="selected"] {border:2px solid #81552b;background:transparent;}


  `,
  head: css`display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;background:#e7ecdf;border:1px solid #cbd4c7;border-radius:14px;padding:18px 20px;`,
  title: css`font-family:Georgia,serif;font-size:clamp(26px, 2.4vw, 34px);line-height:1.16;margin:4px 0;color:#244d38;`,
  badge: css`border:1px solid #a57c3f;background:#fff4d9;border-radius:16px;padding:6px 10px;font-size:11px;color:#72531f;`,
  card: css`background:#fffdf7;border:1px solid #d1d9c9;border-radius:14px;padding:18px;box-sizing:border-box;min-width:0;box-shadow:0 2px 8px rgba(36,77,56,.04);`,
  filters: css`display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr));gap:12px;align-items:end;`,
  select: css`display:block;width:100%;min-width:0;background:white;color:#263d31;border:1px solid #bac8b5;border-radius:6px;padding:8px;`,
  button: css`background:#315f45;color:white;border:0;padding:10px 14px;border-radius:8px;cursor:pointer;min-height:40px;font-weight:600;&:hover{background:#244d38;}`,
  mapLayout: css`display:grid;gap:14px;align-items:start;`,
  explore: css`display:grid;gap:14px;min-width:0;`,
  views: css`display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:#e7ecdf;border:1px solid #cbd4c7;border-radius:12px;padding:5px;align-self:flex-start;max-width:100%;`,
  viewButton: css`border:1px solid #aebfa9;background:#fffdf7;color:#244d38;border-radius:8px;padding:10px 18px;font-size:14px;cursor:pointer;min-height:40px;&:hover:not([aria-pressed="true"]){background:#e1e9dc;}&[aria-pressed="true"]{background:#315f45;color:white;border-color:#315f45;font-weight:600;}`,
  trail: css`display:flex;flex-direction:column;gap:8px;max-height:460px;overflow:auto;scrollbar-color:#a3b5a0 #eef1e8;padding:2px 4px 2px 2px;`,
  trailItem: css`display:flex;gap:12px;text-align:left;align-items:center;background:#f3f5ec;border:1px solid #d1d9c9;color:#263d31;border-radius:8px;padding:10px;cursor:pointer;width:100%;flex-shrink:0;overflow-wrap:anywhere;&:hover{background:#e9efe3;border-color:#aebfa9;} &[aria-pressed="true"]{border-color:#315f45;background:#e2eadc;box-shadow:inset 3px 0 #315f45;}`,
  stage: css`display:grid;gap:24px;align-items:center;overflow-wrap:anywhere;min-width:0;& p{margin:8px 0;} & small{display:block;margin-top:6px;}`,
  image: css`object-fit:contain;background:#e5eadf;border-radius:8px;width:100%;max-height:300px;`,
  marker: css`cursor:pointer;:focus-visible{outline:2px solid #a4652f;}`,
  link: css`color:#245a3b;text-decoration:underline;overflow-wrap:anywhere;`,
  foot: css`display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:11px;border-top:1px solid #cbd4c7;padding-top:10px;`,
};
function Photo({ url, name, thumbnail = false }: { url: string; name: string; thumbnail?: boolean }) {
  // URL değiştiğinde hata geçmişi sıfırlanır; başarısız boyutlar sırayla atlanır.
  return <PhotoVariants key={`${url}:${thumbnail}`} url={url} name={name} thumbnail={thumbnail} />;
}
function PhotoVariants({ url, name, thumbnail }: { url: string; name: string; thumbnail: boolean }) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const current = observationPhotoVariants(url, !thumbnail).find(candidate => !failedUrls.includes(candidate));
  return current ? <img className={s.image} src={current} alt={`Observation of ${name}`} loading={thumbnail ? 'lazy' : 'eager'} referrerPolicy="no-referrer" onError={() => setFailedUrls(old => [...old, current])} style={thumbnail ? { width: 54, height: 54, objectFit: 'cover' } : { maxHeight: 420 }} /> : <span role="status" style={{ fontSize: 12 }}>Photo unavailable</span>;
}
export function WorldExplorerPreview({ data, width, height, filters, showInsights = true, showComparison = true }: Props) {
  const observations = useMemo(() => previewObservations(data),[data]);
  const species = useMemo(() => new Map(frameRows(data,'B').map(r => [str(r.id),r])),[data]);
  const options = useMemo(() => frameRows(data,'C'),[data]);
  const manifest = options.find(r => str(r.kind)==='manifest');
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get('var-observationId') ?? '');
  // Sekme değişimi veriyi, seçilen gözlemi veya Grafana sorgusunu değiştirmez.
  const [requestedView, setRequestedView] = useState<ExplorerView>('explore');
  const view = resolveExplorerView(requestedView, showInsights, showComparison);
  const wide = width >= 900;
  const selected = observations.find(o => o.id===selectedId) ?? observations[0];
  const taxon = selected ? species.get(selected.speciesId) : undefined;
  const scientific = (id: string) => str(species.get(id)?.scientificName) || id;
  // Trail sırası gözlem tarihine göre; seçilen kayıt görünür kalır.
  const recent = [...observations].sort((a,b) => b.observedAt.localeCompare(a.observedAt)||a.id.localeCompare(b.id));
  const trail = selected ? [selected,...recent.filter(o => o.id!==selected.id)] : [];
  const loading = data.state==='Loading';
  const failed = data.state==='Error' || (data.errors?.length ?? 0)>0;
  const ready = !!manifest && str(manifest.value).includes('candidate');
  const change = (name: string,value: string) => locationService.partial({[`var-${name}`]:value},true);
  return <div className={s.root} style={{width,height}}>
    <header className={s.head}><div><p style={{margin:0,fontSize:11,letterSpacing:2}}>BLOOMATLAS · FIELD JOURNAL</p><h1 className={s.title}>World Explorer</h1><small>Discover sourced flora observations · Developed by Tuğçe Topuz</small></div><span className={s.badge}>LOCAL CANDIDATE · NOT PUBLICATION APPROVED</span></header>
    <section className={s.card} aria-label="Observation filters">
      <div className={s.filters}>{names.map((name, i) => {
        const value = filters[name] || '__all__';
        const choices = explorerFilterOptions(options.filter(r => str(r.kind) === name).map(r => ({ value: str(r.value), label: str(r.label) })), value);
        return <label key={name} style={{ fontSize: 14 }}>{labels[i]}<select aria-label={labels[i]} className={s.select} value={value} onChange={e => change(name, e.target.value)} disabled={!ready}>{choices.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
      })}<button className={s.button} onClick={() => locationService.partial({'var-continent':'__all__','var-biome':'__all__','var-month':'__all__','var-species':'__all__'},true)}>Reset filters</button></div>
      <p style={{marginBottom:0,fontSize:12}}>{observations.length} observations · {new Set(observations.map(o => o.speciesId)).size} matching species · API filters</p>
    </section>
    <nav className={s.views} aria-label="World Explorer views">
      <button type="button" className={s.viewButton} aria-pressed={view === 'explore'} onClick={() => setRequestedView('explore')}>Explore</button>
      {showInsights && <button type="button" className={s.viewButton} aria-pressed={view === 'insights'} onClick={() => setRequestedView('insights')}>Insights</button>}
      {showComparison && <button type="button" className={s.viewButton} aria-pressed={view === 'compare'} onClick={() => setRequestedView('compare')}>Compare</button>}
    </nav>
    {loading ? <p role="status">Loading observations…</p> : failed || !ready ? <p role="alert">Candidate datasource unavailable. Check Grafana query inspector.</p> : !selected ? <p role="status">No observations match these filters. Reset filters to explore again.</p> : <>
      <div className={s.explore} style={{ display: view === 'explore' ? 'grid' : 'none' }}>
      {view === 'explore' && <ObservationReplay key={JSON.stringify(observations.map(o => o.id).sort())} ids={observations.map(o => o.id)} onSelect={setSelectedId} />}
      <div className={s.mapLayout} style={{ gridTemplateColumns: wide ? 'minmax(0, 1.65fr) minmax(0, 1fr)' : 'minmax(0, 1fr)' }}>
        <section className={s.card}><h2 style={{ fontFamily: 'Georgia', marginTop: 0 }}>Observation map</h2><ObservationMap observations={observations} selectedId={selected.id} scientific={scientific} onSelect={setSelectedId} /><div data-ba-map-legend="true"><span><i data-kind="single" /> Single observation</span><span><i data-kind="cluster" /> Cluster</span><span><i data-kind="selected" /> Selected observation</span></div></section>
        <section className={s.card}><h2 style={{fontFamily:'Georgia',marginTop:0}}>Observation Trail</h2><div className={s.trail}>{trail.map(o => <button key={o.id} className={s.trailItem} aria-pressed={o.id===selected.id} onClick={() => setSelectedId(o.id)}><div style={{flex:'0 0 54px'}}><Photo key={o.id} url={o.photoUrl} name={scientific(o.speciesId)} thumbnail/></div><span><i>{scientific(o.speciesId)}</i><br/><small>{o.country||'Unknown country'} · {o.observedAt||'Unknown date'}</small><br/><small>{o.photoAttribution||'Attribution unavailable'}</small></span></button>)}</div><p style={{fontSize:12}}>Selected observation first · all matching records, newest first.</p></section>
      </div>
      <section className={s.card}><p style={{fontSize:11,letterSpacing:2,marginTop:0,color:'#476655',fontWeight:600}}>SPECIMEN STAGE</p><div className={s.stage} style={{ gridTemplateColumns: wide ? 'minmax(0, 400px) minmax(0, 1fr)' : 'minmax(0, 1fr)' }}><div style={{ maxWidth: 400, minWidth: 0 }}><Photo key={selected.id} url={selected.photoUrl} name={scientific(selected.speciesId)}/><small>{selected.photoAttribution||'Attribution unavailable'} · {selected.photoLicense||'License unavailable'}</small></div><div><h2 className={s.title} style={{fontStyle:'italic'}}>{scientific(selected.speciesId)}</h2><p>{str(taxon?.commonName)} · {str(taxon?.family)||'Family unavailable'}</p><p>Country: {selected.country||'Unknown'} · Continent: {selected.continent||'Unknown'}</p><p>Biome: {selected.biome||'Unresolved'}<br/>Ecoregion: {selected.ecoregion||'Unresolved'}</p><p>Observed: {selected.observedAt||'Unknown'} · Observer: {selected.observer||'Unknown'}<br/>Observation license: {selected.observationLicense||'Unknown'}</p><p style={{fontSize:12}}>Observation date is not flowering evidence. Exact license versions remain under review.</p><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><a className={s.link} href={selected.sourceUrl} target="_blank" rel="noreferrer">Observation source ↗</a>{selected.photoSourceUrl&&<a className={s.link} href={selected.photoSourceUrl} target="_blank" rel="noreferrer">Photo source ↗</a>}{sourceLink(taxon?.taxonomyUrl,'taxonomy')&&<a className={s.link} href={sourceLink(taxon?.taxonomyUrl,'taxonomy')} target="_blank" rel="noreferrer">Kew taxonomy ↗</a>}</div><div data-ba-story-card="true">
        <span data-ba-story-kicker="true">BEYOND THE OBSERVATION</span>
        <strong>Discover the story behind this flower</strong>
        <div data-ba-story-description="true">Explore its name origin, cultural history, regional flowering and similar species.</div>
        <a data-ba-story-link="true" href={candidateStoryUrl(selected.speciesId, selected.id, filters)} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); window.location.assign(candidateStoryUrl(selected.speciesId, selected.id, filters)); } }}>
          <span>Explore Flower Story</span><span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>→</span>
        </a>
        <small>Opens the selected flower&apos;s story in a separate dashboard.</small>
      </div></div></div></section>
      </div>
    </>}
    {!loading && !failed && ready && showInsights && <div style={{ display: view === 'insights' ? 'block' : 'none' }}><ObservationSummary observations={observations} /></div>}
    {!loading && !failed && ready && selected && showComparison && <div style={{ display: view === 'compare' ? 'block' : 'none' }}><ObservationComparison observations={observations} selected={selected} scientific={scientific} family={id => str(species.get(id)?.family)} /></div>}
    <footer className={s.foot}><span>iNaturalist · Kew POWO · Natural Earth · <a className={s.link} href="https://ecoregions.appspot.com/" target="_blank" rel="noreferrer">RESOLVE Ecoregions 2017</a> · <a className={s.link} href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0 (ecoregions)</a></span><span>Developed by Tuğçe Topuz</span></footer>
  </div>;
}
