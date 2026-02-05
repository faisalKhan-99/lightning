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
  production?: number;
  consumption?: number;
  storageLevel?: number;
  storageCapacity?: number;
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
