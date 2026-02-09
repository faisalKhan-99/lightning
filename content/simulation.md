# The Energy Simulation

SolGrid simulates a realistic energy grid where supply and demand are never perfectly balanced. This natural mismatch is what makes the market interesting — and what gives the battery trader its opportunity to profit.

## Time Compression

The simulation runs at **720x speed**: every 5 real seconds equals 1 simulated hour. This means:

- A full simulated day (24 hours) passes in about 2 real minutes
- You can watch multiple day/night cycles and observe how agents adapt
- Market patterns that would take days to emerge in reality play out in minutes

Each simulated hour is one **market tick** — agents observe conditions, submit orders, and trades execute.

## The Day/Night Cycle

The simulation tracks a 24-hour clock that drives everything:

- **Daytime (6 AM – 6 PM)**: Solar panels produce energy
- **Nighttime (6 PM – 6 AM)**: Solar production drops to zero
- The transition creates the most volatile market moments

The dashboard visualizes this cycle with a sun/moon indicator and a color gradient that shifts from warm (day) to cool (night).

## Solar Production Curve

Solar output follows a **bell curve** centered on noon, mimicking real sunlight intensity:

- **6 AM**: Production begins (low output, sunrise)
- **9 AM**: Ramping up
- **12 PM**: Peak production (maximum output)
- **3 PM**: Starting to decline
- **6 PM**: Production ends (sunset)
- **6 PM – 6 AM**: Zero production

A random weather factor of **±15%** is applied each tick. Some hours produce more than expected (clear skies), others less (cloud cover). This noise prevents agents from perfectly predicting supply.

## Home Consumption Pattern

The smart home's energy demand follows typical residential patterns:

- **12 AM – 5 AM**: Low baseline (sleeping, minimal appliances)
- **7 AM – 9 AM**: Morning peak (heating, cooking, getting ready)
- **10 AM – 4 PM**: Moderate usage (daytime baseline)
- **5 PM – 9 PM**: Evening peak (cooking, entertainment, heating/cooling)
- **10 PM – 11 PM**: Declining (winding down)

Random noise of **±10%** adds variation. No two days have exactly the same consumption profile.

## The Supply-Demand Mismatch

Here's the crucial insight that drives the entire market:

**Solar peaks when homes need energy least, and homes peak when solar produces nothing.**

- At noon, solar is at maximum but home demand is moderate → **surplus** → prices drop
- At 7 PM, home demand peaks but solar is gone → **deficit** → prices spike

This mismatch creates natural **arbitrage opportunities** for the battery:

1. Buy cheap energy during the midday surplus
2. Store it
3. Sell expensive energy during the evening deficit
4. Pocket the price difference

This is exactly how real energy storage economics work — SolGrid just makes it visible and fast.

## Weather and Noise

The random noise on both supply (±15%) and demand (±10%) serves several purposes:

- Prevents agents from developing overly rigid strategies
- Creates unexpected scarcity or surplus events
- Forces agents to adapt in real-time rather than following a fixed script
- Makes each simulation run unique
