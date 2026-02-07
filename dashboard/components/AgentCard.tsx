'use client';

import { AgentState } from '../lib/types';

interface Props {
  agent: AgentState;
}

const agentColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  solar: { bg: 'bg-yellow-900/30', border: 'border-yellow-600/50', text: 'text-yellow-400', icon: 'SOL' },
  home: { bg: 'bg-blue-900/30', border: 'border-blue-600/50', text: 'text-blue-400', icon: 'HOME' },
  battery: { bg: 'bg-purple-900/30', border: 'border-purple-600/50', text: 'text-purple-400', icon: 'BAT' },
};

export default function AgentCard({ agent }: Props) {
  const color = agentColors[agent.type] || agentColors.solar;

  return (
    <div className={`${color.bg} rounded-lg p-4 border ${color.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${color.text} px-2 py-0.5 rounded bg-gray-900/50`}>
            {color.icon}
          </span>
          <h3 className={`font-semibold ${color.text}`}>{agent.name}</h3>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Energy Credits:</span>
          <span className="text-white font-mono">{agent.tokenBalance.toFixed(2)} kWh</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">SOL Balance:</span>
          <span className="text-white font-mono">{agent.solBalance.toFixed(4)}</span>
        </div>

        {agent.production !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-400">Production:</span>
            <span className="text-green-400 font-mono">{agent.production.toFixed(2)} kWh</span>
          </div>
        )}

        {agent.consumption !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-400">Consumption:</span>
            <span className="text-red-400 font-mono">{agent.consumption.toFixed(2)} kWh</span>
          </div>
        )}

        {agent.storageLevel !== undefined && agent.storageCapacity !== undefined && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Storage:</span>
              <span className="text-white font-mono">
                {agent.storageLevel.toFixed(1)} / {agent.storageCapacity} kWh
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(agent.storageLevel / agent.storageCapacity) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-400">Wallet:</span>
          <span className="text-gray-500 font-mono text-[10px]">
            {agent.walletAddress.slice(0, 8)}...{agent.walletAddress.slice(-4)}
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-700">
          <p className="text-gray-500 text-[10px] italic">{agent.strategy}</p>
        </div>

        <div className="mt-1">
          <p className={`text-[11px] ${color.text}`}>{agent.activity}</p>
        </div>

        {agent.reasoning && (
          <div className="mt-1">
            <p className="text-[10px] text-gray-400 italic">
              <span className="text-cyan-500 font-medium">AI:</span> {agent.reasoning}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
