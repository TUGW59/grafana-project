import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import type { PreviewObservation } from '../adapters/previewRows';
import { summarizeObservations } from '../utils/observationAnalytics';

const panel = css`background:#fffdf7;border:1px solid #d1d9c9;border-radius:12px;padding:16px;min-width:0;`;
const grid = css`display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr));gap:8px;`;
const metric = css`padding:10px;border-radius:7px;background:#edf1e7;display:flex;flex-direction:column;gap:3px;`;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ObservationSummary({ observations }: { observations: PreviewObservation[] }) {
  const summary = useMemo(() => summarizeObservations(observations), [observations]);
  const maxMonth = Math.max(1, ...summary.months);
  const maxContinent = Math.max(1, ...summary.continents.map(row => row[1]));
  return <section className={panel} aria-label="Matching observation analytics">
    <h2 style={{ fontFamily: 'Georgia', marginTop: 0 }}>Observation insights</h2>
    <div className={grid}>
      {[
        ['Matching records', summary.total], ['Matching species', summary.species],
        ['Country / continent known', `${summary.countryKnown}/${summary.total}`],
        ['Biome known', `${summary.biomeKnown}/${summary.total}`],
      ].map(([label, value]) => <div className={metric} key={label}><strong style={{ fontSize: 20 }}>{value}</strong><small>{label}</small></div>)}
    </div>
    <div className={grid} style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', marginTop: 12 }}>
      <div>
        <h3 style={{ fontSize: 14 }}>Observation month</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,minmax(0,1fr))', gap: 3 }}>
          {summary.months.map((count, i) => <div key={months[i]} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
            <small>{count}</small><div style={{ height: 55, width: '80%', display: 'flex', alignItems: 'end', background: '#edf1e7' }}><div style={{ width: '100%', height: `${count / maxMonth * 100}%`, background: '#598469' }} /></div><small style={{ fontSize: 10 }}>{months[i]}</small>
          </div>)}
        </div>
        <small>Unknown date: {summary.unknownMonth}. Observation month is not flowering evidence.</small>
      </div>
      <div>
        <h3 style={{ fontSize: 14 }}>Continent distribution</h3>
        {summary.continents.map(([name, count]) => <div key={name} style={{ display: 'grid', gridTemplateColumns: 'minmax(85px,1fr) 1fr 24px', gap: 6, alignItems: 'center', fontSize: 12, marginBottom: 5 }}>
          <span>{name}</span><div style={{ background: '#edf1e7', height: 8 }}><div style={{ width: `${count / maxContinent * 100}%`, background: '#598469', height: 8 }} /></div><span>{count}</span>
        </div>)}
        {!summary.total && <small>No matching observations.</small>}
      </div>
    </div>
    <p style={{ fontSize: 12, marginBottom: 0 }}>Counts reflect only records returned by the current filters; not representative of global flora or native range.</p>
  </section>;
}
