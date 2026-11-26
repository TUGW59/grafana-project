// Kaynaklı bölgesel fenoloji; gözlem ayı veya küresel takvim değildir.
export interface StoryEvidence {
  id: string;
  scientificName: string;
  sourceName: string;
  sourceUrl: string;
  scope: string;
  season: string;
  highlightMonths: number[];
  culturalStory: string | null;
  accessedAt: string;
}
export const storyEvidence: StoryEvidence[] = [
  {
    "id": "rosa-canina",
    "scientificName": "Rosa canina",
    "sourceName": "Woodland Trust",
    "sourceUrl": "https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/plants/wild-flowers/dog-rose",
    "scope": "United Kingdom · wild plants",
    "season": "Often most conspicuous in May and June; the source also gives a broader May–August flowering season.",
    "highlightMonths": [
      5,
      6
    ],
    "culturalStory": "Dog rose motifs appear in medieval heraldry. The Woodland Trust also records European folklore associated with the plant. These are historical beliefs, not medical claims.",
    "accessedAt": "2026-11-27"
  },
  {
    "id": "lavandula-angustifolia",
    "scientificName": "Lavandula angustifolia",
    "sourceName": "Royal Horticultural Society",
    "sourceUrl": "https://www.rhs.org.uk/plants/lavender/english",
    "scope": "UK horticulture · English lavender cultivars",
    "season": "Cultivars generally begin flowering in early summer.",
    "highlightMonths": [],
    "culturalStory": "English lavender has a long horticultural association with fragrance: its oils are used in perfumery and dried flowers in scented household items.",
    "accessedAt": "2026-11-27"
  },
  {
    "id": "tulipa-gesneriana",
    "scientificName": "Tulipa gesneriana",
    "sourceName": "Royal Horticultural Society",
    "sourceUrl": "https://www.rhs.org.uk/plants/18512/tulipa-gesneriana/details",
    "scope": "UK horticulture · garden tulips under this name",
    "season": "Late spring. Cultivated hybrids may differ.",
    "highlightMonths": [],
    "culturalStory": "The RHS notes that the garden tulip was described in the sixteenth century; its origin is uncertain and many plants sold under this name are hybrids.",
    "accessedAt": "2026-11-27"
  },
  {
    "id": "prunus-serrulata",
    "scientificName": "Prunus serrulata",
    "sourceName": "Royal Horticultural Society",
    "sourceUrl": "https://www.rhs.org.uk/plants/14026/prunus-serrulata-d/details",
    "scope": "UK horticulture · double-flowered form described by RHS",
    "season": "Mid to late spring, for the form described in the source.",
    "highlightMonths": [],
    "culturalStory": null,
    "accessedAt": "2026-11-27"
  },
  {
    "id": "lotus-nucifera",
    "scientificName": "Nelumbo nucifera",
    "sourceName": "NC State Extension",
    "sourceUrl": "https://plants.ces.ncsu.edu/plants/nelumbo-nucifera/common-name/chinese-waterlily/",
    "scope": "North American horticultural reference",
    "season": "Summer, particularly around June and July.",
    "highlightMonths": [
      6,
      7
    ],
    "culturalStory": "The sacred lotus has religious symbolism in Hinduism and Buddhism, reflected in its common name.",
    "accessedAt": "2026-11-27"
  },
  {
    "id": "protea-cynaroides",
    "scientificName": "Protea cynaroides",
    "sourceName": "South African National Biodiversity Institute",
    "sourceUrl": "https://pza.sanbi.org/protea-cynaroides",
    "scope": "South Africa · local forms",
    "season": "Flowering times vary substantially between local forms and climates; no single month range is assigned.",
    "highlightMonths": [],
    "culturalStory": "King protea is South Africa’s national flower. The genus name refers to Proteus, the shape-changing figure of Greek mythology, in recognition of its varied forms.",
    "accessedAt": "2026-11-27"
  },
  {
    "id": "strelitzia-reginae",
    "scientificName": "Strelitzia reginae",
    "sourceName": "South African National Biodiversity Institute",
    "sourceUrl": "https://pza.sanbi.org/strelitzia-reginae",
    "scope": "South Africa · Southern Hemisphere seasons",
    "season": "Winter, spring and early summer are listed by SANBI.",
    "highlightMonths": [],
    "culturalStory": "The genus commemorates Queen Charlotte of Mecklenburg-Strelitz. The epithet reginae also refers to a queen.",
    "accessedAt": "2026-11-27"
  },
  {
    "id": "echinacea-purpurea",
    "scientificName": "Echinacea purpurea",
    "sourceName": "NC State Extension",
    "sourceUrl": "https://plants.ces.ncsu.edu/plants/echinacea-purpurea/common-name/coneflower/",
    "scope": "North American horticultural reference",
    "season": "From early summer into mid-autumn.",
    "highlightMonths": [],
    "culturalStory": null,
    "accessedAt": "2026-11-27"
  },
  {
    "id": "lupinus-polyphyllus",
    "scientificName": "Lupinus polyphyllus",
    "sourceName": "Biological Flora of Central Europe (2022 review)",
    "sourceUrl": "https://doi.org/10.1016/j.ppees.2022.125715",
    "scope": "Native range · literature review",
    "season": "May to early September, as reported in the review. Not a universal calendar.",
    "highlightMonths": [],
    "culturalStory": null,
    "accessedAt": "2026-11-27"
  },
  {
    "id": "passiflora-caerulea",
    "scientificName": "Passiflora caerulea",
    "sourceName": "NC State Extension",
    "sourceUrl": "https://plants.ces.ncsu.edu/plants/passiflora-caerulea/common-name/blue-passionflower/",
    "scope": "North American horticultural reference",
    "season": "Usually early summer to early autumn.",
    "highlightMonths": [],
    "culturalStory": "NC State Extension traces the genus name to Christian symbolism associated with the Passion of Christ and the flower’s distinctive structures.",
    "accessedAt": "2026-11-27"
  },
  {
    "id": "anigozanthos-manglesii",
    "scientificName": "Anigozanthos manglesii",
    "sourceName": "Australian National Botanic Gardens",
    "sourceUrl": "https://www.anbg.gov.au/stamps/stamp-anigozanthos-manglesii-2006.html",
    "scope": "Perth, Western Australia · Southern Hemisphere",
    "season": "Spring in bushland around Perth.",
    "highlightMonths": [],
    "culturalStory": "The red-and-green kangaroo paw represents Western Australia as its floral emblem and appeared on an Australian postage stamp issued in 2006.",
    "accessedAt": "2026-11-27"
  }
];
// Tür kimliği ve bilimsel ad birlikte uyuşmalı; yakın eşleşme kullanılmaz.
export function findStoryEvidence(id: string, scientificName: string): StoryEvidence | undefined {
  return storyEvidence.find(row => row.id === id && row.scientificName === scientificName);
}
export function storyEvidenceSource(evidence: StoryEvidence) {
  return { name: `${evidence.sourceName} — regional flowering and contextual evidence (accessed ${evidence.accessedAt})`, url: evidence.sourceUrl, license: 'Project paraphrase; source linked; publication review pending' };
}
