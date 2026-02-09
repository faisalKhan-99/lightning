'use client';

import Link from 'next/link';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

interface SectionPreviewProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
  href: string;
  accentColor: string;
  reverse?: boolean;
}

export default function SectionPreview({
  id,
  icon,
  title,
  description,
  bullets,
  href,
  accentColor,
  reverse = false,
}: SectionPreviewProps) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  const childStyle = (delay: number): React.CSSProperties => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.5s ease-out ${delay * 0.1}s, transform 0.5s ease-out ${delay * 0.1}s`,
  });

  return (
    <div
      id={id}
      ref={ref}
      className="scroll-mt-14"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      <div
        className={`relative max-w-[1400px] mx-auto flex flex-col ${
          reverse ? 'md:flex-row-reverse' : 'md:flex-row'
        } items-start gap-8 md:gap-16 py-16 px-6 md:px-12`}
      >
        {/* Accent glow */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[120px] opacity-[0.06] pointer-events-none"
          style={{
            backgroundColor: accentColor,
            left: reverse ? 'auto' : '0',
            right: reverse ? '0' : 'auto',
          }}
        />

        {/* Icon side */}
        <div
          className="relative flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center border"
          style={{
            borderColor: accentColor + '40',
            backgroundColor: accentColor + '10',
            ...childStyle(1),
          }}
        >
          {icon}
        </div>

        {/* Text side */}
        <div className="relative flex-1 min-w-0">
          <div style={childStyle(2)}>
            <h3
              className="font-mono font-bold text-xl md:text-2xl mb-3"
              style={{ color: accentColor }}
            >
              {title}
            </h3>
          </div>

          <div style={childStyle(3)}>
            <p className="text-txt-secondary text-base leading-relaxed mb-5">
              {description}
            </p>
          </div>

          <ul className="space-y-2.5 mb-6">
            {bullets.map((bullet, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-txt-tertiary"
                style={childStyle(4 + i)}
              >
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                {bullet}
              </li>
            ))}
          </ul>

          <div style={childStyle(7)}>
            <Link
              href={href}
              className="inline-flex items-center gap-2 font-mono text-sm font-semibold transition-colors duration-200 hover:brightness-125"
              style={{ color: accentColor }}
            >
              Explore
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Left accent border */}
        <div
          className={`absolute top-8 bottom-8 w-px ${reverse ? 'right-0 md:right-6' : 'left-0 md:left-6'} hidden md:block`}
          style={{ backgroundColor: accentColor + '30' }}
        />
      </div>
    </div>
  );
}
