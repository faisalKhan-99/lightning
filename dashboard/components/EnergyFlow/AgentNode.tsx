import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface AgentNodeProps {
  x: number;
  y: number;
  label: string;
  value: string;
  color: string;
  active: boolean;
}

const AgentNode: React.FC<AgentNodeProps> = ({ x, y, label, value, color, active }) => {
  const frame = useCurrentFrame();

  const glowOpacity = active
    ? interpolate(frame % 60, [0, 30, 60], [0.2, 0.5, 0.2])
    : 0.05;

  const ringRadius = active
    ? interpolate(frame % 60, [0, 30, 60], [28, 32, 28])
    : 28;

  return (
    <g>
      {/* Outer glow ring */}
      <circle
        cx={x}
        cy={y}
        r={ringRadius}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={glowOpacity}
      />
      {/* Main circle */}
      <circle
        cx={x}
        cy={y}
        r={24}
        fill="#0c1017"
        stroke={color}
        strokeWidth={2}
      />
      {/* Label */}
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={11}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {label}
      </text>
      {/* Value below */}
      <text
        x={x}
        y={y + 44}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#8896ab"
        fontSize={10}
        fontFamily="monospace"
      >
        {value}
      </text>
    </g>
  );
};

export default AgentNode;
