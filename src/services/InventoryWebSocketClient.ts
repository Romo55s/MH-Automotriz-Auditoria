// InventoryWebSocketClient - WebSocket client for real-time inventory collaboration
// This class matches the backend specification exactly
import { API_BASE_URL, WS_BASE_URL } from '../config/environment';

export interface WebSocketMessage {
  type: 'inventory_completed' | 'session_terminated' | 'data_updated' | 
        'user_joined' | 'user_left' | 'scan_added' | 'scan_removed' | 
        'ping' | 'pong' | 'error';
  data: {
    agency: string;
    month: number;
    year: number;
    userId?: string;
    userName?: string;
    completedBy?: string;
    inventoryId?: string;
    sessionId?: string;
    scanData?: {
      code: string;
      user: string;
      timestamp: string;
    };
    message?: string;
    timestamp?: string;
  };
}

export interface ScanData {
  code: string;
  user: string;
  timestamp: string;
}

export interface UserData {
  userId: string;
  userName: string;
}

export class InventoryWebSocketClient {
  private agency: string;
  private month: string;
  private year: string;
  private userId: string;
  private userName: string;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // 1 second
  private pingInterval: NodeJS.Timeout | null = null;

  // Event handlers
  public onUserJoined?: (data: UserData) => void;
  public onUserLeft?: (data: UserData) => void;
  public onScanAdded?: (data: { userId: string; userName: string; scanData: ScanData }) => void;
  public onScanRemoved?: (data: { userId: string; userName: string; scanData: ScanData }) => void;
  public onInventoryCompleted?: (data: { completedBy: string; inventoryId?: string; message?: string }) => void;
  public onSessionTerminated?: (data: { completedBy: string; message?: string }) => void;
  public onDataUpdated?: (data: { message?: string }) => void;
  public onError?: (error: string) => void;
  public onConnectionChange?: (connected: boolean) => void;

  constructor(agency: string, month: string, year: string, userId: string, userName: string) {
    this.agency = agency;
    this.month = month;
    this.year = year;
    this.userId = userId;
    this.userName = userName;
  }

  connect(): void {
    const wsUrl = `${WS_BASE_URL}/ws/inventory/${encodeURIComponent(this.agency)}/${this.month}/${this.year}`;
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectionChange?.(true);
      this.sendUserJoined();
      this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
      this.isConnected = false;
      this.onConnectionChange?.(false);
      this.stopPingInterval();
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onError?.('WebSocket connection error');
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('WebSocket message received:', message);

    switch (message.type) {
      case 'user_joined':
        this.handleUserJoined(message.data);
        break;
      case 'user_left':
        this.handleUserLeft(message.data);
        break;
      case 'scan_added':
        this.handleScanAdded(message.data);
        break;
      case 'scan_removed':
        this.handleScanRemoved(message.data);
        break;
      case 'inventory_completed':
        this.handleInventoryCompleted(message.data);
        break;
      case 'session_terminated':
        this.handleSessionTerminated(message.data);
        break;
      case 'data_updated':
        this.handleDataUpdated(message.data);
        break;
      case 'pong':
        console.log('🏓 Pong received');
        break;
      case 'error':
        console.error('WebSocket error:', message.data.message);
        this.onError?.(message.data.message || 'WebSocket error');
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleUserJoined(data: any): void {
    if (data.userId !== this.userId) {
      this.onUserJoined?.({
        userId: data.userId,
        userName: data.userName
      });
    }
  }

  private handleUserLeft(data: any): void {
    if (data.userId !== this.userId) {
      this.onUserLeft?.({
        userId: data.userId,
        userName: data.userName
      });
    }
  }

  private handleScanAdded(data: any): void {
    if (data.userId !== this.userId && data.scanData) {
      this.onScanAdded?.({
        userId: data.userId,
        userName: data.userName,
        scanData: data.scanData
      });
    }
  }

  private handleScanRemoved(data: any): void {
    if (data.userId !== this.userId && data.scanData) {
      this.onScanRemoved?.({
        userId: data.userId,
        userName: data.userName,
        scanData: data.scanData
      });
    }
  }

  private handleInventoryCompleted(data: any): void {
    this.onInventoryCompleted?.({
      completedBy: data.completedBy,
      inventoryId: data.inventoryId,
      message: data.message
    });
  }

  private handleSessionTerminated(data: any): void {
    this.onSessionTerminated?.({
      completedBy: data.completedBy,
      message: data.message
    });
  }

  private handleDataUpdated(data: any): void {
    this.onDataUpdated?.({
      message: data.message
    });
  }

  private sendUserJoined(): void {
    this.send({
      type: 'user_joined',
      data: {
        agency: this.agency,
        month: parseInt(this.month),
        year: parseInt(this.year),
        userId: this.userId,
        userName: this.userName
      }
    });
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendPing(): void {
    this.send({
      type: 'ping',
      data: {
        agency: this.agency,
        month: parseInt(this.month),
        year: parseInt(this.year),
        timestamp: new Date().toISOString()
      }
    });
  }

  private send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === 1) { // WebSocket.OPEN = 1
      this.ws.send(JSON.stringify(message));
      console.log('WebSocket message sent:', message);
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(`Reconnecting... attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.onError?.('Failed to reconnect to WebSocket');
    }
  }

  public disconnect(): void {
    console.log('Disconnecting WebSocket');
    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.onConnectionChange?.(false);
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  // API integration methods that match backend specification
  public async addScan(barcode: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/save-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency: this.agency,
          month: this.month,
          year: this.year,
          code: barcode,
          user: this.userId,
          userName: this.userName
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Scan added successfully');
    } catch (error) {
      console.error('Error adding scan:', error);
      throw error;
    }
  }

  public async removeScan(barcode: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/delete-scanned-entry`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency: this.agency,
          barcode: barcode,
          month: this.month,
          year: this.year
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Scan removed successfully');
    } catch (error) {
      console.error('Error removing scan:', error);
      throw error;
    }
  }

  public async completeInventory(): Promise<{ success: boolean; alreadyCompleted?: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/finish-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency: this.agency,
          month: this.month,
          year: this.year,
          user: this.userId
        })
      });

      if (!response.ok) {
        if (response.status === 400) {
          try {
            const errorData = await response.json();
            if (errorData.message?.includes('already completed')) {
              // Handle gracefully - don't throw error
              console.log('Inventory already completed by another user');
              return { success: false, alreadyCompleted: true };
            }
          } catch (parseError) {
            // If we can't parse the error response, still handle 400 gracefully
            console.log('Inventory may already be completed');
            return { success: false, alreadyCompleted: true };
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Inventory completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error completing inventory:', error);
      throw error;
    }
  }
}

// Utility functions for global WebSocket management
let globalWebSocketClient: InventoryWebSocketClient | null = null;

export function startInventory(agency: string, month: string, year: string, userId: string, userName: string): InventoryWebSocketClient {
  // Disconnect existing client if any
  if (globalWebSocketClient) {
    globalWebSocketClient.disconnect();
  }

  // Create new client
  globalWebSocketClient = new InventoryWebSocketClient(agency, month, year, userId, userName);
  globalWebSocketClient.connect();

  return globalWebSocketClient;
}

export function stopInventory(): void {
  if (globalWebSocketClient) {
    globalWebSocketClient.disconnect();
    globalWebSocketClient = null;
  }
}

export function getCurrentWebSocketClient(): InventoryWebSocketClient | null {
  return globalWebSocketClient;
}

// Handle page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stopInventory();
  });
}
