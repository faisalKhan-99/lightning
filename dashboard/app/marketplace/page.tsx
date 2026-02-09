import fs from 'fs';
import path from 'path';
import ContentPage from '../../components/landing/ContentPage';

export default function MarketplacePage() {
  const content = fs.readFileSync(
    path.join(process.cwd(), '..', 'content', 'marketplace.md'),
    'utf-8'
  );

  return (
    <ContentPage
      title="The Energy Marketplace"
      subtitle="A continuous order book where prices emerge from competition between agents — the same mechanism used by stock exchanges and crypto markets."
      accentColor="#34d399"
      content={content}
      navLinks={[
        { href: '/agents', label: 'Agents', color: '#e2b340' },
        { href: '/simulation', label: 'Simulation', color: '#5b9cf5' },
        { href: '/blockchain', label: 'Blockchain', color: '#a78bfa' },
      ]}
    />
  );
}
