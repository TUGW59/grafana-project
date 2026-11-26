import type { PanelData } from '@grafana/data';
import { previewObservations, sourceLink } from './previewRows';

function data(rows: Array<Record<string, unknown>>): PanelData {
  return {series:[{refId:'A',length:rows.length,fields:Object.keys(rows[0] ?? {}).map(name => ({name,values:rows.map(r => r[name])}))}]} as unknown as PanelData;
}
const valid = {id:'inat-123',speciesId:'rosa-canina',latitude:46,longitude:1,sourceUrl:'https://www.inaturalist.org/observations/123'};
describe('Yerel gerçek aday adaptörü', () => {
  it('kaynaklı gözlemi okur ve bilinmeyen alanı boş bırakır', () => {
    expect(previewObservations(data([valid]))[0]).toMatchObject({id:'inat-123',biome:'',latitude:46});
  });
  it('demo, hatalı koordinat ve tekrarları reddeder', () => {
    expect(previewObservations(data([valid,valid,{...valid,id:'demo-1'},{...valid,id:'inat-2',latitude:99}]))).toHaveLength(1);
  });
  it('güvenli olmayan kaynak bağlantılarını göstermez', () => {
    expect(sourceLink('javascript:alert(1)','observation')).toBe('');
    expect(sourceLink('https://www.inaturalist.org/photos/123','photo')).toBeTruthy();
  });
});
