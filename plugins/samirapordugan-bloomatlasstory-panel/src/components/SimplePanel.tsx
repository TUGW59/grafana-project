import React from 'react';
import type { PanelProps } from '@grafana/data';
import type { StoryOptions } from '../types';
import { FlowerStory } from './FlowerStory';

export const SimplePanel: React.FC<PanelProps<StoryOptions>> = ({ width, height, options, replaceVariables }) => {
  const interpolated = replaceVariables('${flowerId}');
  const flowerId = interpolated === '${flowerId}' || interpolated === '$flowerId' ? 'iris-germanica' : interpolated;
  return <FlowerStory flowerId={flowerId} width={width} height={height} demoMode={options.demoMode !== false} />;
};
