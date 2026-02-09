'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { MarketState } from '../lib/types';

interface Props {
  state: MarketState;
  connected: boolean;
  joined?: boolean;
  onLeave?: () => void;
}

export default function MetricsBar({ state, connected, joined, onLeave }: Props) {
  const isDaytime = state.simulatedHour >= 6 && state.simulatedHour <= 18;

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-surface-1/80 backdrop-blur-md border-b border-stroke-subtle">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xl font-bold text-solar border-l-2 border-solar pl-2">
          SolGrid
        </span>
        <span className="label-mono ml-1">Autonomous Energy Market</span>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-txt-tertiary">{isDaytime ? 'DAY' : 'NIGHT'}</span>
          <span className="bg-surface-2 px-2 py-0.5 rounded text-txt-primary font-mono text-xs">
            {state.simulatedTime}
          </span>
          <span className="text-txt-tertiary text-xs">Day {state.dayNumber}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-txt-secondary text-xs">Price:</span>
          <span className="text-positive font-mono font-bold">
            {state.currentPrice.toFixed(4)} SOL/kWh
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-txt-secondary text-xs">Tick:</span>
          <span className="bg-surface-2 px-2 py-0.5 rounded text-txt-primary font-mono text-xs">
            {state.tickCount}
          </span>
        </div>

        {joined && onLeave && (
          <button
            onClick={onLeave}
            className="px-3 py-1 rounded-md border border-negative/40 bg-negative/10 text-negative text-xs font-mono uppercase tracking-wider hover:bg-negative/20 transition-colors"
          >
            Leave Grid
          </button>
        )}

        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ring-1 ${
              connected
                ? 'bg-positive ring-positive/50 animate-pulse'
                : 'bg-negative ring-negative/50'
            }`}
          />
          <span className={`text-xs ${connected ? 'text-positive' : 'text-negative'}`}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>

        <WalletMultiButton className="!bg-solar/20 !border !border-solar/40 !rounded-md !text-xs !font-mono !h-8 hover:!bg-solar/30 !transition-colors" />
      </div>
    </div>
  );
}
