import { nameOriginRows, readCandidateSelection } from './storyDataset';
it('prefers the explicit URL species and observation over stale variables', () => {
  expect(readCandidateSelection('?var-flowerId=test-plant&var-observationId=inat-2', 'rosa-canina', 'inat-1')).toEqual({ flowerId: 'test-plant', observationId: 'inat-2' });
});
it('uses Grafana values when there is no explicit URL and never substitutes invalid IDs', () => {
  expect(readCandidateSelection('', 'test-plant', '${observationId}')).toEqual({ flowerId: 'test-plant', observationId: '' });
  expect(readCandidateSelection('?var-flowerId=bad%20value', 'rosa-canina', '') .flowerId).toBe('');
});
it('matches ID and scientific name, rejects non HTTPS sources', () => {
  const row = { speciesId: 'test-plant', scientificName: 'Test plant', text: 'Example', scope: 'Naming', publisher: 'Example', accessedAt: '2026-11-27', sourceUrl: 'https://example.org', status: 'source_checked_draft' };
  expect(nameOriginRows([row, { ...row, scientificName: 'Wrong' }, { ...row, sourceUrl: 'javascript:bad' }], 'test-plant', 'Test plant')).toEqual([row]);
});
