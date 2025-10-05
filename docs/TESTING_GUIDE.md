# WebSocket Testing Guide

This guide provides comprehensive testing instructions for the WebSocket implementation in the car inventory app.

## Test Structure

```
src/__tests__/
├── utils/
│   └── mockWebSocketServer.ts     # Mock WebSocket server for testing
├── services/
│   └── InventoryWebSocketClient.test.ts  # Unit tests for WebSocket client
├── integration/
│   └── realtimeInventory.test.ts  # Integration tests for real-time features
├── components/
│   └── InventoryPage.test.tsx     # Component tests for InventoryPage
├── manual/
│   └── manualTestScript.js        # Manual testing script
└── setup.ts                       # Test setup and configuration
```

## Running Tests

### Prerequisites

Install testing dependencies:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest @types/jest
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only WebSocket tests
npm run test:websocket

# Run only integration tests
npm run test:integration

# Manual testing instructions
npm run test:manual
```

## Test Types

### 1. Unit Tests (`InventoryWebSocketClient.test.ts`)

Tests individual WebSocket client functionality:

- **Connection Management**
  - WebSocket connection establishment
  - User join message sending
  - Connection status tracking
  - Automatic reconnection

- **Message Handling**
  - User joined/left events
  - Scan added/removed events
  - Inventory completion events
  - Session termination events
  - Error handling
  - Ping/pong health checks

- **API Integration**
  - Scan addition API calls
  - Scan removal API calls
  - Inventory completion API calls
  - Error handling for API failures

### 2. Integration Tests (`realtimeInventory.test.ts`)

Tests multi-user collaboration scenarios:

- **Multi-user Collaboration**
  - Multiple users in same room
  - Real-time event broadcasting
  - User join/leave handling
  - Cross-user event filtering

- **Real-time Scan Management**
  - Scan addition and removal
  - Event propagation between users
  - Data consistency

- **Session Management**
  - Session termination on completion
  - Proper cleanup on disconnect
  - Error recovery

### 3. Component Tests (`InventoryPage.test.tsx`)

Tests React component integration:

- **WebSocket Client Integration**
  - Client initialization
  - Event handler setup
  - Component lifecycle management

- **User Interface**
  - Connection status display
  - Event notifications
  - Error handling UI

### 4. Manual Tests (`manualTestScript.js`)

Browser console testing script for real-world scenarios:

```javascript
// Load the manual test script in browser console
// This will create two WebSocket clients and test real-time collaboration

// Available test commands:
window.testClients.client1.connect()           // Connect client 1
window.testClients.client2.connect()           // Connect client 2
window.testClients.client1.addScan("CODE123")  // Add scan
window.testClients.client1.removeScan("CODE123") // Remove scan
window.testClients.client1.completeInventory() // Complete inventory
```

## Test Scenarios

### Scenario 1: Basic Connection
1. Create WebSocket client
2. Connect to server
3. Verify connection status
4. Send user_joined message
5. Disconnect

### Scenario 2: Multi-user Collaboration
1. Create two clients for same room
2. Connect both clients
3. Verify both receive user_joined events
4. Simulate scan addition from one user
5. Verify other user receives scan_added event
6. Simulate inventory completion
7. Verify both users receive completion events

### Scenario 3: Error Handling
1. Create client and connect
2. Simulate connection error
3. Verify error handling
4. Simulate connection drop
5. Verify reconnection attempt

### Scenario 4: API Integration
1. Create connected client
2. Call addScan API
3. Verify API call parameters
4. Simulate API error
5. Verify error handling

## Mock WebSocket Server

The test suite includes a mock WebSocket server that simulates the backend behavior:

```typescript
import { mockWebSocketServer } from '../utils/mockWebSocketServer';

// Create clients
const client1 = mockWebSocketServer.createClient('room1', 'client1');
const client2 = mockWebSocketServer.createClient('room1', 'client2');

// Broadcast messages
mockWebSocketServer.broadcastToRoom('room1', {
  type: 'scan_added',
  data: { /* message data */ }
}, 'client1'); // Exclude sender
```

## Coverage Goals

- **Unit Tests**: 90%+ coverage for WebSocket client
- **Integration Tests**: Cover all real-time collaboration scenarios
- **Component Tests**: Cover all WebSocket-related UI interactions
- **Manual Tests**: Verify real-world functionality

## Debugging Tests

### Enable Debug Logging
```bash
DEBUG=* npm test
```

### Run Specific Test
```bash
npm test -- --testNamePattern="should handle user joined message"
```

### Run Tests in Specific File
```bash
npm test -- InventoryWebSocketClient.test.ts
```

### Debug Mode
```bash
npm test -- --detectOpenHandles --forceExit
```

## Common Issues

### 1. WebSocket Connection Fails
- Check if mock WebSocket server is properly initialized
- Verify URL format matches backend specification
- Check for port conflicts

### 2. Tests Timeout
- Increase test timeout in jest.config.js
- Check for unhandled promises
- Verify mock cleanup in afterEach

### 3. Mock Not Working
- Ensure mocks are properly reset in beforeEach
- Check mock implementation matches expected interface
- Verify mock is called with correct parameters

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    npm run test:coverage
    npm run test:integration
```

## Performance Testing

For load testing WebSocket connections:

```javascript
// Create multiple clients
const clients = [];
for (let i = 0; i < 100; i++) {
  const client = new InventoryWebSocketClient('Agency', '10', '2025', `user${i}`, `User ${i}`);
  clients.push(client);
  client.connect();
}
```

## Best Practices

1. **Always clean up** WebSocket connections in afterEach
2. **Use realistic data** in test scenarios
3. **Test error conditions** as well as success cases
4. **Mock external dependencies** to isolate units under test
5. **Use async/await** properly for asynchronous operations
6. **Verify both positive and negative** test cases

## Troubleshooting

### Test Fails with "WebSocket is not defined"
- Ensure mock WebSocket is properly set up in setup.ts
- Check that tests are running in jsdom environment

### Tests Hang or Timeout
- Check for unclosed WebSocket connections
- Verify all promises are properly awaited
- Use jest.useFakeTimers() for time-based tests

### Mock Not Working
- Ensure mocks are reset between tests
- Check mock implementation matches real interface
- Verify mock is called with correct parameters

This testing suite ensures the WebSocket implementation is robust, reliable, and ready for production use.
