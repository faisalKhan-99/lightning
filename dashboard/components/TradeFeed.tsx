'use client';

import { Trade } from '../lib/types';

interface Props {
  trades: Trade[];
}

export default function TradeFeed({ trades }: Props) {
  const reversed = [...trades].reverse();

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 h-full">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">TRADE FEED</h3>
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
        {reversed.length === 0 && (
          <p className="text-gray-600 text-xs italic">Waiting for trades...</p>
        )}
        {reversed.map((trade) => (
          <div
            key={trade.id}
            className="bg-gray-900/50 rounded px-3 py-2 text-xs border border-gray-700/50"
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-mono">{trade.simulatedTime}</span>
              <span className="text-gray-600 font-mono text-[10px]">{trade.id}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-red-400 font-semibold capitalize">{trade.sellerId}</span>
              <span className="text-gray-600">-&gt;</span>
              <span className="text-green-400 font-semibold capitalize">{trade.buyerId}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-white font-mono">{trade.amount.toFixed(2)} kWh</span>
              <span className="text-green-400 font-mono">@ {trade.pricePerUnit.toFixed(4)}</span>
            </div>
            <div className="mt-1">
              <a
                href={`https://explorer.solana.com/tx/${trade.txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-[10px] font-mono"
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
