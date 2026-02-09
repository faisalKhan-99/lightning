import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

// Node positions
const NODES = {
  solar:      { x: 115, y: 135, w: 150, h: 70, color: '#e2b340', label: 'Solar Producer',  sub: 'Mints energy tokens' },
  marketplace:{ x: 400, y: 135, w: 200, h: 70, color: '#34d399', label: 'Marketplace',      sub: 'Order book matching' },
  home:       { x: 685, y: 135, w: 150, h: 70, color: '#5b9cf5', label: 'Smart Home',       sub: 'Burns energy tokens' },
  battery:    { x: 400, y: 45,  w: 150, h: 70, color: '#a78bfa', label: 'Battery Trader',   sub: 'Buy low, sell high' },
  solana:     { x: 400, y: 275, w: 200, h: 70, color: '#7dd3fc', label: 'Solana Devnet',    sub: 'On-chain settlement' },
};

// Arrow paths
const ARROWS = [
  { id: 'solar-market', from: { x: 190, y: 135 }, to: { x: 296, y: 135 }, color: '#e2b340', label: 'sells', labelX: 243, labelY: 125 },
  { id: 'market-home',  from: { x: 500, y: 135 }, to: { x: 606, y: 135 }, color: '#5b9cf5', label: 'buys',  labelX: 553, labelY: 125 },
  { id: 'battery-down',  from: { x: 390, y: 80 },  to: { x: 390, y: 100 }, color: '#a78bfa', label: 'buys',  labelX: 365, labelY: 92 },
  { id: 'battery-up',    from: { x: 410, y: 100 }, to: { x: 410, y: 80 },  color: '#a78bfa', label: 'sells', labelX: 430, labelY: 92 },
  { id: 'market-solana', from: { x: 400, y: 170 }, to: { x: 400, y: 236 }, color: '#7dd3fc', label: 'settles', labelX: 420, labelY: 210 },
];

function AnimatedNode({ x, y, w, h, color, label, sub, delay }: {
  x: number; y: number; w: number; h: number;
  color: string; label: string; sub: string; delay: number;
}) {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const scale = interpolate(frame, [delay, delay + 15], [0.9, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Pulsing glow
  const glowOpacity = interpolate(
    (frame - delay) % 90, [0, 45, 90], [0.15, 0.35, 0.15],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
  );

  return (
    <g opacity={opacity} transform={`translate(${x}, ${y}) scale(${scale}) translate(${-x}, ${-y})`}>
      {/* Glow behind node */}
      <rect
        x={x - w / 2 - 4} y={y - h / 2 - 4}
        width={w + 8} height={h + 8} rx={16}
        fill={color} opacity={frame > delay ? glowOpacity : 0}
        filter="url(#node-blur)"
      />
      {/* Node box */}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={12} fill="#0c1017" stroke={color} strokeWidth={2} />
      <text x={x} y={y - 7} textAnchor="middle" fill={color} fontFamily="monospace" fontSize="11" fontWeight="bold">{label}</text>
      <text x={x} y={y + 13} textAnchor="middle" fill="#5a6a80" fontFamily="monospace" fontSize="10">{sub}</text>
    </g>
  );
}

function AnimatedArrow({ from, to, color, label, labelX, labelY, delay }: {
  from: { x: number; y: number }; to: { x: number; y: number };
  color: string; label: string; labelX: number; labelY: number; delay: number;
}) {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Animated particle along the arrow
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  // Direction for arrowhead
  const ndx = dx / len;
  const ndy = dy / len;

  // Particle cycles every 60 frames
  const particleDuration = 60;
  const particleProgress = ((frame - delay) % particleDuration) / particleDuration;
  const px = from.x + dx * particleProgress;
  const py = from.y + dy * particleProgress;
  const showParticle = frame > delay + 10;

  // Arrowhead points
  const tipX = to.x;
  const tipY = to.y;
  const aSize = 6;
  const perpX = -ndy;
  const perpY = ndx;
  const baseX = tipX - ndx * aSize;
  const baseY = tipY - ndy * aSize;

  return (
    <g opacity={opacity}>
      {/* Dashed line */}
      <line
        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        stroke={color} strokeWidth={1.5} strokeDasharray="6 4"
      />
      {/* Arrowhead */}
      <polygon
        points={`${tipX},${tipY} ${baseX + perpX * 4},${baseY + perpY * 4} ${baseX - perpX * 4},${baseY - perpY * 4}`}
        fill={color}
      />
      {/* Label */}
      <text x={labelX} y={labelY} textAnchor="middle" fill="#5a6a80" fontFamily="monospace" fontSize="9">{label}</text>
      {/* Animated particle */}
      {showParticle && (
        <circle cx={px} cy={py} r={3} fill={color} opacity={0.9} filter="url(#particle-glow)" />
      )}
    </g>
  );
}

const ArchitectureComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <svg viewBox="0 0 800 340" width="100%" height="100%">
        <defs>
          <filter id="node-blur">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="particle-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Arrows (appear after nodes) */}
        {ARROWS.map((arrow, i) => (
          <AnimatedArrow key={arrow.id} {...arrow} delay={20 + i * 6} />
        ))}

        {/* Nodes (stagger in) */}
        <AnimatedNode {...NODES.solar} delay={0} />
        <AnimatedNode {...NODES.marketplace} delay={5} />
        <AnimatedNode {...NODES.home} delay={10} />
        <AnimatedNode {...NODES.battery} delay={8} />
        <AnimatedNode {...NODES.solana} delay={12} />
      </svg>
    </AbsoluteFill>
  );
};

export default ArchitectureComposition;
