import React from 'react';
import type { PanelProps } from '@grafana/data';
import type { SimpleOptions } from '../types';
import { WorldExplorer } from './WorldExplorer';

/** Grafana entry point. Mock observations are explicitly marked as demo. */
export const SimplePanel: React.FC<PanelProps<SimpleOptions>> = ({ width, height, options }) => (
  <WorldExplorer width={width} height={height} demoMode={options.demoMode !== false} />
);
