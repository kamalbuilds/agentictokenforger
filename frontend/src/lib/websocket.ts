import { io, Socket } from 'socket.io-client';
import {
  WSEvent,
  LaunchUpdateEvent,
  RiskAlertEvent,
  PriceUpdateEvent,
} from './api/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

export class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    this.socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`WebSocket reconnect attempt ${attempt}`);
      this.reconnectAttempts = attempt;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Subscribe to launch updates
   */
  onLaunchUpdate(callback: (event: LaunchUpdateEvent) => void) {
    if (!this.socket) return;

    this.socket.on('launch:update', (data) => {
      callback({
        type: 'launch:update',
        data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Subscribe to risk alerts
   */
  onRiskAlert(callback: (event: RiskAlertEvent) => void) {
    if (!this.socket) return;

    this.socket.on('risk:alert', (data) => {
      callback({
        type: 'risk:alert',
        data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Subscribe to price updates
   */
  onPriceUpdate(callback: (event: PriceUpdateEvent) => void) {
    if (!this.socket) return;

    this.socket.on('price:update', (data) => {
      callback({
        type: 'price:update',
        data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Subscribe to liquidity updates
   */
  onLiquidityUpdate(callback: (event: WSEvent) => void) {
    if (!this.socket) return;

    this.socket.on('liquidity:update', (data) => {
      callback({
        type: 'liquidity:update',
        data,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Subscribe to any custom event
   */
  on(eventName: string, callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on(eventName, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(eventName: string, callback?: (data: any) => void) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(eventName, callback);
    } else {
      this.socket.off(eventName);
    }
  }

  /**
   * Emit an event to the server
   */
  emit(eventName: string, data: any) {
    if (!this.socket) return;
    this.socket.emit(eventName, data);
  }

  /**
   * Join a specific room (e.g., for token-specific updates)
   */
  joinRoom(roomName: string) {
    if (!this.socket) return;
    this.socket.emit('join:room', { room: roomName });
  }

  /**
   * Leave a specific room
   */
  leaveRoom(roomName: string) {
    if (!this.socket) return;
    this.socket.emit('leave:room', { room: roomName });
  }

  /**
   * Disconnect the WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
}

export function disconnectWebSocket() {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}
