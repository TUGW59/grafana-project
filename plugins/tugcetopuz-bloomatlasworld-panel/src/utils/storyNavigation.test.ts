import { buildStoryUrl, buildWorldUrl } from './storyNavigation';

describe('BloomAtlas navigation contract', () => {
  const base = 'http://localhost:3200';
  it('passes selected species and observation and all four filters', () => {
    const url = new URL(buildStoryUrl('rosa-canina', 'demo-rosa-canina-001', '?var-continent=Europe&var-biome=Temperate%20forest&var-month=6&var-species=rosa-canina'), base);
    expect(url.pathname).toBe('/d/bloomatlas-story-api/flower-story-api-demo');
    expect(Object.fromEntries(url.searchParams)).toEqual({ 'var-continent': 'Europe', 'var-biome': 'Temperate forest', 'var-month': '6', 'var-species': 'rosa-canina', 'var-flowerId': 'rosa-canina', 'var-observationId': 'demo-rosa-canina-001' });
  });
  it('keeps All and ignores unrelated parameters and stale selection', () => {
    const url = new URL(buildStoryUrl('iris-germanica', 'demo-iris-germanica-001', '?var-continent=__all__&var-flowerId=old&token=secret'), base);
    expect(url.searchParams.get('var-continent')).toBe('__all__');
    expect(url.searchParams.get('var-flowerId')).toBe('iris-germanica');
    expect(url.searchParams.has('token')).toBe(false);
  });
  it('returns only the Explorer filter context', () => {
    const url = new URL(buildWorldUrl('?var-biome=Temperate%20forest&var-flowerId=rosa-canina&var-observationId=obs'), base);
    expect(url.pathname).toBe('/d/bloomatlas-world-api/world-explorer-api-demo');
    expect(Object.fromEntries(url.searchParams)).toEqual({ 'var-biome': 'Temperate forest' });
    expect(buildWorldUrl('')).toBe('/d/bloomatlas-world-api/world-explorer-api-demo');
  });
});
