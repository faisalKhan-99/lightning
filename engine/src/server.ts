import { WebSocketServer, WebSocket } from 'ws';
import { MarketState } from './market/types.js';
import { WS_PORT } from './config.js';

let wss: WebSocketServer;

export function startWebSocketServer(): WebSocketServer {
  wss = new WebSocketServer({ port: WS_PORT });

  wss.on('connection', (ws) => {
    console.log('Dashboard connected');
    ws.on('close', () => console.log('Dashboard disconnected'));
  });

  console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
  return wss;
}

export function broadcastState(state: MarketState): void {
  if (!wss) return;

  const data = JSON.stringify(state);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
