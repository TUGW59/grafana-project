/** Development-only fictional observation coordinates; not scientific records. */
export type Continent = 'Europe' | 'Asia' | 'Africa' | 'North America' | 'South America' | 'Oceania';
export type Biome = 'Temperate forest' | 'Temperate grassland' | 'Mediterranean' | 'Tropical forest' | 'Savanna' | 'Alpine';

export interface FlowerObservation {
  flowerId: string;
  scientificName: string;
  commonName: string;
  country: string;
  continent: Continent;
  biome: Biome;
  observationMonth: number;
  latitude: number;
  longitude: number;
  color: string;
  symbol: string;
}

export const MOCK_OBSERVATIONS: readonly FlowerObservation[] = [
  {flowerId:'iris-germanica',scientificName:'Iris germanica',commonName:'Bearded Iris',country:'Türkiye',continent:'Asia',biome:'Temperate grassland',observationMonth:4,latitude:39.9,longitude:32.9,color:'#b58ae6',symbol:'🌸'},
  {flowerId:'rosa-canina',scientificName:'Rosa canina',commonName:'Dog Rose',country:'United Kingdom',continent:'Europe',biome:'Temperate forest',observationMonth:6,latitude:52.2,longitude:-1.5,color:'#f18ab4',symbol:'🌹'},
  {flowerId:'lavandula-angustifolia',scientificName:'Lavandula angustifolia',commonName:'English Lavender',country:'France',continent:'Europe',biome:'Mediterranean',observationMonth:7,latitude:44,longitude:5.3,color:'#8f8bdd',symbol:'🪻'},
  {flowerId:'tulipa-gesneriana',scientificName:'Tulipa gesneriana',commonName:'Garden Tulip',country:'Netherlands',continent:'Europe',biome:'Temperate grassland',observationMonth:4,latitude:52,longitude:4.7,color:'#f8a15d',symbol:'🌷'},
  {flowerId:'prunus-serrulata',scientificName:'Prunus serrulata',commonName:'Japanese Cherry',country:'Japan',continent:'Asia',biome:'Temperate forest',observationMonth:4,latitude:35.7,longitude:139.7,color:'#f4a3ba',symbol:'🌸'},
  {flowerId:'lotus-nucifera',scientificName:'Nelumbo nucifera',commonName:'Sacred Lotus',country:'India',continent:'Asia',biome:'Tropical forest',observationMonth:8,latitude:22.6,longitude:77.2,color:'#ff91c8',symbol:'🪷'},
  {flowerId:'protea-cynaroides',scientificName:'Protea cynaroides',commonName:'King Protea',country:'South Africa',continent:'Africa',biome:'Mediterranean',observationMonth:9,latitude:-34,longitude:18.5,color:'#f3b18b',symbol:'🌺'},
  {flowerId:'strelitzia-reginae',scientificName:'Strelitzia reginae',commonName:'Bird of Paradise',country:'South Africa',continent:'Africa',biome:'Savanna',observationMonth:11,latitude:-29,longitude:30.2,color:'#fac357',symbol:'🌼'},
  {flowerId:'echinacea-purpurea',scientificName:'Echinacea purpurea',commonName:'Purple Coneflower',country:'United States',continent:'North America',biome:'Temperate grassland',observationMonth:7,latitude:40,longitude:-93,color:'#a88fe9',symbol:'🌸'},
  {flowerId:'lupinus-polyphyllus',scientificName:'Lupinus polyphyllus',commonName:'Large-leaved Lupine',country:'Canada',continent:'North America',biome:'Temperate forest',observationMonth:6,latitude:49,longitude:-123,color:'#68bad7',symbol:'🪻'},
  {flowerId:'passiflora-caerulea',scientificName:'Passiflora caerulea',commonName:'Blue Passionflower',country:'Argentina',continent:'South America',biome:'Temperate forest',observationMonth:1,latitude:-34.6,longitude:-58.4,color:'#7bd3b7',symbol:'🌺'},
  {flowerId:'anigozanthos-manglesii',scientificName:'Anigozanthos manglesii',commonName:'Red-and-green Kangaroo Paw',country:'Australia',continent:'Oceania',biome:'Mediterranean',observationMonth:9,latitude:-32,longitude:116,color:'#d6e46b',symbol:'🌻'},
];

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'] as const;
