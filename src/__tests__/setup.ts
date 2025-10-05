// Test setup file
import '@testing-library/jest-dom';

// Mock WebSocket globally
import { MockWebSocketConstructor, mockWebSocketServer } from './utils/mockWebSocketServer';

// Mock global WebSocket
(global as any).WebSocket = MockWebSocketConstructor;

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Reset mock WebSocket server
  mockWebSocketServer.removeAllListeners();
  
  // Mock fetch to return successful responses by default
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true })
  });

  // Suppress console errors and warnings in tests unless needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
