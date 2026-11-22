import React from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { MONTH_LABELS, NO_RECORD } from '../constants';

interface Props {
  months: number[];
}

export const BloomTimeline = ({ months }: Props) => {
  const styles = useStyles2(getStyles);

  return (
    <div>
      <h3 className={styles.title}>Bloom timeline</h3>
      {months.length === 0 ? (
        <p className={styles.empty}>{NO_RECORD}</p>
      ) : (
        <ol className={styles.months}>
          {MONTH_LABELS.map((label, index) => {
            const active = months.includes(index + 1);
            return (
              <li
                key={label}
                className={cx(styles.month, active && styles.active)}
                data-testid="bloom-month"
                data-active={active}
              >
                {label}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  title: css`
    margin: 0 0 ${theme.spacing(1)};
    font-size: ${theme.typography.h5.fontSize};
  `,
  empty: css`
    margin: 0;
    color: ${theme.colors.text.secondary};
  `,
  months: css`
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: ${theme.spacing(0.5)};
    margin: 0;
    padding: 0;
    list-style: none;
  `,
  month: css`
    padding: ${theme.spacing(1, 0)};
    border-radius: ${theme.shape.radius.default};
    background: ${theme.colors.background.secondary};
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.bodySmall.fontSize};
    text-align: center;
    overflow: hidden;
  `,
  active: css`
    background: ${theme.colors.success.main};
    color: ${theme.colors.success.contrastText};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
});
