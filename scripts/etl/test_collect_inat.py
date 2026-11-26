import copy
import unittest
from collect_inat import normalize

class NormalizeTests(unittest.TestCase):
    def setUp(self):
        # Tamamen sentetik test girdisi; gerçek gözlem olarak kullanılmaz.
        self.raw = dict(id=1, quality_grade='research', captive=False, obscured=False, geoprivacy=None,
                        taxon_geoprivacy=None, taxon={'id':2}, license_code='cc-by', user={'login':'test'},
                        geojson={'type':'Point','coordinates':[10,20]}, observed_on='2020-06-01', photos=[])
    def test_valid(self):
        record, attribution = normalize(self.raw, 2, 'demo-test')
        self.assertEqual(record['observationMonth'], 6)
        self.assertEqual(attribution['observer'], 'test')
        self.assertIsNone(record['biome'])
    def test_obscured(self):
        self.raw['obscured']=True
        self.assertIsNone(normalize(self.raw,2,'demo-test'))
    def test_private_taxon(self):
        self.raw['taxon_geoprivacy']='obscured'
        self.assertIsNone(normalize(self.raw,2,'demo-test'))
    def test_restrictive_license(self):
        self.raw['license_code']='cc-by-nc'
        self.assertIsNone(normalize(self.raw,2,'demo-test'))
    def test_wrong_taxon(self):
        self.assertIsNone(normalize(self.raw,3,'demo-test'))
    def test_bad_coordinates(self):
        self.raw['geojson']['coordinates']=[200,20]
        self.assertIsNone(normalize(self.raw,2,'demo-test'))
    def test_photo_license_separate(self):
        self.raw['photos']=[dict(id=10,url='https://inaturalist-open-data.s3.amazonaws.com/photos/10/square.jpg', license_code='cc-by-nc',attribution='test')]
        self.assertIsNone(normalize(self.raw,2,'demo-test')[0]['photoUrl'])
        self.raw['photos'][0]['license_code']='cc-by'
        self.assertEqual(normalize(self.raw,2,'demo-test')[0]['photoLicense'],'CC BY')
    def test_invalid_date(self):
        self.raw['observed_on']='bad'
        self.assertIsNone(normalize(self.raw,2,'demo-test'))
if __name__=='__main__': unittest.main()
