const techs = [
  { name: 'Solana', color: '#7dd3fc' },
  { name: 'SPL Tokens', color: '#a78bfa' },
  { name: 'Next.js 14', color: '#e8ecf4' },
  { name: 'TypeScript', color: '#5b9cf5' },
  { name: 'GPT-4o-mini', color: '#34d399' },
  { name: 'Remotion', color: '#f87171' },
  { name: 'Recharts', color: '#e2b340' },
  { name: 'WebSocket', color: '#8896ab' },
];

export default function TechStack() {
  return (
    <section id="tech" className="scroll-mt-14 py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-mono text-2xl font-bold text-txt-primary mb-3">
          Tech Stack
        </h2>
        <p className="text-txt-secondary text-sm mb-10">
          Built with modern tools for real-time performance and on-chain reliability.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {techs.map((tech) => (
            <span
              key={tech.name}
              className="px-4 py-2 rounded-full font-mono text-sm border"
              style={{
                color: tech.color,
                borderColor: tech.color + '33',
                backgroundColor: tech.color + '0a',
              }}
            >
              {tech.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
