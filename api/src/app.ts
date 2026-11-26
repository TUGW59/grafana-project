import {
  type BloomAtlasSnapshot,
  type Observation,
  type Species,
  validateSnapshot,
} from '../../packages/contracts/mod.ts';

export type ApiHandler = (request: Request) => Response;

const API_VERSION = 'v1';
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-BloomAtlas-API-Version': API_VERSION,
    },
  });
}

function error(code: string, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
}

function parseInteger(
  params: URLSearchParams,
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number | null {
  const raw = params.get(key);
  if (raw === null) return fallback;
  if (!/^\d+$/.test(raw)) return null;
  const number = Number(raw);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) return null;
  return number;
}

function listPage<T>(items: T[], limit: number, offset: number) {
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset };
}

/** In-process HTTP handler: transport-independent and easy to unit test. */
export function createApp(snapshot: BloomAtlasSnapshot): ApiHandler {
  const errors = validateSnapshot(snapshot);
  if (errors.length !== 0) throw new Error(`Invalid BloomAtlas snapshot:\n${errors.join('\n')}`);

  const species: Species[] = [...snapshot.species].sort((a, b) => a.id.localeCompare(b.id));
  const observations: Observation[] = [...snapshot.observations].sort((a, b) => a.id.localeCompare(b.id));
  const speciesById = new Map(species.map((item) => [item.id, item]));

  return (request: Request): Response => {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (request.method !== 'GET') {
      return error('METHOD_NOT_ALLOWED', 'Only GET is supported', 405);
    }
    if (path === '/health') {
      return json({ status: 'ok', service: 'bloomatlas-api', dataVersion: snapshot.manifest.dataVersion });
    }
    if (path === '/v1/metadata') {
      return json({
        apiVersion: API_VERSION,
        manifest: snapshot.manifest,
        counts: { species: species.length, observations: observations.length },
      });
    }
    if (path === '/v1/filters') {
      const unique = (items: Array<string | null>) =>
        [...new Set(items.filter((x): x is string => typeof x === 'string' && x.length > 0))].sort();
      return json({
        mode: snapshot.manifest.mode,
        continents: unique(observations.map((x) => x.continent)),
        biomes: unique(observations.map((x) => x.biome)),
        months: [...new Set(observations.map((x) => x.observationMonth)
          .filter((x): x is number => typeof x === 'number'))].sort((a, b) => a - b),
        species: species.map((x) => ({ id: x.id, scientificName: x.scientificName })),
      });
    }
    if (path === '/v1/species') {
      const limit = parseInteger(url.searchParams, 'limit', DEFAULT_LIMIT, 1, MAX_LIMIT);
      const offset = parseInteger(url.searchParams, 'offset', 0, 0, Number.MAX_SAFE_INTEGER);
      if (limit === null || offset === null) {
        return error('INVALID_PAGINATION', 'limit must be 1-200; offset must be a non-negative integer', 400);
      }
      return json({ mode: snapshot.manifest.mode, ...listPage(species, limit, offset) });
    }
    if (path.startsWith('/v1/species/')) {
      const id = path.slice('/v1/species/'.length);
      if (!id || id.includes('/')) return error('SPECIES_NOT_FOUND', 'Species not found', 404);
      const item = speciesById.get(id);
      return item === undefined
        ? error('SPECIES_NOT_FOUND', 'Species not found', 404)
        : json({ mode: snapshot.manifest.mode, item });
    }
    if (path === '/v1/observations') {
      const limit = parseInteger(url.searchParams, 'limit', DEFAULT_LIMIT, 1, MAX_LIMIT);
      const offset = parseInteger(url.searchParams, 'offset', 0, 0, Number.MAX_SAFE_INTEGER);
      if (limit === null || offset === null) {
        return error('INVALID_PAGINATION', 'limit must be 1-200; offset must be a non-negative integer', 400);
      }
      const rawMonth = url.searchParams.get('month');
      let month: number | null = null;
      if (rawMonth !== null && rawMonth !== '') {
        if (!/^(?:[1-9]|1[0-2])$/.test(rawMonth)) {
          return error('INVALID_MONTH', 'month must be an integer from 1 to 12', 400);
        }
        month = Number(rawMonth);
      }
      const continent = url.searchParams.get('continent');
      const biome = url.searchParams.get('biome');
      const speciesId = url.searchParams.get('speciesId');
      const items = observations.filter((x) =>
        (!continent || x.continent === continent) &&
        (!biome || x.biome === biome) &&
        (!speciesId || x.speciesId === speciesId) &&
        (month === null || x.observationMonth === month));
      return json({ mode: snapshot.manifest.mode, ...listPage(items, limit, offset) });
    }
    return error('NOT_FOUND', 'Endpoint not found', 404);
  };
}
