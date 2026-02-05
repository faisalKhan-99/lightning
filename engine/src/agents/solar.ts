import { Keypair, PublicKey } from '@solana/web3.js';
import { Account } from '@solana/spl-token';
import { BaseAgent } from './base.js';
import { Marketplace } from '../market/marketplace.js';
import { mintTokens } from '../chain/token.js';
import { getSolarOutput } from '../simulation/meter.js';
import { AgentState } from '../market/types.js';

export class SolarAgent extends BaseAgent {
  private mintAuthority: Keypair;
  private mint: PublicKey;
  public lastProduction: number = 0;
  public totalMinted: number = 0;

  constructor(
    keypair: Keypair,
    tokenAccount: Account,
    mintAuthority: Keypair,
    mint: PublicKey
  ) {
    super('solar', 'Solar Panel', 'solar', keypair, tokenAccount);
    this.mintAuthority = mintAuthority;
    this.mint = mint;
    this.strategy = 'Produce energy during daylight, sell at 95% market price';
  }

  async tick(hour: number, marketplace: Marketplace): Promise<void> {
    const production = getSolarOutput(hour);
    this.lastProduction = production;

    if (production > 0.01) {
      // Mint tokens for production
      try {
        await mintTokens(
          this.mintAuthority,
          this.mint,
          this.tokenAccountAddress,
          production
        );
        this.totalMinted += production;
        this.activity = `Producing ${production.toFixed(2)} kWh`;

        // Post sell order at 95% of market price
        const marketPrice = marketplace.pricing.getPrice();
        const sellPrice = marketPrice * 0.95;

        marketplace.orderbook.addOrder({
          agentId: this.id,
          side: 'sell',
          amount: production,
          pricePerUnit: sellPrice,
          timestamp: Date.now(),
        });

        this.activity = `Produced ${production.toFixed(2)} kWh, selling @ ${sellPrice.toFixed(4)}`;
      } catch (err) {
        this.activity = `Mint error: ${err}`;
        console.error(`Solar mint error: ${err}`);
      }
    } else {
      this.activity = 'No sunlight - idle';
    }
  }

  getState(tokenBalance: number, solBalance: number): AgentState {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      walletAddress: this.keypair.publicKey.toBase58(),
      tokenBalance,
      solBalance,
      activity: this.activity,
      strategy: this.strategy,
      production: this.lastProduction,
    };
  }
}
