import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingState, PanelProps, getDefaultTimeRange } from '@grafana/data';
import { StoryOptions } from 'types';
import { SimplePanel } from './SimplePanel';

const timeRange = getDefaultTimeRange();

function renderPanel(flowerId: string) {
  const props = {
    id: 1,
    data: { state: LoadingState.Done, series: [], timeRange },
    timeRange,
    timeZone: 'utc',
    options: { showSources: true },
    fieldConfig: { defaults: {}, overrides: [] },
    width: 1200,
    height: 800,
    replaceVariables: () => flowerId,
  } as unknown as PanelProps<StoryOptions>;

  render(<SimplePanel {...props} />);
}

describe('SimplePanel', () => {
  it('shows the developer name', () => {
    renderPanel('rosa-canina');
    expect(screen.getByTestId('developer-credit')).toHaveTextContent('Developed by Samira Porduğan');
  });

  it('shows the selected flower and its bloom months', () => {
    renderPanel('rosa-canina');
    expect(screen.getByTestId('scientific-name')).toHaveTextContent('Rosa canina');
    const activeMonths = screen.getAllByTestId('bloom-month').filter((month) => month.dataset.active === 'true');
    expect(activeMonths).toHaveLength(4);
  });

  it('shows a placeholder when the flower has no photo', () => {
    renderPanel('passiflora-caerulea');
    expect(screen.getByTestId('photo-placeholder')).toBeInTheDocument();
  });

  it('shows a message and the developer name for an unknown flower', () => {
    renderPanel('invalid-flower');
    expect(screen.getByText('This flower could not be found.')).toBeInTheDocument();
    expect(screen.getByTestId('developer-credit')).toBeInTheDocument();
  });
});
