import { initializeSystem } from './chain/setup.js';
import { SimulatedClock } from './simulation/clock.js';
import { Marketplace } from './market/marketplace.js';
import { SolarAgent } from './agents/solar.js';
import { HomeAgent } from './agents/home.js';
import { BatteryAgent } from './agents/battery.js';
import { UserManager } from './agents/userManager.js';
import { initServer, broadcastState } from './server.js';
import { MarketState } from './market/types.js';
import { TICK_INTERVAL_MS, LLM_ENABLED, LLM_CALL_INTERVAL, ADAPTIVE_UPDATE_INTERVAL } from './config.js';
import { Trade } from './market/types.js';
import { getAgentDecisions, AgentDecision } from './agents/llm.js';
import { logger } from './utils/index.js';

async function main() {
  logger.info('SYSTEM', '=== SolGrid: Autonomous Energy Market ===');
  logger.info('SYSTEM', `Log file: ${logger.getLogFilePath()}`);

  // Initialize Solana system
  const system = await initializeSystem();

  // Create marketplace
  const marketplace = new Marketplace();

  // Create user manager
  const userManager = new UserManager(system.mintAuthority, system.mint);

  // Start WebSocket server (bidirectional)
  initServer(userManager, marketplace);

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

  // Connect trade callback for memory tracking
  marketplace.onTradeExecuted = (trade: Trade) => {
    const marketPrice = marketplace.pricing.getPrice();

    if (trade.sellerId === solarAgent.id) {
      solarAgent.recordTrade('sell', trade.amount, trade.pricePerUnit, marketPrice);
    }
    if (trade.buyerId === homeAgent.id) {
      homeAgent.recordTrade('buy', trade.amount, trade.pricePerUnit, marketPrice);
    }
    if (trade.sellerId === batteryAgent.id) {
      batteryAgent.recordTrade('sell', trade.amount, trade.pricePerUnit, marketPrice);
    }
    if (trade.buyerId === batteryAgent.id) {
      batteryAgent.recordTrade('buy', trade.amount, trade.pricePerUnit, marketPrice);
    }

    // Track trades for user agents
    for (const userAgent of userManager.getAllUsers()) {
      if (trade.sellerId === userAgent.id) {
        userAgent.recordTrade('sell', trade.amount, trade.pricePerUnit, marketPrice);
      }
      if (trade.buyerId === userAgent.id) {
        userAgent.recordTrade('buy', trade.amount, trade.pricePerUnit, marketPrice);
      }
    }
  };

  // Create simulated clock
  const clock = new SimulatedClock();

  // Price history for chart
  const priceHistory: { time: string; price: number; simHour: number }[] = [];

  console.log('\nStarting simulation loop...\n');

  // Tick loop
  const tickLoop = async () => {
    const tickStart = Date.now();

    try {
      // 1. Advance clock
      clock.tick();
      const hour = clock.getHour();
      const timeStr = clock.getFormattedTime();

      logger.tick(clock.getTickCount(), timeStr, clock.getDayNumber());

      // Clear stale orders from previous tick
      marketplace.clearOrders();

      // Get balances for LLM context
      const homeBalance = await homeAgent.getTokenBalance();
      const batteryBalance = await batteryAgent.getTokenBalance();

      // Get user agents early so LLM can see them
      const userAgents = userManager.getAllUsers();
      const userSummary = userAgents.length > 0
        ? userAgents.map(u => `${u.role} (demand: ${u.lastConsumption.toFixed(1)} kWh)`).join(', ')
        : undefined;

      // LLM decisions - smart triggering with caching and backoff
      let solarDecision: AgentDecision | null = null;
      let homeDecision: AgentDecision | null = null;
      let batteryDecision: AgentDecision | null = null;

      if (LLM_ENABLED) {
        const llmStart = Date.now();

        const decisions = await getAgentDecisions(
          marketplace,
          clock,
          priceHistory,
          solarAgent,
          homeAgent,
          batteryAgent,
          homeBalance,
          batteryBalance,
          LLM_CALL_INTERVAL,
          userSummary
        );

        solarDecision = decisions.solar;
        homeDecision = decisions.home;
        batteryDecision = decisions.battery;

        if (decisions.triggered) {
          logger.performance('LLM decisions', Date.now() - llmStart, {
            reason: decisions.reason,
            solar: solarDecision?.action ?? 'fallback',
            home: homeDecision?.action ?? 'fallback',
            battery: batteryDecision?.action ?? 'fallback',
          });
        }
      }

      // 2. Solar agent: produce + sell
      await solarAgent.tick(hour, marketplace, solarDecision ?? undefined);

      // 3. Home agent: consume + buy
      await homeAgent.tick(hour, marketplace, homeBalance, homeDecision ?? undefined);

      // 4. Battery agent: evaluate + trade
      await batteryAgent.tick(marketplace, batteryBalance, batteryDecision ?? undefined);

      // 4.5 Tick user agents
      for (const userAgent of userAgents) {
        try {
          const userBalance = await userAgent.getTokenBalance();
          await userAgent.tick(hour, marketplace, userBalance);
        } catch (err) {
          logger.error('USER_TICK', `User agent ${userAgent.id} tick error: ${err}`);
        }
      }

      // 4.6 Update adaptive parameters every ADAPTIVE_UPDATE_INTERVAL ticks
      if (clock.getTickCount() % ADAPTIVE_UPDATE_INTERVAL === 0) {
        solarAgent.updateAdaptiveParams();
        homeAgent.updateAdaptiveParams();
        batteryAgent.updateAdaptiveParams();

        logger.info('ADAPT', 'Updated adaptive parameters', {
          solar: { risk: solarAgent.memory.riskLevel.toFixed(2), profit: solarAgent.memory.totalProfit.toFixed(4) },
          home: { risk: homeAgent.memory.riskLevel.toFixed(2), profit: homeAgent.memory.totalProfit.toFixed(4) },
          battery: { risk: batteryAgent.memory.riskLevel.toFixed(2), profit: batteryAgent.memory.totalProfit.toFixed(4) },
        });
      }

      // 5. Capture supply/demand BEFORE matching (for price discovery)
      const supplyBeforeMatch = marketplace.orderbook.getTotalSupply();
      const demandBeforeMatch = marketplace.orderbook.getTotalDemand();

      // 6. Match orders + execute on-chain
      await marketplace.matchOrders(timeStr);

      // 7. Recalculate price based on pre-match supply/demand
      const price = marketplace.pricing.recalculate(supplyBeforeMatch, demandBeforeMatch);

      // Track remaining unfilled orders
      const supplyAfterMatch = marketplace.orderbook.getTotalSupply();
      const demandAfterMatch = marketplace.orderbook.getTotalDemand();

      // 8. Record price history
      priceHistory.push({ time: timeStr, price, simHour: hour });
      if (priceHistory.length > 500) priceHistory.splice(0, priceHistory.length - 500);

      // 9. Get balances for state
      const [solarBal, homeBal, batteryBal, solarSol, homeSol, batterySol] = await Promise.all([
        solarAgent.getTokenBalance(),
        homeAgent.getTokenBalance(),
        batteryAgent.getTokenBalance(),
        solarAgent.getSolBalance(),
        homeAgent.getSolBalance(),
        batteryAgent.getSolBalance(),
      ]);

      // Build agent states (AI agents first)
      const agentStates = [
        solarAgent.getState(solarBal, solarSol),
        homeAgent.getState(homeBal, homeSol),
        batteryAgent.getState(batteryBal, batterySol),
      ];

      // Append user agent states
      for (const userAgent of userAgents) {
        try {
          const [uBal, uSol] = await Promise.all([
            userAgent.getTokenBalance(),
            userAgent.getSolBalance(),
          ]);
          agentStates.push(userAgent.getState(uBal, uSol));
        } catch (err) {
          logger.error('USER_STATE', `Failed to get state for ${userAgent.id}: ${err}`);
        }
      }

      // 10. Build market state
      const state: MarketState = {
        currentPrice: price,
        priceHistory: [...priceHistory],
        agents: agentStates,
        recentTrades: marketplace.getRecentTrades(),
        openOrders: marketplace.orderbook.getAllOpenOrders(),
        supplyDemand: { supply: supplyBeforeMatch, demand: demandBeforeMatch },
        metrics: {
          totalMinted: solarAgent.totalMinted + userAgents.reduce((sum, u) => sum + u.totalMinted, 0),
          totalBurned: homeAgent.totalBurned + userAgents.reduce((sum, u) => sum + u.totalBurned, 0),
          totalTraded: marketplace.totalTraded,
          totalTransactions: marketplace.totalTransactions,
        },
        simulatedTime: timeStr,
        simulatedHour: hour,
        dayNumber: clock.getDayNumber(),
        tickCount: clock.getTickCount(),
        systemStatus: 'running',
      };

      // 11. Broadcast to dashboard
      broadcastState(state);

      // Log tick completion and performance
      logger.marketState(clock.getTickCount(), price, supplyBeforeMatch, demandBeforeMatch);
      logger.debug('MARKET', `Post-match remaining`, {
        unfilledSupply: supplyAfterMatch,
        unfilledDemand: demandAfterMatch,
      });
      logger.performance('Tick total', Date.now() - tickStart, {
        tick: clock.getTickCount(),
        trades: marketplace.getRecentTrades().length,
        userAgents: userAgents.length,
      });

    } catch (err) {
      logger.error('TICK', `Tick error: ${err}`);
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
