"""RESOLVE 2017 biyom eşleştirmesi. Aday veriye yayın onayı vermez."""
import argparse
import collections
import codecs
import copy
import datetime as dt
import hashlib
import json
import pathlib
import shutil
import tempfile
import urllib.request
import zipfile
import shapefile
from enrich_candidate import audit, ring_contains

URL='https://storage.googleapis.com/teow2016/Ecoregions2017.zip'
LICENSE='https://creativecommons.org/licenses/by/4.0/'
MAX_ZIP=300_000_000

def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def sha256_file(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f,'sha256').hexdigest() if hasattr(hashlib,'file_digest') else _digest(f)


def _digest(f):
    h=hashlib.sha256()
    for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()


def download(path):
    # Resmî arşiv yaklaşık 150 MB. Tek kez indir, cache ve hash ile tekrar kullan.
    if not path.exists():
        tmp=path.with_suffix('.partial')
        try:
            print('[+] RESOLVE Ecoregions 2017 arşivi indiriliyor (yaklaşık 150 MB).',flush=True)
            with urllib.request.urlopen(URL,timeout=90) as r, tmp.open('wb') as f:
                n=0
                while True:
                    block=r.read(1024*1024)
                    if not block: break
                    n+=len(block)
                    if n>MAX_ZIP: raise ValueError('Arşiv boyutu sınırı aşıldı')
                    f.write(block)
            with zipfile.ZipFile(tmp) as z:
                if not any(x.filename.lower().endswith('.shp') for x in z.infolist()): raise ValueError('Shapefile eksik')
            tmp.replace(path)
        finally:
            tmp.unlink(missing_ok=True)
    print('[OK] RESOLVE arşivi cache üzerinden kullanılıyor:',path,flush=True)
    return sha256_file(path)


def inside_shape(x,y,shape):
    # Shapefile polygon halkalarında tek/çift kuralı: delikler dahil.
    # Sınırdaki veya belirsiz noktalar için biyom tahmini yapma.
    if shape.shapeType not in (5,15,25): return 'outside'
    xmin,ymin,xmax,ymax=shape.bbox
    if not xmin<=x<=xmax or not ymin<=y<=ymax: return 'outside'
    count=0
    parts=list(shape.parts)+[len(shape.points)]
    for start,end in zip(parts,parts[1:]):
        ring=shape.points[start:end]
        if len(ring)<4: continue
        xs=[p[0] for p in ring]; ys=[p[1] for p in ring]
        if not min(xs)<=x<=max(xs) or not min(ys)<=y<=max(ys): continue
        state=ring_contains(x,y,ring)
        if state=='boundary': return state
        count+=state=='inside'
    return 'inside' if count%2 else 'outside'


def choose(hits,boundary):
    # Birden çok ayrı ekobölge eşleşmesi olursa null bırakılır.
    unique=set(hits)
    return next(iter(unique)) if len(unique)==1 and not boundary else None


def extract_layer(z,folder):
    # Zip içinden yalnız gerekli dört dosya güvenli sabit isimlere çıkarılır.
    members={x.filename.lower():x for x in z.infolist() if not x.is_dir()}
    shp=[x for x in members if x.endswith('.shp') and not x.startswith('__macosx/')]
    if len(shp)!=1: raise ValueError('Tek RESOLVE shapefile bekleniyordu: '+str(shp))
    stem=shp[0][:-4]
    total=0
    for ext in ('.shp','.shx','.dbf','.prj'):
        member=members.get(stem+ext)
        if member is None: raise ValueError('Arşivde eksik: '+ext)
        total+=member.file_size
        if total>1_200_000_000: raise ValueError('Açılmış arşiv boyutu fazla')
        with z.open(member) as src,(folder/('ecoregions'+ext)).open('wb') as dst: shutil.copyfileobj(src,dst)
    # Koordinatların WGS84 coğrafi sisteminde olduğuna bak; dönüşüm tahmini yok.
    prj=(folder/'ecoregions.prj').read_text(errors='replace').upper()
    if 'PROJCS' in prj or 'PROJCRS' in prj or not any(s in prj for s in ('WGS_1984','WGS 84','WGS_84','WGS84')):
        raise ValueError('Beklenmeyen koordinat sistemi: '+prj[:150])
    # CPG varsa DBF kodlamasını kaynak metadata üzerinden belirle.
    cpg=members.get(stem+'.cpg')
    if cpg is not None:
        if cpg.file_size>4096: raise ValueError('CPG boyutu beklenmedik')
        (folder/'ecoregions.cpg').write_bytes(z.read(cpg))
    return folder/'ecoregions.shp'


def dbf_encoding(layer):
    # Belirtilmiş kodlama öncelikli; hiçbir karakter sessizce silinmez.
    cpg=layer.with_suffix('.cpg')
    with layer.with_suffix('.dbf').open('rb') as f:
        header=f.read(32)
    if len(header)!=32: raise ValueError('DBF başlığı eksik')
    ldid=header[29]
    if cpg.exists():
        raw=cpg.read_text(encoding='utf-8-sig').strip()
        if not raw: raise ValueError('CPG boş')
        aliases={'65001':'utf-8','UTF8':'utf-8','ANSI 1252':'cp1252','1252':'cp1252','8859-1':'iso-8859-1','ISO 8859-1':'iso-8859-1'}
        enc=codecs.lookup(aliases.get(raw.upper(), 'cp'+raw if raw.isdigit() else raw)).name
        candidates=[(enc,'CPG: '+raw)]
    elif ldid in (0x03,0x57):
        candidates=[('cp1252',f'DBF LDID 0x{ldid:02x}; Western ANSI yorumlandı')]
    else:
        # Metadata yoksa UTF-8, ardından Batı Avrupa ANSI adayını dene.
        # Alternatif kodlama varsayımı yayın öncesi gözden geçirilmelidir.
        candidates=[('utf-8',f'CPG yok; LDID 0x{ldid:02x}; strict UTF-8'),('cp1252',f'CPG yok; LDID 0x{ldid:02x}; geçici CP1252 varsayımı')]
    last=None
    for enc,reason in candidates:
        try:
            with shapefile.Reader(str(layer),encoding=enc,encodingErrors='strict') as reader:
                for _ in reader.iterRecords(): pass
            return enc,reason
        except UnicodeDecodeError as exc:
            last=exc
    raise ValueError('DBF kodlaması doğrulanamadı; kaynak CPG/LDID incelenmeli') from last


def match(snapshot,reader):
    fields={f[0].upper() for f in reader.fields[1:]}
    if not {'BIOME_NAME','ECO_NAME','ECO_ID'}<=fields: raise ValueError('RESOLVE alanları eksik: '+str(fields))
    if len(reader)<800: raise ValueError('Beklenenden az ekobölge kaydı')
    hits=collections.defaultdict(set); boundaries=set()
    observations=snapshot['observations']
    for sr in reader.iterShapeRecords():
        d={k.upper():v for k,v in sr.record.as_dict().items()}
        biome=d.get('BIOME_NAME'); name=d.get('ECO_NAME'); eco_id=d.get('ECO_ID')
        if not isinstance(biome,str) or biome.strip() in ('','N/A') or not isinstance(name,str) or not name.strip() or eco_id is None: continue
        for o in observations:
            state=inside_shape(o['longitude'],o['latitude'],sr.shape)
            if state=='boundary': boundaries.add(o['id'])
            elif state=='inside': hits[o['id']].add((biome.strip(),name.strip(),str(eco_id)))
    result={}
    for o in observations:
        result[o['id']]=choose(hits[o['id']],o['id'] in boundaries)
    return result


def self_test():
    s=shapefile.Shape(shapeType=5); s.bbox=[0,0,10,10]; s.parts=[0,5]
    s.points=[(0,0),(10,0),(10,10),(0,10),(0,0),(4,4),(6,4),(6,6),(4,6),(4,4)]
    assert inside_shape(2,2,s)=='inside'
    assert inside_shape(5,5,s)=='outside'
    assert inside_shape(0,2,s)=='boundary'
    assert inside_shape(12,2,s)=='outside'
    assert choose([('a','b','1')]*2,False)==('a','b','1')
    assert choose([('a','b','1'),('c','d','2')],False) is None
    assert choose([('a','b','1')],True) is None
    print('[OK] 7 sentetik biyom geometri testi')


def main():
    p=argparse.ArgumentParser();p.add_argument('--input',type=pathlib.Path,required=True);p.add_argument('--out',type=pathlib.Path,required=True);p.add_argument('--cache',type=pathlib.Path,required=True);a=p.parse_args()
    self_test()
    snapshot=json.loads((a.input/'enriched.candidate.json').read_text()); evidence=json.loads((a.input/'enriched.evidence.json').read_text())
    audit(snapshot,evidence)
    if evidence.get('status')!='enriched_candidate_not_published': raise ValueError('Beklenen zenginleştirilmiş aday raporu değil')
    sha=download(a.cache)
    print('[+] Ekobölge poligonlarıyla çevrimdışı eşleştirme yapılıyor.',flush=True)
    with tempfile.TemporaryDirectory(prefix='bloomatlas-eco-') as td, zipfile.ZipFile(a.cache) as z:
        layer=extract_layer(z,pathlib.Path(td))
        encoding,encoding_basis=dbf_encoding(layer)
        print('[OK] DBF kodlaması:',encoding,'|',encoding_basis,flush=True)
        with shapefile.Reader(str(layer),encoding=encoding,encodingErrors='strict') as r: matches=match(snapshot,r)
    result=copy.deepcopy(snapshot); report=copy.deepcopy(evidence)
    details=[]
    for o in result['observations']:
        hit=matches[o['id']]; o['biome']=hit[0] if hit else None
        details.append({'observationId':o['id'],'biome':o['biome'],'ecoregion':hit[1] if hit else None,'ecoregionId':hit[2] if hit else None})
    result['manifest']['dataVersion']='0.4.0-ecoregion-candidate'
    result['manifest']['generatedAt']=now()
    result['manifest']['sourceVersions']['RESOLVE']='Ecoregions 2017; CC BY 4.0; '+URL+'; sha256='+sha
    report['status']='ecoregion_candidate_not_published'
    report['biomeEnrichment']={'source':URL,'license':LICENSE,'citation':'Dinerstein et al. (2017), doi:10.1093/biosci/bix014','sha256':sha,'matched':sum(bool(v) for v in matches.values()),'total':len(details),'method':'point-in-polygon; no nearest fallback','dbfEncoding':encoding,'dbfEncodingBasis':encoding_basis,'observations':details}
    report['limitations'].append('DBF decoding: '+encoding+'; '+encoding_basis+'. If inferred, check source metadata before publishing.')
    report['limitations'].append('Mapped terrestrial ecoregion is regional context, not observed microhabitat or flowering evidence; unmatched points stay null.')
    audit(result,report)
    for name,obj in [('preview.candidate.json',result),('preview.evidence.json',report)]:
        (a.out/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
    print('[OK] Biyom eşleşmesi:',report['biomeEnrichment']['matched'],'/',len(details))
    print('Biyom dağılımı:',dict(collections.Counter(o['biome'] or 'UNRESOLVED' for o in result['observations'])))
    print('Ülke eşleşmeyen:',sum(o['country'] is None for o in result['observations']))
    print('Aday veri:',len(result['species']),'tür /',len(result['observations']),'gözlem')
    print('Arşiv SHA256:',sha)

if __name__=='__main__': main()
