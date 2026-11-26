import React from 'react';
import type { PanelProps } from '@grafana/data';
import type { SimpleOptions } from '../types';
import { WorldExplorer } from './WorldExplorer';
import { WorldExplorerApi } from './WorldExplorerApi';
import { WorldExplorerPreview } from './WorldExplorerPreview';

// Önizleme açıkça seçilir. Eski iki demo modu aynen korunur.
export const SimplePanel: React.FC<PanelProps<SimpleOptions>> = ({ width, height, options, data, replaceVariables }) => {
  if (options.candidateMode === true) {
    const read = (name: string) => {
      const template = '${' + name + '}';
      const value = replaceVariables(template);
      return value === template || !value ? '__all__' : value;
    };
    return <WorldExplorerPreview showInsights={options.showInsights !== false} showComparison={options.showComparison !== false} width={width} height={height} data={data} filters={{continent:read('continent'),biome:read('biome'),month:read('month'),species:read('species')}} />;
  }
  return options.demoMode === false ? <WorldExplorerApi width={width} height={height} data={data} /> : <WorldExplorer width={width} height={height} demoMode />;
};
