"""İkinci keşif: kesin QID'leri yeniden doğrula, doğrudan claims ve geniş fotoğraf araması."""
import argparse, collections, csv, datetime as dt, html, json, re
from pathlib import Path
from urllib.parse import urlsplit
from collect_story_sources import get_json, commons_pages, plain, LICENSE, QID, load_species

ENTITY_API = 'https://www.wikidata.org/w/api.php'
NON_FLOWER = re.compile(r'\b(tendril|leaf|leaves|root|roots|seed|seeds|fruit|fruits|bark|herbarium|distribution map|illustration|botanical plate)\b', re.I)
FLOWER = re.compile(r'\b(flower|flowers|blossom|bloom|inflorescence|fleur|blüte|cvijet)\b', re.I)

def claims(entity, prop):
    return [c for c in entity.get('claims', {}).get(prop, []) if c.get('rank') != 'deprecated' and c.get('mainsnak', {}).get('snaktype') == 'value']

def val(snak):
    v = snak.get('datavalue', {}).get('value')
    return v.get('id') if isinstance(v, dict) else v

def values(e, p):
    return [val(c['mainsnak']) for c in claims(e,p)]

def entities(ids):
    out = {}
    ids = sorted({x for x in ids if isinstance(x,str) and QID.fullmatch(x)})
    for i in range(0,len(ids),20):
        batch = ids[i:i+20]
        data = get_json(ENTITY_API, {'action':'wbgetentities','ids':'|'.join(batch),'props':'claims|labels','languages':'en','format':'json'})['entities']
        out.update({q:e for q,e in data.items() if q in batch and e.get('id')==q and 'missing' not in e})
    return out

def naming(e, scope):
    result=[]
    for c in claims(e,'P138'):
        q=val(c['mainsnak']); sid=c.get('id','')
        if not isinstance(q,str) or not QID.fullmatch(q) or not sid.startswith(e['id']+'$'):
            continue
        refs=sorted({v for r in c.get('references',[]) for s in r.get('snaks',{}).get('P854',[]) if isinstance(v:=val(s),str) and urlsplit(v).scheme in ('http','https')})
        result.append({'scope':scope,'subjectId':e['id'],'namedAfterId':q,'namedAfterLabel':q,'statementUrl':'https://www.wikidata.org/wiki/'+e['id']+'#'+sid,'sourceUrls':refs,'reviewStatus':'manual_review_required'})
    return result

def photo(page, method):
    if page.get('missing') or not page.get('imageinfo'): return None,'missing_imageinfo'
    info=page['imageinfo'][0]; md=info.get('extmetadata',{})
    def field(k): return plain(md.get(k,{}).get('value',''))
    title=page.get('title','')
    if NON_FLOWER.search(title.replace('_',' ')): return None,'non_flower_title'
    if info.get('mime') not in ('image/jpeg','image/png','image/webp'): return None,'not_bitmap'
    w,h=info.get('width',0),info.get('height',0)
    if not isinstance(w,int) or not isinstance(h,int) or min(w,h)<600: return None,'low_resolution'
    artist,lic,lname=field('Artist'),field('LicenseUrl'),field('LicenseShortName')
    if not artist: return None,'missing_artist'
    if not lname or not LICENSE.fullmatch(lic): return None,'license_not_allowed'
    if field('Restrictions'): return None,'restrictions_require_review'
    url,thumb,detail=info.get('url',''),info.get('thumburl',''),info.get('descriptionurl','')
    if not (url.startswith('https://upload.wikimedia.org/') and detail.startswith('https://commons.wikimedia.org/wiki/File:')): return None,'invalid_source_url'
    if not thumb.startswith('https://upload.wikimedia.org/'):
        if max(w,h)>2000: return None,'no_preview_for_large_image'
        thumb=url
    return {'fileTitle':title,'filePage':detail,'originalUrl':url,'previewUrl':thumb,'width':w,'height':h,'artist':artist,'credit':field('Credit'),'licenseName':lname,'licenseUrl':lic.replace('http://','https://',1),'discoveredVia':method,'reviewStatus':'manual_review_required','flowerVisible':None,'taxonConfirmedVisually':None},None

def images(item):
    name=item['scientificName']; p18=item.get('p18Files',[])
    batches=[]
    if p18: batches.append(('wikidata_P18',{'titles':'|'.join('File:'+x.removeprefix('File:') for x in p18[:8])}))
    batches.extend([('species_category',{'generator':'categorymembers','gcmtitle':'Category:'+name,'gcmtype':'file','gcmlimit':'25'}),('flower_search',{'generator':'search','gsrsearch':'"'+name+'" flower filetype:bitmap','gsrnamespace':'6','gsrlimit':'25'}),('species_search',{'generator':'search','gsrsearch':'"'+name+'" filetype:bitmap','gsrnamespace':'6','gsrlimit':'25'})])
    seen={}; rejected=collections.Counter(); scanned=set()
    for method,params in batches:
        try:
            for p in commons_pages(params):
                title=p.get('title','')
                if title in scanned: continue
                scanned.add(title)
                row,reason=photo(p,method)
                if row: seen[row['filePage']]=row
                else: rejected[reason]+=1
        except (ValueError,OSError,KeyError) as e: item['discoveryErrors'].append(method+': '+str(e)[:180])
        if len(seen)>=6: break
    priority={'wikidata_P18':3,'species_category':2,'flower_search':1,'species_search':0}
    item['imageCandidates']=sorted(seen.values(),key=lambda x:(bool(FLOWER.search(x['fileTitle'])),priority[x['discoveredVia']],min(x['width'],x['height'])),reverse=True)[:6]
    item['imageDiagnostics']={'scannedUniqueTitles':len(scanned),'metadataAccepted':len(seen),'rejectedByReason':dict(rejected),'boundedSearch':True}

def review_html(items):
    esc=lambda x:html.escape(str(x),quote=True)
    out=['<!doctype html><html lang="en"><meta charset="utf-8"><title>BloomAtlas Gallery Review</title><style>body{font:16px system-ui;background:#f5f3e9;color:#244c37;margin:24px}section{margin:30px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}article{background:white;border:1px solid #b5c6b1;border-radius:8px;padding:12px}img{width:100%;height:210px;object-fit:contain;background:#e7ede2}small{overflow-wrap:anywhere}a{color:#285a43}</style><h1>BloomAtlas — gallery review</h1><p>All images are candidates. Check species, visible flowers, creator and exact license on the file page. Choose a file per species; no automatic publication.</p>']
    for i in items:
        out.append('<section><h2>'+esc(i['scientificName'])+'</h2><p>'+esc(i['speciesId'])+' — '+str(len(i['imageCandidates']))+' candidates</p><div class="grid">')
        for p in i['imageCandidates']:
            out.append('<article><img loading="lazy" referrerpolicy="no-referrer" src="'+esc(p['previewUrl'])+'" alt="Candidate photo"><p><a href="'+esc(p['filePage'])+'" target="_blank" rel="noopener noreferrer">'+esc(p['fileTitle'])+'</a></p><small>'+esc(p['artist'])+' · '+str(p['width'])+' × '+str(p['height'])+' · <a href="'+esc(p['licenseUrl'])+'">'+esc(p['licenseName'])+'</a></small></article>')
        out.append('</div></section>')
    return '\n'.join(out)+'</html>'

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--seed',type=Path,required=True); parser.add_argument('--previous',type=Path,required=True); parser.add_argument('--out',type=Path,required=True); args=parser.parse_args()
    names=load_species(args.seed); previous=json.loads(args.previous.read_text()); items=previous['items']
    if len(items)!=len(names) or {x['speciesId']:x['scientificName'] for x in items}!=names: raise ValueError('Seed / discovery identity mismatch')
    if any(x['taxonStatus']!='exact_unique' or len(x['wikidataIds'])!=1 or not QID.fullmatch(x['wikidataIds'][0]) for x in items): raise ValueError('Exact QID required')
    errors=[]
    try: taxa=entities([i['wikidataIds'][0] for i in items])
    except (ValueError,OSError,KeyError) as e: taxa={}; errors.append('Taxon entity API: '+str(e)[:180])
    parents=[]
    for i in items:
        i['namingClaims']=[]; i['discoveryErrors']=[]; i['imageCandidates']=[]
        e=taxa.get(i['wikidataIds'][0],{})
        if i['scientificName'] not in values(e,'P225') or 'Q7432' not in values(e,'P105'):
            i['namingStatus']='identity_not_revalidated'; continue
        i['namingStatus']='entity_checked'; parents.extend(values(e,'P171'))
        i['p18Files']=sorted(set(i.get('p18Files',[])+[v for v in values(e,'P18') if isinstance(v,str)]))
        i['namingClaims']=naming(e,'species')
    try: genera=entities(parents)
    except (ValueError,OSError,KeyError) as e: genera={}; errors.append('Parent entity API: '+str(e)[:180])
    for i in items:
        if i['namingStatus']!='entity_checked': continue
        e=taxa[i['wikidataIds'][0]]
        for q in values(e,'P171'):
            g=genera.get(q,{})
            if 'Q34740' in values(g,'P105') and i['scientificName'].split()[0] in values(g,'P225'): i['namingClaims'].extend(naming(g,'genus'))
    try: targets=entities([c['namedAfterId'] for i in items for c in i['namingClaims']])
    except (ValueError,OSError,KeyError) as e: targets={}; errors.append('Named-after label API: '+str(e)[:180])
    for i in items:
        for c in i['namingClaims']: c['namedAfterLabel']=targets.get(c['namedAfterId'],{}).get('labels',{}).get('en',{}).get('value',c['namedAfterId'])
        images(i); print(i['scientificName'],i['namingStatus'],'claims',len(i['namingClaims']),'photos',len(i['imageCandidates']),i['imageDiagnostics'],flush=True)
    summary={'species':len(items),'revalidatedTaxa':sum(i['namingStatus']=='entity_checked' for i in items),'namingClaims':sum(len(i['namingClaims']) for i in items),'imageCandidates':sum(len(i['imageCandidates']) for i in items),'speciesWithImages':sum(bool(i['imageCandidates']) for i in items),'requestErrors':len(errors)+sum(len(i['discoveryErrors']) for i in items)}
    args.out.mkdir(parents=True,exist_ok=False)
    result={'schemaVersion':'2.0.0','status':'candidate_not_publication_approved','accessedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'sources':{'wikidata':ENTITY_API,'commons':'https://commons.wikimedia.org/w/api.php'},'summary':summary,'errors':errors,'items':items,'limitations':['Bounded search, not exhaustive.','No visual or license approval.','Missing P138 does not prove absence.','Direct genus parent only; no inferred taxon naming.']}
    (args.out/'story-discovery-v2.candidate.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    (args.out/'gallery-review.html').write_text(review_html(items))
    def safe(v): return "'"+v if isinstance(v,str) and v.startswith(('=','+','-','@','\t','\r')) else v
    with (args.out/'photo-review-v2.csv').open('w',newline='',encoding='utf-8-sig') as f:
        w=csv.writer(f); w.writerow(['speciesId','scientificName','filePage','previewUrl','width','height','artist','licenseName','licenseUrl','decision'])
        for i in items:
            for p in i['imageCandidates']: w.writerow([safe(v) for v in [i['speciesId'],i['scientificName'],p['filePage'],p['previewUrl'],p['width'],p['height'],p['artist'],p['licenseName'],p['licenseUrl'],'PENDING']])
    print(json.dumps(summary),flush=True)
if __name__=='__main__': main()
