import {
  BASE_PRICE,
  MIN_PRICE,
  MAX_PRICE,
  PRICE_SENSITIVITY,
  PRICE_HISTORY_LENGTH,
} from '../config.js';

export class PricingEngine {
  private priceHistory: number[] = [BASE_PRICE];
  private currentPrice: number = BASE_PRICE;

  recalculate(supply: number, demand: number): number {
    const denominator = Math.max(supply, 1);
    const ratio = (demand - supply) / denominator;
    const newPrice = BASE_PRICE * (1 + PRICE_SENSITIVITY * ratio);

    this.currentPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, newPrice));
    this.priceHistory.push(this.currentPrice);

    if (this.priceHistory.length > PRICE_HISTORY_LENGTH * 10) {
      this.priceHistory = this.priceHistory.slice(-PRICE_HISTORY_LENGTH * 10);
    }

    return this.currentPrice;
  }

  getPrice(): number {
    return this.currentPrice;
  }

  getMovingAverage(window: number = PRICE_HISTORY_LENGTH): number {
    const slice = this.priceHistory.slice(-window);
    return slice.reduce((sum, p) => sum + p, 0) / slice.length;
  }

  getPriceHistory(): number[] {
    return [...this.priceHistory];
  }
}
