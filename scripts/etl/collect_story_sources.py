"""Wikidata ve Commons kaynak keşfi. Aday veri; hiçbir kayıt otomatik yayımlanmaz."""
import argparse
import csv
import datetime as dt
import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

WD = 'https://query.wikidata.org/sparql'
COMMONS = 'https://commons.wikimedia.org/w/api.php'
UA = 'BloomAtlasStudentProject/0.1 (https://github.com/TUGW59/grafana-project; academic source discovery)'
QID = re.compile(r'Q[1-9][0-9]*\Z')
LICENSE = re.compile(r'https?://creativecommons\.org/(?:licenses/(?:by|by-sa)/(?:2\.0|2\.5|3\.0|4\.0)(?:/[a-z-]+)?|publicdomain/zero/1\.0)/?\Z')


def get_json(url, params):
    # Kısıtlı istek hızı, zaman aşımı ve geçici hatalar için tekrar deneme.
    for attempt in range(3):
        time.sleep(1.1)
        req = urllib.request.Request(url + '?' + urllib.parse.urlencode(params), headers={
            'User-Agent': UA, 'Accept': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                data = json.load(response)
            if 'error' in data:
                raise ValueError('API error: ' + str(data['error'].get('code', 'unknown')))
            return data
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            wait = e.headers.get('Retry-After', '')
            time.sleep(min(60, int(wait)) if wait.isdigit() else 2 ** (attempt + 1))
        except (TimeoutError, urllib.error.URLError):
            if attempt == 2:
                raise
            time.sleep(2 ** (attempt + 1))
    raise RuntimeError('Unreachable')


def query(q):
    return get_json(WD, {'query': q, 'format': 'json'})['results']['bindings']


def value(row, key):
    return row.get(key, {}).get('value', '')


def entity_id(uri):
    if uri.startswith(('http://www.wikidata.org/entity/', 'https://www.wikidata.org/entity/')):
        q = uri.rsplit('/', 1)[-1]
        if QID.fullmatch(q):
            return q
    return None


def load_species(seed):
    data = json.loads(seed.read_text())
    rows = data['items']
    result = {}
    names = set()
    for row in rows:
        ident, name = row['speciesId'], row['scientificName']
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', ident) or not isinstance(name, str) or not name.strip() or ident in result or name in names:
            raise ValueError('Invalid/duplicate seed identity')
        result[ident] = name
        names.add(name)
    if not result or len(result) > 100:
        raise ValueError('Seed must have 1–100 species')
    return result


def taxon_query(names):
    vals = ' '.join(json.dumps(n, ensure_ascii=False) for n in names)
    return '''SELECT DISTINCT ?name ?taxon ?image ?article WHERE {
      VALUES ?name { %s }
      ?taxon wdt:P225 ?name; wdt:P105 wd:Q7432.
      OPTIONAL { ?taxon wdt:P18 ?image. }
      OPTIONAL { ?article schema:about ?taxon; schema:isPartOf <https://en.wikipedia.org/>. }
    }''' % vals


def match_taxa(names, bindings):
    out = {}
    for sid, name in names.items():
        rows = [r for r in bindings if value(r, 'name') == name and entity_id(value(r, 'taxon'))]
        ids = sorted({entity_id(value(r, 'taxon')) for r in rows})
        out[sid] = {'speciesId': sid, 'scientificName': name,
                    'taxonStatus': 'exact_unique' if len(ids) == 1 else ('ambiguous' if ids else 'not_found'),
                    'wikidataIds': ids, 'namingClaims': [], 'imageCandidates': [], 'discoveryErrors': []}
        if len(ids) == 1:
            out[sid]['wikidataUrl'] = 'https://www.wikidata.org/wiki/' + ids[0]
            out[sid]['articleLinks'] = sorted({value(r, 'article') for r in rows if value(r, 'article').startswith('https://en.wikipedia.org/wiki/')})
            out[sid]['p18Files'] = sorted({urllib.parse.unquote(value(r, 'image').split('/Special:FilePath/', 1)[-1]).replace('_', ' ') for r in rows if '/Special:FilePath/' in value(r, 'image')})
    return out


def naming_query(ids):
    assert all(QID.fullmatch(q) for q in ids)
    vals = ' '.join('wd:' + q for q in ids)
    return '''SELECT DISTINCT ?taxon ?subject ?scope ?namedAfter ?namedAfterLabel ?statement ?referenceURL WHERE {
      VALUES ?taxon { %s }
      { BIND(?taxon AS ?subject) BIND("species" AS ?scope) }
      UNION
      { ?taxon wdt:P171 ?subject. ?subject wdt:P105 wd:Q34740. BIND("genus" AS ?scope) }
      ?subject p:P138 ?statement. ?statement ps:P138 ?namedAfter.
      FILTER NOT EXISTS { ?statement wikibase:rank wikibase:DeprecatedRank }
      OPTIONAL { ?statement prov:wasDerivedFrom/pr:P854 ?referenceURL. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }''' % vals


def attach_naming(records, bindings):
    for item in records.values():
        if item['taxonStatus'] != 'exact_unique':
            continue
        q = item['wikidataIds'][0]
        grouped = {}
        for row in bindings:
            scope = value(row, 'scope')
            subject = entity_id(value(row, 'subject'))
            target = entity_id(value(row, 'namedAfter'))
            statement = value(row, 'statement')
            if entity_id(value(row, 'taxon')) != q or scope not in ('genus', 'species') or not subject or not target or not statement.startswith(('http://www.wikidata.org/entity/statement/', 'https://www.wikidata.org/entity/statement/')) or (scope == 'species' and subject != q):
                continue
            key = (scope, subject, target, statement)
            claim = grouped.setdefault(key, {'scope': scope, 'subjectId': subject, 'namedAfterId': target, 'namedAfterLabel': value(row, 'namedAfterLabel') or target, 'statementUrl': statement, 'sourceUrls': [], 'reviewStatus': 'manual_review_required'})
            ref = value(row, 'referenceURL')
            if ref.startswith('https://') and ref not in claim['sourceUrls']:
                claim['sourceUrls'].append(ref)
        item['namingClaims'] = list(grouped.values())


def plain(s):
    return ' '.join(html.unescape(re.sub(r'<[^>]*>', ' ', str(s))).split())


def media_candidate(page, discovery):
    if page.get('missing') or not page.get('imageinfo'):
        return None
    info = page['imageinfo'][0]
    md = info.get('extmetadata', {})
    def field(key):
        return plain(md.get(key, {}).get('value', ''))
    width, height = info.get('width', 0), info.get('height', 0)
    url, thumb, detail = (info.get(k, '') for k in ('url', 'thumburl', 'descriptionurl'))
    artist, license_url, license_name = (field(k) for k in ('Artist', 'LicenseUrl', 'LicenseShortName'))
    # Lisans adı tek başına yeterli değil; tam sürüm URL'si ve atıf gerekir.
    if info.get('mime') not in ('image/jpeg', 'image/png', 'image/webp') or not isinstance(width, int) or not isinstance(height, int) or min(width, height) < 600 or not artist or not license_name or not LICENSE.fullmatch(license_url):
        return None
    if not (url.startswith('https://upload.wikimedia.org/') and thumb.startswith('https://upload.wikimedia.org/') and detail.startswith('https://commons.wikimedia.org/wiki/File:')):
        return None
    # Açık ek kısıt işaretleri varsa elle incelenecek; otomatik aday listesine alınmaz.
    if field('Restrictions'):
        return None
    return {'fileTitle': page.get('title'), 'filePage': detail, 'originalUrl': url, 'previewUrl': thumb,
            'width': width, 'height': height, 'artist': artist, 'credit': field('Credit'),
            'licenseName': license_name, 'licenseUrl': license_url, 'discoveredVia': discovery,
            'reviewStatus': 'manual_review_required', 'flowerVisible': None, 'taxonConfirmedVisually': None}


def commons_pages(params):
    return get_json(COMMONS, {'action': 'query', 'format': 'json', 'formatversion': '2', 'prop': 'imageinfo',
        'iiprop': 'url|size|mime|extmetadata', 'iiurlwidth': '1000', 'iiextmetadatalanguage': 'en', **params}).get('query', {}).get('pages', [])


def collect_images(item):
    seen = set()
    batches = []
    if item.get('p18Files'):
        titles = '|'.join('File:' + x for x in item['p18Files'][:4])
        batches.append(('wikidata_P18', {'titles': titles}))
    # Arama sonucu tür kimliği veya çiçek görünürlüğü kanıtı değildir.
    batches.append(('commons_text_search', {'generator': 'search', 'gsrsearch': '"' + item['scientificName'] + '" filetype:bitmap', 'gsrnamespace': '6', 'gsrlimit': '6'}))
    for method, params in batches:
        try:
            for page in commons_pages(params):
                photo = media_candidate(page, method)
                if photo and photo['filePage'] not in seen:
                    item['imageCandidates'].append(photo)
                    seen.add(photo['filePage'])
        except (ValueError, OSError, KeyError) as exc:
            item['discoveryErrors'].append(method + ': ' + str(exc)[:200])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--seed', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    names = load_species(args.seed)
    args.out.mkdir(parents=True, exist_ok=False)
    errors = []
    try:
        records = match_taxa(names, query(taxon_query(names.values())))
    except (ValueError, OSError, KeyError) as exc:
        errors.append('Wikidata taxon query: ' + str(exc)[:200])
        records = match_taxa(names, [])
        for item in records.values():
            item['taxonStatus'] = 'request_failed'
    ids = [i['wikidataIds'][0] for i in records.values() if i['taxonStatus'] == 'exact_unique']
    if ids:
        try:
            attach_naming(records, query(naming_query(sorted(set(ids)))))
        except (ValueError, OSError, KeyError) as exc:
            errors.append('Wikidata naming query: ' + str(exc)[:200])
    for item in records.values():
        collect_images(item)
        print(item['scientificName'], item['taxonStatus'], 'claims=', len(item['namingClaims']), 'photos=', len(item['imageCandidates']), 'errors=', len(item['discoveryErrors']), flush=True)
    summary = {'species': len(records), 'exactTaxa': len(ids), 'namingClaims': sum(len(i['namingClaims']) for i in records.values()), 'imageCandidates': sum(len(i['imageCandidates']) for i in records.values()), 'speciesWithImages': sum(bool(i['imageCandidates']) for i in records.values()), 'requestErrors': len(errors)+sum(len(i['discoveryErrors']) for i in records.values())}
    report = {'schemaVersion': '1.0.0', 'status': 'candidate_not_publication_approved', 'accessedAt': dt.datetime.now(dt.timezone.utc).isoformat(), 'sources': {'wikidata': WD, 'commons': COMMONS}, 'summary': summary, 'errors': errors, 'items': list(records.values()), 'limitations': ['No automatic publication or narrative generation.', 'Genus naming is not species naming. Missing P138 is not negative evidence.', 'Article links are discovery leads, not copied prose.', 'Commons metadata and text search are not visual taxon or flower confirmation. Review attribution, licensing and source page manually.']}
    (args.out/'story-discovery.candidate.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    # CSV incelemesi için formül enjeksiyonunu önle; JSON orijinal metni saklar.
    def safe(x):
        return "'"+x if isinstance(x,str) and x.startswith(('=', '+', '-', '@', '\t', '\r')) else x
    with (args.out/'photo-review.csv').open('w', newline='', encoding='utf-8-sig') as f:
        writer=csv.writer(f)
        writer.writerow(['speciesId','scientificName','filePage','previewUrl','width','height','artist','licenseName','licenseUrl','decision'])
        for item in records.values():
            for p in item['imageCandidates']:
                writer.writerow([safe(x) for x in [item['speciesId'], item['scientificName'],p['filePage'],p['previewUrl'],p['width'],p['height'],p['artist'],p['licenseName'],p['licenseUrl'],'PENDING']])
    print(json.dumps(summary), flush=True)


if __name__ == '__main__':
    main()
