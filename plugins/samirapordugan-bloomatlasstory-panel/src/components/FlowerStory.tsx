import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { findObservation, findSpecies, getLayout } from '../utils/story';
import { FlowerHero } from './FlowerHero';
import { SourceFooter } from './SourceFooter';
import { StoryChapters } from './StoryChapters';
import { StoryNavigation } from './StoryNavigation';

interface Props {
  flowerId: string;
  width: number;
  height: number;
  showSources: boolean;
}

export const FlowerStory = ({ flowerId, width, height, showSources }: Props) => {
  const styles = useStyles2(getStyles);
  const species = findSpecies(flowerId);
  const layout = getLayout(width);

  return (
    <div className={styles.root} style={{ width, height }}>
      <StoryNavigation />
      {species ? (
        <>
          <FlowerHero
            key={species.id}
            species={species}
            observation={findObservation(species.id)}
            twoColumns={layout !== 'narrow'}
          />
          <StoryChapters species={species} twoColumns={layout === 'wide'} />
        </>
      ) : (
        <section className={styles.notFound}>
          <h2 className={styles.notFoundTitle}>This flower could not be found.</h2>
          <p className={styles.notFoundText}>Unknown flower ID: {flowerId}</p>
        </section>
      )}
      <SourceFooter sources={species?.sources ?? []} showSources={showSources} />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  root: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(2)};
    box-sizing: border-box;
    overflow: auto;
  `,
  notFound: css`
    padding: ${theme.spacing(4, 2)};
    text-align: center;
  `,
  notFoundTitle: css`
    margin: 0 0 ${theme.spacing(1)};
  `,
  notFoundText: css`
    margin: 0;
    color: ${theme.colors.text.secondary};
  `,
});
