import React from 'react';
import { AbsoluteFill } from 'remotion';
import FlowPath from './FlowPath';
import AgentNode from './AgentNode';
import { FlowData, NODES, PATHS, FLOW_COLORS, DynamicNodeData, DynamicFlowPair } from './flowUtils';

interface EnergyFlowCompositionProps {
  flowData: FlowData;
  solarValue: string;
  homeValue: string;
  batteryValue: string;
  dynamicNodes?: DynamicNodeData[];
  dynamicFlows?: DynamicFlowPair[];
  viewBoxHeight?: number;
}

const EnergyFlowComposition: React.FC<EnergyFlowCompositionProps> = ({
  flowData,
  solarValue,
  homeValue,
  batteryValue,
  dynamicNodes,
  dynamicFlows,
  viewBoxHeight = 320,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <svg viewBox={`0 0 500 ${viewBoxHeight}`} width="100%" height="100%">
        {/* Core AI flow paths */}
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

        {/* Dynamic flow paths for user agent trades */}
        {dynamicFlows?.map((flow) => {
          // Skip flows already rendered by the core paths
          const coreIds = ['solar-home', 'solar-battery', 'battery-home'];
          if (coreIds.includes(flow.id)) return null;

          return (
            <FlowPath
              key={flow.id}
              id={flow.id}
              p0={flow.from}
              p1={flow.controlPoints.p1}
              p2={flow.controlPoints.p2}
              p3={flow.to}
              intensity={flow.intensity}
              colorFrom={flow.colorFrom}
              colorTo={flow.colorTo}
            />
          );
        })}

        {/* Core AI agent nodes */}
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

        {/* Dynamic user agent nodes */}
        {dynamicNodes?.filter(n => n.isUser).map((node) => (
          <AgentNode
            key={node.id}
            x={node.position.x}
            y={node.position.y}
            label={node.label}
            value={node.value}
            color={node.color}
            active={node.active}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

export default EnergyFlowComposition;
