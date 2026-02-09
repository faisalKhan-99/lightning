'use client';

import { Player } from '@remotion/player';
import ArchitectureComposition from './ArchitectureComposition';

export default function ArchitectureDiagram() {
  return (
    <section id="architecture" className="scroll-mt-14 py-20 px-6">
      <div className="max-w-[1100px] mx-auto">
        <h2 className="text-center font-mono text-2xl font-bold text-txt-primary mb-3">
          Architecture
        </h2>
        <p className="text-center text-txt-secondary text-sm mb-12 max-w-lg mx-auto">
          Energy flows from production to consumption, with every trade settled on Solana.
        </p>

        <div className="card-cyber p-4 md:p-8">
          <Player
            component={ArchitectureComposition}
            inputProps={{}}
            durationInFrames={300}
            compositionWidth={800}
            compositionHeight={340}
            fps={30}
            loop
            autoPlay
            controls={false}
            acknowledgeRemotionLicense
            style={{
              width: '100%',
              height: 'auto',
              aspectRatio: '800 / 340',
              backgroundColor: 'transparent',
            }}
          />
        </div>
      </div>
    </section>
  );
}
