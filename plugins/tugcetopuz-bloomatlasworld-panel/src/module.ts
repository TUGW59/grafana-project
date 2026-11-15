import { PanelPlugin } from '@grafana/data';
import type { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) =>
  builder.addBooleanSwitch({
    path: 'demoMode',
    name: 'Demo data',
    description: 'Show clearly labeled fictional flower observations until the Grafana datasource is connected.',
    defaultValue: true,
  })
);
