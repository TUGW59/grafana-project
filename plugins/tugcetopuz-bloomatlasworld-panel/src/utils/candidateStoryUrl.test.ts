import { candidateStoryUrl } from './candidateStoryUrl';
it('uses dashboard UID and preserves exact observation and encoded filters', () => {
  const url = new URL(candidateStoryUrl('test-plant', 'inat-1', { biome: 'A, B & C', species: 'test-plant' }), 'http://localhost:3400');
  expect(url.pathname).toBe('/d/bloomatlas-story-preview');
  expect(url.searchParams.get('var-flowerId')).toBe('test-plant');
  expect(url.searchParams.get('var-observationId')).toBe('inat-1');
  expect(url.searchParams.get('var-biome')).toBe('A, B & C');
  expect(url.searchParams.get('var-month')).toBe('__all__');
});
