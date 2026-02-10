'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketState, WsServerMessage } from '../lib/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

export type SimStatus = 'idle' | 'running' | 'completed';

export function useWebSocket() {
  const [state, setState] = useState<MarketState | null>(null);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [simStatus, setSimStatus] = useState<SimStatus>('idle');
  const [simTick, setSimTick] = useState(0);
  const [simTotalTicks, setSimTotalTicks] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectDelayRef = useRef(2000); // starts at 2s, max 30s

  const send = useCallback((msg: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('[WS] Sending:', JSON.stringify(msg));
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('[WS] Cannot send — WebSocket not open. readyState:', wsRef.current?.readyState);
    }
  }, []);

  const startSim = useCallback(() => {
    send({ type: 'start_sim' });
  }, [send]);

  const restartSim = useCallback(() => {
    send({ type: 'restart_sim' });
  }, [send]);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to engine');
        setConnected(true);
        reconnectDelayRef.current = 2000; // reset backoff on success
      };

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);

          // Check if it's an envelope message with a type field
          if (raw.type) {
            const msg = raw as WsServerMessage;
            switch (msg.type) {
              case 'state':
                setState(msg.data);
                // Derive sim status from system status
                if (msg.data.systemStatus === 'running') {
                  setSimStatus('running');
                }
                break;
              case 'join_ack':
                console.log('[WS] Received join_ack:', JSON.stringify(msg));
                setJoining(false);
                if (msg.success) {
                  setJoined(true);
                  setAgentId(msg.agentId || null);
                  setJoinError(null);
                } else {
                  setJoinError(msg.error || 'Join failed');
                }
                break;
              case 'leave_ack':
                setJoined(false);
                setAgentId(null);
                setJoinError(null);
                break;
              case 'sim_status':
                setSimStatus(msg.status);
                setSimTick(msg.tick ?? 0);
                setSimTotalTicks(msg.totalTicks ?? 0);
                break;
            }
          } else {
            // Backwards compatibility: treat as raw MarketState
            setState(raw as MarketState);
          }
        } catch (err) {
          console.error('Parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from engine');
        setConnected(false);
        wsRef.current = null;
        // Auto-reconnect with exponential backoff (2s → 30s)
        const delay = reconnectDelayRef.current;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
        reconnectDelayRef.current = Math.min(delay * 2, 30000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      const delay = reconnectDelayRef.current;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
      reconnectDelayRef.current = Math.min(delay * 2, 30000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return {
    state,
    connected,
    send,
    joined,
    agentId,
    joinError,
    joining,
    setJoining,
    simStatus,
    simTick,
    simTotalTicks,
    startSim,
    restartSim,
  };
}
