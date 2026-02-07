'use client';

import { MarketState } from '../lib/types';

interface Props {
  state: MarketState;
}

export default function SystemStatus({ state }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-surface-1/60 backdrop-blur-md border-t border-stroke-subtle text-xs">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="label-mono">Minted:</span>
          <span className="text-positive font-mono">{state.metrics.totalMinted.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="label-mono">Burned:</span>
          <span className="text-negative font-mono">{state.metrics.totalBurned.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="label-mono">Traded:</span>
          <span className="text-home font-mono">{state.metrics.totalTraded.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="label-mono">Txns:</span>
          <span className="text-battery font-mono">{state.metrics.totalTransactions}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-txt-tertiary">Solana Devnet</span>
        <span className="text-stroke-accent">|</span>
        <span className="text-txt-tertiary">SPL Token Market</span>
      </div>
    </div>
  );
}
