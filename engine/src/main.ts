import { initializeSystem } from './chain/setup.js';
import { SimulatedClock } from './simulation/clock.js';
import { Marketplace } from './market/marketplace.js';
import { SolarAgent } from './agents/solar.js';
import { HomeAgent } from './agents/home.js';
import { BatteryAgent } from './agents/battery.js';
import { startWebSocketServer, broadcastState } from './server.js';
import { MarketState } from './market/types.js';
import { TICK_INTERVAL_MS } from './config.js';

async function main() {
  console.log('=== SolGrid: Autonomous Energy Market ===\n');

  // Start WebSocket server
  startWebSocketServer();

  // Initialize Solana system
  const system = await initializeSystem();

  // Create marketplace
  const marketplace = new Marketplace();

  // Create agents
  const solarAgent = new SolarAgent(
    system.agents.solar.keypair,
    system.agents.solar.tokenAccount,
    system.mintAuthority,
    system.mint
  );

  const homeAgent = new HomeAgent(
    system.agents.home.keypair,
    system.agents.home.tokenAccount,
    system.mint
  );

  const batteryAgent = new BatteryAgent(
    system.agents.battery.keypair,
    system.agents.battery.tokenAccount
  );

  // Register agents in marketplace
  marketplace.registerAgent('solar', solarAgent.keypair, solarAgent.tokenAccountAddress);
  marketplace.registerAgent('home', homeAgent.keypair, homeAgent.tokenAccountAddress);
  marketplace.registerAgent('battery', batteryAgent.keypair, batteryAgent.tokenAccountAddress);

  // Create simulated clock
  const clock = new SimulatedClock();

  // Price history for chart
  const priceHistory: { time: string; price: number; simHour: number }[] = [];

  console.log('\nStarting simulation loop...\n');

  // Tick loop
  const tickLoop = async () => {
    try {
      // 1. Advance clock
      clock.tick();
      const hour = clock.getHour();
      const timeStr = clock.getFormattedTime();

      console.log(`\n--- Tick ${clock.getTickCount()} | ${timeStr} (Day ${clock.getDayNumber()}) ---`);

      // Clear stale orders from previous tick
      marketplace.clearOrders();

      // 2. Solar agent: produce + sell
      await solarAgent.tick(hour, marketplace);

      // 3. Home agent: consume + buy
      const homeBalance = await homeAgent.getTokenBalance();
      await homeAgent.tick(hour, marketplace, homeBalance);

      // 4. Battery agent: evaluate + trade
      const batteryBalance = await batteryAgent.getTokenBalance();
      await batteryAgent.tick(marketplace, batteryBalance);

      // 5. Match orders + execute on-chain
      await marketplace.matchOrders(timeStr);

      // 6. Recalculate price
      const supply = marketplace.orderbook.getTotalSupply();
      const demand = marketplace.orderbook.getTotalDemand();
      const price = marketplace.pricing.recalculate(supply, demand);

      // 7. Record price history
      priceHistory.push({ time: timeStr, price, simHour: hour });
      if (priceHistory.length > 500) priceHistory.splice(0, priceHistory.length - 500);

      // 8. Get balances for state
      const [solarBal, homeBal, batteryBal, solarSol, homeSol, batterySol] = await Promise.all([
        solarAgent.getTokenBalance(),
        homeAgent.getTokenBalance(),
        batteryAgent.getTokenBalance(),
        solarAgent.getSolBalance(),
        homeAgent.getSolBalance(),
        batteryAgent.getSolBalance(),
      ]);

      // 9. Build market state
      const state: MarketState = {
        currentPrice: price,
        priceHistory: [...priceHistory],
        agents: [
          solarAgent.getState(solarBal, solarSol),
          homeAgent.getState(homeBal, homeSol),
          batteryAgent.getState(batteryBal, batterySol),
        ],
        recentTrades: marketplace.getRecentTrades(),
        openOrders: marketplace.orderbook.getAllOpenOrders(),
        supplyDemand: { supply, demand },
        metrics: {
          totalMinted: solarAgent.totalMinted,
          totalBurned: homeAgent.totalBurned,
          totalTraded: marketplace.totalTraded,
          totalTransactions: marketplace.totalTransactions,
        },
        simulatedTime: timeStr,
        simulatedHour: hour,
        dayNumber: clock.getDayNumber(),
        tickCount: clock.getTickCount(),
        systemStatus: 'running',
      };

      // 10. Broadcast to dashboard
      broadcastState(state);

    } catch (err) {
      console.error('Tick error:', err);
    }
  };

  // Run tick loop
  setInterval(tickLoop, TICK_INTERVAL_MS);

  // Run first tick immediately
  await tickLoop();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
