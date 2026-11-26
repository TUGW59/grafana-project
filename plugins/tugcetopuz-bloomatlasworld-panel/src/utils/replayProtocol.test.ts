import { readReplay, replayUrl } from './replayProtocol';

describe('Observation replay protocol', () => {
  const ids = ['inat-1', 'inat-2'];
  it('opens only the local review origin and encodes selected IDs', () => {
    const url = new URL(replayUrl('127.0.0.1:3400', ids, 1)!);
    expect(url.searchParams.getAll('id')).toEqual(ids);
    expect(url.searchParams.get('offset')).toBe('1');
    expect(replayUrl('example.com', ids, 0)).toBeUndefined();
  });
  it('rejects duplicate IDs and invalid resume offsets', () => {
    expect(replayUrl('localhost:3400', ['a', 'a'], 0)).toBeUndefined();
    expect(replayUrl('localhost:3400', ids, 3)).toBeUndefined();
  });
  it('accepts only the next matching observation', () => {
    const event = JSON.stringify({ type:'observation', id:'inat-2', sequence:2, total:2 });
    expect(readReplay(event, ids, ['inat-1'])).toEqual({type:'observation',id:'inat-2'});
    expect(readReplay(event, ids, [])).toBeUndefined();
    expect(readReplay(event, ids, ['inat-2'])).toBeUndefined();
  });
  it('requires every observation before completion', () => {
    const event = JSON.stringify({type:'complete',total:2});
    expect(readReplay(event, ids, ['inat-1'])).toBeUndefined();
    expect(readReplay(event, ids, ids)).toEqual({type:'complete'});
    expect(readReplay('not JSON', ids, [])).toBeUndefined();
  });
});
