#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
# Bir kez kaynakları derle ve ayrı Grafana projesini başlat. Veri/parola Git dışında.
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
SNAP=$(realpath -e "${1:?Kullanım: bash deploy/review/start.sh /mutlak/yol/preview.json}")
case "$SNAP" in "$ROOT"/*) echo 'Snapshot repo dışında olmalı.'; exit 1;; esac
for cmd in npm deno docker curl python3; do command -v "$cmd" >/dev/null || { echo "Eksik: $cmd"; exit 1; }; done
python3 - "$SNAP" <<'PY'
import json,sys
s=json.load(open(sys.argv[1])); assert s['manifest']['mode']=='verified' and 'candidate' in s['manifest']['dataVersion']
assert s['observations'] and all(x['demo'] is False for x in s['observations'])
print('[OK] Yerel aday snapshot:',len(s['species']),len(s['observations']))
PY
cd "$ROOT"
SNAP_HASH=$(sha256sum "$SNAP" | cut -d' ' -f1)
LOG=$(mktemp -d "$HOME/.bloomatlas-review-log-XXXXXX")
export BLOOMATLAS_UID=$(id -u) BLOOMATLAS_GID=$(id -g) BLOOMATLAS_REVIEW_SNAPSHOT="$SNAP"
SECRET="$HOME/.bloomatlas/review-admin-password"
mkdir -p "$(dirname "$SECRET")"
if [[ ! -s "$SECRET" ]]; then python3 -c 'import secrets; print(secrets.token_urlsafe(32))' > "$SECRET"; fi
chmod 600 "$SECRET"
export BLOOMATLAS_REVIEW_PASSWORD=$(cat "$SECRET")
trap 'unset BLOOMATLAS_REVIEW_PASSWORD' EXIT
# Önce tam kalite kapıları; mevcut 3300/3200 proje isimleri kullanılmaz.
deno test --allow-read packages/contracts/tests/
(cd api && deno check src/preview.ts && deno task check && deno task test)
for plugin in tugcetopuz-bloomatlasworld-panel samirapordugan-bloomatlasstory-panel; do
  (cd "plugins/$plugin" && npm ci --no-audit --no-fund && npm run lint && npm run typecheck && npm run test:ci && npm run build)
  test -s "plugins/$plugin/dist/module.js"
done
# Grafana konteynerinin okuyacağı yalnız kaynak/derleme dosyaları.
chmod -R a+rX plugins/tugcetopuz-bloomatlasworld-panel/dist plugins/samirapordugan-bloomatlasstory-panel/dist deploy/p1/provisioning deploy/p2/dashboards
COMPOSE=(docker compose -p bloomatlas-review -f "$ROOT/deploy/review/compose.yaml")
"${COMPOSE[@]}" up -d
READY=0
for ((i=0;i<90;i++)); do
  if curl -fsS --max-time 3 http://127.0.0.1:18183/v1/metadata -o "$LOG/metadata.json" 2>/dev/null && \
    curl -fsS --max-time 3 --config <(printf 'user = "admin:%s"\n' "$BLOOMATLAS_REVIEW_PASSWORD") http://127.0.0.1:3400/api/dashboards/uid/bloomatlas-world-preview -o "$LOG/world.json" 2>/dev/null && \
    curl -fsS --max-time 3 --config <(printf 'user = "admin:%s"\n' "$BLOOMATLAS_REVIEW_PASSWORD") http://127.0.0.1:3400/api/dashboards/uid/bloomatlas-story-preview -o "$LOG/story.json" 2>/dev/null; then
    READY=1; break
  fi
  sleep 2
done
[[ "$READY" == 1 ]] || { echo "Review runtime hazır olmadı. 3300 korunuyor. Rapor: $LOG"; exit 1; }
for plugin in tugcetopuz-bloomatlasworld-panel samirapordugan-bloomatlasstory-panel; do
  curl -fsS --max-time 10 "http://127.0.0.1:3400/public/plugins/$plugin/module.js" -o "$LOG/$plugin.js"
  cmp "$LOG/$plugin.js" "plugins/$plugin/dist/module.js"
done
python3 - "$LOG" "$SNAP" <<'PY'
import json, pathlib,sys
p=pathlib.Path(sys.argv[1]); s=json.load(open(sys.argv[2])); meta=json.loads((p/'metadata.json').read_text())
assert meta['counts']=={'species':len(s['species']),'observations':len(s['observations'])}, meta.get('counts')
for n,plugin in [('world','tugcetopuz-bloomatlasworld-panel'),('story','samirapordugan-bloomatlasstory-panel')]:
    d=json.loads((p/(n+'.json')).read_text())['dashboard']; assert any(x['type']==plugin for x in d['panels'])
print('[OK] İki dashboard, iki bundle ve API metadata eşleşti.')
from urllib.parse import quote
sample=s['observations'][0]
for name, variables in [('world',{'continent':'__all__','biome':'__all__','month':'__all__','species':'__all__'}),('story',{'flowerId':sample['speciesId']})]:
    d=json.loads((p/(name+'.json')).read_text())['dashboard']
    queries=d['panels'][0]['targets']
    for q in queries:
        for key,val in variables.items(): q['url']=q['url'].replace('${'+key+':percentencode}',quote(val,safe=''))
        assert '${' not in q['url']
        q.update(intervalMs=1000,maxDataPoints=200)
    (p/(name+'-query.json')).write_text(json.dumps({'from':'now-6h','to':'now','queries':queries}))
PY
for name in world story; do
  curl -fsS --max-time 90 --config <(printf 'user = "admin:%s"\n' "$BLOOMATLAS_REVIEW_PASSWORD") -H 'Content-Type: application/json' --data-binary "@$LOG/$name-query.json" http://127.0.0.1:3400/api/ds/query -o "$LOG/$name-query-response.json"
done
python3 - "$LOG" "$SNAP" <<'PY'
import json, pathlib,sys
p=pathlib.Path(sys.argv[1]); s=json.load(open(sys.argv[2])); sample=s['observations'][0]
def rows(result,k):
    r=result[k]; assert not r.get('error') and r.get('status',200)<400,k
    out=[]
    for f in r.get('frames',[]):out.extend(dict(zip([c['name'] for c in f['schema']['fields']],row)) for row in zip(*f['data']['values']))
    return out
world=json.loads((p/'world-query-response.json').read_text())['results']; story=json.loads((p/'story-query-response.json').read_text())['results']
assert {x['id'] for x in rows(world,'A')}=={o['id'] for o in s['observations']}
assert {x['id'] for x in rows(story,'B')}=={o['id'] for o in s['observations']}
assert any(x['id']==sample['id'] and x['speciesId']==sample['speciesId'] for x in rows(story,'B'))
assert any(x['speciesId']==sample['speciesId'] and x['status']=='source_checked_draft' for x in rows(story,'D'))
assert {x['speciesId'] for x in rows(story,'E')}=={x['id'] for x in s['species']}
assert len(rows(story,'E'))==2*len(s['species'])
assert any(x['id']==sample['speciesId'] for x in rows(story,'A'))
for result in (world,story): assert any(x['kind']=='manifest' and 'candidate' in x['value'] for x in rows(result,'C'))
print('[OK] World ve Story Infinity veri kimliği eşleşti.')
PY
[[ "$(sha256sum "$SNAP" | cut -d' ' -f1)" == "$SNAP_HASH" ]] || { echo 'Snapshot dışarıdan değiştirildi; sonuç geçersiz.'; exit 1; }
printf '\n[PASS] Kaynaktan yeniden kurulum. Tarayıcı ve ekip onayı açık.\nWorld: http://127.0.0.1:3400/d/bloomatlas-world-preview\nStory: http://127.0.0.1:3400/d/bloomatlas-story-preview\nRapor: %s\n' "$LOG"
