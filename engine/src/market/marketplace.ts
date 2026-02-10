import { OrderBook } from './orderbook.js';
import { PricingEngine } from './pricing.js';
import { Trade } from './types.js';
import { transferTokens, getTokenBalance } from '../chain/token.js';
import { Keypair, PublicKey } from '@solana/web3.js';
import { logger } from '../utils/index.js';

let nextTradeId = 1;

interface AgentAccounts {
  keypair: Keypair;
  tokenAccountAddress: PublicKey;
}

export class Marketplace {
  public orderbook: OrderBook;
  public pricing: PricingEngine;
  private trades: Trade[] = [];
  private agentAccounts: Map<string, AgentAccounts> = new Map();
  public totalTraded: number = 0;
  public totalTransactions: number = 0;

  // Callback for trade notifications
  public onTradeExecuted?: (trade: Trade) => void;

  constructor() {
    this.orderbook = new OrderBook();
    this.pricing = new PricingEngine();
  }

  registerAgent(agentId: string, keypair: Keypair, tokenAccountAddress: PublicKey): void {
    this.agentAccounts.set(agentId, { keypair, tokenAccountAddress });
  }

  unregisterAgent(agentId: string): void {
    this.agentAccounts.delete(agentId);
  }

  clearTradesForAgent(agentId: string): void {
    this.trades = this.trades.filter(
      t => t.sellerId !== agentId && t.buyerId !== agentId
    );
  }

  clearOrders(): void {
    this.orderbook.clearAll();
  }

  async matchOrders(simulatedTime: string): Promise<Trade[]> {
    const newTrades: Trade[] = [];
    const buyOrders = this.orderbook.getBestBuyOrders();
    const sellOrders = this.orderbook.getBestSellOrders();

    // Track how much each seller has available (fetch once)
    const sellerBalances = new Map<string, number>();
    for (const sellOrder of sellOrders) {
      if (!sellerBalances.has(sellOrder.agentId)) {
        const acct = this.agentAccounts.get(sellOrder.agentId);
        if (acct) {
          const bal = await getTokenBalance(acct.tokenAccountAddress);
          sellerBalances.set(sellOrder.agentId, bal);
        }
      }
    }

    for (const buyOrder of buyOrders) {
      if (buyOrder.amount - buyOrder.filled <= 0) continue;

      for (const sellOrder of sellOrders) {
        const sellRemaining = sellOrder.amount - sellOrder.filled;
        if (sellRemaining <= 0) continue;

        if (buyOrder.pricePerUnit < sellOrder.pricePerUnit) continue;
        if (buyOrder.agentId === sellOrder.agentId) continue;

        // Check seller actually has tokens
        const sellerAvailable = sellerBalances.get(sellOrder.agentId) || 0;
        if (sellerAvailable < 0.01) continue;

        const fillAmount = Math.min(
          buyOrder.amount - buyOrder.filled,
          sellOrder.amount - sellOrder.filled,
          sellerAvailable
        );

        if (fillAmount < 0.001) continue;

        const tradePrice = sellOrder.pricePerUnit;

        const seller = this.agentAccounts.get(sellOrder.agentId);
        const buyer = this.agentAccounts.get(buyOrder.agentId);
        if (!seller || !buyer) continue;

        let txSignature = '';
        try {
          txSignature = await transferTokens(
            seller.keypair,
            seller.tokenAccountAddress,
            buyer.tokenAccountAddress,
            fillAmount
          );
        } catch (err) {
          logger.error('TRADE', `Transfer failed: ${sellOrder.agentId} -> ${buyOrder.agentId}`, {
            amount: fillAmount,
            error: String(err),
          });
          // Mark seller as having 0 balance to avoid repeated failures
          sellerBalances.set(sellOrder.agentId, 0);
          continue;
        }

        // Update tracked balance
        sellerBalances.set(sellOrder.agentId, sellerAvailable - fillAmount);

        this.orderbook.fillOrder(buyOrder.id, fillAmount);
        this.orderbook.fillOrder(sellOrder.id, fillAmount);

        const trade: Trade = {
          id: `TRD-${nextTradeId++}`,
          buyerId: buyOrder.agentId,
          sellerId: sellOrder.agentId,
          amount: fillAmount,
          pricePerUnit: tradePrice,
          totalPrice: fillAmount * tradePrice,
          txSignature,
          timestamp: Date.now(),
          simulatedTime,
        };

        newTrades.push(trade);
        this.trades.push(trade);
        this.totalTraded += fillAmount;
        this.totalTransactions++;

        logger.trade({
          buyerId: trade.buyerId,
          sellerId: trade.sellerId,
          amount: trade.amount,
          pricePerUnit: trade.pricePerUnit,
          totalPrice: trade.totalPrice,
        });

        // Notify agents of trade execution
        if (this.onTradeExecuted) {
          this.onTradeExecuted(trade);
        }

        if (buyOrder.amount - buyOrder.filled <= 0) break;
      }
    }

    this.orderbook.clearFilledOrders();
    return newTrades;
  }

  reset(): void {
    this.trades = [];
    this.totalTraded = 0;
    this.totalTransactions = 0;
    this.orderbook.reset();
    this.pricing.reset();
    nextTradeId = 1;
  }

  getRecentTrades(count: number = 20): Trade[] {
    return this.trades.slice(-count);
  }

  getAllTrades(): Trade[] {
    return [...this.trades];
  }
}
