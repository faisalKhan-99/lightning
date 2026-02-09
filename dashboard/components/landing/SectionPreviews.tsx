'use client';

import SectionPreview from './SectionPreview';

const sections = [
  {
    id: 'agents',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e2b340" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1" />
      </svg>
    ),
    title: 'Autonomous Agents',
    description:
      'Three AI agents — a solar producer, a smart home, and a battery trader — each pursue their own strategy in the energy market. No human tells them what to do.',
    bullets: [
      'Solar produces during daylight following a realistic bell curve with weather noise',
      'Smart home consumes with breakfast and dinner peak patterns',
      'Battery arbitrages price differences between cheap midday and expensive evening energy',
    ],
    href: '/agents',
    accentColor: '#e2b340',
  },
  {
    id: 'marketplace',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <line x1="2" y1="9" x2="22" y2="9" />
        <polyline points="7 14 10 11 13 14 17 10" />
        <line x1="17" y1="10" x2="17" y2="13" />
        <line x1="17" y1="10" x2="14" y2="10" />
      </svg>
    ),
    title: 'Energy Marketplace',
    description:
      'A real order book with price-time priority matching. Prices emerge naturally from competition — no central authority sets them.',
    bullets: [
      'Continuous order book with price-time priority matching',
      'Dynamic reference pricing responds to real-time supply/demand imbalance',
      'Price bounds (0.02–0.50 SOL/kWh) prevent extreme swings',
    ],
    href: '/marketplace',
    accentColor: '#34d399',
  },
  {
    id: 'simulation',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5b9cf5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    title: 'Energy Simulation',
    description:
      'A realistic day/night cycle drives supply and demand. Solar peaks at noon while homes peak at dinner — this natural mismatch creates the market.',
    bullets: [
      '720x time compression: 5 real seconds = 1 simulated hour',
      'Solar follows a bell curve, home demand follows residential patterns',
      'Random weather noise (±15%) keeps every simulation run unique',
    ],
    href: '/simulation',
    accentColor: '#5b9cf5',
  },
  {
    id: 'blockchain',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="8" height="8" rx="1.5" />
        <rect x="15" y="4" width="8" height="8" rx="1.5" />
        <rect x="8" y="12" width="8" height="8" rx="1.5" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="9" y1="16" x2="5" y2="12" />
        <line x1="16" y1="16" x2="19" y2="12" />
      </svg>
    ),
    title: 'Solana Settlement',
    description:
      'Every trade settles on Solana\'s blockchain with SPL tokens. Solar mints energy, homes burn it, and every transfer has a verifiable on-chain signature.',
    bullets: [
      'SPL tokens with 6-decimal precision represent energy credits (kWh)',
      'Mint (produce), Transfer (trade), Burn (consume) — all on-chain',
      'Real blockchain on devnet — every transaction is independently verifiable',
    ],
    href: '/blockchain',
    accentColor: '#a78bfa',
  },
];

export default function SectionPreviews() {
  return (
    <section className="py-12">
      <div className="divide-y divide-stroke-subtle/50">
        {sections.map((section, i) => (
          <SectionPreview key={section.href} {...section} reverse={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
