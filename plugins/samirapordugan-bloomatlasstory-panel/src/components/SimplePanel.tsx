import React from 'react';
import { PanelProps } from '@grafana/data';
import { StoryOptions } from 'types';
import { resolveFlowerId } from '../utils/story';
import { FlowerStory } from './FlowerStory';

type Props = PanelProps<StoryOptions>;

export const SimplePanel = ({ options, width, height, replaceVariables }: Props) => {
  const flowerId = resolveFlowerId(replaceVariables('${flowerId}'));

  return <FlowerStory flowerId={flowerId} width={width} height={height} showSources={options.showSources} />;
};
