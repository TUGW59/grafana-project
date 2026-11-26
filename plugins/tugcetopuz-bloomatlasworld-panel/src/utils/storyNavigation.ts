// Yalnız ortak navigasyon değişkenlerini taşı; başka URL parametrelerini kopyalama.
const FILTER_NAMES = ['continent', 'biome', 'month', 'species'] as const;
const WORLD_PATH = '/d/bloomatlas-world-api/world-explorer-api-demo';
const STORY_PATH = '/d/bloomatlas-story-api/flower-story-api-demo';

function filterContext(search: string): URLSearchParams {
  const original = new URLSearchParams(search);
  const result = new URLSearchParams();
  for (const name of FILTER_NAMES) {
    const key = `var-${name}`;
    const value = original.get(key);
    if (value !== null && value !== '') {
      result.set(key, value);
    }
  }
  return result;
}

// URLSearchParams boşluk, Türkçe karakter ve özel karakterleri güvenli biçimde kodlar.
export function buildStoryUrl(speciesId: string, observationId: string, search: string): string {
  const params = filterContext(search);
  params.set('var-flowerId', speciesId);
  params.set('var-observationId', observationId);
  return `${STORY_PATH}?${params.toString()}`;
}

// Story sahibinin geri dönüş için kullanabileceği aynı URL sözleşmesi.
// Henüz Story bileşenine bağlanmadı; bu fonksiyon tek başına E2E kanıtı değildir.
export function buildWorldUrl(search: string): string {
  const params = filterContext(search).toString();
  return params ? `${WORLD_PATH}?${params}` : WORLD_PATH;
}
