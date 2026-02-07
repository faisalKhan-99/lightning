import React from 'react';
import { useCurrentFrame } from 'remotion';
import { cubicBezier, Point } from './flowUtils';

interface FlowPathProps {
  id: string;
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
  intensity: number; // 0–1
  colorFrom: string;
  colorTo: string;
}

const FlowPath: React.FC<FlowPathProps> = ({
  id,
  p0, p1, p2, p3,
  intensity,
  colorFrom,
  colorTo,
}) => {
  const frame = useCurrentFrame();

  const strokeWidth = 1.5 + intensity * 3; // 1.5–4.5
  const particleCount = Math.max(1, Math.round(intensity * 6)); // 1–6
  const glowOpacity = 0.1 + intensity * 0.4; // 0.1–0.5
  const isActive = intensity > 0.01;
  const duration = Math.max(40, 80 - intensity * 40); // frames per cycle: slower when idle

  // SVG path d attribute for the cubic bezier
  const pathD = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

  return (
    <g>
      <defs>
        <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isActive ? colorFrom : '#1a2235'} />
          <stop offset="100%" stopColor={isActive ? colorTo : '#1a2235'} />
        </linearGradient>
        <filter id={`glow-${id}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Base path (always visible, dim when idle) */}
      <path
        d={pathD}
        fill="none"
        stroke={isActive ? `url(#grad-${id})` : '#1a2235'}
        strokeWidth={isActive ? strokeWidth : 1.5}
        strokeLinecap="round"
        opacity={isActive ? glowOpacity + 0.3 : 0.3}
      />

      {/* Animated particles */}
      {isActive && Array.from({ length: particleCount }).map((_, i) => {
        const offset = (i / particleCount) * duration;
        const progress = ((frame + offset) % duration) / duration;
        const pos = cubicBezier(progress, p0, p1, p2, p3);

        // Interpolate color along path
        const r = Math.round(
          parseInt(colorFrom.slice(1, 3), 16) * (1 - progress) +
          parseInt(colorTo.slice(1, 3), 16) * progress
        );
        const g = Math.round(
          parseInt(colorFrom.slice(3, 5), 16) * (1 - progress) +
          parseInt(colorTo.slice(3, 5), 16) * progress
        );
        const b = Math.round(
          parseInt(colorFrom.slice(5, 7), 16) * (1 - progress) +
          parseInt(colorTo.slice(5, 7), 16) * progress
        );
        const particleColor = `rgb(${r},${g},${b})`;

        return (
          <g key={i} filter={`url(#glow-${id})`}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={2.5 + intensity}
              fill={particleColor}
              opacity={0.7 + intensity * 0.3}
            />
          </g>
        );
      })}
    </g>
  );
};

export default FlowPath;
