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
  const { state, connected, send, joined, agentId, joinError, joining, setJoining } = useWebSocket();
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

  if (!state) {
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

  return (
    <div className="min-h-screen flex flex-col bg-surface-0 bg-grid-overlay">
      {/* Top metrics bar */}
      <MetricsBar state={state} connected={connected} joined={joined} onLeave={handleLeave} />

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
