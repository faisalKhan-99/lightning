'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface Props {
  onJoin: (phantomWallet: string, role: 'solar' | 'home' | 'battery') => void;
  joining: boolean;
  joinError: string | null;
}

const roles = [
  {
    role: 'solar' as const,
    label: 'Solar Panel',
    icon: 'SOL',
    color: 'solar',
    desc: 'Produce energy during daylight and sell to the grid',
    border: 'border-solar',
    bg: 'bg-solar/10',
    text: 'text-solar',
    hover: 'hover:border-solar hover:shadow-glow-solar',
  },
  {
    role: 'home' as const,
    label: 'Smart Home',
    icon: 'HOME',
    color: 'home',
    desc: 'Consume energy throughout the day, buy when low',
    border: 'border-home',
    bg: 'bg-home/10',
    text: 'text-home',
    hover: 'hover:border-home hover:shadow-glow-home',
  },
  {
    role: 'battery' as const,
    label: 'Battery Storage',
    icon: 'BAT',
    color: 'battery',
    desc: 'Buy low, sell high - arbitrage the energy market',
    border: 'border-battery',
    bg: 'bg-battery/10',
    text: 'text-battery',
    hover: 'hover:border-battery hover:shadow-glow-battery',
  },
];

export default function JoinGrid({ onJoin, joining, joinError }: Props) {
  const { publicKey, connected } = useWallet();
  const [selectedRole, setSelectedRole] = useState<'solar' | 'home' | 'battery' | null>(null);

  const handleJoin = () => {
    if (!publicKey || !selectedRole) return;
    onJoin(publicKey.toBase58(), selectedRole);
  };

  return (
    <div className="card-cyber p-5">
      <h3 className="label-mono mb-4">Join the Grid</h3>

      {/* Wallet connect */}
      <div className="mb-4">
        <WalletMultiButton />
      </div>

      {!connected && (
        <p className="text-txt-tertiary text-xs">Connect your Phantom wallet to join the simulation</p>
      )}

      {connected && publicKey && (
        <>
          <p className="text-txt-secondary text-xs mb-3">
            Connected: <span className="font-mono text-txt-primary">{publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-4)}</span>
          </p>

          {/* Role selection */}
          <div className="space-y-2 mb-4">
            {roles.map((r) => (
              <button
                key={r.role}
                onClick={() => setSelectedRole(r.role)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedRole === r.role
                    ? `${r.border} ${r.bg}`
                    : `border-stroke-subtle ${r.hover}`
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`${r.bg} ${r.text} font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded`}>
                    {r.icon}
                  </span>
                  <span className={`font-semibold text-sm ${selectedRole === r.role ? r.text : 'text-txt-primary'}`}>
                    {r.label}
                  </span>
                </div>
                <p className="text-txt-tertiary text-[11px] ml-1">{r.desc}</p>
              </button>
            ))}
          </div>

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={!selectedRole || joining}
            className={`w-full py-2.5 rounded-lg font-mono text-sm font-bold uppercase tracking-wider transition-all ${
              selectedRole && !joining
                ? 'bg-positive/20 text-positive border border-positive/40 hover:bg-positive/30'
                : 'bg-surface-2 text-txt-tertiary border border-stroke-subtle cursor-not-allowed'
            }`}
          >
            {joining ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-positive border-t-transparent animate-spin" />
                Joining Grid...
              </span>
            ) : (
              'Join Grid'
            )}
          </button>

          {joinError && (
            <p className="text-negative text-xs mt-2">{joinError}</p>
          )}
        </>
      )}
    </div>
  );
}
