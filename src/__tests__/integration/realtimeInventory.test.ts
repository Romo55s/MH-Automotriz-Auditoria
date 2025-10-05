import { InventoryWebSocketClient } from '../../services/InventoryWebSocketClient';
import { mockWebSocketServer } from '../utils/mockWebSocketServer';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Real-time Inventory Integration Tests', () => {
  let client1: InventoryWebSocketClient;
  let client2: InventoryWebSocketClient;
  const mockAgency = 'Alfa Romeo';
  const mockMonth = '10';
  const mockYear = '2025';

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    client1?.disconnect();
    client2?.disconnect();
  });

  describe('Multi-user Collaboration', () => {
    it('should handle multiple users in same room', (done) => {
      const user1Events: any[] = [];
      const user2Events: any[] = [];

      // Create two clients for the same room
      client1 = new InventoryWebSocketClient(
        mockAgency,
        mockMonth,
        mockYear,
        'user1',
        'User 1'
      );

      client2 = new InventoryWebSocketClient(
        mockAgency,
        mockMonth,
        mockYear,
        'user2',
        'User 2'
      );

      // Set up event handlers
      client1.onUserJoined = (data) => user1Events.push({ type: 'user_joined', data });
      client1.onScanAdded = (data) => user1Events.push({ type: 'scan_added', data });
      client1.onInventoryCompleted = (data) => user1Events.push({ type: 'inventory_completed', data });

      client2.onUserJoined = (data) => user2Events.push({ type: 'user_joined', data });
      client2.onScanAdded = (data) => user2Events.push({ type: 'scan_added', data });
      client2.onInventoryCompleted = (data) => user2Events.push({ type: 'inventory_completed', data });

      // Connect both clients
      client1.connect();
      client2.connect();

      // Wait for connections to be established
      setTimeout(() => {
        // Simulate user 2 adding a scan
        const scanMessage = {
          type: 'scan_added',
          data: {
            agency: mockAgency,
            month: 10,
            year: 2025,
            userId: 'user2',
            userName: 'User 2',
            scanData: {
              code: 'ABC123',
              user: 'User 2',
              timestamp: '2025-01-15T10:30:00.000Z'
            }
          }
        };

        // Broadcast to room (simulating server behavior)
        mockWebSocketServer.broadcastToRoom(
          `${mockAgency}/${mockMonth}/${mockYear}`,
          scanMessage,
          'user2' // Exclude sender
        );

        // Simulate user 2 completing inventory
        const completionMessage = {
          type: 'inventory_completed',
          data: {
            agency: mockAgency,
            month: 10,
            year: 2025,
            completedBy: 'User 2',
            inventoryId: 'inv_123',
            message: 'Inventory completed by User 2'
          }
        };

        mockWebSocketServer.broadcastToRoom(
          `${mockAgency}/${mockMonth}/${mockYear}`,
          completionMessage
        );

        // Wait for events to be processed
        setTimeout(() => {
          // User 1 should receive scan_added and inventory_completed events
          expect(user1Events).toHaveLength(2);
          expect(user1Events[0].type).toBe('scan_added');
          expect(user1Events[1].type).toBe('inventory_completed');

          // User 2 should not receive their own scan_added event
          expect(user2Events).toHaveLength(1);
          expect(user2Events[0].type).toBe('inventory_completed');

          done();
        }, 100);
      }, 100);
    });

    it('should handle user leaving and rejoining', (done) => {
      const events: any[] = [];

      client1 = new InventoryWebSocketClient(
        mockAgency,
        mockMonth,
        mockYear,
        'user1',
        'User 1'
      );

      client1.onUserJoined = (data) => events.push({ type: 'user_joined', data });
      client1.onUserLeft = (data) => events.push({ type: 'user_left', data });

      client1.connect();

      setTimeout(() => {
        // Simulate another user joining
        const joinMessage = {
          type: 'user_joined',
          data: {
            agency: mockAgency,
            month: 10,
            year: 2025,
            userId: 'user2',
            userName: 'User 2'
          }
        };

        mockWebSocketServer.broadcastToRoom(
          `${mockAgency}/${mockMonth}/${mockYear}`,
          joinMessage,
          'user1'
        );

        // Simulate user leaving
        const leaveMessage = {
          type: 'user_left',
          data: {
            agency: mockAgency,
            month: 10,
            year: 2025,
            userId: 'user2',
            userName: 'User 2'
          }
        };

        mockWebSocketServer.broadcastToRoom(
          `${mockAgency}/${mockMonth}/${mockYear}`,
          leaveMessage,
          'user1'
        );

        setTimeout(() => {
          expect(events).toHaveLength(2);
          expect(events[0].type).toBe('user_joined');
          expect(events[1].type).toBe('user_left');
          done();
        }, 100);
      }, 100);
    });
  });

  describe('Real-time Scan Management', () => {
    it('should handle scan addition and removal', (done) => {
      const events: any[] = [];

      client1 = new InventoryWebSocketClient(
        mockAgency,
        mockMonth,
        mockYear,
        'user1',
        'User 1'
      );

      client1.onScanAdded = (data) => events.push({ type: 'scan_added', data });
      client1.onScanRemoved = (data) => events.push({ type: 'scan_removed', data });

      client1.connect();

      setTimeout(() => {
        // Simulate scan addition
        const addMessage = {
          type: 'scan_added',
          data: {
            agency: mockAgency,
            month: 10,
            year: 2025,
            userId: 'user2',
            userName: 'User 2',
            scanData: {
              code: 'ABC123',
              user: 'User 2',
              timestamp: '2025-01-15T10:30:00.000Z'
            }
          }
        };

        mockWebSocketServer.broadcastToRoom(
          `${mockAgency}/${mockMonth}/${mockYear}`,
          addMessage,
          'user1'
        );

        // Simulate scan removal
        const removeMessage = {
          type: 'scan_removed',
          data: {
            agency: mockAgency,
            month: 10,
            year: 2025,
            userId: 'user2',
            userName: 'User 2',
            scanData: {
              code: 'ABC123',
              user: 'User 2',
              timestamp: '2025-01-15T10:31:00.000Z'
            }
          }
        };

        mockWebSocketServer.broadcastToRoom(
          `${mockAgency}/${mockMonth}/${mockYear}`,
          removeMessage,
          'user1'
        );

        setTimeout(() => {
          expect(events).toHaveLength(2);
          expect(events[0].type).toBe('scan_added');
          expect(events[1].type).toBe('scan_removed');
          done();
        }, 100);
      }, 100);
    });
  });

  describe('Session Termination', () => {
    it('should handle session termination when inventory is completed', (done) => {
      const events: any[] = [];

      client1 = new InventoryWebSocketClient(
        mockAgency,
        mockMonth,
        mockYear,
        'user1',
        'User 1'
      );

      client1.onInventoryCompleted = (data) => events.push({ type: 'inventory_completed', data });
      client1.onSessionTerminated = (data) => events.push({ type: 'session_terminated', data });

      client1.connect();

      setTimeout(() => {
        // Simulate inventory completion
        const completionMessage = {
          type: 'inventory_completed',
          data: {
            agency: mockAgency,
            month: 10,
            year: 2025,
            completedBy: 'User 2',
            inventoryId: 'inv_123',
            message: 'Inventory completed by User 2'
          }
        };

        mockWebSocketServer.broadcastToRoom(
          `${mockAgency}/${mockMonth}/${mockYear}`,
          completionMessage
        );

        // Simulate session termination
        const terminationMessage = {
          type: 'session_terminated',
          data: {
            agency: mockAgency,
            month: 10,
            year: 2025,
            completedBy: 'User 2',
            message: 'Tu sesión ha sido terminada porque User 2 completó el inventario.'
          }
        };

        mockWebSocketServer.broadcastToRoom(
          `${mockAgency}/${mockMonth}/${mockYear}`,
          terminationMessage
        );

        setTimeout(() => {
          expect(events).toHaveLength(2);
          expect(events[0].type).toBe('inventory_completed');
          expect(events[1].type).toBe('session_terminated');
          done();
        }, 100);
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors gracefully', (done) => {
      const errors: string[] = [];

      client1 = new InventoryWebSocketClient(
        mockAgency,
        mockMonth,
        mockYear,
        'user1',
        'User 1'
      );

      client1.onError = (error) => errors.push(error);

      client1.connect();

      setTimeout(() => {
        // Simulate error message
        const errorMessage = {
          type: 'error',
          data: {
            message: 'Connection error'
          }
        };

        const mockWs = (global as any).WebSocket.mock.results[0].value;
        mockWs.simulateMessage(errorMessage);

        setTimeout(() => {
          expect(errors).toContain('Connection error');
          done();
        }, 100);
      }, 100);
    });

    it('should handle connection drops', (done) => {
      const connectionChanges: boolean[] = [];

      client1 = new InventoryWebSocketClient(
        mockAgency,
        mockMonth,
        mockYear,
        'user1',
        'User 1'
      );

      client1.onConnectionChange = (connected) => connectionChanges.push(connected);

      client1.connect();

      setTimeout(() => {
        // Simulate connection close
        const mockWs = (global as any).WebSocket.mock.results[0].value;
        mockWs.simulateClose();

        setTimeout(() => {
          expect(connectionChanges).toContain(true); // Initial connection
          expect(connectionChanges).toContain(false); // After close
          done();
        }, 100);
      }, 100);
    });
  });
});
