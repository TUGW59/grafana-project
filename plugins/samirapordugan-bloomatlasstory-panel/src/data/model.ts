export interface Cultivation {
  light: string | null;
  water: string | null;
  soil: string | null;
}

export interface TraditionalUse {
  summary: string;
  category: string;
  usedPart: string | null;
  sourceName: string;
  sourceUrl: string;
  verified: boolean;
}

export interface Source {
  name: string;
  url: string;
  license: string;
}

export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  continents: string[];
  bloomMonths: number[];
  inatTaxonId: number;
  habitat: string | null;
  cultivation: Cultivation | null;
  culturalStory: string | null;
  traditionalUse: TraditionalUse | null;
  sources: Source[];
}

export interface Observation {
  id: string;
  speciesId: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  month: number;
  country: string;
  continent: string;
  photoUrl: string | null;
  photoLicense: string;
  photoAttribution: string;
  sourceUrl: string;
}
