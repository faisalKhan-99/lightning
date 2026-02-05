import { SOLAR_MAX_OUTPUT, SOLAR_NOISE, HOME_BASE_CONSUMPTION } from '../config.js';

export function getSolarOutput(hour: number): number {
  // Bell curve: output follows sin curve between hours 6-18
  if (hour < 6 || hour > 18) return 0;

  const normalizedHour = (hour - 6) / 12; // 0 to 1 over the sunlight period
  const baseOutput = SOLAR_MAX_OUTPUT * Math.sin(Math.PI * normalizedHour);

  // Add weather noise
  const noise = 1 + (Math.random() * 2 - 1) * SOLAR_NOISE;
  return Math.max(0, baseOutput * noise);
}

export function getHomeConsumption(hour: number): number {
  // Higher in morning (7-9) and evening (17-21), lower midday
  let multiplier = 1.0;

  if (hour >= 7 && hour <= 9) {
    multiplier = 1.6; // morning peak
  } else if (hour >= 17 && hour <= 21) {
    multiplier = 1.8; // evening peak
  } else if (hour >= 10 && hour <= 16) {
    multiplier = 0.7; // midday low
  } else if (hour >= 0 && hour <= 6) {
    multiplier = 0.4; // overnight low
  }

  // Add some randomness
  const noise = 1 + (Math.random() * 2 - 1) * 0.1;
  return HOME_BASE_CONSUMPTION * multiplier * noise;
}
