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
import { AgentDecision } from './llm.js';
import { logger } from '../utils/index.js';

export class BatteryAgent extends BaseAgent {
  public storageLevel: number = 0;

  constructor(keypair: Keypair, tokenAccount: Account) {
    super('battery', 'Battery Storage', 'battery', keypair, tokenAccount);
    this.strategy = 'Buy low (< 85% avg), sell high (> 115% avg), max 50 kWh';
  }

  async tick(marketplace: Marketplace, currentBalance: number, decision?: AgentDecision): Promise<void> {
    this.storageLevel = currentBalance;
    this.reasoning = decision?.reasoning || '';
    const currentPrice = marketplace.pricing.getPrice();
    const movingAvg = marketplace.pricing.getMovingAverage();

    if (decision && decision.action !== 'hold') {
      // LLM-driven decision
      const marketPrice = currentPrice;
      const price = marketPrice * decision.priceMultiplier;

      if (decision.action === 'buy') {
        // Enforce capacity constraint
        const maxBuyable = BATTERY_MAX_CAPACITY - this.storageLevel;
        const buyAmount = Math.min(decision.amount, maxBuyable);
        if (buyAmount > 0.01) {
          marketplace.orderbook.addOrder({
            agentId: this.id,
            side: 'buy',
            amount: buyAmount,
            pricePerUnit: price,
            timestamp: Date.now(),
          });
          this.activity = `Buying ${buyAmount.toFixed(2)} kWh @ ${price.toFixed(4)} (AI)`;
          logger.agentAction(this.id, 'BUY', {
            amount: buyAmount,
            price,
            priceMultiplier: decision.priceMultiplier,
            storage: this.storageLevel,
            source: 'llm',
          });
        } else {
          this.activity = `At capacity ${this.storageLevel.toFixed(2)}/${BATTERY_MAX_CAPACITY} kWh, cannot buy`;
          logger.agentAction(this.id, 'SKIP_BUY', { reason: 'at_capacity', storage: this.storageLevel });
        }
      } else if (decision.action === 'sell') {
        // Enforce balance constraint
        const sellAmount = Math.min(decision.amount, this.storageLevel);
        if (sellAmount > 0.01) {
          marketplace.orderbook.addOrder({
            agentId: this.id,
            side: 'sell',
            amount: sellAmount,
            pricePerUnit: price,
            timestamp: Date.now(),
          });
          this.activity = `Selling ${sellAmount.toFixed(2)} kWh @ ${price.toFixed(4)} (AI)`;
          logger.agentAction(this.id, 'SELL', {
            amount: sellAmount,
            price,
            priceMultiplier: decision.priceMultiplier,
            storage: this.storageLevel,
            source: 'llm',
          });
        } else {
          this.activity = `No energy to sell (${this.storageLevel.toFixed(2)} kWh)`;
          logger.agentAction(this.id, 'SKIP_SELL', { reason: 'no_balance', storage: this.storageLevel });
        }
      }
    } else if (decision && decision.action === 'hold') {
      this.activity = `Holding ${this.storageLevel.toFixed(2)} kWh (AI decision)`;
      logger.agentAction(this.id, 'HOLD', { storage: this.storageLevel, price: currentPrice, avg: movingAvg, source: 'llm' });
    } else {
      // Fallback: existing moving average strategy with adaptive thresholds
      // Adaptive thresholds based on risk level
      const buyThreshold = BATTERY_BUY_THRESHOLD - (this.memory.riskLevel - 0.5) * 0.1;
      const sellThreshold = BATTERY_SELL_THRESHOLD + (this.memory.riskLevel - 0.5) * 0.1;
      // riskLevel 0.2 -> buy at 0.88, sell at 1.12 (conservative)
      // riskLevel 0.8 -> buy at 0.82, sell at 1.18 (aggressive)

      if (currentPrice < movingAvg * buyThreshold && this.storageLevel < BATTERY_MAX_CAPACITY) {
        // Buy opportunity
        const buyAmount = Math.min(5, BATTERY_MAX_CAPACITY - this.storageLevel);
        if (buyAmount > 0.01) {
          marketplace.orderbook.addOrder({
            agentId: this.id,
            side: 'buy',
            amount: buyAmount,
            pricePerUnit: currentPrice * 1.02,
            timestamp: Date.now(),
          });
          this.activity = `Buying ${buyAmount.toFixed(2)} kWh @ ${(currentPrice * 1.02).toFixed(4)} (price is low)`;
          logger.agentAction(this.id, 'BUY', {
            amount: buyAmount,
            price: currentPrice * 1.02,
            priceVsAvg: (currentPrice / movingAvg).toFixed(3),
            buyThreshold,
            riskLevel: this.memory.riskLevel,
            source: 'fallback',
          });
        }
      } else if (currentPrice > movingAvg * sellThreshold && this.storageLevel > 1) {
        // Sell opportunity
        const sellAmount = Math.min(5, this.storageLevel);
        if (sellAmount > 0.01) {
          marketplace.orderbook.addOrder({
            agentId: this.id,
            side: 'sell',
            amount: sellAmount,
            pricePerUnit: currentPrice * 0.98,
            timestamp: Date.now(),
          });
          this.activity = `Selling ${sellAmount.toFixed(2)} kWh @ ${(currentPrice * 0.98).toFixed(4)} (price is high)`;
          logger.agentAction(this.id, 'SELL', {
            amount: sellAmount,
            price: currentPrice * 0.98,
            priceVsAvg: (currentPrice / movingAvg).toFixed(3),
            sellThreshold,
            riskLevel: this.memory.riskLevel,
            source: 'fallback',
          });
        }
      } else {
        this.activity = `Holding ${this.storageLevel.toFixed(2)} kWh | Price: ${currentPrice.toFixed(4)} vs Avg: ${movingAvg.toFixed(4)}`;
        logger.agentAction(this.id, 'HOLD', {
          storage: this.storageLevel,
          price: currentPrice,
          avg: movingAvg,
          riskLevel: this.memory.riskLevel,
          source: 'fallback',
        });
      }
    }
  }

  getState(tokenBalance: number, solBalance: number): AgentState {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      owner: 'ai' as const,
      walletAddress: this.keypair.publicKey.toBase58(),
      tokenBalance,
      solBalance,
      activity: this.activity,
      strategy: this.strategy,
      reasoning: this.reasoning,
      storageLevel: this.storageLevel,
      storageCapacity: BATTERY_MAX_CAPACITY,
      memory: this.memory,
    };
  }
}
