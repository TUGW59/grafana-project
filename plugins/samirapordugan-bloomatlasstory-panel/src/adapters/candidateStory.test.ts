import { candidateSpecies, selectCandidate, worldReturnUrl, candidateObservation } from './candidateStory';
const records = [{ id: 'inat-1', speciesId: 'rosa' }, { id: 'inat-2', speciesId: 'rosa' }, { id: 'inat-3', speciesId: 'protea' }];
it('selects the exact requested observation', () => { expect(selectCandidate(records, 'rosa', 'inat-2')?.id).toBe('inat-2'); });
it('does not substitute a different species or missing observation', () => { expect(selectCandidate(records, 'rosa', 'inat-3')).toBeUndefined(); expect(selectCandidate(records, 'rosa', 'inat-8')).toBeUndefined(); });
it('keeps unsourced flowering and cultural content empty', () => { expect(candidateSpecies({ id: 'rosa', scientificName: 'Rosa' }).bloomMonths).toEqual([]); expect(candidateSpecies({ id: 'rosa' }).culturalStory).toBeNull(); });
it('preserves encoded return context', () => { const url = new URL(worldReturnUrl('?var-biome=A%2CB&var-species=rosa', 'inat-2'), 'http://localhost'); expect(url.searchParams.get('var-biome')).toBe('A,B'); expect(url.searchParams.get('var-observationId')).toBe('inat-2'); });
it('rejects invalid coordinates and untrusted observation links', () => { expect(candidateObservation({ latitude: 99, longitude: 1 })).toBeUndefined(); });

it('keeps iNaturalist photos saved as jpeg', () => {
  const row = {
    id: 'inat-1',
    speciesId: 'rosa',
    latitude: 41,
    longitude: 29,
    observationMonth: 5,
    sourceUrl: 'https://www.inaturalist.org/observations/1',
    photoUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/2/medium.jpeg',
  };
  expect(candidateObservation(row)?.photoUrl).toBe(row.photoUrl);
});
