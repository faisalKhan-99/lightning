import { Keypair, PublicKey } from '@solana/web3.js';
import { Account } from '@solana/spl-token';
import { BaseAgent } from './base.js';
import { Marketplace } from '../market/marketplace.js';
import { mintTokens } from '../chain/token.js';
import { burnTokens } from '../chain/token.js';
import { getSolarOutput, getHomeConsumption } from '../simulation/meter.js';
import { AgentState } from '../market/types.js';
import { BATTERY_MAX_CAPACITY } from '../config.js';
import { logger } from '../utils/index.js';

export class UserAgent extends BaseAgent {
  public role: 'solar' | 'home' | 'battery';
  public phantomWallet: string;
  private mintAuthority?: Keypair;
  private mint?: PublicKey;

  // Role-specific state
  public lastProduction: number = 0;
  public lastConsumption: number = 0;
  public totalMinted: number = 0;
  public totalBurned: number = 0;
  public storageLevel: number = 0;

  constructor(
    id: string,
    role: 'solar' | 'home' | 'battery',
    phantomWallet: string,
    keypair: Keypair,
    tokenAccount: Account,
    mintAuthority?: Keypair,
    mint?: PublicKey
  ) {
    const name = `User ${role.charAt(0).toUpperCase() + role.slice(1)}`;
    super(id, name, role, keypair, tokenAccount);
    this.role = role;
    this.phantomWallet = phantomWallet;
    this.mintAuthority = mintAuthority;
    this.mint = mint;

    const strategies: Record<string, string> = {
      solar: 'User solar: mint during daylight, sell at 85% market',
      home: 'User home: consume per curve, buy when below 20 kWh buffer',
      battery: 'User battery: buy below 85% avg, sell above 115%',
    };
    this.strategy = strategies[role];
  }

  async tick(hour: number, marketplace: Marketplace, currentBalance: number): Promise<void> {
    switch (this.role) {
      case 'solar':
        await this.tickSolar(hour, marketplace);
        break;
      case 'home':
        await this.tickHome(hour, marketplace, currentBalance);
        break;
      case 'battery':
        await this.tickBattery(marketplace, currentBalance);
        break;
    }
  }

  private async tickSolar(hour: number, marketplace: Marketplace): Promise<void> {
    const production = getSolarOutput(hour);
    this.lastProduction = production;

    if (production > 0.01 && this.mintAuthority && this.mint) {
      try {
        await mintTokens(this.mintAuthority, this.mint, this.tokenAccountAddress, production);
        this.totalMinted += production;

        const marketPrice = marketplace.pricing.getPrice();
        const sellPrice = marketPrice * 0.85;

        marketplace.orderbook.addOrder({
          agentId: this.id,
          side: 'sell',
          amount: production,
          pricePerUnit: sellPrice,
          timestamp: Date.now(),
        });

        this.activity = `Produced ${production.toFixed(2)} kWh, selling @ ${sellPrice.toFixed(4)}`;
        logger.agentAction(this.id, 'USER_SOLAR_SELL', { production, sellPrice });
      } catch (err) {
        this.activity = `Mint error: ${err}`;
        logger.error(this.id, `User solar mint error: ${err}`);
      }
    } else {
      this.activity = 'No sunlight - idle';
    }
  }

  private async tickHome(hour: number, marketplace: Marketplace, currentBalance: number): Promise<void> {
    const consumption = getHomeConsumption(hour);
    this.lastConsumption = consumption;

    if (consumption > 0.01 && currentBalance >= consumption && this.mint) {
      try {
        await burnTokens(this.keypair, this.mint, this.tokenAccountAddress, consumption);
        this.totalBurned += consumption;
        this.activity = `Consuming ${consumption.toFixed(2)} kWh`;
      } catch (err) {
        this.activity = `Burn error: ${err}`;
        logger.error(this.id, `User home burn error: ${err}`);
      }
    } else if (currentBalance < consumption && currentBalance > 0.01 && this.mint) {
      try {
        await burnTokens(this.keypair, this.mint, this.tokenAccountAddress, currentBalance);
        this.totalBurned += currentBalance;
        this.activity = `Low supply! Consumed ${currentBalance.toFixed(2)}/${consumption.toFixed(2)} kWh`;
      } catch (err) {
        this.activity = `Burn error: ${err}`;
      }
    }

    const balanceAfter = Math.max(0, currentBalance - consumption);
    if (balanceAfter < 0.01 && this.lastConsumption > 0.01) {
      this.activity = 'No energy available!';
    }
    if (balanceAfter < 20) {
      const deficit = 20 - balanceAfter;
      const buyAmount = Math.min(deficit, consumption * 2);
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
      logger.agentAction(this.id, 'USER_HOME_BUY', { buyAmount, buyPrice });
    }
  }

  private async tickBattery(marketplace: Marketplace, currentBalance: number): Promise<void> {
    this.storageLevel = currentBalance;
    const currentPrice = marketplace.pricing.getPrice();
    const movingAvg = marketplace.pricing.getMovingAverage();

    if (currentPrice < movingAvg * 0.85 && this.storageLevel < BATTERY_MAX_CAPACITY) {
      const buyAmount = Math.min(5, BATTERY_MAX_CAPACITY - this.storageLevel);
      if (buyAmount > 0.01) {
        marketplace.orderbook.addOrder({
          agentId: this.id,
          side: 'buy',
          amount: buyAmount,
          pricePerUnit: currentPrice * 1.02,
          timestamp: Date.now(),
        });
        this.activity = `Buying ${buyAmount.toFixed(2)} kWh @ ${(currentPrice * 1.02).toFixed(4)} (price low)`;
        logger.agentAction(this.id, 'USER_BAT_BUY', { buyAmount, price: currentPrice });
      }
    } else if (currentPrice > movingAvg * 1.15 && this.storageLevel > 1) {
      const sellAmount = Math.min(5, this.storageLevel);
      if (sellAmount > 0.01) {
        marketplace.orderbook.addOrder({
          agentId: this.id,
          side: 'sell',
          amount: sellAmount,
          pricePerUnit: currentPrice * 0.98,
          timestamp: Date.now(),
        });
        this.activity = `Selling ${sellAmount.toFixed(2)} kWh @ ${(currentPrice * 0.98).toFixed(4)} (price high)`;
        logger.agentAction(this.id, 'USER_BAT_SELL', { sellAmount, price: currentPrice });
      }
    } else {
      this.activity = `Holding ${this.storageLevel.toFixed(2)} kWh | Price: ${currentPrice.toFixed(4)} vs Avg: ${movingAvg.toFixed(4)}`;
    }
  }

  getState(tokenBalance: number, solBalance: number): AgentState {
    const base: AgentState = {
      id: this.id,
      name: this.name,
      type: this.type,
      owner: 'user',
      walletAddress: this.keypair.publicKey.toBase58(),
      phantomWallet: this.phantomWallet,
      tokenBalance,
      solBalance,
      activity: this.activity,
      strategy: this.strategy,
      memory: this.memory,
    };

    if (this.role === 'solar') {
      base.production = this.lastProduction;
    } else if (this.role === 'home') {
      base.consumption = this.lastConsumption;
    } else if (this.role === 'battery') {
      base.storageLevel = this.storageLevel;
      base.storageCapacity = BATTERY_MAX_CAPACITY;
    }

    return base;
  }
}
