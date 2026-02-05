'use client';

import { MarketState } from '../lib/types';

interface Props {
  state: MarketState;
  connected: boolean;
}

export default function MetricsBar({ state, connected }: Props) {
  const isDaytime = state.simulatedHour >= 6 && state.simulatedHour <= 18;

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-700">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-yellow-400">SolGrid</span>
        <span className="text-xs text-gray-500 ml-1">Autonomous Energy Market</span>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{isDaytime ? 'DAY' : 'NIGHT'}</span>
          <span className="text-white font-mono">{state.simulatedTime}</span>
          <span className="text-gray-500">Day {state.dayNumber}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-400">Price:</span>
          <span className="text-green-400 font-mono font-bold">
            {state.currentPrice.toFixed(4)} SOL/kWh
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-gray-400">Tick:</span>
          <span className="text-gray-300 font-mono">{state.tickCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
          />
          <span className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
}
