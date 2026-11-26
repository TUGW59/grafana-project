import { PanelPlugin } from '@grafana/data';
import type { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) =>
  builder.addBooleanSwitch({
    path: 'demoMode',
    name: 'Demo data',
    description: 'Show clearly labeled fictional flower observations until the Grafana datasource is connected.',
    defaultValue: true,
  }).addBooleanSwitch({
    path: 'candidateMode',
    name: 'Local candidate preview',
    description: 'Use reviewed candidate data in the isolated preview dashboard.',
    defaultValue: false,
  }).addBooleanSwitch({
    path: 'showInsights',
    name: 'Observation insights',
    description: 'Show statistics for the current candidate query.',
    defaultValue: true,
  }).addBooleanSwitch({
    path: 'showComparison',
    name: 'Observation comparison',
    description: 'Compare two matching candidate observations.',
    defaultValue: true,
  })
);
