import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { Observation, Species } from '../data/model';
import { BloomTimeline } from './BloomTimeline';
import { observationPhotoVariants } from '../utils/observationPhotoVariants';

interface Props {
  species: Species;
  observation?: Observation;
  twoColumns: boolean;
  detailPhoto?: boolean;
  referencePhoto?: React.ReactNode;
  hideTimeline?: boolean;
}

export const FlowerHero = ({ species, observation, twoColumns, detailPhoto = false, referencePhoto, hideTimeline = false }: Props) => {
  const styles = useStyles2(getStyles);
  // Aday modunda daha büyük aynı fotoğrafı dene. Demo davranışı değişmez.
  const [failedPhoto, setFailedPhoto] = useState<{ key: string; urls: string[] }>({ key: '', urls: [] });
  const original = observation?.photoUrl ?? '';
  const photoKey = `${original}:${detailPhoto}`;
  const failedUrls = failedPhoto.key === photoKey ? failedPhoto.urls : [];
  const variants = detailPhoto ? observationPhotoVariants(original, true) : original ? [original] : [];
  const photoUrl = variants.find(candidate => !failedUrls.includes(candidate));

  return (
    <section className={cx(styles.hero, twoColumns && styles.twoColumns)}>
      {referencePhoto ?? <figure className={styles.figure}>
        {photoUrl ? (
          <>
            <img
              className={styles.photo}
              src={photoUrl}
              alt={species.commonName}
              referrerPolicy="no-referrer"
              style={detailPhoto ? { objectFit: 'contain' } : undefined}
              onError={() => setFailedPhoto(old => ({ key: photoKey, urls: [...(old.key === photoKey ? old.urls : []), photoUrl] }))}
            />
            <figcaption className={styles.caption}>
              {observation?.photoAttribution} ·{' '}
              <a href={observation?.sourceUrl} target="_blank" rel="noreferrer">
                iNaturalist
              </a>
            </figcaption>
          </>
        ) : (
          <div className={styles.placeholder} data-testid="photo-placeholder">
            ✿
          </div>
        )}
      </figure>}
      <div className={styles.identity}>
        <h2 className={styles.commonName}>{species.commonName}</h2>
        <p className={styles.scientificName} data-testid="scientific-name">
          {species.scientificName}
        </p>
        <p className={styles.detail}>Family: {species.family}</p>
        <p className={styles.detail}>
          {observation ? `Observed in ${observation.country} on ${observation.observedAt}` : 'No observation selected'}
        </p>
        {!hideTimeline && <BloomTimeline months={species.bloomMonths} />}
      </div>
    </section>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  hero: css`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${theme.spacing(2)};
  `,
  twoColumns: css`
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  `,
  figure: css`
    margin: 0;
  `,
  photo: css`
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: ${theme.shape.radius.default};
  `,
  placeholder: css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: ${theme.shape.radius.default};
    background: ${theme.colors.background.secondary};
    color: ${theme.colors.text.disabled};
    font-size: 64px;
  `,
  caption: css`
    margin-top: ${theme.spacing(0.5)};
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  identity: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
  commonName: css`
    margin: 0;
    font-size: ${theme.typography.h2.fontSize};
  `,
  scientificName: css`
    margin: 0;
    font-size: ${theme.typography.h4.fontSize};
    font-style: italic;
  `,
  detail: css`
    margin: 0;
    color: ${theme.colors.text.secondary};
  `,
});
