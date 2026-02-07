'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AgentState, Trade } from '../../lib/types';
import { calculateFlowData } from './flowUtils';

const EnergyFlowPlayer = dynamic(() => import('./EnergyFlowPlayer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <span className="label-mono animate-pulse-slow">Loading flow...</span>
    </div>
  ),
});

interface Props {
  agents: AgentState[];
  recentTrades: Trade[];
  simulatedHour: number;
}

export default function EnergyFlow({ agents, recentTrades, simulatedHour }: Props) {
  const solar = agents.find((a) => a.type === 'solar');
  const home = agents.find((a) => a.type === 'home');
  const battery = agents.find((a) => a.type === 'battery');

  const flowData = useMemo(() => calculateFlowData(recentTrades, simulatedHour), [recentTrades, simulatedHour]);

  const solarValue = `${solar?.production?.toFixed(1) || '0'} kWh`;
  const homeValue = `${home?.consumption?.toFixed(1) || '0'} kWh`;
  const batteryValue = `${battery?.storageLevel?.toFixed(1) || '0'}/${battery?.storageCapacity || 50} kWh`;

  return (
    <div className="card-cyber p-4">
      <h3 className="label-mono mb-3">Energy Flow</h3>
      <div className="h-[280px]">
        <EnergyFlowPlayer
          flowData={flowData}
          solarValue={solarValue}
          homeValue={homeValue}
          batteryValue={batteryValue}
        />
      </div>
    </div>
  );
}
