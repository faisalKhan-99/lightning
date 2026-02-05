'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketState } from '../lib/types';

const WS_URL = 'ws://localhost:8080';

export function useWebSocket() {
  const [state, setState] = useState<MarketState | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to engine');
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: MarketState = JSON.parse(event.data);
          setState(data);
        } catch (err) {
          console.error('Parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from engine');
        setConnected(false);
        wsRef.current = null;
        // Auto-reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectTimeoutRef.current = setTimeout(connect, 2000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { state, connected };
}
