# Bloom Oracle · AI Evaluation

Bloom Oracle is the "Similar Flowers" feature in the Flower Story panel. For the flower on screen, it suggests the three most similar flowers from a fixed catalogue and explains why each one was chosen.

Code: `plugins/samirapordugan-bloomatlasstory-panel/src/utils/bloomOracle.ts`, `src/components/BloomOraclePilot.tsx`
Evaluation: `src/utils/oracleBenchmark.ts`, `src/utils/oracleBenchmark.test.ts`

---

## Method

Bloom Oracle is a weighted k-nearest-neighbor search (k = 3) over hand-checked botanical profiles.

**Catalogue:** 24 species profiles summarised from Kew Plants of the World Online (`src/data/botanicalProfiles.ts`). Each profile links to its Kew page.

**Features and weights:**

| Feature | Weight | Similarity |
|---|---|---|
| Family | 3 | 1 if equal, else 0 |
| Growth form | 2 | 1 if equal, else 0 |
| Broad climate | 2 | 1 if equal, else 0 |
| Native regions | 1 | Overlap of the two region sets (Jaccard) |

**Score:** the weighted mean of the feature similarities that both flowers have.

**Coverage:** how much of the total weight (8) was available for the comparison.

**Rules:**
- The query flower is never suggested.
- A candidate needs at least 3 shared features, and a score above 0.
- Ties are broken by coverage, then by ID, so the result is always the same.

**Explanation:** every suggestion has a "Why this result?" list with each feature, both values, the match and the weight.

---

## Evaluation

**Question:** does the weighting find related flowers better than simple rules?

**Queries:** the first 11 catalogue species, which are the original BloomAtlas species. The other 13 profiles are reference species, added so every query has at least one partner from the same genus.

**Answer key:** for each query, the other catalogue species of the **same genus** (for example Rosa gallica and Rosa rugosa for Rosa canina). Genus is not one of the features.

**Compared with:**
- **Family baseline:** same family first, then alphabetical.
- **Random baseline:** 3 random candidates out of 23. Expected values, calculated exactly.

**Metrics (top 3):**
- **Hit@3:** is at least one correct answer in the top 3?
- **Precision@3:** what share of the 3 suggestions is correct?
- **MRR@3:** 1 / rank of the first correct answer, or 0 if there is none.

### Results

| Method | Hit@3 | Precision@3 | MRR@3 |
|---|---|---|---|
| **Bloom Oracle** | **1.00** | **0.394** | **1.00** |
| Family baseline | 1.00 | 0.364 | 0.939 |
| Random (expected) | 0.152 | 0.051 | 0.093 |

0.394 is the highest Precision@3 possible here, because 9 of the 11 queries have only one same-genus species in the catalogue.

The test `reproduces the numbers reported in docs/ai-evaluation.md` in `oracleBenchmark.test.ts` checks these numbers on every CI run.

### Per query

| Query | Correct answers | Bloom Oracle top 3 | Family baseline top 3 |
|---|---|---|---|
| Rosa canina | Rosa gallica, Rosa rugosa | **Rosa gallica**, **Rosa rugosa**, Prunus avium | Prunus avium, Prunus serrulata, **Rosa gallica** |
| Lavandula angustifolia | Lavandula stoechas, Lavandula latifolia | **L. latifolia**, **L. stoechas**, Rosa gallica | **L. latifolia**, **L. stoechas**, Anigozanthos flavidus |
| Tulipa gesneriana | Tulipa tarda | **Tulipa tarda**, Echinacea angustifolia, Echinacea purpurea | **Tulipa tarda**, Anigozanthos flavidus, Anigozanthos manglesii |
| Prunus serrulata | Prunus avium | **Prunus avium**, Rosa rugosa, Rosa gallica | **Prunus avium**, Rosa canina, Rosa gallica |
| Nelumbo nucifera | Nelumbo lutea | **Nelumbo lutea**, Lavandula stoechas, Anigozanthos flavidus | **Nelumbo lutea**, Anigozanthos flavidus, Anigozanthos manglesii |
| Protea cynaroides | Protea repens | **Protea repens**, Strelitzia nicolai, Strelitzia reginae | **Protea repens**, Anigozanthos flavidus, Anigozanthos manglesii |
| Strelitzia reginae | Strelitzia nicolai | **Strelitzia nicolai**, Anigozanthos flavidus, Anigozanthos manglesii | **Strelitzia nicolai**, Anigozanthos flavidus, Anigozanthos manglesii |
| Echinacea purpurea | Echinacea angustifolia | **E. angustifolia**, Lupinus perennis, Lupinus polyphyllus | **E. angustifolia**, Anigozanthos flavidus, Anigozanthos manglesii |
| Lupinus polyphyllus | Lupinus perennis | **Lupinus perennis**, Echinacea angustifolia, Echinacea purpurea | **Lupinus perennis**, Anigozanthos flavidus, Anigozanthos manglesii |
| Passiflora caerulea | Passiflora incarnata | **P. incarnata**, Anigozanthos flavidus, Anigozanthos manglesii | **P. incarnata**, Anigozanthos flavidus, Anigozanthos manglesii |
| Anigozanthos manglesii | Anigozanthos flavidus | **A. flavidus**, Strelitzia reginae, Nelumbo nucifera | **A. flavidus**, Echinacea angustifolia, Echinacea purpurea |

**What the table shows:**
- Bloom Oracle puts a correct answer first for every query.
- The family baseline fails on Rosa canina, because two Prunus species from the same family come first alphabetically.
- After the correct answers, Bloom Oracle fills the list with flowers that share growth form, climate or region (for example the North American perennials Echinacea and Lupinus). The baseline fills it with alphabetical leftovers.

---

## Limitations

- **The answer key is not independent.** Genus is not a feature, but species of the same genus almost always share a family, and family has the largest weight. The test shows the ranking is consistent, not that it is botanically correct.
- **The catalogue is small and hand-picked.** It has 24 profiles, and each query was given at least one same-genus partner. Results on a larger catalogue would be lower.
- **The features are coarse:** broad climate classes and continent-level regions.
- **It is not identification.** The score describes the features we have, not genetic relatedness or how sure we are of a species.
- **There is no learned model.** The weights were chosen by hand, which keeps every result explainable.
