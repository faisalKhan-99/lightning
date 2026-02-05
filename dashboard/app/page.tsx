'use client';

import { useWebSocket } from '../hooks/useWebSocket';
import MetricsBar from '../components/MetricsBar';
import PriceChart from '../components/PriceChart';
import AgentCard from '../components/AgentCard';
import TradeFeed from '../components/TradeFeed';
import SupplyDemand from '../components/SupplyDemand';
import EnergyFlow from '../components/EnergyFlow';
import SystemStatus from '../components/SystemStatus';

export default function Home() {
  const { state, connected } = useWebSocket();

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">SolGrid</h1>
          <p className="text-gray-400 mb-2">Connecting to engine...</p>
          <p className="text-gray-600 text-sm">
            Make sure the engine is running on ws://localhost:8080
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-yellow-400 text-xs">Waiting for connection</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Top metrics bar */}
      <MetricsBar state={state} connected={connected} />

      {/* Main content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        {/* Left column: Agent cards */}
        <div className="col-span-3 space-y-4">
          {state.agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Middle column: Charts */}
        <div className="col-span-5 space-y-4">
          <PriceChart priceHistory={state.priceHistory} />
          <SupplyDemand
            supply={state.supplyDemand.supply}
            demand={state.supplyDemand.demand}
          />
          <EnergyFlow agents={state.agents} recentTrades={state.recentTrades} />
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
