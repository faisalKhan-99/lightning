import 'dotenv/config';

export const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.devnet.solana.com';
export const WS_PORT = Number(process.env.WS_PORT) || 8080;

// Simulation
export const TICK_INTERVAL_MS = 5000; // 5 seconds per tick
export const SIM_SPEED = 60; // 1 real minute = 1 simulated hour

// Pricing
export const BASE_PRICE = 0.10;
export const MIN_PRICE = 0.02;
export const MAX_PRICE = 0.50;
export const PRICE_SENSITIVITY = 0.5;

// Agent parameters
export const SOLAR_MAX_OUTPUT = 10; // kWh per tick at peak
export const SOLAR_NOISE = 0.15; // ±15% weather noise
export const HOME_BASE_CONSUMPTION = 3; // kWh per tick base
export const HOME_TARGET_BUFFER = 20; // kWh credits to maintain
export const BATTERY_MAX_CAPACITY = 50; // kWh max storage
export const BATTERY_BUY_THRESHOLD = 0.85; // buy when price < avg * this
export const BATTERY_SELL_THRESHOLD = 1.15; // sell when price > avg * this
export const PRICE_HISTORY_LENGTH = 10; // ticks for moving average

// Token decimals (we use 6 decimals like USDC)
export const TOKEN_DECIMALS = 6;
export const TOKEN_MULTIPLIER = 10 ** TOKEN_DECIMALS;
