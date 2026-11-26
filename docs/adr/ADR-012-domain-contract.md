# ADR-012 — BloomAtlas domain contract foundation (proposed)

**Status:** Proposed — M1 / BA-101 and BA-103 foundation. Not yet wired into plugins or API.

## Decisions

- `Species.id` is the canonical join key; each `Observation.speciesId` must reference an existing species.
- Grafana dashboard parameter is `var-flowerId`; optional selected observation will be `var-observationId`.
- `dataset mode = demo|verified` must be explicit. No silently substituting a fictional map point for a real source record.
- The initial 12-place snapshot is generated from World Explorer's existing **fictional** demo points; it makes no botanical, photo-license or flowering-time assertions.
- Keep `observedAt` separate from `observationMonth`; a fictional demo month is not reliable flowering evidence.
- In verified records, source URL and date are mandatory; photographs need photo-specific license and attribution.
- Source distributions and cultural claims must be reviewed before the verified ETL pipeline accepts them.
- No direct change to either plugin before both adapters are designed and tested.

## Open issues

1. Existing mock `flowerId = lotus-nucifera` refers to scientific name `Nelumbo nucifera`. Do **not** silently rename the ID: choose `nelumbo-nucifera` plus an explicit legacy alias/migration in BA-102.
2. Story currently understands only 3 of 12 IDs; UI/adapter alignment is separate BA-103/BA-403 work.
3. `growthConditions` vs `cultivation`, phenology evidence and richer source metadata require follow-up contract revisions.
4. Validate that the shared TypeScript module works in Deno *and* both Grafana plugin build toolchains before direct imports (BA-106).

## Verification

`deno check packages/contracts/mod.ts`
`deno test --allow-read packages/contracts/tests/validate_test.ts`

The fixtures are **not** the final actual scientific dataset and **not** an earned datasource bonus.
