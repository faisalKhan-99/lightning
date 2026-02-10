import { TICK_INTERVAL_MS, SIM_SPEED } from '../config.js';

export class SimulatedClock {
  private simHour: number = 6; // start at 6 AM
  private dayNumber: number = 1;
  private tickCount: number = 0;

  // Each tick advances simulated time by (TICK_INTERVAL_MS / 1000 / 60) * SIM_SPEED hours
  // With 5s tick and 60x speed: 5/60 * 60 = 5 simulated minutes per tick
  // That means 12 ticks = 1 simulated hour, 288 ticks = 1 simulated day
  private readonly hoursPerTick: number;

  constructor() {
    this.hoursPerTick = (TICK_INTERVAL_MS / 1000 / 3600) * SIM_SPEED;
  }

  tick(): void {
    this.tickCount++;
    this.simHour += this.hoursPerTick;
    if (this.simHour >= 24) {
      this.simHour -= 24;
      this.dayNumber++;
    }
  }

  getHour(): number {
    return this.simHour;
  }

  getDayNumber(): number {
    return this.dayNumber;
  }

  getTickCount(): number {
    return this.tickCount;
  }

  getFormattedTime(): string {
    const hours = Math.floor(this.simHour);
    const minutes = Math.floor((this.simHour % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  isDaytime(): boolean {
    return this.simHour >= 6 && this.simHour <= 18;
  }

  reset(): void {
    this.simHour = 6;
    this.dayNumber = 1;
    this.tickCount = 0;
  }
}
