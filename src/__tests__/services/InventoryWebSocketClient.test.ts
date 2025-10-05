import { InventoryWebSocketClient } from '../../services/InventoryWebSocketClient';
import { MockWebSocketConstructor } from '../utils/mockWebSocketServer';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('InventoryWebSocketClient', () => {
  let client: InventoryWebSocketClient;
  const mockAgency = 'Alfa Romeo';
  const mockMonth = '10';
  const mockYear = '2025';
  const mockUserId = 'user123';
  const mockUserName = 'Test User';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    // Create new client
    client = new InventoryWebSocketClient(
      mockAgency,
      mockMonth,
      mockYear,
      mockUserId,
      mockUserName
    );
  });

  afterEach(() => {
    client.disconnect();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket with correct URL', () => {
      client.connect();
      
      expect(MockWebSocketConstructor).toHaveBeenCalledWith(
        `ws://localhost:5000/ws/inventory/${encodeURIComponent(mockAgency)}/${mockMonth}/${mockYear}`
      );
    });

    it('should send user_joined message on connection', async () => {
      client.connect();
      
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the mock WebSocket from the current client instance
      const mockWs = (client as any).ws;
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'user_joined',
          data: {
            agency: mockAgency,
            month: parseInt(mockMonth),
            year: parseInt(mockYear),
            userId: mockUserId,
            userName: mockUserName
          }
        })
      );
    });

    it('should handle connection open event', async () => {
      const onConnectionChange = jest.fn();
      client.onConnectionChange = onConnectionChange;

      client.connect();
      
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onConnectionChange).toHaveBeenCalledWith(true);
    });

    it('should handle connection close event', async () => {
      const onConnectionChange = jest.fn();
      client.onConnectionChange = onConnectionChange;

      client.connect();
      
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 50));
      
      client.disconnect();

      expect(onConnectionChange).toHaveBeenCalledWith(false);
    });

    it('should attempt reconnection on close', async () => {
      const connectSpy = jest.spyOn(client, 'connect');
      
      client.connect();
      
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Simulate connection close
      const mockWs = (client as any).ws;
      mockWs.simulateClose();
      
      // Wait for reconnection attempt (reconnect delay is 1000ms)
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      expect(connectSpy).toHaveBeenCalledTimes(2); // Initial + reconnection
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      client.connect();
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should handle user_joined message', () => {
      const onUserJoined = jest.fn();
      client.onUserJoined = onUserJoined;

      const message = {
        type: 'user_joined',
        data: {
          agency: mockAgency,
          month: 10,
          year: 2025,
          userId: 'other_user',
          userName: 'Other User'
        }
      };

      // Get the mock WebSocket from the current client instance
      const mockWs = (client as any).ws;
      mockWs.simulateMessage(message);

      expect(onUserJoined).toHaveBeenCalledWith({
        userId: 'other_user',
        userName: 'Other User'
      });
    });

    it('should handle scan_added message', () => {
      const onScanAdded = jest.fn();
      client.onScanAdded = onScanAdded;

      const message = {
        type: 'scan_added',
        data: {
          agency: mockAgency,
          month: 10,
          year: 2025,
          userId: 'other_user',
          userName: 'Other User',
          scanData: {
            code: 'ABC123',
            user: 'Other User',
            timestamp: '2025-01-15T10:30:00.000Z'
          }
        }
      };

      // Get the mock WebSocket from the current client instance
      const mockWs = (client as any).ws;
      mockWs.simulateMessage(message);

      expect(onScanAdded).toHaveBeenCalledWith({
        userId: 'other_user',
        userName: 'Other User',
        scanData: {
          code: 'ABC123',
          user: 'Other User',
          timestamp: '2025-01-15T10:30:00.000Z'
        }
      });
    });

    it('should handle inventory_completed message', () => {
      const onInventoryCompleted = jest.fn();
      client.onInventoryCompleted = onInventoryCompleted;

      const message = {
        type: 'inventory_completed',
        data: {
          agency: mockAgency,
          month: 10,
          year: 2025,
          completedBy: 'Other User',
          inventoryId: 'inv_123',
          message: 'Inventory completed by Other User'
        }
      };

      // Get the mock WebSocket from the current client instance
      const mockWs = (client as any).ws;
      mockWs.simulateMessage(message);

      expect(onInventoryCompleted).toHaveBeenCalledWith({
        completedBy: 'Other User',
        inventoryId: 'inv_123',
        message: 'Inventory completed by Other User'
      });
    });

    it('should handle session_terminated message', () => {
      const onSessionTerminated = jest.fn();
      client.onSessionTerminated = onSessionTerminated;

      const message = {
        type: 'session_terminated',
        data: {
          agency: mockAgency,
          month: 10,
          year: 2025,
          completedBy: 'Other User',
          message: 'Session terminated by Other User'
        }
      };

      // Get the mock WebSocket from the current client instance
      const mockWs = (client as any).ws;
      mockWs.simulateMessage(message);

      expect(onSessionTerminated).toHaveBeenCalledWith({
        completedBy: 'Other User',
        message: 'Session terminated by Other User'
      });
    });

    it('should handle pong message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const message = {
        type: 'pong',
        data: {
          timestamp: '2025-01-15T10:30:00.000Z'
        }
      };

      // Get the mock WebSocket from the current client instance
      const mockWs = (client as any).ws;
      mockWs.simulateMessage(message);

      expect(consoleSpy).toHaveBeenCalledWith('🏓 Pong received');
      
      consoleSpy.mockRestore();
    });

    it('should handle error message', () => {
      const onError = jest.fn();
      client.onError = onError;

      const message = {
        type: 'error',
        data: {
          message: 'Test error message'
        }
      };

      // Get the mock WebSocket from the current client instance
      const mockWs = (client as any).ws;
      mockWs.simulateMessage(message);

      expect(onError).toHaveBeenCalledWith('Test error message');
    });

    it('should ignore messages from self', () => {
      const onScanAdded = jest.fn();
      client.onScanAdded = onScanAdded;

      const message = {
        type: 'scan_added',
        data: {
          agency: mockAgency,
          month: 10,
          year: 2025,
          userId: mockUserId, // Same as current user
          userName: mockUserName,
          scanData: {
            code: 'ABC123',
            user: mockUserName,
            timestamp: '2025-01-15T10:30:00.000Z'
          }
        }
      };

      // Get the mock WebSocket from the current client instance
      const mockWs = (client as any).ws;
      mockWs.simulateMessage(message);

      expect(onScanAdded).not.toHaveBeenCalled();
    });
  });

  describe('API Integration', () => {
    beforeEach(async () => {
      client.connect();
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should call addScan API correctly', async () => {
      await client.addScan('ABC123');

      expect(fetch).toHaveBeenCalledWith('/api/inventory/save-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency: mockAgency,
          month: mockMonth,
          year: mockYear,
          code: 'ABC123',
          user: mockUserId,
          userName: mockUserName
        })
      });
    });

    it('should call removeScan API correctly', async () => {
      await client.removeScan('ABC123');

      expect(fetch).toHaveBeenCalledWith('/api/inventory/delete-scanned-entry', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency: mockAgency,
          barcode: 'ABC123',
          month: mockMonth,
          year: mockYear
        })
      });
    });

    it('should call completeInventory API correctly', async () => {
      await client.completeInventory();

      expect(fetch).toHaveBeenCalledWith('/api/inventory/finish-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency: mockAgency,
          month: mockMonth,
          year: mockYear,
          user: mockUserId
        })
      });
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(client.addScan('ABC123')).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('Ping/Pong Health Check', () => {
    it('should send ping every 30 seconds', () => {
      jest.useFakeTimers();
      
      client.connect();
      
      // Get the mock WebSocket from the current client instance
      const mockWs = (client as any).ws;
      const sendSpy = jest.spyOn(mockWs, 'send');

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'ping',
          data: {
            agency: mockAgency,
            month: parseInt(mockMonth),
            year: parseInt(mockYear),
            timestamp: expect.any(String)
          }
        })
      );
      
      jest.useRealTimers();
    });

    it('should stop ping interval on disconnect', () => {
      jest.useFakeTimers();
      
      client.connect();
      
      // Get the mock WebSocket from the current client instance
      const mockWs = (client as any).ws;
      const sendSpy = jest.spyOn(mockWs, 'send');

      client.disconnect();

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      expect(sendSpy).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('Connection Status', () => {
    it('should return correct connection status', async () => {
      expect(client.getConnectionStatus()).toBe(false);
      
      client.connect();
      
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(client.getConnectionStatus()).toBe(true);
      
      client.disconnect();
      expect(client.getConnectionStatus()).toBe(false);
    });

    it('should return reconnect attempts count', () => {
      expect(client.getReconnectAttempts()).toBe(0);
    });
  });
});
