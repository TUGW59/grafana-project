import React from 'react';
import type { StoryEvidence } from '../data/storyEvidence';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function RegionalFlowering({ evidence }: { evidence: StoryEvidence }) {
  return <section aria-label="Regional flowering evidence" style={{ border: '1px solid currentColor', borderRadius: 8, padding: 16 }}>
    <h3>Regional flowering evidence</h3>
    <p><strong>{evidence.scope}</strong></p>
    <p>{evidence.season}</p>
    {evidence.highlightMonths.length > 0 && <ol aria-label="Reported peak or typical months" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(44px,1fr))', gap: 4, listStyle: 'none', padding: 0 }}>
      {months.map((month, i) => <li key={month} aria-label={`${month}: ${evidence.highlightMonths.includes(i + 1) ? 'reported typical period' : 'not specified as typical'}`} style={{ padding: 6, textAlign: 'center', border: '1px solid currentColor', borderRadius: 4, ...(evidence.highlightMonths.includes(i + 1) ? { background: '#315f45', color: 'white' } : {}) }}>{month}</li>)}
    </ol>}
    <p><small>Literature or horticultural guidance, not measured flowering observations. Unhighlighted months are not proof of absence. Exact timing varies by locality and year.</small></p>
    <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">{evidence.sourceName} ↗</a>
  </section>;
}
