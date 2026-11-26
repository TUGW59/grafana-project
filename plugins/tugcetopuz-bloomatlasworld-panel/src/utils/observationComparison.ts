// Karşılaştırma yalnız mevcut Grafana sorgusunun kayıtları üzerinden yapılır.
export interface ComparisonIdentity {
  id: string;
  speciesId: string;
}

export function comparisonChoices<T extends ComparisonIdentity>(rows: readonly T[], selected: T): T[] {
  // Farklı türleri önce göster; aynı türün farklı gözlemleri de seçilebilir.
  return rows.filter(row => row.id !== selected.id).sort((a, b) =>
    Number(a.speciesId === selected.speciesId) - Number(b.speciesId === selected.speciesId) || a.id.localeCompare(b.id)
  );
}

export function chooseComparison<T extends ComparisonIdentity>(choices: readonly T[], requestedId: string): T | undefined {
  // Filtre veya ana seçim değişince artık görünmeyen kaydı kullanma.
  return choices.find(row => row.id === requestedId) ?? choices[0];
}
