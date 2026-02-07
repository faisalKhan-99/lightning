import React from 'react';
import { AbsoluteFill } from 'remotion';
import FlowPath from './FlowPath';
import AgentNode from './AgentNode';
import { FlowData, NODES, PATHS, FLOW_COLORS } from './flowUtils';

interface EnergyFlowCompositionProps {
  flowData: FlowData;
  solarValue: string;
  homeValue: string;
  batteryValue: string;
}

const EnergyFlowComposition: React.FC<EnergyFlowCompositionProps> = ({
  flowData,
  solarValue,
  homeValue,
  batteryValue,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <svg viewBox="0 0 500 320" width="100%" height="100%">
        {/* Flow paths */}
        <FlowPath
          id="solar-home"
          {...PATHS.solarToHome}
          intensity={flowData.solarToHome}
          colorFrom={FLOW_COLORS.solarToHome.from}
          colorTo={FLOW_COLORS.solarToHome.to}
        />
        <FlowPath
          id="solar-battery"
          {...PATHS.solarToBattery}
          intensity={flowData.solarToBattery}
          colorFrom={FLOW_COLORS.solarToBattery.from}
          colorTo={FLOW_COLORS.solarToBattery.to}
        />
        <FlowPath
          id="battery-home"
          {...PATHS.batteryToHome}
          intensity={flowData.batteryToHome}
          colorFrom={FLOW_COLORS.batteryToHome.from}
          colorTo={FLOW_COLORS.batteryToHome.to}
        />

        {/* Agent nodes */}
        <AgentNode
          x={NODES.solar.x}
          y={NODES.solar.y}
          label="SOL"
          value={solarValue}
          color="#e2b340"
          active={flowData.solarToHome > 0.01 || flowData.solarToBattery > 0.01}
        />
        <AgentNode
          x={NODES.home.x}
          y={NODES.home.y}
          label="HOME"
          value={homeValue}
          color="#5b9cf5"
          active={flowData.solarToHome > 0.01 || flowData.batteryToHome > 0.01}
        />
        <AgentNode
          x={NODES.battery.x}
          y={NODES.battery.y}
          label="BAT"
          value={batteryValue}
          color="#a78bfa"
          active={flowData.solarToBattery > 0.01 || flowData.batteryToHome > 0.01}
        />
      </svg>
    </AbsoluteFill>
  );
};

export default EnergyFlowComposition;
