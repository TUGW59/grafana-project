"""Yerel aday veriyi denetim raporuna bağla; yayın verisi üretmez."""
import argparse
import hashlib
import json
from pathlib import Path


def prepare(candidate_path, evidence_path, audit_path):
    paths = [Path(candidate_path), Path(evidence_path), Path(audit_path)]
    raw = [p.read_bytes() for p in paths]
    candidate, evidence, audit = map(json.loads, raw)
    for name, content in zip(('preview.candidate.json', 'preview.evidence.json'), raw[:2]):
        if hashlib.sha256(content).hexdigest() != audit['inputSha256'][name]:
            raise ValueError(f'Denetim raporu hash uyuşmazlığı: {name}')
    if candidate['manifest']['mode'] != 'verified' or audit['status'] != 'review_not_publication_approval':
        raise ValueError('Beklenen aday/denetim durumu yok')
    observations = candidate['observations']
    ids = {o['id'] for o in observations}
    species = {s['id'] for s in candidate['species']}
    attribution = {a['observationId']: a for a in evidence['attributions']}
    checks = {c['observationId']: c for c in audit['checks']}
    ecoregions = {r['observationId']: r for r in evidence['biomeEnrichment']['observations']}
    if (not ids or len(ids) != len(observations) or len(species) != len(candidate['species'])
            or len(attribution) != len(evidence['attributions']) or len(checks) != len(audit['checks'])
            or ids != set(attribution) or ids != set(checks) or ids != set(ecoregions)
            or audit['counts']['total'] != len(ids) or audit['counts']['rechecked'] != len(ids)
            or audit['counts']['hold'] != 0):
        raise ValueError('Eksik, tekrarlı veya HOLD kayıt var')
    for o in observations:
        a, c = attribution[o['id']], checks[o['id']]
        if (c['status'] != 'rechecked' or c['issues'] or c['speciesId'] != o['speciesId']
                or o['speciesId'] not in species or o['demo'] is not False or o['source'] != 'iNaturalist'
                or a['sourceUrl'] != o['sourceUrl'] or a['observationLicense'] != o['observationLicense']
                or a['photoAttribution'] != o['photoAttribution']
                or a['photoLicenseCode'] not in ('cc0', 'cc-by')
                or a['observationLicenseCode'] not in ('cc0', 'cc-by')
                or o['photoLicense'] != {'cc0':'CC0','cc-by':'CC BY'}[a['photoLicenseCode']]
                or not a['observer'] or not a['photoSourceUrl']):
            raise ValueError(f'Kayıt/atıf tutarsız: {o["id"]}')
        # Veri sözleşmesini kırmadan, yalnız önizlemeye ait ek alanları ekle.
        o.update(observer=a['observer'], photoSourceUrl=a['photoSourceUrl'],
                 ecoregion=ecoregions[o['id']]['ecoregion'])
    for s in candidate['species']:
        s['taxonomyUrl'] = next((x['url'] for x in s['sources'] if 'Kew' in x['name']), None)
    return candidate


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('candidate'); p.add_argument('evidence'); p.add_argument('audit'); p.add_argument('output')
    args = p.parse_args()
    data = prepare(args.candidate, args.evidence, args.audit)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    # Özel veri, public repository dışında tutulur.
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    out.chmod(0o600)
    print(f'[OK] Hash ve denetim eşleşmesi: {len(data["species"])} tür, {len(data["observations"])} gözlem')
