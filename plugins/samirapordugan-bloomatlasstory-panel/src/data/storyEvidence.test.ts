import { findStoryEvidence, storyEvidence, storyEvidenceSource } from './storyEvidence';

describe('regional story evidence', () => {
  it('has eleven unique, scoped and attributed species records', () => {
    expect(storyEvidence).toHaveLength(11);
    expect(new Set(storyEvidence.map(row => row.id)).size).toBe(11);
    for (const row of storyEvidence) {
      expect(row.scope.length).toBeGreaterThan(0);
      expect(row.sourceUrl).toMatch(/^https:\/\//);
      expect(row.season.length).toBeGreaterThan(0);
      expect(row.accessedAt).toBe('2026-11-27');
    }
  });
  it('matches the internal lotus ID with the accepted scientific name only', () => {
    expect(findStoryEvidence('lotus-nucifera', 'Nelumbo nucifera')?.highlightMonths).toEqual([6, 7]);
    expect(findStoryEvidence('lotus-nucifera', 'Lotus nucifera')).toBeUndefined();
    expect(findStoryEvidence('unknown', 'Rosa canina')).toBeUndefined();
  });
  it('does not turn Southern Hemisphere seasons or variable flowering into invented months', () => {
    for (const id of ['protea-cynaroides', 'strelitzia-reginae', 'anigozanthos-manglesii']) {
      expect(storyEvidence.find(row => row.id === id)?.highlightMonths).toEqual([]);
    }
    expect(storyEvidence.every(row => row.highlightMonths.every(month => Number.isInteger(month) && month >= 1 && month <= 12))).toBe(true);
  });
  it('keeps unverified cultural stories absent and links the evidence source', () => {
    expect(findStoryEvidence('lupinus-polyphyllus', 'Lupinus polyphyllus')?.culturalStory).toBeNull();
    const row = findStoryEvidence('rosa-canina', 'Rosa canina')!;
    expect(storyEvidenceSource(row).url).toBe(row.sourceUrl);
    expect(storyEvidenceSource(row).name).toContain(row.accessedAt);
  });
});
