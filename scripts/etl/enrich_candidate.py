"""Kaynaklı taksonomi ve çevrimdışı ülke/kıta eşlemesi; yayın onayı vermez."""
import argparse
import collections
import copy
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import urllib.request

# Kew POWO tür sayfalarında incelenen ad/familya eşlemeleri. İç ID değişmez.
# WCVP toplu sürüm denetimi ayrıca yapılacak; bu tablo POWO sayfa kontrolüdür.
TAXA = {
    'rosa-canina': ('Rosa canina', 'Rosaceae', '731955-1'),
    'lavandula-angustifolia': ('Lavandula angustifolia', 'Lamiaceae', '449008-1'),
    'tulipa-gesneriana': ('Tulipa gesneriana', 'Liliaceae', '542923-1'),
    'prunus-serrulata': ('Prunus serrulata', 'Rosaceae', '730268-1'),
    'lotus-nucifera': ('Nelumbo nucifera', 'Nelumbonaceae', '605422-1'),
    'protea-cynaroides': ('Protea cynaroides', 'Proteaceae', '705744-1'),
    'strelitzia-reginae': ('Strelitzia reginae', 'Strelitziaceae', '798194-1'),
    'echinacea-purpurea': ('Echinacea purpurea', 'Asteraceae', '1174497-2'),
    'lupinus-polyphyllus': ('Lupinus polyphyllus', 'Fabaceae', '504939-1'),
    'passiflora-caerulea': ('Passiflora caerulea', 'Passifloraceae', '321949-2'),
    'anigozanthos-manglesii': ('Anigozanthos manglesii', 'Haemodoraceae', '429580-1'),
}
NE_VERSION = '5.1.2'
NE_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/f1890d9f152c896d250a77557a5751a93d494776/geojson/ne_10m_admin_0_countries.geojson'
LICENSES = {'cc0': 'CC0', 'cc-by': 'CC BY'}


def audit(snapshot, evidence):
    # Kaynak ve atıf kayıtları bire bir eşleşmelidir.
    species_ids = [s['id'] for s in snapshot['species']]
    obs = snapshot['observations']
    obs_ids = [o['id'] for o in obs]
    att = evidence['attributions']
    index = {a['observationId']: a for a in att}
    if (len(set(species_ids)) != len(species_ids) or len(set(obs_ids)) != len(obs_ids)
            or len(index) != len(att) or set(obs_ids) != set(index)):
        raise ValueError('Tekrarlı kimlik veya atıf eşleme hatası')
    for o in obs:
        a = index[o['id']]
        if o['speciesId'] not in species_ids or o['demo'] is not False or o['source'] != 'iNaturalist':
            raise ValueError('Geçersiz gözlem kaynağı/tür bağı')
        if any(o[k] != a[k] for k in ('sourceUrl', 'observationLicense', 'photoAttribution')):
            raise ValueError('Atıf uyuşmazlığı: '+o['id'])
        if LICENSES.get(a['observationLicenseCode']) != o['observationLicense'] or o['observationLicense'] not in LICENSES.values():
            raise ValueError('Gözlem lisansı uyuşmazlığı')
        if o['photoUrl'] is not None:
            expected = LICENSES.get(a['photoLicenseCode'])
            if not expected or expected != o['photoLicense'] or not o['photoAttribution'] or not a.get('observer'):
                raise ValueError('Fotoğraf lisansı/atıf eksik')
            if not o['photoUrl'].startswith(f"https://inaturalist-open-data.s3.amazonaws.com/photos/{a['photoId']}/"):
                raise ValueError('Fotoğraf kimliği uyuşmuyor')
        if dt.date.fromisoformat(o['observedAt']).month != o['observationMonth']:
            raise ValueError('Tarih/ay uyuşmazlığı')
        if not all(type(o[k]) in (float, int) and math.isfinite(o[k]) for k in ('latitude','longitude')) or not (-90 <= o['latitude'] <= 90 and -180 <= o['longitude'] <= 180):
            raise ValueError('Koordinat hatası')
    return index


def ring_contains(x, y, ring):
    # Ray casting: GeoJSON sırası longitude, latitude. Sınır noktaları ayrı işaretlenir.
    inside = False
    for a,b in zip(ring, ring[1:]):
        ax,ay = a[:2]; bx,by = b[:2]
        cross = (x-ax)*(by-ay)-(y-ay)*(bx-ax)
        if abs(cross) < 1e-10 and min(ax,bx)-1e-10 <= x <= max(ax,bx)+1e-10 and min(ay,by)-1e-10 <= y <= max(ay,by)+1e-10:
            return 'boundary'
        if (ay > y) != (by > y) and x < (bx-ax)*(y-ay)/(by-ay)+ax:
            inside = not inside
    return 'inside' if inside else 'outside'


def polygon_contains(x,y,rings):
    if not rings: return 'outside'
    outer = ring_contains(x,y,rings[0])
    if outer != 'inside': return outer
    for hole in rings[1:]:
        state = ring_contains(x,y,hole)
        if state == 'boundary': return state
        if state == 'inside': return 'outside'
    return 'inside'


def locate(x,y,features):
    hits=set(); boundary=False
    for f in features:
        p = f['properties']; g = f.get('geometry') or {}
        polygons = [g['coordinates']] if g.get('type')=='Polygon' else g.get('coordinates',[]) if g.get('type')=='MultiPolygon' else []
        country = p.get('ADMIN') or p.get('admin'); continent = p.get('CONTINENT') or p.get('continent')
        if not country or not continent: continue
        for poly in polygons:
            if not poly or not poly[0]: continue
            xs=[pt[0] for pt in poly[0]]; ys=[pt[1] for pt in poly[0]]
            if not min(xs) <= x <= max(xs) or not min(ys) <= y <= max(ys): continue
            status=polygon_contains(x,y,poly)
            if status=='inside': hits.add((country,continent))
            elif status=='boundary': boundary=True
    # Sınırda, denizde ya da çelişkili poligonda tahmin yok.
    return next(iter(hits)) if len(hits)==1 and not boundary else (None,None)


def download(path):
    if not path.exists():
        tmp=path.with_suffix('.tmp')
        try:
            with urllib.request.urlopen(NE_URL, timeout=90) as r:
                data=r.read(30_000_001)
            if len(data)>30_000_000: raise ValueError('Beklenmeyen dosya boyutu')
            parsed=json.loads(data)
            if parsed.get('type')!='FeatureCollection' or len(parsed.get('features',[]))<200: raise ValueError('Natural Earth dosyası geçersiz')
            tmp.write_bytes(data); tmp.replace(path)
        finally:
            tmp.unlink(missing_ok=True)
    data=path.read_bytes(); parsed=json.loads(data)
    if parsed.get('type')!='FeatureCollection' or len(parsed.get('features',[]))<200: raise ValueError('Cache dosyası geçersiz')
    return parsed['features'], hashlib.sha256(data).hexdigest()


def enrich(snapshot,evidence,features,sha):
    audit(snapshot,evidence)
    result=copy.deepcopy(snapshot); now=dt.datetime.now(dt.timezone.utc).isoformat()
    for s in result['species']:
        name,family,ipni=TAXA[s['id']]
        if s['scientificName'] != name: raise ValueError('Takson adı uyuşmuyor: '+s['id'])
        s['family']=family
        s['sources'].append({'name':'Kew Plants of the World Online (taxonomy/family)', 'url':'https://powo.science.kew.org/taxon/'+ipni, 'license':None,'accessedAt':'2026-11-26'})
    unresolved=[]
    for o in result['observations']:
        o['country'],o['continent']=locate(o['longitude'],o['latitude'],features)
        if o['country'] is None: unresolved.append(o['id'])
        # Biyom Natural Earth ülke poligonundan türetilemez; null korunur.
    result['manifest']['dataVersion']='0.3.0-enriched-candidate'
    result['manifest']['generatedAt']=now
    result['manifest']['sourceVersions'].update({'Kew POWO':'Manual species/family page review 2026-11-26; not bulk WCVP verification','Natural Earth':f'Admin 0 Countries 1:10m v{NE_VERSION}; sha256={sha}'})
    report=copy.deepcopy(evidence)
    report['status']='enriched_candidate_not_published'
    report['enrichment']={'generatedAt':now,'naturalEarthUrl':NE_URL,'naturalEarthSha256':sha,'naturalEarthLicense':'Public domain','boundaryMethod':'point-in-polygon, no nearest fallback','countryCounts':dict(collections.Counter(o['country'] or 'UNRESOLVED' for o in result['observations'])),'continentCounts':dict(collections.Counter(o['continent'] or 'UNRESOLVED' for o in result['observations'])),'unresolvedObservationIds':unresolved,'familyCount':sum(bool(s['family']) for s in result['species']),'irisReview':{'name':'Iris × germanica','source':'https://powo.science.kew.org/taxon/438637-1','status':'manual iNaturalist taxon match required'}}
    report['limitations']=['Candidate, not production/published','Bulk WCVP version check pending','Country/continent from Natural Earth de facto boundaries; unresolved records remain null','Biome enrichment pending','Observation month is not flowering evidence','Exact license versions and current public geoprivacy need final check','Sample not representative','Legacy lotus-nucifera ID retained for navigation compatibility']
    return result,report


def self_test():
    outer=[[0,0],[10,0],[10,10],[0,10],[0,0]]
    hole=[[4,4],[6,4],[6,6],[4,6],[4,4]]
    f={'properties':{'ADMIN':'Test','CONTINENT':'Test continent'},'geometry':{'type':'Polygon','coordinates':[outer,hole]}}
    assert locate(2,2,[f])==('Test','Test continent')
    assert locate(5,5,[f])==(None,None)
    assert locate(0,2,[f])==(None,None)
    assert locate(20,20,[f])==(None,None)
    f2=copy.deepcopy(f); f2['properties']['ADMIN']='Other'
    assert locate(2,2,[f,f2])==(None,None)
    multi=copy.deepcopy(f); multi['geometry']={'type':'MultiPolygon','coordinates':[[outer,hole]]}
    assert locate(2,2,[multi])==('Test','Test continent')
    print('[OK] 6 sentetik coğrafya testi')


def main():
    p=argparse.ArgumentParser();p.add_argument('--input',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);a=p.parse_args()
    self_test()
    snapshot=json.loads((a.input/'inat.candidate.json').read_text()); evidence=json.loads((a.input/'inat.evidence.json').read_text())
    audit(snapshot,evidence); print('[OK] Aday veri ile kaynak raporu eşleşiyor',flush=True)
    features,sha=download(a.cache)
    result,report=enrich(snapshot,evidence,features,sha)
    for name,obj in [('enriched.candidate.json',result),('enriched.evidence.json',report)]:
        (a.out/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
    print('Familya:',report['enrichment']['familyCount'],'/',len(result['species']))
    print('Ülke dağılımı:',report['enrichment']['countryCounts'])
    print('Kıta dağılımı:',report['enrichment']['continentCounts'])
    print('Eşleşmeyen gözlem:',len(report['enrichment']['unresolvedObservationIds']))
    print('Biyom: henüz doğrulanmadı')

if __name__=='__main__': main()
