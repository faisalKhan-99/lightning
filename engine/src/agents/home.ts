import { Keypair, PublicKey } from '@solana/web3.js';
import { Account } from '@solana/spl-token';
import { BaseAgent } from './base.js';
import { Marketplace } from '../market/marketplace.js';
import { burnTokens } from '../chain/token.js';
import { getHomeConsumption } from '../simulation/meter.js';
import { HOME_TARGET_BUFFER } from '../config.js';
import { AgentState } from '../market/types.js';
import { AgentDecision } from './llm.js';
import { logger } from '../utils/index.js';

export class HomeAgent extends BaseAgent {
  private mint: PublicKey;
  public lastConsumption: number = 0;
  public totalBurned: number = 0;

  constructor(keypair: Keypair, tokenAccount: Account, mint: PublicKey) {
    super('home', 'Smart Home', 'home', keypair, tokenAccount);
    this.mint = mint;
    this.strategy = `Consume energy, maintain ${HOME_TARGET_BUFFER} kWh buffer, buy at 105% market`;
  }

  reset(): void {
    this.resetMemory();
    this.lastConsumption = 0;
    this.totalBurned = 0;
  }

  async tick(hour: number, marketplace: Marketplace, currentBalance: number, decision?: AgentDecision): Promise<void> {
    const consumption = getHomeConsumption(hour);
    this.lastConsumption = consumption;
    this.reasoning = decision?.reasoning || '';

    // Burn tokens for consumption (always happens, non-negotiable)
    if (consumption > 0.01 && currentBalance >= consumption) {
      try {
        await burnTokens(this.keypair, this.mint, this.tokenAccountAddress, consumption);
        this.totalBurned += consumption;
        this.activity = `Consuming ${consumption.toFixed(2)} kWh`;
        logger.agentAction(this.id, 'CONSUME', { consumption, balance: currentBalance });
      } catch (err) {
        this.activity = `Burn error: ${err}`;
        logger.error('HOME', `Burn error: ${err}`);
      }
    } else if (currentBalance < consumption) {
      // Not enough balance, consume what we have
      if (currentBalance > 0.01) {
        try {
          await burnTokens(this.keypair, this.mint, this.tokenAccountAddress, currentBalance);
          this.totalBurned += currentBalance;
          this.activity = `Low supply! Consumed only ${currentBalance.toFixed(2)}/${consumption.toFixed(2)} kWh`;
          logger.warn('HOME', 'Insufficient energy', { needed: consumption, available: currentBalance });
        } catch (err) {
          this.activity = `Burn error: ${err}`;
          logger.error('HOME', `Burn error: ${err}`);
        }
      } else {
        this.activity = 'No energy available!';
        logger.warn('HOME', 'No energy available', { needed: consumption, balance: currentBalance });
      }
    }

    // Determine buy behavior based on LLM decision or fallback
    const balanceAfterConsumption = Math.max(0, currentBalance - consumption);

    if (decision && decision.action === 'hold') {
      // LLM says hold - skip buying this tick
      this.activity += ' | Holding (AI decision)';
      logger.agentAction(this.id, 'HOLD', { balanceAfter: balanceAfterConsumption, source: 'llm' });
    } else if (decision && decision.action === 'buy' && decision.amount > 0.01) {
      // LLM-driven buy
      const marketPrice = marketplace.pricing.getPrice();
      const buyPrice = marketPrice * decision.priceMultiplier;

      marketplace.orderbook.addOrder({
        agentId: this.id,
        side: 'buy',
        amount: decision.amount,
        pricePerUnit: buyPrice,
        timestamp: Date.now(),
      });

      this.activity += ` | Buying ${decision.amount.toFixed(2)} kWh @ ${buyPrice.toFixed(4)} (AI)`;
      logger.agentAction(this.id, 'BUY', {
        amount: decision.amount,
        price: buyPrice,
        priceMultiplier: decision.priceMultiplier,
        source: 'llm',
      });
    } else if (balanceAfterConsumption < HOME_TARGET_BUFFER) {
      // Fallback: if balance below target buffer, place buy orders with adaptive premium
      const deficit = HOME_TARGET_BUFFER - balanceAfterConsumption;
      const buyAmount = Math.min(deficit, consumption * 2); // don't over-buy
      const marketPrice = marketplace.pricing.getPrice();
      // Adaptive buy premium based on risk level
      const basePremium = 1.05;
      const adaptivePremium = basePremium + (0.5 - this.memory.riskLevel) * 0.05;
      // riskLevel 0.2 -> 1.065 (conservative, pay more to ensure supply)
      // riskLevel 0.8 -> 1.035 (aggressive, try to get better price)
      const buyPrice = marketPrice * adaptivePremium;

      marketplace.orderbook.addOrder({
        agentId: this.id,
        side: 'buy',
        amount: buyAmount,
        pricePerUnit: buyPrice,
        timestamp: Date.now(),
      });

      this.activity += ` | Buying ${buyAmount.toFixed(2)} kWh @ ${buyPrice.toFixed(4)}`;
      logger.agentAction(this.id, 'BUY', {
        amount: buyAmount,
        price: buyPrice,
        deficit,
        premium: adaptivePremium,
        riskLevel: this.memory.riskLevel,
        source: 'fallback',
      });
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
      consumption: this.lastConsumption,
      memory: this.memory,
    };
  }
}
