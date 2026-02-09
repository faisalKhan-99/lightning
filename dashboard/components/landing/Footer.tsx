import Link from 'next/link';

export default function Footer() {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[200px] rounded-full bg-solar/5 blur-[80px]" />
      </div>

      <div className="relative z-10 text-center">
        <p className="font-mono text-xl text-txt-secondary mb-6">
          Ready to watch the market?
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-solar text-surface-0 font-mono font-bold rounded-lg hover:shadow-glow-solar transition-shadow duration-300 text-lg"
        >
          Launch App
          <span aria-hidden="true">&rarr;</span>
        </Link>
        <p className="mt-8 text-txt-tertiary text-xs font-mono">
          SolGrid &mdash; Autonomous Energy Trading on Solana
        </p>
      </div>
    </section>
  );
}
