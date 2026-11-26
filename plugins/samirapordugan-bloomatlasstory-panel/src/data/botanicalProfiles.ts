// POWO kabul edilen takson sayfalarının kısa, özgün İngilizce özetleri.
// Gözlem yeri/ayı, doğal yayılış/çiçeklenme bilgisi yerine kullanılmaz.
export interface BotanicalProfile {
  id: string;
  scientificName: string;
  family: string;
  growthForm: string;
  climate: string;
  nativeRegions: readonly string[];
  range: string;
  taxonomyUrl: string;
}
const entry = (id: string, scientificName: string, family: string, growthForm: string, climate: string, nativeRegions: string[], range: string, ipni: string): BotanicalProfile => ({ id, scientificName, family, growthForm, climate, nativeRegions, range, taxonomyUrl: `https://powo.science.kew.org/taxon/${ipni}` });
export const botanicalProfiles: BotanicalProfile[] = [
  entry('rosa-canina', 'Rosa canina', 'Rosaceae', 'Shrub', 'Temperate', ['Europe', 'Africa', 'Asia'], 'Madeira and northwestern Africa, across Europe into central Asia and Pakistan.', '731955-1'),
  entry('lavandula-angustifolia', 'Lavandula angustifolia', 'Lamiaceae', 'Subshrub', 'Temperate', ['Europe'], 'Southwestern Europe, extending from northeastern Spain through France to Italy.', '449008-1'),
  entry('tulipa-gesneriana', 'Tulipa gesneriana', 'Liliaceae', 'Bulbous geophyte', 'Temperate', [], 'POWO records this as a cultivated-origin plant from Türkiye; a wild native range is not asserted here.', '542923-1'),
  entry('prunus-serrulata', 'Prunus serrulata', 'Rosaceae', 'Tree', 'Temperate', ['Asia'], 'Eastern and southern China through Korea.', '730268-1'),
  entry('lotus-nucifera', 'Nelumbo nucifera', 'Nelumbonaceae', 'Rhizomatous hydrogeophyte', 'Subtropical', ['Europe', 'Asia', 'Oceania'], 'Eastern Europe towards northern Iran, and from the Russian Far East across tropical Asia to northern and northeastern Australia.', '605422-1'),
  entry('protea-cynaroides', 'Protea cynaroides', 'Proteaceae', 'Tuberous shrub', 'Subtropical', ['Africa'], 'Southern Cape region of South Africa.', '705744-1'),
  entry('strelitzia-reginae', 'Strelitzia reginae', 'Strelitziaceae', 'Perennial', 'Subtropical', ['Africa'], 'South Africa, from the Cape region east to KwaZulu-Natal.', '798194-1'),
  entry('echinacea-purpurea', 'Echinacea purpurea', 'Asteraceae', 'Perennial', 'Temperate', ['North America'], 'Central and eastern United States.', '1174497-2'),
  entry('lupinus-polyphyllus', 'Lupinus polyphyllus', 'Fabaceae', 'Perennial', 'Temperate', ['North America'], 'Parts of western Canada and the western USA, as well as eastern Canada and north-central and northeastern USA (POWO taxonomic range).', '504939-1'),
  entry('passiflora-caerulea', 'Passiflora caerulea', 'Passifloraceae', 'Liana', 'Subtropical', ['South America'], 'South America, from Bolivia through Brazil to northern Argentina.', '321949-2'),
  entry('anigozanthos-manglesii', 'Anigozanthos manglesii', 'Haemodoraceae', 'Perennial', 'Subtropical', ['Oceania'], 'Western and southwestern parts of Western Australia.', '429580-1'),
  entry("rosa-gallica", "Rosa gallica", "Rosaceae", "Shrub", "Temperate", ["Europe", "Asia"], "Mediterranean and central/eastern Europe through the Caucasus, with records in western Asia.", "732569-1"),
  entry("rosa-rugosa", "Rosa rugosa", "Rosaceae", "Shrub", "Temperate", ["Asia"], "Northeastern Asia, including the Russian Far East, northern China and Japan.", "927373-1"),
  entry("lavandula-stoechas", "Lavandula stoechas", "Lamiaceae", "Subshrub", "Subtropical", ["Europe", "Africa", "Asia"], "Mediterranean region.", "449089-1"),
  entry("lavandula-latifolia", "Lavandula latifolia", "Lamiaceae", "Subshrub", "Temperate", ["Europe"], "Western Mediterranean Europe, from Spain through France to Italy.", "449051-1"),
  entry("tulipa-tarda", "Tulipa tarda", "Liliaceae", "Bulbous geophyte", "Temperate", ["Asia"], "Central Asia and northwestern Iran.", "543112-1"),
  entry("prunus-avium", "Prunus avium", "Rosaceae", "Tree", "Temperate", ["Europe", "Africa", "Asia"], "Europe, northern Africa and western Asia as far as Afghanistan.", "30093848-2"),
  entry("nelumbo-lutea", "Nelumbo lutea", "Nelumbonaceae", "Rhizomatous hydrogeophyte", "Temperate", ["North America", "South America"], "Southeastern Canada through Mexico, with native occurrences in the Greater Antilles and Colombia.", "605419-1"),
  entry("protea-repens", "Protea repens", "Proteaceae", "Shrub or tree", "Subtropical", ["Africa"], "Southern Cape region of South Africa.", "706086-1"),
  entry("strelitzia-nicolai", "Strelitzia nicolai", "Strelitziaceae", "Tree", "Subtropical", ["Africa"], "Southeastern Africa, including eastern Botswana, Zimbabwe, Mozambique and KwaZulu-Natal.", "798185-1"),
  entry("echinacea-angustifolia", "Echinacea angustifolia", "Asteraceae", "Perennial", "Temperate", ["North America"], "Central North America, including western Canada and the north-central United States.", "87143-2"),
  entry("lupinus-perennis", "Lupinus perennis", "Fabaceae", "Perennial", "Temperate", ["North America"], "Southeastern Canada and central/eastern United States.", "504907-1"),
  entry("passiflora-incarnata", "Passiflora incarnata", "Passifloraceae", "Climbing subshrub or tree", "Temperate", ["North America"], "Central and eastern United States and Bermuda.", "675096-1"),
  entry("anigozanthos-flavidus", "Anigozanthos flavidus", "Haemodoraceae", "Perennial", "Subtropical", ["Oceania"], "Southwestern Australia.", "429575-1"),
];
export function matchProfile(id: string, scientificName: string, family: string, taxonomyUrl: string): BotanicalProfile | undefined {
  // Takson kimliği veya familya değişirse eski profili sessizce kullanma.
  return botanicalProfiles.find(p => p.id === id && p.scientificName === scientificName && p.family === family && p.taxonomyUrl === taxonomyUrl);
}
