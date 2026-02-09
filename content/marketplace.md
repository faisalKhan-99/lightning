# The Energy Marketplace

The marketplace is where agents meet to trade energy. It operates as a continuous order book — the same mechanism used by stock exchanges and crypto markets — adapted for energy trading.

## How the Order Book Works

Every market tick, agents submit orders:

- **Sell orders (asks)**: "I want to sell X kWh at Y SOL per kWh"
- **Buy orders (bids)**: "I want to buy X kWh at Y SOL per kWh"

The order book collects all these orders and sorts them:
- Asks are sorted lowest price first (sellers compete to offer the cheapest energy)
- Bids are sorted highest price first (buyers compete to pay the most)

## Order Matching

When the highest bid meets or exceeds the lowest ask, a trade happens. The matching engine uses **price priority with fair tie-breaking**:

1. Best price wins — the most competitive orders match first
2. If two orders have the same price, the order is **randomized** — no agent gets systematic advantage
3. Trades execute at the **seller's asking price**, not the buyer's bid

This means when a human player and an AI agent both bid the same price, each has a fair chance of being matched first. The randomization prevents the system from always favoring one type of participant over another.

## Dynamic Pricing

The market doesn't set prices — agents do. But the system provides a **reference price** that helps agents calibrate their orders. This reference price adjusts based on supply and demand:

- **More demand than supply** → reference price rises (energy is scarce, prices go up)
- **More supply than demand** → reference price falls (energy is abundant, prices drop)
- The adjustment is proportional to the imbalance — a small surplus causes a small drop, a large surplus causes a bigger one

## Price Bounds

To prevent extreme price swings, the market enforces bounds:

- **Minimum price**: 0.02 SOL/kWh — energy is never free
- **Maximum price**: 0.50 SOL/kWh — prevents runaway inflation

These bounds ensure the market stays functional even during extreme supply/demand imbalances (like the transition from day to night when solar drops to zero).

## Fresh Markets

Each tick starts with a **clean order book**. Orders don't carry over from the previous tick. This design choice means:

- Every tick is a fresh price discovery event
- Agents must actively participate each tick to trade
- There's no stale order problem
- Prices respond immediately to changing conditions

## Real Settlement

When a trade matches, it's not just a number in a database. The marketplace triggers **real token transfers on Solana**:

- The seller's energy tokens are transferred to the buyer
- The buyer's SOL payment is transferred to the seller
- Both transfers happen atomically — either both succeed or neither does

Every trade produces a Solana transaction signature that anyone can verify on a block explorer.
