import { Keypair, PublicKey } from '@solana/web3.js';
import { Account } from '@solana/spl-token';
import { BaseAgent } from './base.js';
import { Marketplace } from '../market/marketplace.js';
import { burnTokens } from '../chain/token.js';
import { getHomeConsumption } from '../simulation/meter.js';
import { HOME_TARGET_BUFFER } from '../config.js';
import { AgentState } from '../market/types.js';

export class HomeAgent extends BaseAgent {
  private mint: PublicKey;
  public lastConsumption: number = 0;
  public totalBurned: number = 0;

  constructor(keypair: Keypair, tokenAccount: Account, mint: PublicKey) {
    super('home', 'Smart Home', 'home', keypair, tokenAccount);
    this.mint = mint;
    this.strategy = `Consume energy, maintain ${HOME_TARGET_BUFFER} kWh buffer, buy at 105% market`;
  }

  async tick(hour: number, marketplace: Marketplace, currentBalance: number): Promise<void> {
    const consumption = getHomeConsumption(hour);
    this.lastConsumption = consumption;

    // Burn tokens for consumption
    if (consumption > 0.01 && currentBalance >= consumption) {
      try {
        await burnTokens(this.keypair, this.mint, this.tokenAccountAddress, consumption);
        this.totalBurned += consumption;
        this.activity = `Consuming ${consumption.toFixed(2)} kWh`;
      } catch (err) {
        this.activity = `Burn error: ${err}`;
        console.error(`Home burn error: ${err}`);
      }
    } else if (currentBalance < consumption) {
      // Not enough balance, consume what we have
      if (currentBalance > 0.01) {
        try {
          await burnTokens(this.keypair, this.mint, this.tokenAccountAddress, currentBalance);
          this.totalBurned += currentBalance;
          this.activity = `Low supply! Consumed only ${currentBalance.toFixed(2)}/${consumption.toFixed(2)} kWh`;
        } catch (err) {
          this.activity = `Burn error: ${err}`;
        }
      } else {
        this.activity = 'No energy available!';
      }
    }

    // If balance below target buffer, place buy orders
    const balanceAfterConsumption = Math.max(0, currentBalance - consumption);
    if (balanceAfterConsumption < HOME_TARGET_BUFFER) {
      const deficit = HOME_TARGET_BUFFER - balanceAfterConsumption;
      const buyAmount = Math.min(deficit, consumption * 2); // don't over-buy
      const marketPrice = marketplace.pricing.getPrice();
      const buyPrice = marketPrice * 1.05;

      marketplace.orderbook.addOrder({
        agentId: this.id,
        side: 'buy',
        amount: buyAmount,
        pricePerUnit: buyPrice,
        timestamp: Date.now(),
      });

      this.activity += ` | Buying ${buyAmount.toFixed(2)} kWh @ ${buyPrice.toFixed(4)}`;
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
      consumption: this.lastConsumption,
    };
  }
}
