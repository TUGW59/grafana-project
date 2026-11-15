import { PanelPlugin } from '@grafana/data';
import type { StoryOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

export const plugin = new PanelPlugin<StoryOptions>(SimplePanel).setPanelOptions((builder) =>
  builder.addBooleanSwitch({
    path: 'demoMode',
    name: 'Demo stories',
    description: 'Show clearly labeled fictional demo content until real sources are verified.',
    defaultValue: true,
  })
);
