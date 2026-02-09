import { Order } from './types.js';

let nextOrderId = 1;

export class OrderBook {
  private sellOrders: Order[] = [];
  private buyOrders: Order[] = [];

  addOrder(order: Omit<Order, 'id' | 'filled'>): Order {
    const fullOrder: Order = {
      ...order,
      id: `ORD-${nextOrderId++}`,
      filled: 0,
    };

    if (order.side === 'sell') {
      this.sellOrders.push(fullOrder);
      this.sellOrders.sort((a, b) => {
        const priceDiff = a.pricePerUnit - b.pricePerUnit;
        if (Math.abs(priceDiff) > 0.0001) return priceDiff;
        return Math.random() - 0.5;
      });
    } else {
      this.buyOrders.push(fullOrder);
      this.buyOrders.sort((a, b) => {
        const priceDiff = b.pricePerUnit - a.pricePerUnit;
        if (Math.abs(priceDiff) > 0.0001) return priceDiff;
        return Math.random() - 0.5;
      });
    }

    return fullOrder;
  }

  getBestSellOrders(): Order[] {
    return this.sellOrders.filter(o => o.amount - o.filled > 0);
  }

  getBestBuyOrders(): Order[] {
    return this.buyOrders.filter(o => o.amount - o.filled > 0);
  }

  getAllOpenOrders(): Order[] {
    return [
      ...this.sellOrders.filter(o => o.amount - o.filled > 0),
      ...this.buyOrders.filter(o => o.amount - o.filled > 0),
    ];
  }

  fillOrder(orderId: string, fillAmount: number): void {
    const order =
      this.sellOrders.find(o => o.id === orderId) ||
      this.buyOrders.find(o => o.id === orderId);
    if (order) {
      order.filled += fillAmount;
    }
  }

  clearFilledOrders(): void {
    this.sellOrders = this.sellOrders.filter(o => o.amount - o.filled > 0);
    this.buyOrders = this.buyOrders.filter(o => o.amount - o.filled > 0);
  }

  clearAll(): void {
    this.sellOrders = [];
    this.buyOrders = [];
  }

  getTotalSupply(): number {
    return this.sellOrders
      .filter(o => o.amount - o.filled > 0)
      .reduce((sum, o) => sum + (o.amount - o.filled), 0);
  }

  getTotalDemand(): number {
    return this.buyOrders
      .filter(o => o.amount - o.filled > 0)
      .reduce((sum, o) => sum + (o.amount - o.filled), 0);
  }
}
