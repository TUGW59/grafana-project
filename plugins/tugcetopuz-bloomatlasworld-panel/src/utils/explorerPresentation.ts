// Görünüm seçenekleri ve filtre değerleri veri kaynağından bağımsız olarak doğrulanır.
export type ExplorerView = 'explore' | 'insights' | 'compare';

export function resolveExplorerView(requested: ExplorerView, insights: boolean, comparison: boolean): ExplorerView {
  if ((requested === 'insights' && !insights) || (requested === 'compare' && !comparison)) {
    return 'explore';
  }
  return requested;
}

export interface ExplorerOption { value: string; label: string }

export function explorerFilterOptions(rows: readonly ExplorerOption[], current: string): ExplorerOption[] {
  // Geçersiz/eski URL değerini gizleme veya otomatik olarak All ile değiştirme.
  const result = new Map<string, string>([['__all__', 'All']]);
  for (const row of rows) {
    if (row.value && row.value !== '__all__' && !result.has(row.value)) {
      result.set(row.value, row.label || row.value);
    }
  }
  if (current && !result.has(current)) {
    result.set(current, `Unavailable: ${current}`);
  }
  return Array.from(result, ([value, label]) => ({ value, label }));
}
