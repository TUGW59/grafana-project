import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import type { PreviewObservation } from '../adapters/previewRows';
import { LAND_PATHS } from '../data/worldLandPaths';
import { groupObservations, INITIAL_VIEW, point, viewport } from '../utils/observationAnalytics';

interface Props {
  observations: PreviewObservation[];
  selectedId: string;
  scientific: (id: string) => string;
  onSelect: (id: string) => void;
}
const button = css`background:#fffdf7;color:#244d38;border:1px solid #b8c6b2;border-radius:6px;padding:6px 9px;cursor:pointer;&:disabled{opacity:.45;cursor:default;}&:focus-visible{outline:2px solid #81552b;}`;
const marker = css`cursor:pointer;&:focus-visible{outline:2px solid #81552b;}`;
const controls = css`display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:8px;`;

export function ObservationMap({ observations, selectedId, scientific, onSelect }: Props) {
  const [view, setView] = useState(INITIAL_VIEW);
  const [openCluster, setOpenCluster] = useState('');
  const groups = useMemo(() => groupObservations(observations, view.zoom), [observations, view.zoom]);
  const activeGroup = groups.find(g => g.id === openCluster);
  const selected = observations.find(o => o.id === selectedId);
  const move = (dx: number, dy: number) => {
    setView(v => viewport(v.x + dx * 240 / v.zoom, v.y + dy * 120 / v.zoom, v.zoom));
    setOpenCluster('');
  };
  const zoom = (factor: number) => {
    setView(v => viewport(v.x, v.y, v.zoom * factor));
    setOpenCluster('');
  };
  const focus = () => {
    if (selected) {
      const p = point(selected);
      setView(viewport(p.x, p.y, 4));
      setOpenCluster('');
    }
  };
  const selectGroup = (id: string, items: PreviewObservation[]) => {
    if (items.length === 1) {
      onSelect(items[0].id);
      setOpenCluster('');
    } else {
      setOpenCluster(id);
    }
  };
  const scale = view.zoom;
  const viewBox = `${view.x - 480 / scale} ${view.y - 240 / scale} ${960 / scale} ${480 / scale}`;
  return <div>
    <div className={controls} aria-label="Map controls">
      <button className={button} aria-label="Zoom in" disabled={scale >= 8} onClick={() => zoom(2)}>+</button>
      <button className={button} aria-label="Zoom out" disabled={scale <= 1} onClick={() => zoom(0.5)}>−</button>
      <button className={button} aria-label="Pan west" disabled={scale <= 1} onClick={() => move(-1, 0)}>←</button>
      <button className={button} aria-label="Pan east" disabled={scale <= 1} onClick={() => move(1, 0)}>→</button>
      <button className={button} aria-label="Pan north" disabled={scale <= 1} onClick={() => move(0, -1)}>↑</button>
      <button className={button} aria-label="Pan south" disabled={scale <= 1} onClick={() => move(0, 1)}>↓</button>
      <button className={button} disabled={!selected} onClick={focus}>Focus selected</button>
      <button className={button} onClick={() => { setView(INITIAL_VIEW); setOpenCluster(''); }}>Reset map</button>
      <small aria-live="polite">{scale}×</small>
    </div>
    <svg viewBox={viewBox} role="group" aria-label="World observation map" style={{ width: '100%', background: '#e4ebe0', borderRadius: 8, aspectRatio: '2 / 1' }}>
      {LAND_PATHS.map((d, i) => <path key={i} d={d} fill="#8da78b" stroke="#e6ece1" strokeWidth={0.6 / scale} fillRule="evenodd" />)}
      {groups.map(g => {
        const active = g.items.some(o => o.id === selectedId);
        const multiple = g.items.length > 1;
        const label = multiple ? `${g.items.length} nearby observations` : `Select ${scientific(g.items[0].speciesId)}`;
        // Ekran dışı noktalar klavye odağına girmez; alttaki liste tüm kayıtlara erişim sağlar.
        if (Math.abs(g.x - view.x) > 480 / scale || Math.abs(g.y - view.y) > 240 / scale) {
          return null;
        }
        return <g key={g.id} role="button" tabIndex={0} aria-label={label} className={marker}
          onClick={() => selectGroup(g.id, g.items)} onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectGroup(g.id, g.items);
            }
          }}>
          {active && <circle cx={g.x} cy={g.y} r={16 / scale} stroke="#81552b" fill="none" strokeWidth={2 / scale} />}
          <circle cx={g.x} cy={g.y} r={(multiple ? 12 : 7) / scale} fill={multiple ? '#315f45' : '#be8553'} stroke="white" strokeWidth={1.5 / scale} />
          {multiple && <text x={g.x} y={g.y} dominantBaseline="central" textAnchor="middle" fontSize={11 / scale} fill="white" pointerEvents="none">{g.items.length}</text>}
          <title>{label}</title>
        </g>;
      })}
    </svg>
    {activeGroup && activeGroup.items.length > 1 && <div style={{ padding: '8px 0' }}>
      <p style={{ margin: '4px 0' }}>{activeGroup.items.length} observations in this cluster</p>
      {activeGroup.items.map(o => <button key={o.id} className={button} aria-pressed={o.id === selectedId} onClick={() => onSelect(o.id)}>{scientific(o.speciesId)} · {o.observedAt || 'Unknown date'}</button>)}
    </div>}
    <label style={{ display: 'block', marginTop: 8, fontSize: 12 }}>Select any matching observation
      <select className={button} style={{ width: '100%' }} value={selectedId} onChange={e => onSelect(e.target.value)}>
        {observations.map(o => <option key={o.id} value={o.id}>{scientific(o.speciesId)} · {o.country || 'Unknown region'} · {o.observedAt || 'Unknown date'} · {o.id}</option>)}
      </select>
    </label>
    <small>Clusters group nearby sample records, not population density. Map: Natural Earth.</small>
  </div>;
}
