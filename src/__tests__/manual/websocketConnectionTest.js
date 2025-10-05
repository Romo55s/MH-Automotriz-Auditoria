// Manual WebSocket Connection Test
// Run this in the browser console to test WebSocket connectivity
// NOTE: This uses hardcoded localhost:5000 for development testing only

console.log('Testing WebSocket connection to backend...');

const testWebSocketConnection = () => {
  const agency = 'Alfa Romeo';
  const month = '10';
  const year = '2025';
  const wsUrl = `ws://localhost:5000/ws/inventory/${encodeURIComponent(agency)}/${month}/${year}`;
  
  console.log(`Attempting to connect to: ${wsUrl}`);
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('✅ WebSocket connection successful!');
    console.log('Backend WebSocket server is running on port 5000');
    
    // Send a test message
    ws.send(JSON.stringify({
      type: 'user_joined',
      data: {
        agency: agency,
        month: parseInt(month),
        year: parseInt(year),
        userId: 'test-user',
        userName: 'Test User'
      }
    }));
    
    // Close after 2 seconds
    setTimeout(() => {
      ws.close();
      console.log('Test connection closed');
    }, 2000);
  };
  
  ws.onerror = (error) => {
    console.error('❌ WebSocket connection failed!');
    console.error('This means the backend WebSocket server is not running on port 5000');
    console.error('Error details:', error);
    console.log('\n🔧 To fix this:');
    console.log('1. The backend team needs to implement the WebSocket server');
    console.log('2. Or you can run a mock server for testing');
    console.log('3. Check the BACKEND_WEBSOCKET_IMPLEMENTATION.md file for instructions');
  };
  
  ws.onclose = (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('📨 Received message:', message);
  };
};

// Run the test
testWebSocketConnection();
