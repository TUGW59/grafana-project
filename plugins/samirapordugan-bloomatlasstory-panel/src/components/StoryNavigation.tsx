import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { WORLD_ATLAS_URL } from '../constants';

export const StoryNavigation = () => {
  const styles = useStyles2(getStyles);

  return (
    <nav className={styles.nav}>
      <a className={styles.back} href={WORLD_ATLAS_URL}>
        ← Back to World Atlas
      </a>
      <span className={styles.label}>Flower Story · Mock data</span>
    </nav>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  nav: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
  `,
  back: css`
    color: ${theme.colors.text.link};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  label: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
});
