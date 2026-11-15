# BloomAtlas — World Explorer (Grafana panel plugin)

Developed by **Tuğçe Topuz** — SEN0415 Advanced Web Programming.

This repository directory contains the complete Grafana `panel` plugin scaffold and the first functional World Explorer MVP. It uses **12 explicitly fictional demo observations** to verify the UI; no external data source is connected yet. Do not present mock records as real scientific observations.

## What works

- Responsive dark themed world map (bundled SVG paths)
- 12 selectable fictional demo points
- Filters: continent, biome, observation month and species
- Reset, no-results empty state, selection details
- Developer credit and visible demo-data label
- Four Jest unit tests for filtering and coordinate projection

## Structure

- `src/module.ts` — Grafana panel registration and panel options
- `src/components/SimplePanel.tsx` — Grafana PanelProps entry point
- `src/components/WorldExplorer.tsx` — panel layout and interactivity
- `src/data/mockFlowers.ts` — *fictional* examples, not sourced observations
- `src/data/worldLandPaths.ts` — static background geometry
- `src/utils/flowerFilters.ts` — pure filtering and map-point projection
- `src/utils/flowerFilters.test.ts` — Jest tests
- `src/plugin.json` — plugin metadata and ID
- `package.json`, `package-lock.json` — build scripts and pinned deps
- `.config/` — the original Grafana create-plugin build/tooling files
- `provisioning/` — original scaffold example, **not** your saved World Explorer Dev dashboard

## Verify (in WSL Ubuntu)

```bash
cd ~/projects/grafana-project/plugins/tugcetopuz-bloomatlasworld-panel
python3 -m json.tool package.json >/dev/null
npm run typecheck
npm run lint
npm run test:ci
npm run build
```

The development Grafana environment is currently the separately running `bloomatlas-world-dev` container with the plugin `dist` bind-mounted. **Do not use `npm run server` or the default scaffold docker-compose configuration:** it previously failed with the root-user image error and can compete for port 3000. Build and reload the dashboard instead. Keep the existing container and its internal Grafana database. Dashboard JSON is saved at repository root `dashboards/world-explorer-dev.json`.

## Not implemented yet

- Real flower observation feed and license/source references
- Deno API and shared Flower Story integration
- Active `View Flower Story` navigation (button explicitly disabled until that dashboard exists)
- Non-demo data mode (displays an honest not-connected message)
- Backend persistence, production signing, two-machine check

To run live on a different system, install npm dependencies using the **lock file** (`npm ci`) and configure a Grafana instance to load this unsigned plugin for local development.
