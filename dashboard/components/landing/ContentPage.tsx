'use client';

import Link from 'next/link';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

interface NavLink {
  href: string;
  label: string;
  color: string;
}

interface ContentPageProps {
  title: string;
  subtitle: string;
  accentColor: string;
  content: string;
  navLinks: NavLink[];
}

function ContentSection({ heading, body, accentColor }: {
  heading: string;
  body: string;
  accentColor: string;
}) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  const parseBody = (text: string) => {
    const lines = text.trim().split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let key = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${key++}`} className="space-y-2.5 my-4">
            {currentList.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-txt-secondary text-base leading-relaxed">
                <span
                  className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    for (const line of lines) {
      if (line.startsWith('- ')) {
        currentList.push(line.slice(2));
      } else if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h4
            key={`h3-${key++}`}
            className="font-mono font-semibold text-lg text-txt-primary mt-6 mb-2"
          >
            {line.slice(4)}
          </h4>
        );
      } else if (line.trim() === '') {
        // skip blanks between paragraphs
      } else {
        flushList();
        const numberedMatch = line.match(/^\d+\.\s+/);
        if (numberedMatch) {
          currentList.push(line.slice(numberedMatch[0].length));
        } else {
          elements.push(
            <p
              key={`p-${key++}`}
              className="text-txt-secondary text-base leading-relaxed my-3"
              dangerouslySetInnerHTML={{ __html: formatInline(line) }}
            />
          );
        }
      }
    }
    flushList();
    return elements;
  };

  const formatInline = (text: string) => {
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-txt-primary font-semibold">$1</strong>');
    formatted = formatted.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-surface-2 rounded text-sm font-mono text-txt-accent">$1</code>');
    formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="underline hover:brightness-125" target="_blank" rel="noopener noreferrer">$1</a>');
    return formatted;
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      <div className="max-w-3xl mx-auto py-8">
        {heading && (
          <h2
            className="font-mono font-bold text-2xl md:text-3xl mb-4"
            style={{ color: accentColor }}
          >
            {heading}
          </h2>
        )}
        <div>{parseBody(body)}</div>
      </div>
    </div>
  );
}

export default function ContentPage({ title, subtitle, accentColor, content, navLinks }: ContentPageProps) {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.1);

  // Parse markdown into sections split on ## headings
  const sections: { heading: string; body: string }[] = [];
  const parts = content.split(/^## /m);

  // First part is intro (before any ## heading)
  if (parts[0].trim()) {
    const introLines = parts[0].trim().split('\n');
    const introBody = introLines.slice(1).join('\n').trim();
    if (introBody) {
      sections.push({ heading: '', body: introBody });
    }
  }

  // Remaining parts are ## sections
  for (let i = 1; i < parts.length; i++) {
    const lines = parts[i].split('\n');
    const heading = lines[0].trim();
    const body = lines.slice(1).join('\n').trim();
    sections.push({ heading, body });
  }

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Back link */}
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-mono text-txt-tertiary hover:text-txt-secondary transition-colors"
        >
          <span aria-hidden="true">&larr;</span>
          Back to SolGrid
        </Link>
      </div>

      {/* Header */}
      <div
        ref={headerRef}
        className="max-w-3xl mx-auto px-6 pt-12 pb-8"
        style={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        }}
      >
        <h1
          className="font-mono font-bold text-4xl md:text-5xl mb-3"
          style={{ color: accentColor }}
        >
          {title}
        </h1>
        <p className="text-txt-secondary text-lg leading-relaxed">{subtitle}</p>
        <div
          className="w-16 h-1 rounded-full mt-6"
          style={{ backgroundColor: accentColor + '60' }}
        />
      </div>

      {/* Content sections */}
      <div className="px-6 pb-16">
        {sections.map((section, i) => (
          <ContentSection
            key={i}
            heading={section.heading}
            body={section.body}
            accentColor={accentColor}
          />
        ))}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-stroke-subtle/50">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-txt-tertiary text-sm font-mono mb-6">Explore more</p>
          <div className="flex flex-wrap gap-4 mb-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 px-4 py-2.5 card-cyber text-sm font-mono font-semibold transition-colors hover:brightness-125"
                style={{ color: link.color, borderColor: link.color + '30' }}
              >
                {link.label}
                <span aria-hidden="true">&rarr;</span>
              </Link>
            ))}
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-solar text-surface-0 font-mono font-bold rounded-lg hover:shadow-glow-solar transition-shadow duration-300 text-sm"
          >
            Launch App
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
