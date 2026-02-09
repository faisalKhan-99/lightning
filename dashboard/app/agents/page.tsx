import fs from 'fs';
import path from 'path';
import ContentPage from '../../components/landing/ContentPage';

export default function AgentsPage() {
  const content = fs.readFileSync(
    path.join(process.cwd(), '..', 'content', 'agents.md'),
    'utf-8'
  );

  return (
    <ContentPage
      title="The Autonomous Agents"
      subtitle="Three AI agents each pursue their own strategy in the energy market — producing, consuming, and trading without human intervention."
      accentColor="#e2b340"
      content={content}
      navLinks={[
        { href: '/marketplace', label: 'Marketplace', color: '#34d399' },
        { href: '/simulation', label: 'Simulation', color: '#5b9cf5' },
        { href: '/blockchain', label: 'Blockchain', color: '#a78bfa' },
      ]}
    />
  );
}
