'use client';

import React from 'react';
import { Player } from '@remotion/player';
import EnergyFlowComposition from './EnergyFlowComposition';
import { FlowData } from './flowUtils';

interface EnergyFlowPlayerProps {
  flowData: FlowData;
  solarValue: string;
  homeValue: string;
  batteryValue: string;
}

const EnergyFlowPlayer: React.FC<EnergyFlowPlayerProps> = ({
  flowData,
  solarValue,
  homeValue,
  batteryValue,
}) => {
  return (
    <Player
      component={EnergyFlowComposition}
      inputProps={{ flowData, solarValue, homeValue, batteryValue }}
      durationInFrames={120}
      compositionWidth={500}
      compositionHeight={320}
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
