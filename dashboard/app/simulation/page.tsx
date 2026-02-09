import fs from 'fs';
import path from 'path';
import ContentPage from '../../components/landing/ContentPage';

export default function SimulationPage() {
  const content = fs.readFileSync(
    path.join(process.cwd(), '..', 'content', 'simulation.md'),
    'utf-8'
  );

  return (
    <ContentPage
      title="The Energy Simulation"
      subtitle="A realistic day/night cycle where solar peaks at noon and homes peak at dinner — this natural mismatch drives the entire market."
      accentColor="#5b9cf5"
      content={content}
      navLinks={[
        { href: '/agents', label: 'Agents', color: '#e2b340' },
        { href: '/marketplace', label: 'Marketplace', color: '#34d399' },
        { href: '/blockchain', label: 'Blockchain', color: '#a78bfa' },
      ]}
    />
  );
}
