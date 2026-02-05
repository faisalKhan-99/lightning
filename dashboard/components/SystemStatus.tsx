'use client';

import { MarketState } from '../lib/types';

interface Props {
  state: MarketState;
}

export default function SystemStatus({ state }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-gray-900 border-t border-gray-700 text-xs">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Minted:</span>
          <span className="text-green-400 font-mono">{state.metrics.totalMinted.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Burned:</span>
          <span className="text-red-400 font-mono">{state.metrics.totalBurned.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Traded:</span>
          <span className="text-blue-400 font-mono">{state.metrics.totalTraded.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Txns:</span>
          <span className="text-purple-400 font-mono">{state.metrics.totalTransactions}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-600">Solana Devnet</span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-600">SPL Token Market</span>
      </div>
    </div>
  );
}
