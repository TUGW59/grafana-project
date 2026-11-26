import type { PanelData } from '@grafana/data';

/**
 * Grafana Infinity'den gelen DataFrame'i satır nesnelerine dönüştürür.
 * JSON parser'daki columns[].text adları ile buradaki alan anahtarları aynı olmalıdır.
 * Veri yokken sessizce kurgusal mock veri kullanmayız.
 */
export function frameRows(data: PanelData, refId: string): Array<Record<string, unknown>> {
  const frame = data.series.find((series) => series.refId === refId);
  if (!frame) {
    return [];
  }
  return Array.from({ length: frame.length }, (_, index) => {
    const row: Record<string, unknown> = {};
    for (const field of frame.fields) {
      row[field.name] = field.values[index];
    }
    return row;
  });
}

export function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function finiteNum(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
