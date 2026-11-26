import unittest
from collect_story_sources import match_taxa, attach_naming, media_candidate, taxon_query, naming_query


def binding(**kwargs):
    return {k: {'value': v} for k,v in kwargs.items()}


class DiscoveryTests(unittest.TestCase):
    def test_exact_and_ambiguous(self):
        rows = [binding(name='Rosa canina',taxon='http://www.wikidata.org/entity/Q1'),binding(name='Rosa canina',taxon='http://www.wikidata.org/entity/Q2')]
        self.assertEqual(match_taxa({'r':'Rosa canina'},rows)['r']['taxonStatus'],'ambiguous')
        self.assertEqual(match_taxa({'r':'Rosa canina'},rows[:1])['r']['taxonStatus'],'exact_unique')
        self.assertEqual(match_taxa({'r':'Rosa canina'},[])['r']['taxonStatus'],'not_found')
    def test_claim_scope_and_dedup(self):
        records=match_taxa({'r':'Rosa canina'},[binding(name='Rosa canina',taxon='http://www.wikidata.org/entity/Q1')])
        r=binding(taxon='http://www.wikidata.org/entity/Q1',subject='http://www.wikidata.org/entity/Q2',scope='genus',namedAfter='http://www.wikidata.org/entity/Q3',statement='http://www.wikidata.org/entity/statement/Q2-abc',referenceURL='https://example.org')
        attach_naming(records,[r,r,{**r,'scope':{'value':'species'}}])
        self.assertEqual(len(records['r']['namingClaims']),1)
        self.assertEqual(records['r']['namingClaims'][0]['scope'],'genus')
    def photo(self):
        return {'title':'File:A.jpg','imageinfo':[{'mime':'image/jpeg','width':1200,'height':900,'url':'https://upload.wikimedia.org/a.jpg','thumburl':'https://upload.wikimedia.org/thumb/a.jpg','descriptionurl':'https://commons.wikimedia.org/wiki/File:A.jpg','extmetadata':{'Artist':{'value':'<b>A &amp; B</b>'},'LicenseShortName':{'value':'CC BY-SA 4.0'},'LicenseUrl':{'value':'https://creativecommons.org/licenses/by-sa/4.0/'}}}]}
    def test_photo_license_and_credit(self):
        p=media_candidate(self.photo(),'wikidata_P18')
        self.assertEqual(p['artist'],'A & B')
        self.assertIsNone(p['flowerVisible'])
    def test_photo_rejects_low_resolution(self):
        p=self.photo(); p['imageinfo'][0]['width']=599
        self.assertIsNone(media_candidate(p,'search'))
    def test_photo_rejects_missing_license(self):
        p=self.photo(); del p['imageinfo'][0]['extmetadata']['LicenseUrl']
        self.assertIsNone(media_candidate(p,'search'))
    def test_photo_rejects_wrong_host_or_restrictions(self):
        p=self.photo(); p['imageinfo'][0]['url']='https://example.org/a.jpg'
        self.assertIsNone(media_candidate(p,'search'))
        p=self.photo(); p['imageinfo'][0]['extmetadata']['Restrictions']={'value':'restriction'}
        self.assertIsNone(media_candidate(p,'search'))
    def test_queries(self):
        self.assertIn('"Rosa canina"',taxon_query(['Rosa canina']))
        self.assertIn('wd:Q1',naming_query(['Q1']))
        with self.assertRaises(AssertionError): naming_query(['notqid'])

if __name__=='__main__': unittest.main()
