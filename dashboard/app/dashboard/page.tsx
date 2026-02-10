'use client';

import { useWebSocket } from '../../hooks/useWebSocket';
import { useWallet } from '@solana/wallet-adapter-react';
import MetricsBar from '../../components/MetricsBar';
import DayCycle from '../../components/DayCycle';
import PriceChart from '../../components/PriceChart';
import AgentCard from '../../components/AgentCard';
import TradeFeed from '../../components/TradeFeed';
import SupplyDemand from '../../components/SupplyDemand';
import EnergyFlow from '../../components/EnergyFlow';
import SystemStatus from '../../components/SystemStatus';
import JoinGrid from '../../components/JoinGrid';

export default function Dashboard() {
  const {
    state,
    connected,
    send,
    joined,
    agentId,
    joinError,
    joining,
    setJoining,
    simStatus,
    simTotalTicks,
    startSim,
    restartSim,
  } = useWebSocket();
  const { publicKey } = useWallet();

  const handleJoin = (phantomWallet: string, role: 'solar' | 'home' | 'battery') => {
    console.log('[JOIN] handleJoin called:', { phantomWallet: phantomWallet.slice(0, 8) + '...', role });
    setJoining(true);
    send({ type: 'join', phantomWallet, role });
  };

  const handleLeave = () => {
    if (publicKey) {
      send({ type: 'leave', phantomWallet: publicKey.toBase58() });
    }
  };

  // Not connected to engine at all
  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0 bg-grid-overlay">
        <div className="card-cyber p-8 text-center max-w-sm">
          <div className="flex justify-center mb-5">
            <div className="w-12 h-12 rounded-full border-2 border-solar border-t-transparent animate-spin" />
          </div>
          <h1 className="font-mono text-2xl font-bold text-solar mb-3">SolGrid</h1>
          <p className="text-txt-secondary mb-2 text-sm">Connecting to engine...</p>
          <p className="text-txt-tertiary text-xs">
            Make sure the engine is running on ws://localhost:8080
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-solar animate-pulse-slow ring-1 ring-solar/50" />
            <span className="text-solar text-xs font-mono">Waiting for connection</span>
          </div>
        </div>
      </div>
    );
  }

  // Connected but simulation is idle — show start button
  if (simStatus === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0 bg-grid-overlay">
        <div className="card-cyber p-10 text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-solar/20 border-2 border-solar flex items-center justify-center">
              <svg className="w-8 h-8 text-solar" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="font-mono text-3xl font-bold text-solar mb-3">SolGrid</h1>
          <p className="text-txt-secondary mb-2 text-sm">Autonomous Energy Trading Simulation</p>
          <p className="text-txt-tertiary text-xs mb-8">
            AI agents trade energy tokens on Solana devnet over 2 simulated days (48 ticks, ~4 minutes)
          </p>
          <button
            onClick={startSim}
            className="px-8 py-3 rounded-lg bg-solar text-surface-0 font-mono font-bold text-lg uppercase tracking-wider hover:bg-solar/90 transition-colors shadow-lg shadow-solar/20"
          >
            Start Simulation
          </button>
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-positive ring-1 ring-positive/50 animate-pulse" />
            <span className="text-positive text-xs font-mono">Engine connected</span>
          </div>
        </div>
      </div>
    );
  }

  // Simulation completed — show overlay with stats
  if (simStatus === 'completed') {
    return (
      <div className="min-h-screen flex flex-col bg-surface-0 bg-grid-overlay">
        {state && (
          <>
            <MetricsBar
              state={state}
              connected={connected}
              joined={joined}
              onLeave={handleLeave}
              simTotalTicks={simTotalTicks}
            />
            <div className="px-4 pt-4">
              <DayCycle hour={state.simulatedHour} />
            </div>
          </>
        )}

        {/* Completion overlay */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Background: faded dashboard content */}
          {state && (
            <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden p-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3 space-y-4">
                  {state.agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} isCurrentUser={agent.id === agentId} />
                  ))}
                </div>
                <div className="col-span-5 space-y-4">
                  <PriceChart priceHistory={state.priceHistory} />
                </div>
                <div className="col-span-4">
                  <TradeFeed trades={state.recentTrades} />
                </div>
              </div>
            </div>
          )}

          {/* Stats overlay */}
          <div className="card-cyber p-10 text-center max-w-lg z-10">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-positive/20 border-2 border-positive flex items-center justify-center">
                <svg className="w-7 h-7 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="font-mono text-2xl font-bold text-txt-primary mb-2">Simulation Complete</h2>
            <p className="text-txt-tertiary text-xs mb-6">2 simulated days of autonomous energy trading</p>

            {state && (
              <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                <div className="bg-surface-2/60 rounded-lg p-3">
                  <p className="text-txt-tertiary text-xs mb-1">Total Traded</p>
                  <p className="text-txt-primary font-mono font-bold">{state.metrics.totalTraded.toFixed(2)} kWh</p>
                </div>
                <div className="bg-surface-2/60 rounded-lg p-3">
                  <p className="text-txt-tertiary text-xs mb-1">Transactions</p>
                  <p className="text-txt-primary font-mono font-bold">{state.metrics.totalTransactions}</p>
                </div>
                <div className="bg-surface-2/60 rounded-lg p-3">
                  <p className="text-txt-tertiary text-xs mb-1">Total Minted</p>
                  <p className="text-positive font-mono font-bold">{state.metrics.totalMinted.toFixed(2)} kWh</p>
                </div>
                <div className="bg-surface-2/60 rounded-lg p-3">
                  <p className="text-txt-tertiary text-xs mb-1">Total Burned</p>
                  <p className="text-negative font-mono font-bold">{state.metrics.totalBurned.toFixed(2)} kWh</p>
                </div>
                <div className="bg-surface-2/60 rounded-lg p-3">
                  <p className="text-txt-tertiary text-xs mb-1">Final Price</p>
                  <p className="text-solar font-mono font-bold">{state.currentPrice.toFixed(4)} SOL/kWh</p>
                </div>
                <div className="bg-surface-2/60 rounded-lg p-3">
                  <p className="text-txt-tertiary text-xs mb-1">Ticks Run</p>
                  <p className="text-txt-primary font-mono font-bold">{state.tickCount}/{simTotalTicks}</p>
                </div>
              </div>
            )}

            <button
              onClick={restartSim}
              className="px-8 py-3 rounded-lg bg-solar text-surface-0 font-mono font-bold text-lg uppercase tracking-wider hover:bg-solar/90 transition-colors shadow-lg shadow-solar/20"
            >
              Restart Simulation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Simulation running — show normal dashboard
  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0 bg-grid-overlay">
        <div className="card-cyber p-8 text-center max-w-sm">
          <div className="flex justify-center mb-5">
            <div className="w-12 h-12 rounded-full border-2 border-solar border-t-transparent animate-spin" />
          </div>
          <h1 className="font-mono text-2xl font-bold text-solar mb-3">SolGrid</h1>
          <p className="text-txt-secondary mb-2 text-sm">Simulation starting...</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-positive ring-1 ring-positive/50 animate-pulse" />
            <span className="text-positive text-xs font-mono">Waiting for first tick</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-0 bg-grid-overlay">
      {/* Top metrics bar */}
      <MetricsBar
        state={state}
        connected={connected}
        joined={joined}
        onLeave={handleLeave}
        simTotalTicks={simTotalTicks}
      />

      {/* Day/Night cycle indicator */}
      <div className="px-4 pt-4">
        <DayCycle hour={state.simulatedHour} />
      </div>

      {/* Main content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        {/* Left column: Agent cards + Join Grid */}
        <div className="col-span-3 space-y-4">
          {!joined && (
            <JoinGrid onJoin={handleJoin} joining={joining} joinError={joinError} />
          )}
          {state.agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isCurrentUser={agent.id === agentId}
            />
          ))}
        </div>

        {/* Middle column: Charts */}
        <div className="col-span-5 space-y-4">
          <PriceChart priceHistory={state.priceHistory} />
          <SupplyDemand
            supply={state.supplyDemand.supply}
            demand={state.supplyDemand.demand}
          />
          <EnergyFlow agents={state.agents} recentTrades={state.recentTrades} simulatedHour={state.simulatedHour} />
        </div>

        {/* Right column: Trade feed */}
        <div className="col-span-4">
          <TradeFeed trades={state.recentTrades} />
        </div>
      </div>

      {/* Bottom status bar */}
      <SystemStatus state={state} />
    </div>
  );
}
