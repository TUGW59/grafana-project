import type { PanelData } from '@grafana/data';
import { finiteNum, frameRows, str } from './frameRows';

describe('Grafana DataFrame adapter', () => {
  const data = {
    series: [{
      refId: 'A',
      length: 2,
      fields: [
        { name: 'speciesId', values: ['rosa-canina', 'iris-germanica'] },
        { name: 'latitude', values: [52.2, 39.9] },
      ],
    }],
  } as unknown as PanelData;

  it('DataFrame kayıtlarını satırlara çevirir', () => {
    expect(frameRows(data, 'A')).toEqual([
      { speciesId: 'rosa-canina', latitude: 52.2 },
      { speciesId: 'iris-germanica', latitude: 39.9 },
    ]);
  });
  it('bilinmeyen sorgudan sahte veri üretmez', () => {
    expect(frameRows(data, 'B')).toEqual([]);
  });
  it('geçersiz sayıları koordinat olarak kabul etmez', () => {
    expect(finiteNum('52.2')).toBeNull();
    expect(finiteNum(52.2)).toBe(52.2);
    expect(str(null)).toBe('');
  });
});
