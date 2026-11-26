import React from 'react';
import type { PanelData } from '@grafana/data';
import { frameRows, str } from '../adapters/frameRows';
import { candidateObservation, candidateSpecies, selectCandidate, worldReturnUrl } from '../adapters/candidateStory';
import { getLayout } from '../utils/story';
import { FlowerHero } from './FlowerHero';
import { StoryChapters } from './StoryChapters';
import { SourceFooter } from './SourceFooter';
import { botanicalProfiles, matchProfile } from '../data/botanicalProfiles';
import { BloomOraclePilot } from './BloomOraclePilot';
import { findStoryEvidence, storyEvidenceSource } from '../data/storyEvidence';
import { RegionalFlowering } from './RegionalFlowering';
import { nameOriginRows } from '../utils/storyDataset';
import { galleryRows } from '../utils/galleryRows';
import { ObservationEvidencePhoto, SpeciesGallery } from './SpeciesGallery';

interface Props { data: PanelData; flowerId: string; observationId: string; width: number; height: number; showSources: boolean; }
export function CandidateStory({ data, flowerId, observationId, width, height, showSources }: Props) {
  const source = frameRows(data, 'A').find(r => str(r.id) === flowerId);
  const manifest = frameRows(data, 'C').find(r => str(r.kind) === 'manifest');
  const ready = str(manifest?.value).includes('candidate');
  const row = selectCandidate(frameRows(data, 'B'), flowerId, observationId);
  const observation = row ? candidateObservation(row) : undefined;
  const baseSpecies = source ? candidateSpecies(source) : undefined;
  const profile = baseSpecies ? matchProfile(baseSpecies.id, baseSpecies.scientificName, baseSpecies.family, str(source?.taxonomyUrl)) : undefined;
  const catalog = botanicalProfiles;
  const botanicalSpecies = baseSpecies && profile ? { ...baseSpecies, habitat: `${profile.range} Growth description: ${profile.growthForm}. Broad POWO climate: ${profile.climate}. Source: Kew POWO.`, sources: [{ name: 'Kew POWO — taxonomy and distribution; project summary (consulted 26 Nov 2026)', url: profile.taxonomyUrl, license: 'Source attribution; publication review pending' }] } : baseSpecies;
  // Fenoloji ve kültür yalnız tam tür eşleşmesinde eklenir. Global bloomMonths boş kalır.
  const evidence = botanicalSpecies ? findStoryEvidence(botanicalSpecies.id, botanicalSpecies.scientificName) : undefined;
  const species = botanicalSpecies && evidence ? { ...botanicalSpecies, culturalStory: evidence.culturalStory ? `${evidence.culturalStory} (Source: ${evidence.sourceName})` : null, sources: [...botanicalSpecies.sources, storyEvidenceSource(evidence)] } : botanicalSpecies;
  const origins = nameOriginRows(frameRows(data, 'D'), flowerId, species?.scientificName ?? '');
  const gallery = galleryRows(frameRows(data, 'E'), flowerId, species?.scientificName ?? '');
  const returnUrl = worldReturnUrl(window.location.search, observationId || observation?.id || '');
  const loading = data.state === 'Loading';
  const failed = data.state === 'Error' || (data.errors?.length ?? 0) > 0;
  const layout = getLayout(width);
  const photoSource = str(row?.photoSourceUrl);
  // Aday modunda mock içerik veya gözlem ayından fenoloji üretimi yok.
  return <div style={{ width, height, overflow: 'auto', padding: 20, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 }}>
    <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}><a href={returnUrl} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); window.location.assign(returnUrl); } }}>← Back to World Explorer</a><strong>Flower Story · LOCAL CANDIDATE · NOT PUBLICATION APPROVED</strong></nav>
    {loading ? <p role="status">Loading observations…</p> : failed || !ready ? <p role="alert">Candidate datasource unavailable.</p> : !species ? <p role="alert">This flower could not be found.</p> : <>
      <FlowerHero key={species.id + ':' + (observation?.id ?? '')} species={species} observation={observation} twoColumns={layout !== 'narrow'} detailPhoto hideTimeline referencePhoto={gallery.length ? <SpeciesGallery key={species.id} rows={gallery} /> : undefined} />
      <section aria-label="Name origin" style={{ border: '1px solid #839384', borderRadius: 8, padding: 16 }}>
        <h3>Name Origin · Stories behind the name</h3>
        {origins.length ? <><p>{str(origins[0].text)}</p><small>{str(origins[0].scope)} · Source-checked draft · publication review pending</small><ul>{origins.map((origin, index) => <li key={`${str(origin.sourceUrl)}:${index}`}><a href={str(origin.sourceUrl)} target="_blank" rel="noreferrer">{str(origin.publisher)} ↗</a> · Accessed {str(origin.accessedAt)}</li>)}</ul><small>Story dataset: {str(origins[0].dataVersion)}</small></> : <p role="status">No matched name-origin evidence.</p>}
      </section>
      <p>Observation dates are not flowering evidence. A global month-by-month timeline is unavailable; regional literature is displayed separately. Cultivation and medical claims are not inferred.</p>
      {evidence ? <RegionalFlowering evidence={evidence} /> : <p role="status">No matched regional flowering source.</p>}
      {observation ? <section aria-label="Observation evidence"><h3>Observation evidence</h3>{gallery.length > 0 && observation.photoUrl && <ObservationEvidencePhoto key={observation.id} url={observation.photoUrl} name={species.scientificName} />}<p>{observation.id} · {observation.country} · {observation.continent} · {observation.observedAt}</p><p>Biome: {str(row?.biome) || 'Unresolved'} · Ecoregion: {str(row?.ecoregion) || 'Unresolved'}</p><p>Observer: {str(row?.observer) || 'Unresolved'} · Observation license: {str(row?.observationLicense) || 'Unresolved'}</p><p>Photo: {observation.photoAttribution} · {observation.photoLicense}</p><p><a href={observation.sourceUrl} target="_blank" rel="noreferrer">Observation source ↗</a>{/^https:\/\/www\.inaturalist\.org\/photos\/\d+$/.test(photoSource) && <> · <a href={photoSource} target="_blank" rel="noreferrer">Photo source ↗</a></>}</p></section> : <p role="status">Requested observation is unavailable for this species.</p>}
      <StoryChapters species={species} twoColumns={layout === 'wide'} />
      {profile ? <BloomOraclePilot profile={profile} catalog={catalog} /> : <p role="status">No source-matched botanical profile for this species.</p>}
    </>}
    <SourceFooter sources={species?.sources ?? []} showSources={showSources} />
  </div>;
}
