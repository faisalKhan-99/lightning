'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const tabs = [
  { id: 'agents', label: 'Agents', color: '#e2b340' },
  { id: 'marketplace', label: 'Marketplace', color: '#34d399' },
  { id: 'simulation', label: 'Simulation', color: '#5b9cf5' },
  { id: 'blockchain', label: 'Blockchain', color: '#a78bfa' },
  { id: 'architecture', label: 'Architecture', color: '#7dd3fc' },
  { id: 'tech', label: 'Tech Stack', color: '#8896ab' },
];

export default function TopNav() {
  const [active, setActive] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );

    for (const tab of tabs) {
      const el = document.getElementById(tab.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface-0/80 backdrop-blur-md border-b border-stroke-subtle/50">
      <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-12">
        <span className="font-mono font-bold text-sm landing-gradient-text flex-shrink-0">
          SolGrid
        </span>

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollTo(tab.id)}
              className="px-3 py-1.5 font-mono text-xs rounded-md transition-all duration-200 whitespace-nowrap"
              style={{
                color: active === tab.id ? tab.color : '#5a6a80',
                backgroundColor: active === tab.id ? tab.color + '10' : 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="flex-shrink-0 ml-4 px-4 py-1.5 bg-solar text-surface-0 font-mono font-bold text-xs rounded-md hover:shadow-glow-solar transition-shadow duration-200"
        >
          Launch App
        </Link>
      </div>
    </nav>
  );
}
