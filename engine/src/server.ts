import { WebSocketServer, WebSocket } from 'ws';
import { MarketState, WsClientMessage, WsJoinAck, WsLeaveAck, WsStateMessage } from './market/types.js';
import { WS_PORT } from './config.js';
import { UserManager } from './agents/userManager.js';
import { Marketplace } from './market/marketplace.js';
import { logger } from './utils/index.js';

let wss: WebSocketServer;
let userManager: UserManager;
let marketplace: Marketplace;

// Track which WebSocket belongs to which wallet
const wsToWallet = new Map<WebSocket, string>();

export function initServer(um: UserManager, mp: Marketplace): WebSocketServer {
  userManager = um;
  marketplace = mp;

  wss = new WebSocketServer({ port: WS_PORT });

  wss.on('connection', (ws) => {
    console.log('Dashboard connected');

    ws.on('message', async (raw) => {
      try {
        const msg: WsClientMessage = JSON.parse(raw.toString());
        await handleMessage(ws, msg);
      } catch (err) {
        logger.error('WS', `Failed to parse message: ${err}`);
      }
    });

    ws.on('close', () => {
      console.log('Dashboard disconnected');
      // Auto-remove user agent if this websocket had one
      const wallet = wsToWallet.get(ws);
      if (wallet) {
        const agent = userManager.getUser(wallet);
        if (agent) {
          marketplace.clearTradesForAgent(agent.id);
          marketplace.unregisterAgent(agent.id);
          userManager.removeUser(wallet);
          logger.info('WS', `Auto-removed user agent for wallet ${wallet.slice(0, 8)}...`);
        }
        wsToWallet.delete(ws);
      }
    });
  });

  console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
  return wss;
}

async function handleMessage(ws: WebSocket, msg: WsClientMessage): Promise<void> {
  switch (msg.type) {
    case 'join': {
      logger.info('WS', `Join request received: wallet=${msg.phantomWallet.slice(0, 8)}... role=${msg.role}`);
      try {
        if (userManager.hasUser(msg.phantomWallet)) {
          const ack: WsJoinAck = { type: 'join_ack', success: false, error: 'Wallet already joined' };
          ws.send(JSON.stringify(ack));
          return;
        }

        const agent = await userManager.addUser(msg.phantomWallet, msg.role);

        // Register agent in marketplace
        marketplace.registerAgent(agent.id, agent.keypair, agent.tokenAccountAddress);

        // Map this websocket to the wallet
        wsToWallet.set(ws, msg.phantomWallet);

        const ack: WsJoinAck = { type: 'join_ack', success: true, agentId: agent.id };
        ws.send(JSON.stringify(ack));

        logger.info('WS', `User joined: ${agent.id} (role: ${msg.role})`);
      } catch (err) {
        const ack: WsJoinAck = { type: 'join_ack', success: false, error: String(err) };
        ws.send(JSON.stringify(ack));
        logger.error('WS', `Join failed: ${err}`);
      }
      break;
    }

    case 'leave': {
      const agent = userManager.getUser(msg.phantomWallet);
      if (agent) {
        marketplace.clearTradesForAgent(agent.id);
        marketplace.unregisterAgent(agent.id);
        userManager.removeUser(msg.phantomWallet);
        wsToWallet.delete(ws);
      }

      const ack: WsLeaveAck = { type: 'leave_ack', success: true };
      ws.send(JSON.stringify(ack));
      logger.info('WS', `User left: ${msg.phantomWallet.slice(0, 8)}...`);
      break;
    }
  }
}

export function broadcastState(state: MarketState): void {
  if (!wss) return;

  const envelope: WsStateMessage = { type: 'state', data: state };
  const data = JSON.stringify(envelope);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
