import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { Source } from '../data/model';

interface Props {
  sources: Source[];
  showSources: boolean;
}

export const SourceFooter = ({ sources, showSources }: Props) => {
  const styles = useStyles2(getStyles);

  return (
    <footer className={styles.footer}>
      {showSources && sources.length > 0 && (
        <ul className={styles.sources}>
          {sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.name}
              </a>{' '}
              · {source.license}
            </li>
          ))}
        </ul>
      )}
      <p className={styles.text}>
        Not medical advice. Traditional uses are shown as they were recorded in the sources.
      </p>
      <p className={styles.credit} data-testid="developer-credit">
        Developed by Samira Porduğan
      </p>
    </footer>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  footer: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(0.5)};
    margin-top: auto;
    padding-top: ${theme.spacing(1)};
    border-top: 1px solid ${theme.colors.border.weak};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  sources: css`
    margin: 0;
    padding-left: ${theme.spacing(2)};
    color: ${theme.colors.text.secondary};
  `,
  text: css`
    margin: 0;
    color: ${theme.colors.text.secondary};
  `,
  credit: css`
    margin: 0;
    font-weight: ${theme.typography.fontWeightMedium};
  `,
});
