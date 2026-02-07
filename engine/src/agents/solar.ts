import { Keypair, PublicKey } from '@solana/web3.js';
import { Account } from '@solana/spl-token';
import { BaseAgent } from './base.js';
import { Marketplace } from '../market/marketplace.js';
import { mintTokens } from '../chain/token.js';
import { getSolarOutput } from '../simulation/meter.js';
import { AgentState } from '../market/types.js';
import { AgentDecision } from './llm.js';
import { logger } from '../utils/index.js';

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

  async tick(hour: number, marketplace: Marketplace, decision?: AgentDecision): Promise<void> {
    const production = getSolarOutput(hour);
    this.lastProduction = production;
    this.reasoning = decision?.reasoning || '';

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

        // Determine sell behavior based on LLM decision or fallback
        if (decision && decision.action === 'hold') {
          // LLM says hold - mint but don't post sell order
          this.activity = `Produced ${production.toFixed(2)} kWh, holding (AI decision)`;
          logger.agentAction(this.id, 'MINT+HOLD', { production, source: 'llm' });
        } else {
          // Sell: use LLM decision or fallback to 95%
          const marketPrice = marketplace.pricing.getPrice();
          const priceMultiplier = decision?.priceMultiplier ?? 0.95;
          const sellAmount = decision ? Math.min(decision.amount, production) : production;
          const sellPrice = marketPrice * priceMultiplier;

          if (sellAmount > 0.01) {
            marketplace.orderbook.addOrder({
              agentId: this.id,
              side: 'sell',
              amount: sellAmount,
              pricePerUnit: sellPrice,
              timestamp: Date.now(),
            });

            this.activity = `Produced ${production.toFixed(2)} kWh, selling ${sellAmount.toFixed(2)} @ ${sellPrice.toFixed(4)}`;
            logger.agentAction(this.id, 'MINT+SELL', {
              production,
              sellAmount,
              sellPrice,
              priceMultiplier,
              source: decision ? 'llm' : 'fallback',
            });
          } else {
            this.activity = `Produced ${production.toFixed(2)} kWh, holding`;
            logger.agentAction(this.id, 'MINT+HOLD', { production, source: 'fallback' });
          }
        }
      } catch (err) {
        this.activity = `Mint error: ${err}`;
        logger.error('SOLAR', `Mint error: ${err}`);
      }
    } else {
      this.activity = 'No sunlight - idle';
      logger.debug('SOLAR', 'No production (nighttime)', { hour });
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
      reasoning: this.reasoning,
      production: this.lastProduction,
    };
  }
}
