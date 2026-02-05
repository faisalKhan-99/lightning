import { Keypair } from '@solana/web3.js';
import { Account } from '@solana/spl-token';
import { BaseAgent } from './base.js';
import { Marketplace } from '../market/marketplace.js';
import {
  BATTERY_MAX_CAPACITY,
  BATTERY_BUY_THRESHOLD,
  BATTERY_SELL_THRESHOLD,
} from '../config.js';
import { AgentState } from '../market/types.js';

export class BatteryAgent extends BaseAgent {
  public storageLevel: number = 0;

  constructor(keypair: Keypair, tokenAccount: Account) {
    super('battery', 'Battery Storage', 'battery', keypair, tokenAccount);
    this.strategy = 'Buy low (< 85% avg), sell high (> 115% avg), max 50 kWh';
  }

  async tick(marketplace: Marketplace, currentBalance: number): Promise<void> {
    this.storageLevel = currentBalance;
    const currentPrice = marketplace.pricing.getPrice();
    const movingAvg = marketplace.pricing.getMovingAverage();

    if (currentPrice < movingAvg * BATTERY_BUY_THRESHOLD && this.storageLevel < BATTERY_MAX_CAPACITY) {
      // Buy opportunity
      const buyAmount = Math.min(5, BATTERY_MAX_CAPACITY - this.storageLevel);
      if (buyAmount > 0.01) {
        marketplace.orderbook.addOrder({
          agentId: this.id,
          side: 'buy',
          amount: buyAmount,
          pricePerUnit: currentPrice * 1.02, // slightly above market to ensure fill
          timestamp: Date.now(),
        });
        this.activity = `Buying ${buyAmount.toFixed(2)} kWh @ ${(currentPrice * 1.02).toFixed(4)} (price is low)`;
      }
    } else if (currentPrice > movingAvg * BATTERY_SELL_THRESHOLD && this.storageLevel > 1) {
      // Sell opportunity
      const sellAmount = Math.min(5, this.storageLevel);
      if (sellAmount > 0.01) {
        marketplace.orderbook.addOrder({
          agentId: this.id,
          side: 'sell',
          amount: sellAmount,
          pricePerUnit: currentPrice * 0.98, // slightly below market to ensure fill
          timestamp: Date.now(),
        });
        this.activity = `Selling ${sellAmount.toFixed(2)} kWh @ ${(currentPrice * 0.98).toFixed(4)} (price is high)`;
      }
    } else {
      this.activity = `Holding ${this.storageLevel.toFixed(2)} kWh | Price: ${currentPrice.toFixed(4)} vs Avg: ${movingAvg.toFixed(4)}`;
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
      storageLevel: this.storageLevel,
      storageCapacity: BATTERY_MAX_CAPACITY,
    };
  }
}
