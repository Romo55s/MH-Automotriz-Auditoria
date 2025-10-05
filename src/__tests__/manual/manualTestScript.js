// Manual Testing Script for WebSocket Implementation
// Run this in the browser console to test WebSocket functionality

console.log('🧪 Starting WebSocket Manual Tests...');

// Test 1: Create WebSocket Client
console.log('\n1. Testing WebSocket Client Creation...');
const client1 = new InventoryWebSocketClient('Alfa Romeo', '10', '2025', 'user1', 'User 1');
const client2 = new InventoryWebSocketClient('Alfa Romeo', '10', '2025', 'user2', 'User 2');

// Test 2: Set up event handlers
console.log('\n2. Setting up event handlers...');
client1.onUserJoined = (data) => console.log('👤 Client 1: User joined:', data);
client1.onUserLeft = (data) => console.log('👋 Client 1: User left:', data);
client1.onScanAdded = (data) => console.log('📱 Client 1: Scan added:', data);
client1.onScanRemoved = (data) => console.log('🗑️ Client 1: Scan removed:', data);
client1.onInventoryCompleted = (data) => console.log('✅ Client 1: Inventory completed:', data);
client1.onSessionTerminated = (data) => console.log('🔚 Client 1: Session terminated:', data);
client1.onError = (error) => console.error('❌ Client 1: Error:', error);
client1.onConnectionChange = (connected) => console.log('🔌 Client 1: Connection:', connected ? 'Connected' : 'Disconnected');

client2.onUserJoined = (data) => console.log('👤 Client 2: User joined:', data);
client2.onUserLeft = (data) => console.log('👋 Client 2: User left:', data);
client2.onScanAdded = (data) => console.log('📱 Client 2: Scan added:', data);
client2.onScanRemoved = (data) => console.log('🗑️ Client 2: Scan removed:', data);
client2.onInventoryCompleted = (data) => console.log('✅ Client 2: Inventory completed:', data);
client2.onSessionTerminated = (data) => console.log('🔚 Client 2: Session terminated:', data);
client2.onError = (error) => console.error('❌ Client 2: Error:', error);
client2.onConnectionChange = (connected) => console.log('🔌 Client 2: Connection:', connected ? 'Connected' : 'Disconnected');

// Test 3: Connect clients
console.log('\n3. Connecting clients...');
client1.connect();
setTimeout(() => client2.connect(), 1000);

// Test 4: Test API calls
console.log('\n4. Testing API calls...');
setTimeout(async () => {
  try {
    console.log('Testing addScan...');
    await client1.addScan('TEST123');
    console.log('✅ addScan successful');
  } catch (error) {
    console.error('❌ addScan failed:', error);
  }
}, 2000);

setTimeout(async () => {
  try {
    console.log('Testing removeScan...');
    await client1.removeScan('TEST123');
    console.log('✅ removeScan successful');
  } catch (error) {
    console.error('❌ removeScan failed:', error);
  }
}, 3000);

setTimeout(async () => {
  try {
    console.log('Testing completeInventory...');
    await client1.completeInventory();
    console.log('✅ completeInventory successful');
  } catch (error) {
    console.error('❌ completeInventory failed:', error);
  }
}, 4000);

// Test 5: Test connection status
console.log('\n5. Testing connection status...');
setTimeout(() => {
  console.log('Client 1 connected:', client1.getConnectionStatus());
  console.log('Client 2 connected:', client2.getConnectionStatus());
  console.log('Client 1 reconnect attempts:', client1.getReconnectAttempts());
  console.log('Client 2 reconnect attempts:', client2.getReconnectAttempts());
}, 5000);

// Test 6: Test disconnection
console.log('\n6. Testing disconnection...');
setTimeout(() => {
  console.log('Disconnecting client 2...');
  client2.disconnect();
}, 6000);

// Test 7: Test reconnection
console.log('\n7. Testing reconnection...');
setTimeout(() => {
  console.log('Reconnecting client 2...');
  client2.connect();
}, 7000);

// Test 8: Cleanup
console.log('\n8. Cleanup...');
setTimeout(() => {
  console.log('Disconnecting all clients...');
  client1.disconnect();
  client2.disconnect();
  console.log('✅ Manual tests completed!');
}, 8000);

// Export clients for manual testing
window.testClients = {
  client1,
  client2
};

console.log('\n📋 Manual Test Commands:');
console.log('- window.testClients.client1.connect() - Connect client 1');
console.log('- window.testClients.client2.connect() - Connect client 2');
console.log('- window.testClients.client1.addScan("CODE123") - Add scan');
console.log('- window.testClients.client1.removeScan("CODE123") - Remove scan');
console.log('- window.testClients.client1.completeInventory() - Complete inventory');
console.log('- window.testClients.client1.disconnect() - Disconnect client 1');
console.log('- window.testClients.client2.disconnect() - Disconnect client 2');
