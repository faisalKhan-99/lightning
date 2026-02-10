import { Keypair, PublicKey } from '@solana/web3.js';
import { Account } from '@solana/spl-token';
import { getTokenBalance } from '../chain/token.js';
import { getConnection } from '../chain/connection.js';
import { AgentState, PerformanceMemory } from '../market/types.js';
import {
  MEMORY_HISTORY_LENGTH,
  MIN_RISK_LEVEL,
  MAX_RISK_LEVEL,
  RISK_ADJUSTMENT_RATE,
} from '../config.js';

export abstract class BaseAgent {
  public id: string;
  public name: string;
  public type: 'solar' | 'home' | 'battery';
  public keypair: Keypair;
  public tokenAccount: Account;
  public tokenAccountAddress: PublicKey;
  public activity: string = 'Idle';
  public strategy: string = '';
  public reasoning: string = '';

  public memory: PerformanceMemory = {
    totalProfit: 0,
    tradesWon: 0,
    tradesLost: 0,
    recentProfits: [],
    avgBuyPrice: 0,
    avgSellPrice: 0,
    predictedPrices: [],
    actualPrices: [],
    riskLevel: 0.5,        // Start neutral
    llmTrustScore: 0.5,    // Start neutral
  };

  constructor(
    id: string,
    name: string,
    type: 'solar' | 'home' | 'battery',
    keypair: Keypair,
    tokenAccount: Account
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.keypair = keypair;
    this.tokenAccount = tokenAccount;
    this.tokenAccountAddress = tokenAccount.address;
  }

  resetMemory(): void {
    this.memory = {
      totalProfit: 0,
      tradesWon: 0,
      tradesLost: 0,
      recentProfits: [],
      avgBuyPrice: 0,
      avgSellPrice: 0,
      predictedPrices: [],
      actualPrices: [],
      riskLevel: 0.5,
      llmTrustScore: 0.5,
    };
    this.activity = 'Idle';
    this.reasoning = '';
  }

  async getTokenBalance(): Promise<number> {
    return getTokenBalance(this.tokenAccountAddress);
  }

  async getSolBalance(): Promise<number> {
    const conn = getConnection();
    const balance = await conn.getBalance(this.keypair.publicKey);
    return balance / 1e9;
  }

  // Record trade outcome
  recordTrade(side: 'buy' | 'sell', amount: number, price: number, marketPrice: number): void {
    const profit = side === 'sell'
      ? (price - marketPrice) * amount    // Sold above market = profit
      : (marketPrice - price) * amount;   // Bought below market = profit

    this.memory.totalProfit += profit;
    this.memory.recentProfits.push(profit);
    if (this.memory.recentProfits.length > MEMORY_HISTORY_LENGTH) {
      this.memory.recentProfits.shift();
    }

    if (profit > 0) {
      this.memory.tradesWon++;
    } else {
      this.memory.tradesLost++;
    }

    // Update averages
    if (side === 'buy') {
      this.memory.avgBuyPrice = this.memory.avgBuyPrice === 0
        ? price
        : (this.memory.avgBuyPrice * 0.9 + price * 0.1);
    } else {
      this.memory.avgSellPrice = this.memory.avgSellPrice === 0
        ? price
        : (this.memory.avgSellPrice * 0.9 + price * 0.1);
    }
  }

  // Update adaptive parameters (call every N ticks)
  updateAdaptiveParams(): void {
    const profitTrend = this.getProfitTrend();
    const predictionAccuracy = this.getPredictionAccuracy();

    // Adjust risk level based on recent performance
    if (profitTrend < -0.1) {
      // Losing money -> become more conservative
      this.memory.riskLevel = Math.max(MIN_RISK_LEVEL, this.memory.riskLevel - RISK_ADJUSTMENT_RATE);
    } else if (profitTrend > 0.1) {
      // Making money -> can be more aggressive
      this.memory.riskLevel = Math.min(MAX_RISK_LEVEL, this.memory.riskLevel + RISK_ADJUSTMENT_RATE * 0.6);
    }

    // Adjust LLM trust based on prediction accuracy
    if (predictionAccuracy > 0.7) {
      this.memory.llmTrustScore = Math.min(0.9, this.memory.llmTrustScore + RISK_ADJUSTMENT_RATE);
    } else if (predictionAccuracy < 0.4) {
      this.memory.llmTrustScore = Math.max(0.2, this.memory.llmTrustScore - RISK_ADJUSTMENT_RATE);
    }
  }

  getWinRate(): number {
    const total = this.memory.tradesWon + this.memory.tradesLost;
    return total > 0 ? this.memory.tradesWon / total : 0.5;
  }

  getProfitTrend(): number {
    if (this.memory.recentProfits.length < 5) return 0;
    const recent = this.memory.recentProfits.slice(-5);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }

  getPredictionAccuracy(): number {
    if (this.memory.predictedPrices.length < 5) return 0.5;
    let correct = 0;
    for (let i = 0; i < this.memory.predictedPrices.length; i++) {
      const diff = Math.abs(this.memory.predictedPrices[i] - this.memory.actualPrices[i]);
      if (diff < this.memory.actualPrices[i] * 0.1) correct++;  // Within 10%
    }
    return correct / this.memory.predictedPrices.length;
  }

  abstract getState(tokenBalance: number, solBalance: number): AgentState;
}
