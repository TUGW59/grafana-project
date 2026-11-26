#!/usr/bin/env python3
"""BloomAtlas: küçük, kaynaklı iNaturalist aday koleksiyonu (çevrimdışı ETL girdisi)."""
import argparse
import datetime as dt
import json
import math
import pathlib
import time
import urllib.parse
import urllib.request
import urllib.error

LICENSES = {'cc0': 'CC0', 'cc-by': 'CC BY'}
BASE = 'https://api.inaturalist.org/v1'

# Kısıtlı istek sıklığı; ham API yanıtları veya gizli koordinatlar diske yazılmaz.
def request(path, params):
    url = BASE + path + '?' + urllib.parse.urlencode(params)
    for attempt in range(3):
        time.sleep(1.1)
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'BloomAtlas-Student-Project/0.1', 'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=35) as response:
                return json.load(response)['results']
        except urllib.error.HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            time.sleep(15 * (attempt + 1))
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(5 * (attempt + 1))


def normalize(raw, taxon_id, species_id):
    # Yalnız açık koordinatlı, araştırma dereceli, tam tür eşleşmeli kayıtlar.
    if raw.get('quality_grade') != 'research' or raw.get('captive') is not False:
        return None
    if raw.get('obscured') is not False or raw.get('geoprivacy') not in (None, 'open') or raw.get('taxon_geoprivacy') not in (None, 'open'):
        return None
    if (raw.get('taxon') or {}).get('id') != taxon_id:
        return None
    license_name = LICENSES.get(raw.get('license_code'))
    user = raw.get('user') or {}
    author = user.get('name') or user.get('login')
    if not license_name or not isinstance(author, str) or not author.strip():
        return None
    obs_id = raw.get('id')
    if type(obs_id) is not int or obs_id <= 0:
        return None
    geo = raw.get('geojson') or {}
    coords = geo.get('coordinates')
    if geo.get('type') != 'Point' or not isinstance(coords, list) or len(coords) != 2:
        return None
    lon, lat = coords
    if not all(type(n) in (int, float) and math.isfinite(n) for n in coords) or not (-180 <= lon <= 180 and -90 <= lat <= 90):
        return None
    try:
        date = dt.date.fromisoformat(raw.get('observed_on') or '')
    except (ValueError, TypeError):
        return None
    # Fotoğraf lisansı, gözlem lisansından bağımsız olarak denetlenir.
    photo = None
    for p in raw.get('photos') or []:
        u = p.get('url') or ''
        parsed = urllib.parse.urlparse(u)
        if LICENSES.get(p.get('license_code')) and p.get('attribution') and parsed.scheme == 'https' and parsed.netloc == 'inaturalist-open-data.s3.amazonaws.com' and p.get('id'):
            photo = p
            break
    url = f'https://www.inaturalist.org/observations/{obs_id}'
    record = dict(id=f'inat-{obs_id}', speciesId=species_id, source='iNaturalist', demo=False,
                  latitude=lat, longitude=lon, observedAt=date.isoformat(), observationMonth=date.month,
                  country=None, continent=None, biome=None,
                  photoUrl=photo['url'] if photo else None,
                  photoLicense=LICENSES[photo['license_code']] if photo else None,
                  photoAttribution=photo['attribution'] if photo else None,
                  observationLicense=license_name, sourceUrl=url)
    # Atıf ve lisans bağlantıları ayrı kaynak kaydında tutulur; UI entegrasyonunda gösterilecek.
    evidence = dict(observationId=record['id'], observer=author, sourceUrl=url,
                    observationLicense=license_name, observationLicenseCode=raw['license_code'],
                    photoId=photo['id'] if photo else None,
                    photoSourceUrl=f'https://www.inaturalist.org/photos/{photo["id"]}' if photo else None,
                    photoLicenseCode=photo['license_code'] if photo else None,
                    photoAttribution=photo['attribution'] if photo else None)
    return record, evidence


def collect(seed, count):
    species, observations, evidence, report = [], [], [], []
    seen = set()
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    for s in seed['species']:
        # Eş adları otomatik kabul etmiyoruz; kesin tür adı bulunmazsa manuel inceleme.
        try:
            taxa = request('/taxa', {'q': s['scientificName'], 'rank': 'species', 'is_active': 'true', 'per_page': 30})
            matches = [t for t in taxa if t.get('name') == s['scientificName'] and t.get('rank') == 'species' and t.get('is_active') is True]
            if len(matches) != 1:
                report.append({'speciesId': s['id'], 'status': 'manual_taxonomy_review', 'matches': len(matches)})
                continue
            t = matches[0]
            raw = request('/observations', {'taxon_id': t['id'], 'quality_grade': 'research', 'captive': 'false', 'geo': 'true', 'license': 'cc0,cc-by', 'per_page': 50, 'order_by': 'id', 'order': 'desc'})
            valid = []
            for item in raw:
                pair = normalize(item, t['id'], s['id'])
                if pair and pair[0]['id'] not in seen:
                    seen.add(pair[0]['id'])
                    valid.append(pair)
            # Lisanslı fotoğraflı gözlemleri öncele; bu istatistiksel temsil örneği değildir.
            valid.sort(key=lambda p: (p[0]['photoUrl'] is not None, p[0]['observedAt']), reverse=True)
            selected = valid[:count]
            if selected:
                species.append(dict(id=s['id'], scientificName=s['scientificName'], commonName=s['commonName'], family=None,
                                    sources=[dict(name='iNaturalist taxon', url=f'https://www.inaturalist.org/taxa/{t["id"]}', license=None, accessedAt=now)]))
                observations.extend(p[0] for p in selected)
                evidence.extend(p[1] for p in selected)
            report.append({'speciesId': s['id'], 'taxonId': t['id'], 'status': 'collected' if selected else 'no_eligible_observations', 'candidates': len(raw), 'accepted': len(selected)})
            print(s['id'], len(selected), 'aday gözlem', flush=True)
        except (urllib.error.URLError, TimeoutError, KeyError, ValueError) as exc:
            report.append({'speciesId': s['id'], 'status': 'request_failed', 'reason': type(exc).__name__})
            print(s['id'], 'istek başarısız:', type(exc).__name__, flush=True)
    snapshot = dict(manifest=dict(dataVersion='0.2.0-inat-candidate', mode='verified', generatedAt=now,
                                  sourceVersions={'iNaturalist': 'API v1; collected '+now}), species=species, observations=observations)
    return snapshot, {'status':'candidate_not_published', 'accessedAt':now, 'requestedSpecies':len(seed['species']), 'species':report, 'attributions':evidence,
                      'limitations':['Taxonomy not yet cross-checked against WCVP', 'No country/continent/biome enrichment', 'Observation month is not flowering evidence', 'Sample is not representative', 'Review exact license versions and attribution before publishing']}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--seed', type=pathlib.Path, required=True)
    p.add_argument('--out', type=pathlib.Path, required=True)
    p.add_argument('--per-species', type=int, choices=range(1, 6), default=3)
    args = p.parse_args()
    args.out.mkdir(parents=True, exist_ok=False)
    snapshot, report = collect(json.loads(args.seed.read_text()), args.per_species)
    (args.out/'inat.candidate.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2)+'\n')
    (args.out/'inat.evidence.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(f"TOPLAM: {len(snapshot['species'])} tür, {len(snapshot['observations'])} aday gözlem")
    if not snapshot['observations']:
        raise SystemExit('Hiç uygun kayıt bulunmadı; raporu kontrol edin.')

if __name__ == '__main__':
    main()
