import { galleryRows } from './galleryRows';
const row = { speciesId: 'test', scientificName: 'Test plant', rank: 1, fileTitle: 'File:Test.jpg', filePage: 'https://commons.wikimedia.org/wiki/File:Test.jpg', previewUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Test.jpg', width: 900, height: 800, artist: 'Example', credit: 'Own work', licenseName: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0', status: 'metadata_shortlisted_pending_visual_review' };
it('sorts exact species references by rank', () => {
  const second = { ...row, rank: 2 };
  expect(galleryRows([second, row, { ...row, scientificName: 'Wrong' }], 'test', 'Test plant')).toEqual([row, second]);
});
it('rejects unsafe URLs, false approval and mismatched licences', () => {
  expect(galleryRows([{ ...row, previewUrl: 'https://evil.test/x' }, { ...row, status: 'approved' }, { ...row, licenseUrl: 'https://creativecommons.org/licenses/by/4.0' }], 'test', 'Test plant')).toEqual([]);
});
it('rejects incomplete dimensions and credit', () => {
  expect(galleryRows([{ ...row, width: 75 }, { ...row, artist: '' }], 'test', 'Test plant')).toEqual([]);
});
