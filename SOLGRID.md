# SolGrid: Autonomous Energy Market on Solana

A decentralized energy trading simulation featuring autonomous AI agents that mint, trade, and consume energy tokens on Solana devnet.

---

## System Summary

**What it does:** Three AI agents autonomously trade energy in a simulated marketplace with real on-chain transactions.

| Agent | Role | Strategy |
|-------|------|----------|
| Solar Panel | Produces & sells energy | Mint during daylight, sell at competitive prices |
| Smart Home | Consumes & buys energy | Burn for consumption, maintain 20 kWh buffer |
| Battery | Arbitrage trading | Buy low (<85% avg), sell high (>115% avg) |

**Key Features:**
- Real SPL token minting, burning, and transfers on Solana devnet
- GPT-4o-mini advisory decisions with smart triggering and fallback strategies
- Dynamic pricing based on supply/demand
- Live dashboard with WebSocket updates
- Structured logging for performance tracing
- 92% reduction in API calls via caching and rate limiting

---

## Project Status

| Component | Status |
|-----------|--------|
| Engine Core | Complete |
| Solana Integration | Complete |
| WebSocket Server | Complete |
| Dashboard UI | Complete |
| Agent System | Complete |
| LLM Decision Layer | Complete |
| Smart LLM Triggering | Complete |
| Rate Limiting & Caching | Complete |
| Logging System | Complete |
| Colosseum Heartbeat | Complete |
| Energy Flow Animation | Complete |
| Day/Night Cycle UI | Complete |
| Nighttime Solar Flow Fix | Complete |

**Last Updated:** 2026-02-07

### Hackathon Status

| Field | Value |
|-------|-------|
| Agent Name | lightning |
| Agent ID | 646 |
| Twitter | @Lightningenrgy |
| Claim Status | Verified |
| Project | Pending creation |
| Hackathon | Day 5 of 10, 5 days remaining |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         SolGrid System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   Solar     │     │    Home     │     │   Battery   │       │
│  │   Agent     │     │   Agent     │     │   Agent     │       │
│  │             │     │             │     │             │       │
│  │ Produces    │     │ Consumes    │     │ Arbitrages  │       │
│  │ & Sells     │     │ & Buys      │     │ Buy/Sell    │       │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘       │
│         │                   │                   │               │
│         │    ┌──────────────┴───────────────┐   │               │
│         │    │      LLM Advisory Layer      │   │               │
│         │    │       (GPT-4o-mini)          │   │               │
│         │    │  Smart trigger + caching     │   │               │
│         │    │  Rate limited (10 RPM)       │   │               │
│         │    └──────────────────────────────┘   │               │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Marketplace                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │ Order Book │  │  Pricing   │  │  Order Matching    │  │  │
│  │  │            │  │  Engine    │  │  Engine            │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Solana Devnet                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │ SPL Token  │  │   Token    │  │   SOL Transfers    │  │  │
│  │  │   Mint     │  │  Accounts  │  │   (Payments)       │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  WebSocket Server                         │  │
│  │                    (Port 8080)                            │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Dashboard (Next.js)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐    │
│  │ Price Chart│  │ Agent Cards│  │ Order Book & Trades    │    │
│  │ (Recharts) │  │ + AI Notes │  │                        │    │
│  └────────────┘  └────────────┘  └────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
hackathon/
├── .env                    # Environment variables (API keys, etc.)
├── SOLGRID.md              # This documentation file
├── engine/                 # Simulation engine (Node.js + TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts         # Entry point, tick loop
│       ├── config.ts       # Configuration constants
│       ├── server.ts       # WebSocket server
│       ├── agents/
│       │   ├── base.ts     # BaseAgent abstract class
│       │   ├── solar.ts    # Solar producer agent
│       │   ├── home.ts     # Home consumer agent
│       │   ├── battery.ts  # Battery arbitrage agent
│       │   └── llm.ts      # LLM integration module
│       ├── chain/
│       │   ├── connection.ts   # Solana RPC connection
│       │   ├── setup.ts        # System initialization
│       │   └── token.ts        # SPL token operations
│       ├── colosseum/
│       │   ├── index.ts        # Module exports
│       │   ├── api.ts          # Colosseum API client
│       │   └── heartbeat.ts    # Periodic sync system
│       ├── utils/
│       │   ├── index.ts        # Module exports
│       │   └── logger.ts       # Logging system
│       ├── market/
│       │   ├── marketplace.ts  # Core marketplace logic
│       │   ├── orderbook.ts    # Order management
│       │   ├── pricing.ts      # Dynamic pricing engine
│       │   └── types.ts        # TypeScript interfaces
│       └── simulation/
│           ├── clock.ts        # Simulated time system
│           └── meter.ts        # Energy production/consumption curves
│
└── dashboard/              # Frontend (Next.js 14 + Tailwind + Remotion)
    ├── package.json
    ├── tailwind.config.ts
    ├── next.config.mjs
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── AgentCard.tsx           # Agent status + AI reasoning display
    │   ├── DayCycle.tsx            # Day/night cycle sun position indicator
    │   ├── EnergyFlow/            # Animated energy flow visualization
    │   │   ├── index.tsx          # Entry point, accepts agents/trades/hour
    │   │   ├── EnergyFlowPlayer.tsx # Remotion Player wrapper
    │   │   ├── EnergyFlowComposition.tsx # Remotion composition
    │   │   ├── FlowPath.tsx       # Animated bezier flow paths
    │   │   ├── AgentNode.tsx      # Agent node icons (solar/home/battery)
    │   │   └── flowUtils.ts       # Flow calculations, night-gated solar
    │   ├── MetricsBar.tsx         # Top bar: price, time, connection status
    │   ├── PriceChart.tsx         # Price history line chart (Recharts)
    │   ├── SupplyDemand.tsx       # Supply/demand bar chart
    │   ├── SystemStatus.tsx       # Bottom system health indicator
    │   └── TradeFeed.tsx          # Recent trades with Solana tx links
    ├── hooks/
    │   └── useWebSocket.ts        # WebSocket hook with auto-reconnect
    └── lib/
        └── types.ts               # Shared TypeScript types
```

---

## Components

### 1. Engine (`/engine`)

The simulation engine runs a tick-based loop that:
1. Advances simulated time
2. Gathers LLM decisions (every 3rd tick, in parallel)
3. Executes agent behaviors
4. Matches orders and settles trades on-chain
5. Broadcasts state to connected dashboards

#### Tick Loop (5 seconds real-time = 1 simulated hour)

```
Every 5 seconds:
  1. Clock advances 1 hour
  2. Clear previous orders
  3. (If LLM tick) Fetch 3 agent decisions in parallel
  4. Solar agent: mint tokens based on hour, post sell orders
  5. Home agent: burn tokens for consumption, post buy orders
  6. Battery agent: evaluate arbitrage opportunities
  7. Match orders → execute on-chain transfers
  8. Recalculate market price based on supply/demand
  9. Broadcast full state via WebSocket
```

#### Configuration (`config.ts`)

| Parameter | Value | Description |
|-----------|-------|-------------|
| `TICK_INTERVAL_MS` | 5000 | Real-time tick interval |
| `SIM_SPEED` | 720 | 1 tick = 1 sim hour (24 ticks = 1 day) |
| `BASE_PRICE` | 0.10 | Base energy price (SOL/kWh) |
| `MIN_PRICE` | 0.02 | Price floor |
| `MAX_PRICE` | 0.50 | Price ceiling |
| `PRICE_SENSITIVITY` | 0.5 | How much supply/demand affects price |
| `SOLAR_MAX_OUTPUT` | 10 | Peak solar production (kWh/tick) |
| `HOME_BASE_CONSUMPTION` | 3 | Base home consumption (kWh/tick) |
| `HOME_TARGET_BUFFER` | 20 | Home's target energy reserve |
| `BATTERY_MAX_CAPACITY` | 50 | Battery max storage (kWh) |
| `BATTERY_BUY_THRESHOLD` | 0.85 | Buy when price < avg * this |
| `BATTERY_SELL_THRESHOLD` | 1.15 | Sell when price > avg * this |
| `LLM_ENABLED` | auto | True if `OPENAI_API_KEY` is set |
| `LLM_CALL_INTERVAL` | 3 | Scheduled LLM interval (3 ticks = 3 sim hours) |
| `LLM_BACKOFF_TICKS` | 5 | After failure, wait N ticks before retry (5 hours) |
| `LLM_PRICE_CHANGE_THRESHOLD` | 0.15 | Trigger LLM if price changes >15% |
| `LLM_DECISION_CACHE_TICKS` | 6 | Reuse decision for up to N ticks (6 hours) |
| `LLM_MAX_RPM` | 10 | Max requests per minute (env configurable) |
| `LLM_REQUEST_THROTTLE_MS` | 500 | Delay between sequential requests |
| `ADAPTIVE_UPDATE_INTERVAL` | 6 | Update strategy every 6 ticks (6 hours) |
| `MEMORY_HISTORY_LENGTH` | 20 | Track last 20 trades for adaptation |
| `MIN_RISK_LEVEL` | 0.2 | Minimum agent risk level |
| `MAX_RISK_LEVEL` | 0.8 | Maximum agent risk level |
| `RISK_ADJUSTMENT_RATE` | 0.05 | Risk level step per adjustment |
| `COLOSSEUM_API_KEY` | env | Colosseum hackathon API key |
| `COLOSSEUM_ENABLED` | auto | True if API key is set |
| `HEARTBEAT_INTERVAL_MS` | 1800000 | Heartbeat sync interval (30 min) |

---

### 2. Agents

#### Solar Agent (`agents/solar.ts`)

**Role:** Energy producer — mints new energy tokens during daylight hours.

**Behavior:**
- Produces energy following a solar curve (peak at noon, zero at night)
- Hours 6-18: active production
- Mints SPL tokens representing kWh produced
- Posts sell orders to marketplace

**Default Strategy:** Sell at 95% of market price

**LLM Override:** Can adjust price multiplier (0.8-1.2x) or hold production

```typescript
Production curve: sin((hour - 6) * π / 12) * MAX_OUTPUT * (1 ± 15% noise)
```

#### Home Agent (`agents/home.ts`)

**Role:** Energy consumer — burns tokens for consumption, maintains buffer.

**Behavior:**
- Consumes energy following residential patterns
- Peak consumption: 7-9 AM (morning) and 5-9 PM (evening)
- Burns SPL tokens to represent consumption
- Buys energy when balance falls below target buffer (20 kWh)

**Default Strategy:** Buy at 105% of market price to ensure fills

**LLM Override:** Can adjust buy amount, price multiplier, or hold

```typescript
Consumption pattern: BASE * (1 + peakMultiplier) where peaks at 8 AM and 7 PM
```

#### Battery Agent (`agents/battery.ts`)

**Role:** Arbitrage trader — profits from price volatility.

**Behavior:**
- Tracks 10-tick moving average of prices
- Buys when price is "low" (< 85% of moving avg)
- Sells when price is "high" (> 115% of moving avg)
- Respects capacity limits (0-50 kWh)

**Default Strategy:** Moving average crossover

**LLM Override:** Can make buy/sell/hold decisions with custom amounts and prices

---

### 3. LLM Integration (`agents/llm.ts`)

**Model:** GPT-4o-mini (fast, cheap, good for structured output)

**Smart Triggering Flow:**
```
On each tick:
  1. Check if LLM should be called:
     - Scheduled interval (every 36 ticks / 3 sim hours)
     - Price changed >15% since last decision
     - Hour transitioned to peak/off-peak (6, 10, 16, 22)
  2. Check cache for valid recent decisions
  3. Check rate limits (10 RPM) and backoff status
  4. If triggered: make throttled sequential API calls (500ms apart)
  5. Cache successful decisions for reuse
  6. Agent uses LLM decision OR falls back to coded strategy
```

**Rate Limiting & Efficiency:**
| Feature | Value | Purpose |
|---------|-------|---------|
| Call Interval | 36 ticks | ~1 call/min vs 12 calls/min |
| Request Throttle | 500ms | Prevents burst rate limits |
| Max RPM | 10 | Stays well under OpenAI limits |
| Decision Cache | 72 ticks | Reuse decisions for 6 sim hours |
| Backoff Period | 60 ticks | Wait 5 min after quota errors |

**Fallback:** If LLM fails (timeout, quota, rate limit), agent uses coded strategy seamlessly.

**System Prompts:** Each agent type has a specialized prompt explaining:
- Their role in the market
- Their goals and constraints
- Expected JSON response format: `{ action, amount, priceMultiplier, reasoning }`

---

### 4. Marketplace (`market/`)

#### Order Book (`orderbook.ts`)

- Maintains separate buy and sell order lists
- Orders have: id, agentId, side, amount, pricePerUnit, timestamp, filled
- Provides methods to add orders, get totals, match orders

#### Pricing Engine (`pricing.ts`)

Dynamic pricing based on supply/demand ratio:

```typescript
price = BASE_PRICE * (1 + SENSITIVITY * (demand - supply) / max(demand, supply, 1))
price = clamp(price, MIN_PRICE, MAX_PRICE)
```

Also maintains a 10-tick moving average for trend analysis.

#### Order Matching

Simple price-time priority matching:
1. Sort sells by price ascending (lowest first)
2. Sort buys by price descending (highest first)
3. Match when buy.price >= sell.price
4. Execute on-chain token + SOL transfers
5. Record trade

---

### 5. Solana Integration (`chain/`)

**Network:** Solana Devnet

**Components:**
- **Mint Authority:** Creates the energy token mint
- **SPL Token Mint:** Represents kWh energy credits (6 decimals)
- **Agent Wallets:** Each agent has a Keypair + Token Account
- **Token Operations:**
  - `mintTokens()` — Solar agent creates new supply
  - `burnTokens()` — Home agent destroys consumed energy
  - `transfer()` — Marketplace settles trades

**Funding:** Agents are airdropped SOL on devnet for transaction fees

---

### 6. Colosseum Integration (`colosseum/`)

Integration with the Colosseum Agent Hackathon platform.

#### API Client (`api.ts`)

Wrapper for all Colosseum API endpoints:

| Category | Methods |
|----------|---------|
| Status | `getStatus()` — Agent status, hackathon info, engagement metrics |
| Polls | `getActivePoll()`, `submitPollResponse()` |
| Forum | `getForumPosts()`, `createPost()`, `createComment()`, `getMyPosts()` |
| Project | `getMyProject()`, `createProject()`, `updateProject()` |
| Leaderboard | `getLeaderboard()` |

#### Heartbeat System (`heartbeat.ts`)

Periodic synchronization with the hackathon platform:

```
Every 30 minutes:
  1. Fetch agent status from /agents/status
  2. Log hackathon day and time remaining
  3. Check for new announcements
  4. Check for active polls (notify if unresponded)
  5. Log engagement metrics (posts, project status)
  6. Display next steps from platform
```

**Standalone Runner:** `heartbeat-runner.ts`

The heartbeat runs as a **separate process** from the main engine, since it monitors hackathon progress (polls, forum, project) rather than the energy simulation.

```bash
# Run heartbeat monitor in background
cd engine && npm run heartbeat
```

**Features:**
- Full heartbeat sync every 30 minutes
- Quick poll check every 5 minutes
- Urgent alerts for polls expiring soon
- Notification of replies on your posts

**Console Output Example:**
```
[Heartbeat] ====== Colosseum Sync ======
[Heartbeat] Hackathon: Colosseum Agent Hackathon
[Heartbeat] Day 4 | 6 days, 11 hours remaining
[Heartbeat] Agent Status: claimed
[Heartbeat] Engagement: 0 posts | Project: none
[Heartbeat] REMINDER: No project created yet!
[Heartbeat] ========================
```

---

### 7. Logging System (`utils/logger.ts`)

Structured logging with console output and file persistence.

**Log Levels:**
- `DEBUG` — Detailed internal state (gray)
- `INFO` — Normal operations (cyan)
- `WARN` — Issues that don't stop execution (yellow)
- `ERROR` — Failures (red)

**Specialized Methods:**
| Method | Purpose |
|--------|---------|
| `logger.tick()` | Log tick start with sim time |
| `logger.llmDecision()` | Log LLM response with timing |
| `logger.llmFallback()` | Log when using coded strategy |
| `logger.agentAction()` | Log agent buy/sell/hold actions |
| `logger.trade()` | Log executed trades |
| `logger.marketState()` | Log price/supply/demand |
| `logger.performance()` | Log operation timing |

**Log Output:**
- Console: Color-coded by level
- File: JSON lines at `logs/solgrid-{session}.log`

**Example Log Entry:**
```json
{
  "timestamp": "2026-02-06T12:30:00.000Z",
  "level": "INFO",
  "category": "LLM",
  "message": "solar decision",
  "data": {
    "agent": "solar",
    "action": "sell",
    "amount": 8.5,
    "priceMultiplier": 0.92,
    "reasoning": "High supply during peak production, pricing competitively",
    "durationMs": 892
  }
}
```

---

### 8. Dashboard (`/dashboard`)

**Framework:** Next.js 14 with App Router, Tailwind CSS, Remotion (animations), Recharts

**Features:**
- Real-time WebSocket connection to engine with auto-reconnect
- Cyberpunk-themed UI with custom design system
- Day/night cycle visualization with sun position indicator
- Animated energy flow diagram (Remotion) showing solar→home, solar→battery, battery→home paths
- Night-gated solar flows: solar paths go idle when `simulatedHour < 6 || > 18`
- Live price chart (Recharts)
- Agent status cards with balances, activity, strategy, and AI reasoning
- Recent trades feed with Solana explorer links
- Supply/demand bar chart

#### Key Components

| Component | Purpose |
|-----------|---------|
| `page.tsx` | Main layout, WebSocket state, component composition |
| `MetricsBar` | Top bar with current price, simulated time, connection status |
| `DayCycle` | Visual sun position indicator (daylight 6AM–6PM) |
| `PriceChart` | Historical price line chart (Recharts, 100-tick window) |
| `AgentCard` | Per-agent display: balances, production/consumption, AI reasoning |
| `EnergyFlow/` | Animated bezier flow paths between solar, home, battery (Remotion) |
| `SupplyDemand` | Bar chart of open buy/sell order volumes |
| `TradeFeed` | Scrollable recent trades with amounts, prices, Solana tx signatures |
| `SystemStatus` | Bottom bar with system health indicator |

---

## Running the System

### Prerequisites

- Node.js 18+
- npm or pnpm
- (Optional) OpenAI API key for LLM features

### Environment Setup

Create `.env` in the hackathon root directory:
```bash
# Solana
SOLANA_RPC=https://api.devnet.solana.com
WS_PORT=8080

# OpenAI (enables LLM decision layer)
OPENAI_API_KEY=sk-...

# Colosseum Hackathon
COLOSSEUM_API_KEY=your_api_key
COLOSSEUM_AGENT_ID=your_agent_id
COLOSSEUM_CLAIM_CODE=your_claim_code
COLOSSEUM_VERIFICATION_CODE=your_verification_code

# AgentWallet (optional)
AGENTWALLET_USERNAME=your_username
AGENTWALLET_API_TOKEN=your_token
AGENTWALLET_SOLANA_ADDRESS=your_solana_address
```

### Start Engine

```bash
cd engine
npm install
npm start
# or: npx tsx src/main.ts
```

### Start Dashboard

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3000
```

---

## Data Flow

### Market State Object

Broadcast every tick via WebSocket:

```typescript
interface MarketState {
  currentPrice: number;
  priceHistory: { time: string; price: number; simHour: number }[];
  agents: AgentState[];
  recentTrades: Trade[];
  openOrders: Order[];
  supplyDemand: { supply: number; demand: number };
  metrics: {
    totalMinted: number;
    totalBurned: number;
    totalTraded: number;
    totalTransactions: number;
  };
  simulatedTime: string;
  simulatedHour: number;
  dayNumber: number;
  tickCount: number;
  systemStatus: 'initializing' | 'running' | 'paused' | 'error';
}
```

### Agent State Object

```typescript
interface AgentState {
  id: string;
  name: string;
  type: 'solar' | 'home' | 'battery';
  walletAddress: string;
  tokenBalance: number;
  solBalance: number;
  activity: string;
  strategy: string;
  reasoning?: string;      // LLM explanation (when available)
  production?: number;     // Solar only
  consumption?: number;    // Home only
  storageLevel?: number;   // Battery only
  storageCapacity?: number;// Battery only
}
```

---

## Recent Changes

### 2026-02-06: Smart LLM Triggering

Optimized LLM integration to reduce API calls by ~90%:

**Changes to `config.ts`:**
- `LLM_CALL_INTERVAL`: 3 (every 3 ticks = 3 sim hours)
- Added `LLM_BACKOFF_TICKS`: 5 (wait 5 hours after failures)
- Added `LLM_PRICE_CHANGE_THRESHOLD`: 0.15 (trigger on 15% price change)
- Added `LLM_DECISION_CACHE_TICKS`: 6 (cache valid for 6 sim hours)

**New Features in `agents/llm.ts`:**
- **Smart Triggering**: Only call LLM when:
  - Scheduled interval reached (every 3 ticks / 3 sim hours)
  - Price changed >15% since last decision
  - Hour transitioned to peak/off-peak period (6, 10, 16, 22)
- **Decision Caching**: Reuse valid decisions if market conditions similar
- **Backoff on Failure**: After 429 error, wait 5 ticks before retrying
- **Rate Limiting**: Track RPM and enforce limits (default 10 RPM)
- **Request Throttling**: 500ms delay between sequential requests (not parallel)
- **Usage Tracking**: Track total calls, failures, estimated cost, current RPM

**API Call Reduction:**
| Before | After | Reduction |
|--------|-------|-----------|
| 12 calls/min | ~1 call/min | 92% |
| 720 calls/hr | ~60 calls/hr | 92% |

---

### 2026-02-06: Logging System

Added structured logging for tracing performance and decisions:

**New Files:**
- `engine/src/utils/logger.ts` — Logger with levels, file output, specialized methods
- `engine/src/utils/index.ts` — Module exports

**Modified Files:**
- `engine/src/main.ts` — Tick and performance logging
- `engine/src/agents/llm.ts` — LLM decision logging with timing
- `engine/src/agents/solar.ts` — Agent action logging
- `engine/src/agents/home.ts` — Agent action logging
- `engine/src/agents/battery.ts` — Agent action logging
- `engine/src/market/marketplace.ts` — Trade logging

**Features:**
- Color-coded console output by log level
- JSON log files at `logs/solgrid-{session}.log`
- Performance tracking with timing warnings (>3s)
- LLM decision logging with duration
- Trade execution logging
- Agent action logging with source (llm/fallback)

---

### 2026-02-06: Colosseum Heartbeat System

Added periodic sync with the Colosseum hackathon platform:

**New Files:**
- `engine/src/colosseum/api.ts` — Full Colosseum API client
- `engine/src/colosseum/heartbeat.ts` — Periodic sync system
- `engine/src/colosseum/index.ts` — Module exports

**Modified Files:**
- `engine/src/config.ts` — Added Colosseum config (API key, base URL, heartbeat interval)
- `engine/src/main.ts` — Starts heartbeat loop on engine startup

**Features:**
- 30-minute sync interval with hackathon platform
- Agent status monitoring (claim status, engagement metrics)
- Active poll detection and notification
- Announcement tracking
- Project status reminders
- Next steps display from platform

**Agent Claim Completed:**
- Twitter: @Lightningenrgy
- Verification: hull-A3AF
- Status: Verified and active

---

### 2026-02-06: LLM Decision Layer

Added GPT-4o-mini as an advisory decision layer for all agents:

**New Files:**
- `engine/src/agents/llm.ts` — OpenAI client, prompts, response parsing

**Modified Files:**
- `engine/package.json` — Added `openai` dependency
- `engine/src/config.ts` — Added `OPENAI_API_KEY`, `LLM_ENABLED`, `LLM_CALL_INTERVAL`
- `engine/src/agents/base.ts` — Added `reasoning` field
- `engine/src/agents/solar.ts` — Accepts optional LLM decision
- `engine/src/agents/home.ts` — Accepts optional LLM decision
- `engine/src/agents/battery.ts` — Accepts optional LLM decision
- `engine/src/main.ts` — Parallel LLM calls before agent ticks
- `engine/src/market/types.ts` — Added `reasoning` to `AgentState`
- `dashboard/lib/types.ts` — Added `reasoning` to `AgentState`
- `dashboard/components/AgentCard.tsx` — Displays AI reasoning

**How It Works:**
1. Every 3rd tick, engine gathers market + agent context
2. Three parallel API calls to GPT-4o-mini (3s timeout each)
3. Each agent receives structured decision: `{ action, amount, priceMultiplier, reasoning }`
4. Agents use LLM decision when valid, otherwise fall back to coded strategy
5. Reasoning string displayed on dashboard agent cards

---

### 2026-02-07: Dashboard UI Overhaul & Energy Flow

Complete redesign of the dashboard with cyberpunk theme and animated energy flow:

**New Components:**
- `DayCycle.tsx` — Visual sun position indicator tracking simulated hour
- `EnergyFlow/` — Animated energy flow diagram using Remotion:
  - Bezier curve paths between Solar, Home, and Battery nodes
  - Particle animation intensity driven by trade volume
  - Night-gated solar flows (solar paths idle when hour < 6 or > 18)
  - `flowUtils.ts` — Flow intensity calculations with `simulatedHour` gating
  - `FlowPath.tsx` — Animated bezier paths with gradient particles
  - `AgentNode.tsx` — SVG icons for solar panel, home, battery
  - `EnergyFlowPlayer.tsx` — Remotion Player wrapper
- `MetricsBar.tsx` — Top bar with price, time, connection status
- `SupplyDemand.tsx` — Supply/demand bar chart
- `SystemStatus.tsx` — Bottom system health bar
- `TradeFeed.tsx` — Scrollable trade feed (replaced TradeHistory)

**Modified Components:**
- `AgentCard.tsx` — Redesigned with cyberpunk styling, AI reasoning display
- `PriceChart.tsx` — Updated styling to match new theme
- `page.tsx` — New grid layout with 3-column design

**Design System:**
- Custom Tailwind config with cyberpunk color palette (`solar`, `battery`, `home-blue`, `surface-*`, `txt-*`)
- Custom CSS classes: `card-cyber`, `label-mono`, `bg-grid-overlay`
- Remotion for smooth energy flow animations

### 2026-02-07: Fix Stale Solar Trades at Night

Fixed energy flow showing active solar→home and solar→battery paths during nighttime:

**Root Cause:** `calculateFlowData()` aggregated trade volumes without time awareness — stale daytime solar trades persisted in the buffer and rendered as active flow at night.

**Fix:**
- `flowUtils.ts` — Added `simulatedHour` parameter to `calculateFlowData()`, zeroes solar flows when `hour < 6 || hour > 18`
- `EnergyFlow/index.tsx` — Accepts and forwards `simulatedHour` prop
- `page.tsx` — Passes `state.simulatedHour` to `<EnergyFlow>`

---

## Roadmap / Future Ideas

- [ ] Multi-home agents with different consumption patterns
- [ ] Weather simulation affecting solar output
- [ ] Grid fees and transmission costs
- [ ] Agent profit/loss tracking
- [ ] Historical analytics and replay
- [ ] Mobile dashboard
- [ ] Mainnet deployment option

---

## Troubleshooting

### Engine won't start
- Check Solana devnet is accessible: `curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'`
- Ensure `.env` file exists in engine directory

### Dashboard not receiving data
- Verify engine is running and WebSocket server started on port 8080
- Check browser console for WebSocket connection errors
- Verify no firewall blocking localhost:8080

### LLM not working
- Ensure `OPENAI_API_KEY` is set in `engine/.env`
- Check engine logs for `[LLM]` messages
- Verify API key has access to gpt-4o-mini

### Transactions failing
- Devnet may be congested; transactions will retry
- Agents may need more SOL for fees (automatic airdrop on startup)

---

## License

MIT
