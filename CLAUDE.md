# SolGrid - Claude Code Guidelines

## What This Is

Autonomous energy trading simulation on Solana devnet. AI agents + human players trade energy tokens (SPL) in a real-time marketplace. GPT-4o-mini advises AI agent decisions.

## Project Structure

```
engine/          # Node.js + TypeScript simulation engine
  src/main.ts    # Tick loop entry point
  src/agents/    # AI agents (solar, home, battery) + user agent + LLM
  src/market/    # Orderbook, pricing, marketplace matching
  src/chain/     # Solana devnet: mint, burn, transfer SPL tokens
  src/server.ts  # WebSocket server (port 8080) + user join/leave

dashboard/       # Next.js 14 + Tailwind + Remotion
  app/page.tsx           # Landing page
  app/dashboard/page.tsx # Live trading dashboard
  components/EnergyFlow/ # Animated SVG energy flow diagram
  components/JoinGrid.tsx # Phantom wallet connect + role selection
  hooks/useWebSocket.ts  # WS hook with join/leave state

content/         # Markdown content for landing page sections
```

## Setup & Run

```bash
# Environment: create .env in project root with OPENAI_API_KEY, SOLANA_RPC, etc.

# Engine
cd engine && npm install && npm run dev    # tsx watch, ws://localhost:8080

# Dashboard
cd dashboard && npm install && npm run dev # Next.js, http://localhost:3000
```

## Architecture Rules

- **Tick loop** (5s real = 1h sim): clear orders -> LLM decisions -> AI agents tick -> user agents tick -> match orders -> broadcast state
- **Order matching**: price priority, randomized tie-breaking (no AI-first bias)
- **LLM context** includes user agent summary so AI agents know about human demand
- **User agents** get dedicated Solana keypair + token account, registered in marketplace
- **WebSocket protocol**: `join` (wallet + role) / `leave` / `state` (broadcast each tick)

## Key Patterns

- Agents use fallback strategies when LLM is unavailable (timeout, rate limit, backoff)
- Energy flow diagram: user nodes positioned below their AI counterpart by type
- Home agents never appear as sellers in flows (invariant: homes only consume)
- Solar flows are night-gated (hidden when simulatedHour outside 6-18)
- Orders are cleared each tick (`marketplace.clearOrders()`) — no stale orders carry over

## Common Gotchas

- Agent ID for users is `user_${wallet.slice(0,8)}` — same wallet = same ID regardless of role
- Stale trades persist in `marketplace.trades` across user sessions (dashboard filters by node type)
- User home activity string must be reset when balance is 0 (neither consumption branch fires)
- TypeScript: engine uses `.js` extensions in imports (ESM with tsx)
- `.env` lives in project root, engine loads it via `dotenv` with `../` path

## Testing

```bash
cd engine && npx tsc --noEmit   # Type check engine
cd dashboard && npm run build   # Build check dashboard
```

Run both engine + dashboard, join as home via Phantom wallet, verify trades flow to user agent in trade log.

## Reference

See `SOLGRID.md` for full documentation (architecture, config table, agent details, data types).
