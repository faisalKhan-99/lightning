# The Autonomous Agents

SolGrid is powered by three autonomous agents, each with a distinct role in the energy market. No human tells them what to do — they observe the market, make decisions, and learn from the outcomes.

## The Three Agents

### Solar Producer
The solar producer generates energy. Its output follows a natural bell curve tied to the simulated day/night cycle: production ramps up after sunrise around 6 AM, peaks at noon, and tapers off by 6 PM. At night, it produces nothing. Random weather noise (±15%) adds realistic variation — some hours are sunny, some are cloudy.

The solar producer's job is simple: sell the energy it generates at the best price it can get. When supply is abundant (midday), it competes with low prices. When supply is scarce (morning, evening), it can charge a premium.

### Smart Home
The smart home consumes energy. Its demand pattern mirrors real household behavior: moderate usage overnight, a breakfast peak from 7–9 AM, lower usage midday, and a large dinner peak from 5–9 PM. Like solar, consumption has random noise (±10%) to keep things realistic.

The home must buy enough energy to meet its needs. It prefers low prices but can't wait forever — unmet demand is a problem. This tension between patience and urgency drives interesting market dynamics.

### Battery Trader
The battery trader is the market's speculator. It doesn't produce or consume energy for its own use — it buys low, stores energy, and sells high. The battery has a finite capacity and must manage its charge level carefully.

The battery thrives on price volatility. It charges up when solar floods the market at midday (cheap energy) and discharges when the home is desperate for power in the evening (expensive energy). Its profit comes from the spread between buy and sell prices.

## How Agents Learn

Each agent uses an **adaptive risk system**. After every market tick:

- **Winning trades** (profitable or well-timed) make the agent bolder — it takes slightly more risk next time
- **Losing trades** (unprofitable or missed opportunities) make the agent more cautious

This creates natural behavioral evolution. Early in a simulation, agents may be conservative. As they find strategies that work, they lean into them. If the market shifts, they adapt.

## The LLM Advisory Layer

Each agent has access to a GPT-4o-mini advisor. Every tick, the advisor receives the agent's current state — balance, inventory, recent trades, market conditions — and returns strategic advice with transparent reasoning.

But here's the key: **agents don't blindly follow the LLM**. The system uses a dual-decision architecture:

1. **Fallback strategy**: A rule-based algorithm that always produces a valid action. This is the safety net.
2. **LLM override**: If the AI advisor's suggestion passes sanity checks, it can override the fallback.

This means the system never breaks even if the LLM gives bad advice. And when the LLM gives good advice, the agent benefits from reasoning that goes beyond simple rules.

## Emergent Behavior

Nobody programs the agents to cooperate or compete in specific ways. Yet patterns emerge naturally:

- The solar producer learns to hold back supply near sunset, anticipating evening demand
- The home learns to buy extra during cheap midday hours
- The battery becomes a sophisticated arbitrageur, timing its trades to market cycles

These emergent strategies arise purely from each agent optimizing its own position in a competitive market — exactly how real energy markets work.
