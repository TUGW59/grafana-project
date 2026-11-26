// Aynı açık veri fotoğrafının boyutlarını değiştir; fotoğraf kimliği ve uzantısı korunur.
export function observationPhotoVariants(url: string, detail: boolean): string[] {
  const match = /^(https:\/\/inaturalist-open-data\.s3\.amazonaws\.com\/photos\/\d+\/)(square|small|medium|large)\.(jpg|jpeg|png)$/.exec(url);
  if (!match) { return []; }
  const sizes = detail ? ['large', 'medium', 'small', match[2]] : ['square', match[2]];
  return [...new Set(sizes.map(size => `${match[1]}${size}.${match[3]}`))];
}
