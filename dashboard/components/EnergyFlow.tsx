'use client';

import { AgentState, Trade } from '../lib/types';

interface Props {
  agents: AgentState[];
  recentTrades: Trade[];
}

export default function EnergyFlow({ agents, recentTrades }: Props) {
  const solar = agents.find((a) => a.type === 'solar');
  const home = agents.find((a) => a.type === 'home');
  const battery = agents.find((a) => a.type === 'battery');

  // Determine recent flow directions from last 5 trades
  const last5 = recentTrades.slice(-5);
  const flows = {
    solarToHome: last5.some((t) => t.sellerId === 'solar' && t.buyerId === 'home'),
    solarToBattery: last5.some((t) => t.sellerId === 'solar' && t.buyerId === 'battery'),
    batteryToHome: last5.some((t) => t.sellerId === 'battery' && t.buyerId === 'home'),
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">ENERGY FLOW</h3>
      <div className="flex items-center justify-between px-4 py-6">
        {/* Solar node */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-yellow-900/50 border-2 border-yellow-500 flex items-center justify-center">
            <span className="text-yellow-400 text-xs font-bold">SOL</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-1">
            {solar?.production?.toFixed(1) || '0'} kWh
          </span>
        </div>

        {/* Arrow: Solar -> Home */}
        <div className="flex flex-col items-center flex-1 mx-2">
          <div
            className={`h-0.5 w-full ${flows.solarToHome ? 'bg-green-400' : 'bg-gray-700'} transition-colors relative`}
          >
            {flows.solarToHome && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-green-400 border-y-4 border-y-transparent" />
            )}
          </div>
          <span className="text-[9px] text-gray-600 mt-1">
            {flows.solarToHome ? 'active' : 'idle'}
          </span>
        </div>

        {/* Home node */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-blue-900/50 border-2 border-blue-500 flex items-center justify-center">
            <span className="text-blue-400 text-xs font-bold">HOME</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-1">
            {home?.consumption?.toFixed(1) || '0'} kWh
          </span>
        </div>
      </div>

      {/* Battery in the middle below */}
      <div className="flex flex-col items-center -mt-2">
        <div className="flex items-center gap-8">
          <div
            className={`w-12 h-0.5 ${flows.solarToBattery ? 'bg-yellow-400' : 'bg-gray-700'} transition-colors`}
          />
          <div className="w-14 h-14 rounded-full bg-purple-900/50 border-2 border-purple-500 flex items-center justify-center">
            <span className="text-purple-400 text-xs font-bold">BAT</span>
          </div>
          <div
            className={`w-12 h-0.5 ${flows.batteryToHome ? 'bg-purple-400' : 'bg-gray-700'} transition-colors`}
          />
        </div>
        <span className="text-[10px] text-gray-400 mt-1">
          {battery?.storageLevel?.toFixed(1) || '0'}/{battery?.storageCapacity || 50} kWh
        </span>
      </div>
    </div>
  );
}
