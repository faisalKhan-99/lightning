import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from hackathon root
config({ path: resolve(process.cwd(), '../.env') });

export const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.devnet.solana.com';
export const WS_PORT = Number(process.env.WS_PORT) || 8080;

// Simulation
export const TICK_INTERVAL_MS = 5000; // 5 seconds per tick
export const SIM_SPEED = 720; // 1 tick = 1 simulated hour (24 ticks = 1 day)
export const SIM_DURATION_DAYS = 2; // Number of simulated days per run
export const SIM_TOTAL_TICKS = SIM_DURATION_DAYS * 24; // 48 ticks for 2 days

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

// LLM Settings
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const LLM_ENABLED = !!process.env.OPENAI_API_KEY;
export const LLM_CALL_INTERVAL = Number(process.env.LLM_CALL_INTERVAL) || 3; // call LLM every N ticks (3 hours)
export const LLM_BACKOFF_TICKS = 5; // after failure, wait N ticks before retrying (5 hours)
export const LLM_PRICE_CHANGE_THRESHOLD = 0.15; // trigger LLM if price changes >15%
export const LLM_DECISION_CACHE_TICKS = 6; // reuse decision for up to N ticks (6 hours)
export const LLM_MAX_RPM = Number(process.env.LLM_MAX_RPM) || 10; // max requests per minute
export const LLM_REQUEST_THROTTLE_MS = Number(process.env.LLM_REQUEST_THROTTLE_MS) || 500; // delay between requests

// Colosseum Hackathon Settings
export const COLOSSEUM_API_KEY = process.env.COLOSSEUM_API_KEY || '';
export const COLOSSEUM_AGENT_ID = process.env.COLOSSEUM_AGENT_ID || '';
export const COLOSSEUM_API_BASE = 'https://agents.colosseum.com/api';
export const COLOSSEUM_ENABLED = !!process.env.COLOSSEUM_API_KEY;
export const HEARTBEAT_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Adaptive Strategy Settings
export const ADAPTIVE_UPDATE_INTERVAL = 6;    // Update every 6 ticks (6 hours)
export const MEMORY_HISTORY_LENGTH = 20;      // Track last 20 trades
export const MIN_RISK_LEVEL = 0.2;
export const MAX_RISK_LEVEL = 0.8;
export const RISK_ADJUSTMENT_RATE = 0.05;
