import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { MarketState, WsClientMessage, WsJoinAck, WsLeaveAck, WsStateMessage, WsSimStatus } from './market/types.js';
import { PORT } from './config.js';
import { UserManager } from './agents/userManager.js';
import { Marketplace } from './market/marketplace.js';
import { logger } from './utils/index.js';

let wss: WebSocketServer;
let httpServer: http.Server;
let userManager: UserManager;
let marketplace: Marketplace;

// Track which WebSocket belongs to which wallet
const wsToWallet = new Map<WebSocket, string>();

// Current sim status (server tracks this to send on new connections)
let currentSimStatus: 'idle' | 'running' | 'completed' = 'idle';
let currentTick = 0;
let currentTotalTicks = 0;

// Idle timer
const IDLE_TIMEOUT_MS = 60_000; // 60 seconds
let idleTimer: ReturnType<typeof setTimeout> | null = null;

export interface EngineCallbacks {
  onStart: () => void;
  onRestart: () => void;
  onFirstClient: () => void;
  onLastClientGone: () => void;
}

let callbacks: EngineCallbacks;
const startTime = Date.now();

export function initServer(um: UserManager, mp: Marketplace, cb: EngineCallbacks): { wss: WebSocketServer; httpServer: http.Server } {
  userManager = um;
  marketplace = mp;
  callbacks = cb;

  // Create HTTP server with health endpoint
  httpServer = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: currentSimStatus,
        clients: wss ? wss.clients.size : 0,
        paused: idleTimer !== null,
        uptime: Math.floor((Date.now() - startTime) / 1000),
      }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  // Attach WebSocket server to HTTP server
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    console.log('Dashboard connected');

    // Cancel idle timer on new connection
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }

    // Notify engine if this is the first client
    if (wss.clients.size === 1) {
      callbacks.onFirstClient();
    }

    // Send current sim status to new connection immediately
    const statusMsg: WsSimStatus = {
      type: 'sim_status',
      status: currentSimStatus,
      tick: currentTick,
      totalTicks: currentTotalTicks,
    };
    ws.send(JSON.stringify(statusMsg));

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

      // Start idle timer when all clients disconnect
      if (wss.clients.size === 0) {
        logger.info('WS', `All clients disconnected, starting ${IDLE_TIMEOUT_MS / 1000}s idle timer`);
        idleTimer = setTimeout(() => {
          idleTimer = null;
          logger.info('WS', 'Idle timeout reached');
          callbacks.onLastClientGone();
        }, IDLE_TIMEOUT_MS);
      }
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (HTTP + WebSocket)`);
  });

  return { wss, httpServer };
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

    case 'start_sim': {
      logger.info('WS', 'Start simulation requested');
      callbacks.onStart();
      break;
    }

    case 'restart_sim': {
      logger.info('WS', 'Restart simulation requested');
      callbacks.onRestart();
      break;
    }
  }
}

export function broadcastSimStatus(status: 'idle' | 'running' | 'completed', tick?: number, totalTicks?: number): void {
  currentSimStatus = status;
  currentTick = tick ?? 0;
  currentTotalTicks = totalTicks ?? 0;

  if (!wss) return;

  const msg: WsSimStatus = {
    type: 'sim_status',
    status,
    tick,
    totalTicks,
  };
  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
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
