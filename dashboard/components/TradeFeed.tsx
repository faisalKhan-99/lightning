'use client';

import { Trade } from '../lib/types';

interface Props {
  trades: Trade[];
}

const agentTextColor: Record<string, string> = {
  solar: 'text-solar',
  home: 'text-home',
  battery: 'text-battery',
};

export default function TradeFeed({ trades }: Props) {
  const reversed = [...trades].reverse();

  return (
    <div className="card-cyber p-4 h-full">
      <h3 className="label-mono mb-3">Trade Feed</h3>
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
        {reversed.length === 0 && (
          <p className="text-txt-tertiary text-xs italic">Waiting for trades...</p>
        )}
        {reversed.map((trade) => (
          <div
            key={trade.id}
            className="bg-surface-2/50 rounded-lg px-3 py-2 text-xs border border-stroke-subtle/50 animate-fade-in"
          >
            <div className="flex justify-between items-center">
              <span className="text-txt-tertiary font-mono">{trade.simulatedTime}</span>
              <span className="text-txt-tertiary font-mono text-[10px]">{trade.id}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className={`${agentTextColor[trade.sellerId] || 'text-txt-secondary'} font-semibold capitalize`}>
                {trade.sellerId}
              </span>
              <span className="text-stroke-accent">→</span>
              <span className={`${agentTextColor[trade.buyerId] || 'text-txt-secondary'} font-semibold capitalize`}>
                {trade.buyerId}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-txt-primary font-mono">{trade.amount.toFixed(2)} kWh</span>
              <span className="text-positive font-mono">@ {trade.pricePerUnit.toFixed(4)}</span>
            </div>
            <div className="mt-1">
              <a
                href={`https://explorer.solana.com/tx/${trade.txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-txt-accent hover:text-sky-300 text-[10px] font-mono transition-colors"
              >
                tx: {trade.txSignature.slice(0, 20)}...
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
