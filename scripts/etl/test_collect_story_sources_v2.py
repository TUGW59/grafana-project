import unittest
from unittest.mock import patch
from collect_story_sources_v2 import claims, values, naming, photo, images, review_html, entities

def claim(prop,value,rank='normal'):
    return {'id':'Q1$abc','rank':rank,'mainsnak':{'snaktype':'value','datavalue':{'value':value}},'references':[{'snaks':{'P854':[{'datavalue':{'value':'https://example.org/source'}}]}}]}
def fixture(title='File:Flower.jpg'):
    return {'title':title,'imageinfo':[{'mime':'image/jpeg','width':1200,'height':800,'url':'https://upload.wikimedia.org/a.jpg','descriptionurl':'https://commons.wikimedia.org/wiki/File:A.jpg','extmetadata':{'Artist':{'value':'<b>A &amp; B</b>'},'LicenseShortName':{'value':'CC BY-SA 4.0'},'LicenseUrl':{'value':'http://creativecommons.org/licenses/by-sa/4.0/'}}}]}
class Tests(unittest.TestCase):
    def test_claim_rank(self):
        e={'claims':{'P225':[claim('P225','A b'),claim('P225','C d','deprecated')]}}
        self.assertEqual(values(e,'P225'),['A b'])
    def test_naming(self):
        e={'id':'Q1','claims':{'P138':[claim('P138',{'id':'Q2'})]}}
        self.assertEqual(naming(e,'genus')[0]['sourceUrls'],['https://example.org/source'])
        self.assertEqual(naming(e,'species')[0]['scope'],'species')
    def test_missing_thumb(self):
        p,r=photo(fixture(),'search'); self.assertIsNone(r); self.assertEqual(p['originalUrl'],p['previewUrl']); self.assertEqual(p['licenseUrl'],'https://creativecommons.org/licenses/by-sa/4.0/')
    def test_tendril(self): self.assertEqual(photo(fixture('File:Spiral tendril.jpg'),'search')[1],'non_flower_title')
    def test_low_resolution(self):
        p=fixture(); p['imageinfo'][0]['width']=599; self.assertEqual(photo(p,'search')[1],'low_resolution')
    def test_bad_license(self):
        p=fixture(); p['imageinfo'][0]['extmetadata']['LicenseUrl']['value']='https://creativecommons.org/licenses/by-nc/4.0/'; self.assertEqual(photo(p,'search')[1],'license_not_allowed')
    def test_dedup_diagnostics(self):
        i={'scientificName':'A b','p18Files':['Flower.jpg'],'discoveryErrors':[]}
        with patch('collect_story_sources_v2.commons_pages',return_value=[fixture(),fixture('File:Leaf.jpg')]): images(i)
        self.assertEqual(len(i['imageCandidates']),1); self.assertEqual(i['imageDiagnostics']['rejectedByReason'],{'non_flower_title':1})
    def test_html_escape(self):
        p,_=photo(fixture(),'search'); p['artist']='<script>alert(1)</script>'
        result=review_html([{'scientificName':'A b','speciesId':'a-b','imageCandidates':[p]}]); self.assertNotIn('<script>',result); self.assertIn('&lt;script&gt;',result)
    def test_entity_revalidation(self):
        with patch('collect_story_sources_v2.get_json',return_value={'entities':{'Q1':{'id':'Q1'},'Q2':{'id':'Q3'}}}): self.assertEqual(list(entities(['Q1','Q2'])),['Q1'])
if __name__=='__main__': unittest.main()
