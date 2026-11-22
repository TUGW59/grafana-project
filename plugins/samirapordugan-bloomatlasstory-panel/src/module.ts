import { PanelPlugin } from '@grafana/data';
import { StoryOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

export const plugin = new PanelPlugin<StoryOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder.addBooleanSwitch({
    path: 'showSources',
    name: 'Show sources',
    description: 'Show the source and license list at the bottom of the story.',
    defaultValue: true,
  });
});
