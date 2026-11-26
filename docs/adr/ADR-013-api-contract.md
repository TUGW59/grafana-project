# ADR-013 — Deno API v1, demo-first implementation

**Status:** Proposed; pending full-stack Grafana Infinity validation.

- Runtime reads a validated, immutable `demo.snapshot.json` and returns **read-only** HTTP GET responses.
- The API never identifies fictional observation points as verified scientific observations.
- Routes: `GET /health`, `/v1/metadata`, `/v1/filters`, `/v1/species`, `/v1/species/:id`, `/v1/observations`.
- Collection responses use `{mode, items, total, limit, offset}` and deterministic ID ordering.
- Observations support `continent`, `biome`, `speciesId`, and `month` filters with AND semantics.
- Invalid filters or pagination produce HTTP 400 with `{error:{code,message}}`; an unknown species is HTTP 404; zero results are HTTP 200.
- Query filtering is **server-side**; later Grafana dashboards can pass variables to Infinity queries.
- `BLOOMATLAS_HOST=127.0.0.1` by default, configurable to `0.0.0.0` **only for isolated Docker networking**. No public auth mechanism is implemented: do NOT expose to public Internet.
- This API is a *development slice*, not the final botanical ETL / verified data pipeline.
- Missing: `/v1/sources`, explicit source attribution endpoints, verified snapshot generation, datasource provisioning, two panel adapters, navigation E2E, refresh handling, pagination UX.

## Local checks

```bash
cd api
deno task check
deno task test
# optionally: deno run --allow-read --allow-env=BLOOMATLAS_PORT,BLOOMATLAS_HOST --allow-net=127.0.0.1:8000 src/main.ts
```
