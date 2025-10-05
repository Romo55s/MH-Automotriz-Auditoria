// Mock WebSocket Server for testing
import { EventEmitter } from 'events';

export interface MockWebSocketMessage {
  type: string;
  data: any;
}

export class MockWebSocketServer extends EventEmitter {
  private clients: Map<string, MockWebSocket> = new Map();
  private rooms: Map<string, Set<string>> = new Map();

  constructor() {
    super();
  }

  createClient(roomKey: string, clientId: string): MockWebSocket {
    const client = new MockWebSocket(clientId, roomKey, this);
    this.clients.set(clientId, client);
    
    // Add to room
    if (!this.rooms.has(roomKey)) {
      this.rooms.set(roomKey, new Set());
    }
    this.rooms.get(roomKey)!.add(clientId);

    // Emit connection event
    this.emit('connection', client);

    return client;
  }

  broadcastToRoom(roomKey: string, message: MockWebSocketMessage, excludeClientId?: string): void {
    const roomClients = this.rooms.get(roomKey);
    if (!roomClients) return;

    roomClients.forEach(clientId => {
      if (clientId !== excludeClientId) {
        const client = this.clients.get(clientId);
        if (client) {
          client.simulateMessage(message);
        }
      }
    });
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      const roomKey = client.roomKey;
      const roomClients = this.rooms.get(roomKey);
      if (roomClients) {
        roomClients.delete(clientId);
        if (roomClients.size === 0) {
          this.rooms.delete(roomKey);
        }
      }
      this.clients.delete(clientId);
    }
  }

  getRoomClients(roomKey: string): string[] {
    const roomClients = this.rooms.get(roomKey);
    return roomClients ? Array.from(roomClients) : [];
  }

  getClientCount(roomKey: string): number {
    return this.getRoomClients(roomKey).length;
  }
}

export class MockWebSocket extends EventEmitter {
  public readyState: number = 0; // CONNECTING initially
  public clientId: string;
  public roomKey: string;
  private server: MockWebSocketServer;
  private isConnected: boolean = false;
  public send: jest.Mock;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(clientId: string, roomKey: string, server: MockWebSocketServer) {
    super();
    this.clientId = clientId;
    this.roomKey = roomKey;
    this.server = server;
    this.send = jest.fn();
    
    // Simulate connection after a very short delay
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.isConnected = true;
      this.emit('open');
      // Also call the onopen handler if it's set
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 1);
  }

  close(code?: number, reason?: string): void {
    this.isConnected = false;
    this.readyState = 3; // CLOSED
    this.server.removeClient(this.clientId);
    this.emit('close', code, reason);
  }

  simulateMessage(message: MockWebSocketMessage): void {
    this.emit('message', { data: JSON.stringify(message) });
    // Also call the onmessage handler if it's set
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(message) } as MessageEvent);
    }
  }

  simulateError(error: Error): void {
    this.emit('error', error);
  }

  simulateClose(code: number = 1000, reason: string = 'Normal closure'): void {
    this.close(code, reason);
  }
}

// Global mock WebSocket for testing
export const mockWebSocketServer = new MockWebSocketServer();

// Mock WebSocket constructor
export const MockWebSocketConstructor = jest.fn().mockImplementation((url: string) => {
  const urlParts = url.split('/');
  const agency = decodeURIComponent(urlParts[urlParts.length - 3]);
  const month = urlParts[urlParts.length - 2];
  const year = urlParts[urlParts.length - 1];
  const roomKey = `${agency}/${month}/${year}`;
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const mockWs = mockWebSocketServer.createClient(roomKey, clientId);
  
  // Store the mock instance for later access in tests
  MockWebSocketConstructor.mockInstances = MockWebSocketConstructor.mockInstances || [];
  MockWebSocketConstructor.mockInstances.push(mockWs);
  
  return mockWs;
});

// Mock global WebSocket
(global as any).WebSocket = MockWebSocketConstructor;
