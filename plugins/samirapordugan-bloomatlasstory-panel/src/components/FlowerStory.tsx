import React from 'react';
import { css } from '@emotion/css';
import { findFlowerStory, MONTHS } from '../data/flowerStories';

const styles = {
  root: css`height:100%;width:100%;box-sizing:border-box;overflow:auto;background:#141b23;color:#e5ebf0;font-family:Inter,Arial,sans-serif;display:flex;flex-direction:column;`,
  top: css`padding:16px 21px;border-bottom:1px solid #35434d;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;`,
  title: css`font-size:21px;font-weight:700;`,
  badge: css`font-size:11px;border:1px solid #aa8acc;border-radius:20px;padding:6px 10px;color:#dec4f4;`,
  body: css`display:grid;grid-template-columns:minmax(240px,1fr) minmax(330px,2fr);gap:0;flex:1;min-height:0;@media (max-width:800px){grid-template-columns:1fr;}`,
  aside: css`padding:24px;background:#1a252d;border-right:1px solid #39454d;display:flex;flex-direction:column;gap:12px;`,
  icon: css`font-size:95px;line-height:1.2;text-align:center;margin:8px 0 3px;`,
  scientific: css`font-size:28px;font-weight:750;font-style:italic;overflow-wrap:anywhere;`,
  sub: css`color:#bfcbd4;font-size:15px;`,
  pill: css`align-self:flex-start;padding:5px 9px;border-radius:9px;background:#294433;color:#bde5c3;border:1px solid #4b755a;font-size:12px;`,
  facts: css`display:flex;flex-direction:column;gap:10px;padding-top:15px;border-top:1px solid #45545d;font-size:13px;line-height:1.45;`,
  main: css`padding:26px 31px;display:flex;flex-direction:column;gap:18px;overflow:auto;`,
  section: css`border:1px solid #354650;border-radius:10px;background:#1b262f;padding:19px 21px;`,
  heading: css`font-size:16px;font-weight:700;margin-bottom:10px;color:#ecd6ff;`,
  text: css`font-size:14px;color:#cfd9e0;line-height:1.7;`,
  months: css`display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:4px;`,
  month: css`padding:9px 1px;text-align:center;border-radius:5px;background:#293641;font-size:10px;min-width:0;`,
  monthActive: css`background:#a787d6;color:#191320;font-weight:750;`,
  warning: css`font-size:12px;color:#efc9a1;line-height:1.5;`,
  back: css`display:inline-block;align-self:flex-start;color:#181321;background:#aa8bd0;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:700;font-size:12px;`,
  footer: css`border-top:1px solid #35434d;padding:9px 16px;font-size:11px;color:#9eacb7;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;`,
};

interface Props { flowerId: string; width: number; height: number; demoMode: boolean }
export function FlowerStory({ flowerId, width, height, demoMode }: Props) {
  const flower = findFlowerStory(flowerId);
  return (
    <div className={styles.root} style={{ width, height }}>
      <header className={styles.top}>
        <span className={styles.title}>✿ Flower Story</span>
        <span className={styles.badge}>BLOOMATLAS · DEMO STORY</span>
      </header>
      {!demoMode ? (
        <main className={styles.main}>Live botanical stories are not connected yet. Enable Demo mode in panel options.</main>
      ) : !flower ? (
        <main className={styles.main}>
          <h2>Flower not found</h2>
          <p data-testid="flower-id">Unknown flowerId: {flowerId}</p>
          <p>The World Explorer and Flower Story must use the same stable flowerId.</p>
          <a className={styles.back} href="/d/adrgfjg/world-explorer-dev">← Back to World Explorer</a>
        </main>
      ) : (
        <div className={styles.body}>
          <aside className={styles.aside}>
            <div className={styles.icon} aria-hidden="true">{flower.symbol}</div>
            <div className={styles.scientific} data-testid="flower-scientific-name">{flower.scientificName}</div>
            <div className={styles.sub}>{flower.commonName}</div>
            <span className={styles.pill}>Fictional demo observation</span>
            <div className={styles.facts}>
              <span>📍 Demo location: {flower.country}, {flower.continent}</span>
              <span>🌱 Demo habitat label: {flower.demoBiome}</span>
              <span>🗓 Demo observation month: {MONTHS[flower.demoObservationMonth-1]}</span>
              <span data-testid="flower-id">🔗 flowerId: {flower.flowerId}</span>
            </div>
            <a className={styles.back} href="/d/adrgfjg/world-explorer-dev">← Back to World Explorer</a>
          </aside>
          <main className={styles.main}>
            <section className={styles.section}>
              <h2 className={styles.heading}>✦ {flower.storyTitle}</h2>
              <p className={styles.text}>{flower.fictionalStory}</p>
              <p className={styles.warning}>Creative sample text, not a sourced cultural tradition or verified historical account.</p>
            </section>
            <section className={styles.section}>
              <h2 className={styles.heading}>Observation timeline (demo)</h2>
              <div className={styles.months} aria-label="Illustrative observation month, not flowering season">
                {MONTHS.map((month, index) => (
                  <div key={month} className={`${styles.month} ${index+1===flower.demoObservationMonth ? styles.monthActive : ''}`}>
                    {month}
                  </div>
                ))}
              </div>
              <p className={styles.warning}>Highlighted month belongs to fictional demo data. It does NOT establish the species&apos; flowering season.</p>
            </section>
            <section className={styles.section}>
              <h2 className={styles.heading}>Botanical & cultural references</h2>
              <p className={styles.text}>Taxonomy, verified habitat, real observation coordinates, medicinal claims, and cultural stories require source review. Planned data sources: Kew Plants of the World Online, iNaturalist, and independently verified cultural references.</p>
              <p className={styles.warning}>No real observation, medical benefit, or cultural attribution is claimed in this demo.</p>
            </section>
          </main>
        </div>
      )}
      <footer className={styles.footer}>
        <span>Flower Story MVP · {flower ? flower.scientificName : 'No matching record'} · Sample data only</span>
        <span data-testid="story-owner">BloomAtlas Flower Story · Samira Porduğan track</span>
      </footer>
    </div>
  );
}
