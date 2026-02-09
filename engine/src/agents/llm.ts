import OpenAI from 'openai';
import {
  OPENAI_API_KEY,
  LLM_ENABLED,
  HOME_TARGET_BUFFER,
  BATTERY_MAX_CAPACITY,
  LLM_BACKOFF_TICKS,
  LLM_PRICE_CHANGE_THRESHOLD,
  LLM_DECISION_CACHE_TICKS,
  LLM_MAX_RPM,
  LLM_REQUEST_THROTTLE_MS,
} from '../config.js';
import { Marketplace } from '../market/marketplace.js';
import { SimulatedClock } from '../simulation/clock.js';
import { SolarAgent } from './solar.js';
import { HomeAgent } from './home.js';
import { BatteryAgent } from './battery.js';
import { logger } from '../utils/index.js';

export interface AgentDecision {
  action: 'buy' | 'sell' | 'hold';
  amount: number;
  priceMultiplier: number;
  reasoning: string;
}

interface CachedDecision {
  decision: AgentDecision;
  tick: number;
  price: number;
  hour: number;
}

interface LLMState {
  lastFailureTick: number;
  backoffUntilTick: number;
  totalCalls: number;
  totalFailures: number;
  estimatedCost: number;
  cache: Map<string, CachedDecision>;
  lastPrice: number;
  lastHour: number;
  requestTimestamps: number[]; // For RPM tracking
}

const state: LLMState = {
  lastFailureTick: 0,
  backoffUntilTick: 0,
  totalCalls: 0,
  totalFailures: 0,
  estimatedCost: 0,
  cache: new Map(),
  lastPrice: 0,
  lastHour: -1,
  requestTimestamps: [],
};

/**
 * Sleep utility for throttling
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if we can make a request (RPM limiting)
 */
function checkRateLimit(): { allowed: boolean; waitMs: number } {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Remove timestamps older than 1 minute
  state.requestTimestamps = state.requestTimestamps.filter(ts => ts > oneMinuteAgo);

  if (state.requestTimestamps.length >= LLM_MAX_RPM) {
    // Calculate how long to wait
    const oldestTimestamp = state.requestTimestamps[0];
    const waitMs = oldestTimestamp - oneMinuteAgo + 100; // +100ms buffer
    return { allowed: false, waitMs };
  }

  return { allowed: true, waitMs: 0 };
}

/**
 * Record a request for RPM tracking
 */
function recordRequest(): void {
  state.requestTimestamps.push(Date.now());
}

const openai = LLM_ENABLED ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Estimated cost per call (gpt-4o-mini: ~$0.00015 per 1K input tokens, ~$0.0006 per 1K output)
const ESTIMATED_COST_PER_CALL = 0.0005; // ~$0.0005 per call average

const SYSTEM_PROMPTS = {
  solar: `You are an autonomous solar energy producer in a decentralized energy market on Solana.
You produce energy during daylight hours (6-18) following a solar curve.
You mint energy tokens and sell them on the market.

Your goals:
- Maximize revenue from energy sales
- Price competitively to ensure your energy sells
- Consider time of day (peak production midday = more supply = lower prices)
- Consider current supply/demand balance

Respond with a JSON object:
{
  "action": "sell" | "hold",
  "amount": <number kWh to sell, 0 if hold>,
  "priceMultiplier": <0.8 to 1.2, multiplier on market price>,
  "reasoning": "<1 sentence explaining your decision>"
}`,

  home: `You are a smart home energy consumer in a decentralized energy market.
You consume energy following daily patterns (peaks morning 7-9 and evening 17-21).
You burn energy tokens for consumption and buy from the market.

Your goals:
- Ensure you have enough energy (maintain buffer of ~${HOME_TARGET_BUFFER} kWh)
- Buy at the best possible price
- Buy more when prices are low, buy less when prices are high
- Anticipate peak consumption periods and stock up beforehand

Respond with JSON:
{
  "action": "buy" | "hold",
  "amount": <number kWh to buy>,
  "priceMultiplier": <0.9 to 1.2, multiplier on market price>,
  "reasoning": "<1 sentence>"
}`,

  battery: `You are a battery storage arbitrage trader in a decentralized energy market.
You buy energy when prices are low and sell when prices are high.
Maximum storage capacity: ${BATTERY_MAX_CAPACITY} kWh.

Your goals:
- Buy low, sell high (profit from price differences)
- Track price trends and moving averages
- Don't over-buy (respect capacity limits)
- Be patient - wait for clear signals

Respond with JSON:
{
  "action": "buy" | "sell" | "hold",
  "amount": <number kWh>,
  "priceMultiplier": <0.8 to 1.2>,
  "reasoning": "<1 sentence>"
}`,
};

// Peak hours for triggering decisions
const PEAK_HOURS = [7, 8, 9, 17, 18, 19, 20, 21];
const TRANSITION_HOURS = [6, 10, 16, 22]; // dawn, mid-morning, afternoon, night

export function buildMarketContext(
  marketplace: Marketplace,
  clock: SimulatedClock,
  priceHistory: { time: string; price: number; simHour: number }[],
  userAgentsSummary?: string
): string {
  const currentPrice = marketplace.pricing.getPrice();
  const movingAvg = marketplace.pricing.getMovingAverage();
  const supply = marketplace.orderbook.getTotalSupply();
  const demand = marketplace.orderbook.getTotalDemand();
  const recentTrades = marketplace.getRecentTrades().slice(-5);

  const last10Prices = priceHistory.slice(-10).map(p => p.price.toFixed(4)).join(', ');
  const tradesSummary = recentTrades.length > 0
    ? recentTrades.map(t => `${t.amount.toFixed(2)} kWh @ ${t.pricePerUnit.toFixed(4)}`).join('; ')
    : 'No recent trades';

  return `Time: ${clock.getFormattedTime()} (Day ${clock.getDayNumber()}) | Hour: ${clock.getHour()}
Market Price: ${currentPrice.toFixed(4)} SOL/kWh
Price Trend (last 10): [${last10Prices}]
Moving Average (10-tick): ${movingAvg.toFixed(4)}
Supply on orderbook: ${supply.toFixed(2)} kWh
Demand on orderbook: ${demand.toFixed(2)} kWh
Recent trades: ${tradesSummary}
User agents in grid: ${userAgentsSummary || 'None'}`;
}

export function buildAgentContext(
  agentType: 'solar' | 'home' | 'battery',
  agent: SolarAgent | HomeAgent | BatteryAgent,
  hour: number,
  tokenBalance?: number
): string {
  switch (agentType) {
    case 'solar': {
      const solar = agent as SolarAgent;
      const isDaylight = hour >= 6 && hour <= 18;
      return `Current production: ${solar.lastProduction.toFixed(2)} kWh
Hour: ${hour} (${isDaylight ? 'daylight - producing' : 'night - no production'})
Total minted so far: ${solar.totalMinted.toFixed(2)} kWh`;
    }
    case 'home': {
      const home = agent as HomeAgent;
      const balance = tokenBalance ?? 0;
      const deficit = Math.max(0, HOME_TARGET_BUFFER - balance);
      return `Current consumption: ${home.lastConsumption.toFixed(2)} kWh
Token balance: ${balance.toFixed(2)} kWh
Deficit from ${HOME_TARGET_BUFFER} kWh target: ${deficit.toFixed(2)} kWh
Hour: ${hour} (peak consumption: 7-9 morning, 17-21 evening)`;
    }
    case 'battery': {
      const battery = agent as BatteryAgent;
      const balance = tokenBalance ?? 0;
      return `Storage level: ${balance.toFixed(2)} / ${BATTERY_MAX_CAPACITY} kWh
Available to sell: ${balance.toFixed(2)} kWh
Remaining capacity: ${(BATTERY_MAX_CAPACITY - balance).toFixed(2)} kWh`;
    }
    default:
      return '';
  }
}

/**
 * Check if we should trigger LLM calls based on market conditions
 */
export function shouldTriggerLLM(
  currentTick: number,
  scheduledInterval: number,
  currentPrice: number,
  currentHour: number
): { shouldCall: boolean; reason: string } {
  // Check if in backoff period
  if (currentTick < state.backoffUntilTick) {
    return { shouldCall: false, reason: `backoff until tick ${state.backoffUntilTick}` };
  }

  // Scheduled interval check
  if (currentTick % scheduledInterval === 0) {
    return { shouldCall: true, reason: 'scheduled interval' };
  }

  // Price change trigger
  if (state.lastPrice > 0) {
    const priceChange = Math.abs(currentPrice - state.lastPrice) / state.lastPrice;
    if (priceChange > LLM_PRICE_CHANGE_THRESHOLD) {
      return { shouldCall: true, reason: `price change ${(priceChange * 100).toFixed(1)}%` };
    }
  }

  // Hour transition trigger (peak/off-peak changes)
  if (state.lastHour !== currentHour) {
    if (TRANSITION_HOURS.includes(currentHour)) {
      return { shouldCall: true, reason: `hour transition to ${currentHour}` };
    }
  }

  return { shouldCall: false, reason: 'no trigger' };
}

/**
 * Get cached decision if still valid
 */
export function getCachedDecision(
  agentType: string,
  currentTick: number,
  currentPrice: number
): AgentDecision | null {
  const cached = state.cache.get(agentType);
  if (!cached) return null;

  // Check if cache is too old
  if (currentTick - cached.tick > LLM_DECISION_CACHE_TICKS) {
    return null;
  }

  // Check if price changed significantly
  const priceChange = Math.abs(currentPrice - cached.price) / cached.price;
  if (priceChange > LLM_PRICE_CHANGE_THRESHOLD) {
    return null;
  }

  logger.debug('LLM', `Using cached decision for ${agentType}`, {
    cachedTick: cached.tick,
    currentTick,
    action: cached.decision.action,
  });

  return cached.decision;
}

/**
 * Cache a decision
 */
function cacheDecision(
  agentType: string,
  decision: AgentDecision,
  tick: number,
  price: number,
  hour: number
): void {
  state.cache.set(agentType, { decision, tick, price, hour });
}

/**
 * Record a failure and set backoff
 */
function recordFailure(currentTick: number): void {
  state.totalFailures++;
  state.lastFailureTick = currentTick;
  state.backoffUntilTick = currentTick + LLM_BACKOFF_TICKS;
  logger.warn('LLM', `Entering backoff mode until tick ${state.backoffUntilTick}`, {
    totalFailures: state.totalFailures,
  });
}

/**
 * Update tracking state after LLM call
 */
export function updateLLMState(currentPrice: number, currentHour: number): void {
  state.lastPrice = currentPrice;
  state.lastHour = currentHour;
}

/**
 * Get LLM usage stats
 */
export function getLLMStats(): {
  totalCalls: number;
  totalFailures: number;
  estimatedCost: number;
  inBackoff: boolean;
  backoffUntilTick: number;
  cacheSize: number;
  currentRPM: number;
  maxRPM: number;
} {
  // Clean up old timestamps for accurate RPM
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  state.requestTimestamps = state.requestTimestamps.filter(ts => ts > oneMinuteAgo);

  return {
    totalCalls: state.totalCalls,
    totalFailures: state.totalFailures,
    estimatedCost: state.estimatedCost,
    inBackoff: state.backoffUntilTick > 0,
    backoffUntilTick: state.backoffUntilTick,
    cacheSize: state.cache.size,
    currentRPM: state.requestTimestamps.length,
    maxRPM: LLM_MAX_RPM,
  };
}

/**
 * Check if LLM is in backoff mode
 */
export function isInBackoff(currentTick: number): boolean {
  return currentTick < state.backoffUntilTick;
}

/**
 * Make LLM API call for agent decision
 */
export async function getAgentDecision(
  agentType: 'solar' | 'home' | 'battery',
  marketContext: string,
  agentContext: string,
  currentTick: number,
  currentPrice: number,
  currentHour: number
): Promise<AgentDecision | null> {
  if (!openai || !LLM_ENABLED) {
    return null;
  }

  // Check cache first
  const cached = getCachedDecision(agentType, currentTick, currentPrice);
  if (cached) {
    return cached;
  }

  // Check backoff
  if (isInBackoff(currentTick)) {
    logger.debug('LLM', `${agentType}: skipping due to backoff`);
    return null;
  }

  // Check rate limit
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    logger.debug('LLM', `${agentType}: rate limited, need to wait ${rateCheck.waitMs}ms`);
    return null;
  }

  const systemPrompt = SYSTEM_PROMPTS[agentType];
  const userMessage = `Market Context:
${marketContext}

Your Status:
${agentContext}

What is your decision for this tick?`;

  const startTime = Date.now();
  state.totalCalls++;
  recordRequest(); // Track for RPM

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 150,
      temperature: 0.7,
    }, { signal: controller.signal });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    // Track cost
    state.estimatedCost += ESTIMATED_COST_PER_CALL;

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.llmFallback(agentType, 'No response content');
      return null;
    }

    const parsed = JSON.parse(content);

    // Validate response
    if (!parsed.action || !['buy', 'sell', 'hold'].includes(parsed.action)) {
      logger.llmFallback(agentType, `Invalid action: ${parsed.action}`);
      return null;
    }

    const decision: AgentDecision = {
      action: parsed.action,
      amount: Math.max(0, Number(parsed.amount) || 0),
      priceMultiplier: Math.max(0.8, Math.min(1.2, Number(parsed.priceMultiplier) || 1)),
      reasoning: String(parsed.reasoning || '').slice(0, 200),
    };

    // Cache the successful decision
    cacheDecision(agentType, decision, currentTick, currentPrice, currentHour);

    logger.llmDecision(agentType, decision, durationMs);
    return decision;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;

    if (err.name === 'AbortError') {
      logger.llmFallback(agentType, `Timeout after ${durationMs}ms`);
    } else if (err.message?.includes('429')) {
      logger.llmFallback(agentType, 'Rate limit/quota exceeded - entering backoff');
      recordFailure(currentTick);
    } else {
      logger.llmFallback(agentType, `Error: ${err.message}`);
      // Also backoff on other errors to be safe
      if (err.message?.includes('exceeded') || err.message?.includes('limit')) {
        recordFailure(currentTick);
      }
    }

    return null;
  }
}

/**
 * Batch get decisions for all agents with smart triggering
 */
export async function getAgentDecisions(
  marketplace: Marketplace,
  clock: SimulatedClock,
  priceHistory: { time: string; price: number; simHour: number }[],
  solarAgent: SolarAgent,
  homeAgent: HomeAgent,
  batteryAgent: BatteryAgent,
  homeBalance: number,
  batteryBalance: number,
  scheduledInterval: number,
  userAgentsSummary?: string
): Promise<{
  solar: AgentDecision | null;
  home: AgentDecision | null;
  battery: AgentDecision | null;
  triggered: boolean;
  reason: string;
}> {
  const currentTick = clock.getTickCount();
  const currentPrice = marketplace.pricing.getPrice();
  const currentHour = clock.getHour();

  // Check if we should trigger LLM calls
  const trigger = shouldTriggerLLM(currentTick, scheduledInterval, currentPrice, currentHour);

  if (!trigger.shouldCall) {
    return {
      solar: getCachedDecision('solar', currentTick, currentPrice),
      home: getCachedDecision('home', currentTick, currentPrice),
      battery: getCachedDecision('battery', currentTick, currentPrice),
      triggered: false,
      reason: trigger.reason,
    };
  }

  logger.info('LLM', `Triggering decisions: ${trigger.reason}`, {
    tick: currentTick,
    price: currentPrice,
    hour: currentHour,
    rpm: state.requestTimestamps.length,
    maxRpm: LLM_MAX_RPM,
  });

  const marketCtx = buildMarketContext(marketplace, clock, priceHistory, userAgentsSummary);

  // Throttled sequential calls instead of parallel to respect rate limits
  const solar = await getAgentDecision('solar', marketCtx, buildAgentContext('solar', solarAgent, currentHour), currentTick, currentPrice, currentHour);

  // Throttle between requests
  await sleep(LLM_REQUEST_THROTTLE_MS);

  const home = await getAgentDecision('home', marketCtx, buildAgentContext('home', homeAgent, currentHour, homeBalance), currentTick, currentPrice, currentHour);

  await sleep(LLM_REQUEST_THROTTLE_MS);

  const battery = await getAgentDecision('battery', marketCtx, buildAgentContext('battery', batteryAgent, currentHour, batteryBalance), currentTick, currentPrice, currentHour);

  // Update state after calls
  updateLLMState(currentPrice, currentHour);

  // Log stats periodically
  if (currentTick % 50 === 0) {
    const stats = getLLMStats();
    logger.info('LLM', 'Usage stats', {
      totalCalls: stats.totalCalls,
      totalFailures: stats.totalFailures,
      estimatedCost: `$${stats.estimatedCost.toFixed(4)}`,
      cacheSize: stats.cacheSize,
    });
  }

  return {
    solar,
    home,
    battery,
    triggered: true,
    reason: trigger.reason,
  };
}
