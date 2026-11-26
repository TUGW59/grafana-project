// Yalnızca sorgudan dönen gözlemleri sayar; popülasyon veya fenoloji tahmini yapmaz.
export interface ObservationForAnalysis {
  id: string;
  speciesId: string;
  latitude: number;
  longitude: number;
  country: string;
  continent: string;
  biome: string;
  observedAt: string;
}
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
export const INITIAL_VIEW: Viewport = { x: 480, y: 240, zoom: 1 };

export function viewport(x: number, y: number, zoom: number): Viewport {
  const z = Math.max(1, Math.min(8, zoom));
  const halfWidth = 480 / z;
  const halfHeight = 240 / z;
  return {
    x: Math.max(halfWidth, Math.min(960 - halfWidth, x)),
    y: Math.max(halfHeight, Math.min(480 - halfHeight, y)),
    zoom: z,
  };
}

export function point(o: ObservationForAnalysis) {
  return { x: (o.longitude + 180) * (960 / 360), y: (90 - o.latitude) * (480 / 180) };
}

// Görüntü ölçeğine göre kümeler; kayıtları birleştirmez veya silmez.
// Aynı koordinattaki kayıtlar en yüksek yakınlaştırmada bile listeden seçilebilir.
export function groupObservations<T extends ObservationForAnalysis>(rows: readonly T[], zoom: number) {
  const size = 32 / Math.max(1, Math.min(8, zoom));
  const bins = new Map<string, T[]>();
  for (const row of rows) {
    const p = point(row);
    const key = `${Math.floor(p.x / size)}:${Math.floor(p.y / size)}`;
    const group = bins.get(key) ?? [];
    group.push(row);
    bins.set(key, group);
  }
  return Array.from(bins.entries()).map(([id, items]) => {
    const points = items.map(point);
    return {
      id,
      items: [...items].sort((a, b) => a.id.localeCompare(b.id)),
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    };
  });
}

export function summarizeObservations(rows: readonly ObservationForAnalysis[]) {
  const continents = new Map<string, number>();
  const months = Array<number>(12).fill(0);
  let unknownMonth = 0;
  for (const row of rows) {
    const key = row.continent || 'Unresolved';
    continents.set(key, (continents.get(key) ?? 0) + 1);
    // ISO tarihinden yalnız gözlem ayını al; geçersiz tarihleri ayrı say.
    const date = row.observedAt;
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
    if (parsed && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date) {
      months[parsed.getUTCMonth()] += 1;
    } else {
      unknownMonth += 1;
    }
  }
  return {
    total: rows.length,
    species: new Set(rows.map(row => row.speciesId)).size,
    countryKnown: rows.filter(row => !!row.country && !!row.continent).length,
    biomeKnown: rows.filter(row => !!row.biome).length,
    months,
    unknownMonth,
    continents: Array.from(continents.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  };
}
