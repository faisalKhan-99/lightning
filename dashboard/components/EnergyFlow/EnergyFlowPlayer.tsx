'use client';

import React from 'react';
import { Player } from '@remotion/player';
import EnergyFlowComposition from './EnergyFlowComposition';
import { FlowData, DynamicNodeData, DynamicFlowPair } from './flowUtils';

interface EnergyFlowPlayerProps {
  flowData: FlowData;
  solarValue: string;
  homeValue: string;
  batteryValue: string;
  dynamicNodes?: DynamicNodeData[];
  dynamicFlows?: DynamicFlowPair[];
  viewBoxHeight?: number;
}

const EnergyFlowPlayer: React.FC<EnergyFlowPlayerProps> = ({
  flowData,
  solarValue,
  homeValue,
  batteryValue,
  dynamicNodes,
  dynamicFlows,
  viewBoxHeight = 320,
}) => {
  return (
    <Player
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={EnergyFlowComposition as any}
      inputProps={{ flowData, solarValue, homeValue, batteryValue, dynamicNodes, dynamicFlows, viewBoxHeight }}
      durationInFrames={120}
      compositionWidth={500}
      compositionHeight={viewBoxHeight}
      fps={30}
      loop
      autoPlay
      controls={false}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
      }}
    />
  );
};

export default EnergyFlowPlayer;
