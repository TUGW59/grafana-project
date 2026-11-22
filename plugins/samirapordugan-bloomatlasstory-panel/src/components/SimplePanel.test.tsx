import React from 'react';
import { render, screen } from '@testing-library/react';
import { FieldType, LoadingState, PanelProps, getDefaultTimeRange, toDataFrame } from '@grafana/data';
import { SimpleOptions } from 'types';
import { SimplePanel } from './SimplePanel';

const timeRange = getDefaultTimeRange();

const props = {
  id: 1,
  data: {
    state: LoadingState.Done,
    series: [toDataFrame({ fields: [{ name: 'value', type: FieldType.number, values: [1] }] })],
    timeRange,
  },
  timeRange,
  timeZone: 'utc',
  options: { text: 'test', showSeriesCount: false, seriesCountSize: 'sm' },
  fieldConfig: { defaults: {}, overrides: [] },
  width: 400,
  height: 300,
} as unknown as PanelProps<SimpleOptions>;

describe('SimplePanel', () => {
  it('shows the developer name', () => {
    render(<SimplePanel {...props} />);
    expect(screen.getByTestId('developer-credit')).toHaveTextContent('Developed by Samira Porduğan');
  });
});
