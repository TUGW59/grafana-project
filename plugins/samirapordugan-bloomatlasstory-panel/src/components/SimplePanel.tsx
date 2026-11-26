import React from 'react';
import { PanelProps } from '@grafana/data';
import { StoryOptions } from 'types';
import { resolveFlowerId } from '../utils/story';
import { FlowerStory } from './FlowerStory';
import { CandidateStory } from './CandidateStory';
import { readCandidateSelection } from '../utils/storyDataset';

type Props = PanelProps<StoryOptions>;

export const SimplePanel = ({ options, width, height, replaceVariables, data }: Props) => {
  const flowerId = resolveFlowerId(replaceVariables('${flowerId}'));
  const selection = readCandidateSelection(window.location.search, replaceVariables('${flowerId}'), replaceVariables('${observationId}'));

  // demoMode=false yeni API panellerine özgüdür; eski Story aynı şekilde çalışır.
  return options.demoMode === false
    ? <CandidateStory flowerId={selection.flowerId} observationId={selection.observationId} width={width} height={height} data={data} showSources={options.showSources} />
    : <FlowerStory flowerId={flowerId} width={width} height={height} showSources={options.showSources} />;
};
