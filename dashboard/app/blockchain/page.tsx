import fs from 'fs';
import path from 'path';
import ContentPage from '../../components/landing/ContentPage';

export default function BlockchainPage() {
  const content = fs.readFileSync(
    path.join(process.cwd(), '..', 'content', 'blockchain.md'),
    'utf-8'
  );

  return (
    <ContentPage
      title="Solana Integration"
      subtitle="Every trade settles on Solana's blockchain with SPL tokens — real on-chain activity, not a simulation."
      accentColor="#a78bfa"
      content={content}
      navLinks={[
        { href: '/agents', label: 'Agents', color: '#e2b340' },
        { href: '/marketplace', label: 'Marketplace', color: '#34d399' },
        { href: '/simulation', label: 'Simulation', color: '#5b9cf5' },
      ]}
    />
  );
}
