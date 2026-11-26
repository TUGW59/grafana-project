# BloomAtlas — joint source review

Two distinct panel plugins, two dashboards and a local candidate Deno API. This is a team review, not publication approval. The existing 3300 environment is independent. This environment uses Grafana 3400 and API 18183, both loopback-only. No candidate observations or credentials are tracked. Provide the previously audited private preview JSON; do not distribute it before license/privacy review. Requires Node/npm, Deno, Docker Compose and Python 3. Run from the repository root:

```bash
bash deploy/review/start.sh /absolute/private/path/preview.json
```

The launcher installs from lockfiles, runs contract/API and plugin quality gates, builds both plugins, provisions both dashboards and checks served bundles. Browser interaction, combined filter behavior, second-machine validation and team approval remain separate acceptance gates. Keep the Story changes pending Samira's review. Do not publish the private candidate data. The new review environment has its own volume and password, outside Git. No automatic commit or push.
