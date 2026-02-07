'use client';

import { AgentState } from '../lib/types';

interface Props {
  agent: AgentState;
}

const agentColors: Record<string, { border: string; text: string; icon: string; badge: string; bar: string }> = {
  solar: {
    border: 'border-l-solar',
    text: 'text-solar',
    icon: 'SOL',
    badge: 'bg-solar/10 text-solar',
    bar: 'bg-solar',
  },
  home: {
    border: 'border-l-home',
    text: 'text-home',
    icon: 'HOME',
    badge: 'bg-home/10 text-home',
    bar: 'bg-home',
  },
  battery: {
    border: 'border-l-battery',
    text: 'text-battery',
    icon: 'BAT',
    badge: 'bg-battery/10 text-battery',
    bar: 'bg-battery',
  },
};

export default function AgentCard({ agent }: Props) {
  const color = agentColors[agent.type] || agentColors.solar;

  return (
    <div className={`card-cyber border-l-2 ${color.border} p-4 hover:border-stroke-muted transition-colors`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`${color.badge} font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded`}>
            {color.icon}
          </span>
          <h3 className={`font-semibold ${color.text}`}>{agent.name}</h3>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-txt-secondary">Energy Credits:</span>
          <span className="text-txt-primary font-mono">{agent.tokenBalance.toFixed(2)} kWh</span>
        </div>

        <div className="flex justify-between">
          <span className="text-txt-secondary">SOL Balance:</span>
          <span className="text-txt-primary font-mono">{agent.solBalance.toFixed(4)}</span>
        </div>

        {agent.production !== undefined && (
          <div className="flex justify-between">
            <span className="text-txt-secondary">Production:</span>
            <span className="text-positive font-mono">{agent.production.toFixed(2)} kWh</span>
          </div>
        )}

        {agent.consumption !== undefined && (
          <div className="flex justify-between">
            <span className="text-txt-secondary">Consumption:</span>
            <span className="text-negative font-mono">{agent.consumption.toFixed(2)} kWh</span>
          </div>
        )}

        {agent.storageLevel !== undefined && agent.storageCapacity !== undefined && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-txt-secondary">Storage:</span>
              <span className="text-txt-primary font-mono">
                {agent.storageLevel.toFixed(1)} / {agent.storageCapacity} kWh
              </span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-1.5">
              <div
                className={`${color.bar} h-1.5 rounded-full transition-all`}
                style={{ width: `${(agent.storageLevel / agent.storageCapacity) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-txt-secondary">Wallet:</span>
          <span className="text-txt-tertiary font-mono text-[10px]">
            {agent.walletAddress.slice(0, 8)}...{agent.walletAddress.slice(-4)}
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-stroke-subtle">
          <p className="text-txt-tertiary text-[10px] italic">{agent.strategy}</p>
        </div>

        <div className="mt-1">
          <p className={`text-[11px] ${color.text}`}>{agent.activity}</p>
        </div>

        {agent.reasoning && (
          <div className="mt-1 border-l border-sky-500/30 pl-2">
            <p className="text-[10px] text-txt-secondary italic">
              <span className="text-txt-accent font-medium">AI:</span> {agent.reasoning}
            </p>
          </div>
        )}

        {agent.memory && (
          <div className="mt-2 pt-2 border-t border-stroke-subtle">
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-surface-2 rounded-lg p-2">
                <span className="text-txt-tertiary">Profit:</span>
                <span className={`ml-1 font-mono ${agent.memory.totalProfit >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {agent.memory.totalProfit >= 0 ? '+' : ''}{agent.memory.totalProfit.toFixed(4)}
                </span>
              </div>
              <div className="bg-surface-2 rounded-lg p-2">
                <span className="text-txt-tertiary">Win:</span>
                <span className="ml-1 font-mono text-txt-primary">
                  {agent.memory.tradesWon + agent.memory.tradesLost > 0
                    ? ((agent.memory.tradesWon / (agent.memory.tradesWon + agent.memory.tradesLost)) * 100).toFixed(0)
                    : 50}%
                </span>
              </div>
              <div className="bg-surface-2 rounded-lg p-2">
                <span className="text-txt-tertiary">Risk:</span>
                <span className="ml-1 font-mono text-txt-primary">
                  {(agent.memory.riskLevel * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
