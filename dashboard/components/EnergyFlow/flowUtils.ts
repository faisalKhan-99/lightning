import { Trade } from '../../lib/types';

export interface Point {
  x: number;
  y: number;
}

export interface FlowData {
  solarToHome: number;   // intensity 0–1
  solarToBattery: number;
  batteryToHome: number;
}

/**
 * Aggregate last 10 trades per direction and calculate intensity (0–1).
 * 20 kWh total volume = max intensity (1.0).
 */
export function calculateFlowData(trades: Trade[], simulatedHour: number): FlowData {
  const recent = trades.slice(-30); // look at last 30 trades for all directions

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
