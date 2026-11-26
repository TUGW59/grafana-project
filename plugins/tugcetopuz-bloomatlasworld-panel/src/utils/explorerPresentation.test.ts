import { explorerFilterOptions, resolveExplorerView } from './explorerPresentation';

describe('Explorer presentation', () => {
  it('keeps the chosen enabled view', () => {
    expect(resolveExplorerView('compare', true, true)).toBe('compare');
  });
  it('returns to Explore when an option is disabled', () => {
    expect(resolveExplorerView('compare', true, false)).toBe('explore');
    expect(resolveExplorerView('insights', false, true)).toBe('explore');
  });
  it('retains comma-containing values and removes duplicates', () => {
    const value = 'Temperate Forests, Woodlands & Scrub';
    expect(explorerFilterOptions([{ value, label: value }, { value, label: 'duplicate' }], value)).toEqual([
      { value: '__all__', label: 'All' }, { value, label: value },
    ]);
  });
  it('does not silently reset an unavailable value', () => {
    expect(explorerFilterOptions([], 'old')[1]).toEqual({ value: 'old', label: 'Unavailable: old' });
  });
});
