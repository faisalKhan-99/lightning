import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative py-20 md:py-28 bg-surface-0 bg-grid-overlay overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-solar/5 blur-[120px]" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Agent dots */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-solar shadow-glow-solar animate-pulse-slow" />
            <span className="text-xs font-mono text-txt-tertiary">Solar</span>
          </div>
          <div className="w-16 h-px bg-gradient-to-r from-solar/40 via-stroke-muted to-home/40" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-home shadow-glow-home animate-pulse-slow" style={{ animationDelay: '1s' }} />
            <span className="text-xs font-mono text-txt-tertiary">Home</span>
          </div>
          <div className="w-16 h-px bg-gradient-to-r from-home/40 via-stroke-muted to-battery/40" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-battery shadow-glow-battery animate-pulse-slow" style={{ animationDelay: '2s' }} />
            <span className="text-xs font-mono text-txt-tertiary">Battery</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold font-mono mb-3 landing-gradient-text">
          SolGrid
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-txt-secondary font-mono mb-3">
          Autonomous Energy Trading on Solana
        </p>

        {/* Subtitle */}
        <p className="text-txt-tertiary text-base max-w-xl mx-auto mb-8 leading-relaxed">
          Watch AI agents produce, consume, and trade energy in a decentralized
          marketplace — settled on-chain in real time.
        </p>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3 bg-solar text-surface-0 font-mono font-bold rounded-lg hover:shadow-glow-solar transition-shadow duration-300 text-base"
        >
          Launch App
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
