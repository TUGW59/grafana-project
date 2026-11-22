import React from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { NO_RECORD } from '../constants';
import { Species } from '../data/model';

interface Props {
  species: Species;
  twoColumns: boolean;
}

export const StoryChapters = ({ species, twoColumns }: Props) => {
  const styles = useStyles2(getStyles);
  const { habitat, cultivation, culturalStory, traditionalUse } = species;

  return (
    <section className={cx(styles.grid, twoColumns && styles.twoColumns)}>
      <Chapter title="Habitat & Range">{habitat}</Chapter>
      <Chapter title="Cultivation">
        {cultivation && (
          <ul className={styles.list}>
            <li>Light: {cultivation.light ?? NO_RECORD}</li>
            <li>Water: {cultivation.water ?? NO_RECORD}</li>
            <li>Soil: {cultivation.soil ?? NO_RECORD}</li>
          </ul>
        )}
      </Chapter>
      <Chapter title="Cultural Story">{culturalStory}</Chapter>
      <Chapter title="Traditional Use & Safety">
        {traditionalUse && (
          <>
            <p className={styles.paragraph}>{traditionalUse.summary}</p>
            <p className={styles.meta}>
              Category: {traditionalUse.category}
              {traditionalUse.usedPart && ` · Part used: ${traditionalUse.usedPart}`}
            </p>
            <p className={styles.meta}>
              Reported traditional use. Source:{' '}
              <a href={traditionalUse.sourceUrl} target="_blank" rel="noreferrer">
                {traditionalUse.sourceName}
              </a>
            </p>
          </>
        )}
      </Chapter>
    </section>
  );
};

interface ChapterProps {
  title: string;
  children: React.ReactNode;
}

const Chapter = ({ title, children }: ChapterProps) => {
  const styles = useStyles2(getStyles);

  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      {children ? <div>{children}</div> : <p className={styles.empty}>{NO_RECORD}</p>}
    </article>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  grid: css`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${theme.spacing(2)};
  `,
  twoColumns: css`
    grid-template-columns: repeat(2, minmax(0, 1fr));
  `,
  card: css`
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    background: ${theme.colors.background.secondary};
  `,
  title: css`
    margin: 0 0 ${theme.spacing(1)};
    font-size: ${theme.typography.h5.fontSize};
  `,
  list: css`
    margin: 0;
    padding-left: ${theme.spacing(2)};
  `,
  paragraph: css`
    margin: 0 0 ${theme.spacing(1)};
  `,
  meta: css`
    margin: 0;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  empty: css`
    margin: 0;
    color: ${theme.colors.text.secondary};
  `,
});
