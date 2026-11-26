import { observationPhotoVariants } from './observationPhotoVariants';

const base = 'https://inaturalist-open-data.s3.amazonaws.com/photos/123/';
test('detail uses the same photo at large size, with fallback', () => {
  expect(observationPhotoVariants(base + 'square.jpg', true)).toEqual(['large', 'medium', 'small', 'square'].map(size => base + size + '.jpg'));
});
test('thumbnail stays small and keeps the original fallback', () => {
  expect(observationPhotoVariants(base + 'medium.jpg', false)).toEqual([base + 'square.jpg', base + 'medium.jpg']);
});
test('rejects unsupported URLs and preserves extension', () => {
  expect(observationPhotoVariants('https://example.org/photos/123/square.jpg', true)).toEqual([]);
  expect(observationPhotoVariants(base + 'square.jpg?redirect=1', true)).toEqual([]);
  expect(observationPhotoVariants(base + 'square.jpeg', true)[0]).toBe(base + 'large.jpeg');
});
test('fallback list is unique and finite', () => {
  expect(observationPhotoVariants(base + 'large.jpg', true)).toEqual(['large', 'medium', 'small'].map(size => base + size + '.jpg'));
});
