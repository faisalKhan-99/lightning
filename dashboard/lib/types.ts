export interface PerformanceMemory {
  // Cumulative metrics
  totalProfit: number;           // SOL profit/loss from trades
  tradesWon: number;             // Trades where we got favorable price
  tradesLost: number;            // Trades where we got unfavorable price

  // Rolling metrics (updated each tick)
  recentProfits: number[];       // Last N trade profits (for trend)
  avgBuyPrice: number;           // Average price paid for energy
  avgSellPrice: number;          // Average price received for energy

  // Prediction tracking
  predictedPrices: number[];     // What we expected
  actualPrices: number[];        // What happened

  // Adaptive parameters (0-1 scale)
  riskLevel: number;             // Higher = more aggressive
  llmTrustScore: number;         // Higher = trust LLM more over fallback
}

export interface Order {
  id: string;
  agentId: string;
  side: 'buy' | 'sell';
  amount: number;
  pricePerUnit: number;
  timestamp: number;
  filled: number;
}

export interface Trade {
  id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  pricePerUnit: number;
  totalPrice: number;
  txSignature: string;
  timestamp: number;
  simulatedTime: string;
}

export interface AgentState {
  id: string;
  name: string;
  type: 'solar' | 'home' | 'battery';
  walletAddress: string;
  tokenBalance: number;
  solBalance: number;
  activity: string;
  strategy: string;
  reasoning?: string;
  production?: number;
  consumption?: number;
  storageLevel?: number;
  storageCapacity?: number;
  memory?: PerformanceMemory;    // Add for dashboard display
}

export interface MarketState {
  currentPrice: number;
  priceHistory: { time: string; price: number; simHour: number }[];
  agents: AgentState[];
  recentTrades: Trade[];
  openOrders: Order[];
  supplyDemand: { supply: number; demand: number };
  metrics: {
    totalMinted: number;
    totalBurned: number;
    totalTraded: number;
    totalTransactions: number;
  };
  simulatedTime: string;
  simulatedHour: number;
  dayNumber: number;
  tickCount: number;
  systemStatus: 'initializing' | 'running' | 'paused' | 'error';
}
