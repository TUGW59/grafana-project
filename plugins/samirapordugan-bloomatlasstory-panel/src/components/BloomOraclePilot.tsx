import React from 'react';
import type { BotanicalProfile } from '../data/botanicalProfiles';
import { oracleMinimumCatalog, rankNeighbors } from '../utils/bloomOracle';
interface Props { profile: BotanicalProfile; catalog: BotanicalProfile[]; }
export function BloomOraclePilot({ profile, catalog }: Props) {
  const neighbors = rankNeighbors(profile, catalog);
  return <section aria-label="Bloom Oracle" style={{ border: '1px solid currentColor', borderRadius: 8, padding: 16 }}>
    <h3>Bloom Oracle · Similar Flowers</h3>
    <p>Experimental weighted nearest-neighbor retrieval · {catalog.length} botanical reference profiles · target {oracleMinimumCatalog} or more.</p>
    <p>Similarity describes the available botanical features, not identification confidence or genetic relatedness. No flowering predictions. Reference-only species may have no mapped observation in BloomAtlas.</p>
    <details><summary>Method and limitations</summary><p>Family (3), growth description (2), broad POWO climate (2), native-region overlap (1). Score = weighted mean of shared-feature similarities. Coverage = available feature weight / 8. Minimum three shared features. The query itself is excluded. No learned model or independent accuracy evaluation. A reproducible genus-retrieval benchmark is available in the development report.</p><p>POWO climate categories are not the RESOLVE biome of the observation. Region groups are coarse project mappings; cultivated-origin tulips have no wild range feature.</p></details>
    {neighbors.length === 0 ? <p role="status">No comparable profiles available.</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12, marginTop: 12 }}>
      {neighbors.map(n => <article key={n.profile.id} style={{ padding: 12, border: '1px solid currentColor', borderRadius: 6 }}><strong><i>{n.profile.scientificName}</i></strong><p>Feature similarity: {Math.round(n.similarity * 100)}% · Coverage: {Math.round(n.coverage * 100)}%</p><details><summary>Why this result?</summary><ul>{n.evidence.map(e => <li key={e.label}>{e.label}: {e.left} / {e.right} — {Math.round(e.similarity * 100)}% match (weight {e.weight})</li>)}</ul></details><a href={n.profile.taxonomyUrl} target="_blank" rel="noreferrer">Kew botanical source ↗</a></article>)}
    </div>}
  </section>;
}
