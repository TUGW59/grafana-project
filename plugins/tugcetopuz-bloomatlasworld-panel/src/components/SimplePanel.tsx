
import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';

interface Props extends PanelProps<SimpleOptions> {}

const getStyles = () => {
  return {
    wrapper: css`
      font-family: 'Open Sans', sans-serif;
      position: relative;
      overflow: hidden;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 35px;
      left: 10px;
      padding: 5px;
    `,
    credit: css`
      position: absolute;
      bottom: 8px;
      right: 12px;
      font-size: 12px;
      opacity: 0.8;
    `,
  };
};

export const SimplePanel: React.FC<Props> = ({
  options,
  data,
  width,
  height,
  fieldConfig,
  id,
}) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      {data.series.length === 0 ? (
        <PanelDataErrorView
          fieldConfig={fieldConfig}
          panelId={id}
          data={data}
          needsStringField
        />
      ) : (
        <>
          <svg
            className={styles.svg}
            width={width}
            height={height}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`-${width / 2} -${height / 2} ${width} ${height}`}
          >
            <circle
              data-testid="simple-panel-circle"
              style={{ fill: theme.colors.primary.main }}
              r={100}
            />
          </svg>

          <div className={styles.textBox}>
            {options.showSeriesCount && (
              <div data-testid="simple-panel-series-counter">
                Number of series: {data.series.length}
              </div>
            )}

            <div>Text option value: {options.text}</div>
          </div>
        </>
      )}

      <div
        className={styles.credit}
        data-testid="developer-credit"
      >
        Developed by Tuğçe Topuz
      </div>
    </div>
  );
};
