import { Trade, AgentState } from '../../lib/types';

export interface Point {
  x: number;
  y: number;
}

export interface FlowData {
  solarToHome: number;   // intensity 0–1
  solarToBattery: number;
  batteryToHome: number;
}

export interface DynamicNodeData {
  id: string;
  label: string;
  value: string;
  color: string;
  position: Point;
  active: boolean;
  isUser: boolean;
  agentType: string;
}

export interface DynamicFlowPair {
  id: string;
  from: Point;
  to: Point;
  intensity: number;
  colorFrom: string;
  colorTo: string;
  controlPoints: { p1: Point; p2: Point };
}

const AGENT_COLORS: Record<string, string> = {
  solar: '#e2b340',
  home: '#5b9cf5',
  battery: '#a78bfa',
};

/**
 * Aggregate last 10 trades per direction and calculate intensity (0–1).
 * 20 kWh total volume = max intensity (1.0).
 */
export function calculateFlowData(trades: Trade[], simulatedHour: number): FlowData {
  const recent = trades.slice(-30);

  let solarToHomeVol = 0;
  let solarToBatteryVol = 0;
  let batteryToHomeVol = 0;

  let solarToHomeCount = 0;
  let solarToBatteryCount = 0;
  let batteryToHomeCount = 0;

  for (let i = recent.length - 1; i >= 0; i--) {
    const t = recent[i];
    if (t.sellerId === 'solar' && t.buyerId === 'home' && solarToHomeCount < 10) {
      solarToHomeVol += t.amount;
      solarToHomeCount++;
    } else if (t.sellerId === 'solar' && t.buyerId === 'battery' && solarToBatteryCount < 10) {
      solarToBatteryVol += t.amount;
      solarToBatteryCount++;
    } else if (t.sellerId === 'battery' && t.buyerId === 'home' && batteryToHomeCount < 10) {
      batteryToHomeVol += t.amount;
      batteryToHomeCount++;
    }
  }

  const isSolarActive = simulatedHour >= 6 && simulatedHour <= 18;

  return {
    solarToHome: isSolarActive ? Math.min(solarToHomeVol / 20, 1) : 0,
    solarToBattery: isSolarActive ? Math.min(solarToBatteryVol / 20, 1) : 0,
    batteryToHome: Math.min(batteryToHomeVol / 20, 1),
  };
}

/**
 * Pure-math cubic bezier evaluation (SSR-safe, no DOM).
 */
export function cubicBezier(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  };
}

// Node positions (viewBox 0 0 500 320)
export const NODES = {
  solar:   { x: 100, y: 80 },
  home:    { x: 400, y: 80 },
  battery: { x: 250, y: 240 },
} as const;

// Bezier control points for each path
export const PATHS = {
  solarToHome: {
    p0: NODES.solar,
    p1: { x: 200, y: 60 },
    p2: { x: 300, y: 60 },
    p3: NODES.home,
  },
  solarToBattery: {
    p0: NODES.solar,
    p1: { x: 120, y: 160 },
    p2: { x: 200, y: 200 },
    p3: NODES.battery,
  },
  batteryToHome: {
    p0: NODES.battery,
    p1: { x: 300, y: 200 },
    p2: { x: 380, y: 160 },
    p3: NODES.home,
  },
} as const;

// Colors for each flow direction (gradient from → to)
export const FLOW_COLORS = {
  solarToHome: { from: '#e2b340', to: '#5b9cf5' },
  solarToBattery: { from: '#e2b340', to: '#a78bfa' },
  batteryToHome: { from: '#a78bfa', to: '#5b9cf5' },
} as const;

/**
 * Calculate dynamic node positions and flow data for all agents (including user agents).
 */
export function calculateDynamicFlowData(
  agents: AgentState[],
  trades: Trade[],
  simulatedHour: number
): { nodes: DynamicNodeData[]; flows: DynamicFlowPair[]; viewBoxHeight: number } {
  const aiAgents = agents.filter(a => a.owner === 'ai');
  const userAgents = agents.filter(a => a.owner === 'user');

  // AI agents at fixed positions
  const nodes: DynamicNodeData[] = aiAgents.map(a => {
    const pos = NODES[a.type as keyof typeof NODES] || { x: 250, y: 160 };
    return {
      id: a.id,
      label: a.type === 'solar' ? 'SOL' : a.type === 'home' ? 'HOME' : 'BAT',
      value: getAgentValue(a),
      color: AGENT_COLORS[a.type] || '#34d399',
      position: pos,
      active: false, // computed later from flows
      isUser: false,
      agentType: a.type,
    };
  });

  // Group user agents by type for positioning below their AI counterpart
  const usersByType = new Map<string, AgentState[]>();
  for (const a of userAgents) {
    const arr = usersByType.get(a.type) || [];
    arr.push(a);
    usersByType.set(a.type, arr);
  }

  let maxY = 320; // base viewBox height (no users)
  for (const [type, agentsOfType] of Array.from(usersByType.entries())) {
    const aiPos = NODES[type as keyof typeof NODES] || { x: 250, y: 160 };
    const baseY = aiPos.y + 100;

    agentsOfType.forEach((a, i) => {
      const count = agentsOfType.length;
      // Center group around AI node's x, spaced 60px apart
      const xOffset = count > 1 ? (i - (count - 1) / 2) * 60 : 0;
      const pos = { x: aiPos.x + xOffset, y: baseY };
      maxY = Math.max(maxY, pos.y + 60);

      nodes.push({
        id: a.id,
        label: `U-${a.type.slice(0, 3).toUpperCase()}`,
        value: getAgentValue(a),
        color: '#34d399',
        position: pos,
        active: false,
        isUser: true,
        agentType: a.type,
      });
    });
  }

  const viewBoxHeight = maxY;

  // Build flow pairs from recent trades
  const recent = trades.slice(-30);
  const pairVolumes = new Map<string, number>();

  for (const t of recent) {
    const key = `${t.sellerId}__${t.buyerId}`;
    pairVolumes.set(key, (pairVolumes.get(key) || 0) + t.amount);
  }

  const isSolarActive = simulatedHour >= 6 && simulatedHour <= 18;
  const flows: DynamicFlowPair[] = [];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const [key, volume] of Array.from(pairVolumes.entries())) {
    const [sellerId, buyerId] = key.split('__');
    const sellerNode = nodeMap.get(sellerId);
    const buyerNode = nodeMap.get(buyerId);
    if (!sellerNode || !buyerNode) continue;

    // Skip solar flows at night (both AI and user solar agents)
    if (sellerNode.agentType === 'solar' && !isSolarActive) continue;

    // Skip flows where a home agent appears as seller (homes only consume, never produce)
    if (sellerNode.agentType === 'home') continue;

    const intensity = Math.min(volume / 20, 1);
    if (intensity < 0.01) continue;

    const cp = generateControlPoints(sellerNode.position, buyerNode.position);

    flows.push({
      id: `${sellerId}-${buyerId}`,
      from: sellerNode.position,
      to: buyerNode.position,
      intensity,
      colorFrom: sellerNode.color,
      colorTo: buyerNode.color,
      controlPoints: cp,
    });

    // Mark nodes as active
    sellerNode.active = true;
    buyerNode.active = true;
  }

  return { nodes, flows, viewBoxHeight };
}

function getAgentValue(a: AgentState): string {
  if (a.production !== undefined) return `${a.production.toFixed(1)} kWh`;
  if (a.consumption !== undefined) return `${a.consumption.toFixed(1)} kWh`;
  if (a.storageLevel !== undefined) return `${a.storageLevel.toFixed(1)}/${a.storageCapacity || 50} kWh`;
  return `${a.tokenBalance.toFixed(1)} kWh`;
}

function generateControlPoints(from: Point, to: Point): { p1: Point; p2: Point } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = dist * 0.25;

  // Perpendicular offset for curve
  const nx = -dy / dist;
  const ny = dx / dist;

  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;

  return {
    p1: { x: mx + nx * curvature * 0.3, y: my + ny * curvature * 0.3 },
    p2: { x: mx - nx * curvature * 0.3, y: my - ny * curvature * 0.3 },
  };
}
