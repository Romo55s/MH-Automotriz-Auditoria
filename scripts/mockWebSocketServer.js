#!/usr/bin/env node

// Mock WebSocket Server for Testing Real-time Inventory Features
// Run with: node scripts/mockWebSocketServer.js

const WebSocket = require('ws');
const http = require('http');

const PORT = 5000;
const WS_PATH = '/ws/inventory';

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server, 
  path: WS_PATH + '/*' // Match any path after /ws/inventory/
});

// Store active connections by room
const rooms = new Map();

// Parse room from URL
function parseRoomFromUrl(url) {
  const match = url.match(/\/ws\/inventory\/([^\/]+)\/(\d+)\/(\d+)/);
  if (match) {
    return {
      agency: decodeURIComponent(match[1]),
      month: match[2],
      year: match[3],
      roomKey: `${match[1]}_${match[2]}_${match[3]}`
    };
  }
  return null;
}

// Broadcast message to all clients in a room
function broadcastToRoom(roomKey, message, excludeClient = null) {
  const room = rooms.get(roomKey);
  if (room) {
    room.forEach(client => {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const roomInfo = parseRoomFromUrl(req.url);
  
  if (!roomInfo) {
    console.log('❌ Invalid WebSocket URL:', req.url);
    ws.close(1008, 'Invalid URL format');
    return;
  }

  console.log(`🔌 New connection to room: ${roomInfo.roomKey}`);
  
  // Add to room
  if (!rooms.has(roomInfo.roomKey)) {
    rooms.set(roomInfo.roomKey, new Set());
  }
  rooms.get(roomInfo.roomKey).add(ws);
  
  // Store room info on the connection
  ws.roomInfo = roomInfo;
  ws.userId = null;
  ws.userName = null;

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 Received: ${message.type} in room ${roomInfo.roomKey}`);
      
      switch (message.type) {
        case 'user_joined':
          ws.userId = message.data.userId;
          ws.userName = message.data.userName;
          console.log(`👤 User joined: ${ws.userName} (${ws.userId})`);
          
          // Broadcast to other users in the room
          broadcastToRoom(roomInfo.roomKey, {
            type: 'user_joined',
            data: {
              agency: roomInfo.agency,
              month: parseInt(roomInfo.month),
              year: parseInt(roomInfo.year),
              userId: ws.userId,
              userName: ws.userName,
              timestamp: new Date().toISOString()
            }
          }, ws);
          
          // Send confirmation back to the user
          ws.send(JSON.stringify({
            type: 'user_joined',
            data: {
              agency: roomInfo.agency,
              month: parseInt(roomInfo.month),
              year: parseInt(roomInfo.year),
              userId: ws.userId,
              userName: ws.userName,
              timestamp: new Date().toISOString()
            }
          }));
          break;
          
        case 'ping':
          // Respond to ping with pong
          ws.send(JSON.stringify({
            type: 'pong',
            data: {
              agency: roomInfo.agency,
              month: parseInt(roomInfo.month),
              year: parseInt(roomInfo.year),
              timestamp: new Date().toISOString()
            }
          }));
          break;
          
        case 'scan_added':
          // Broadcast scan added to all users in room
          broadcastToRoom(roomInfo.roomKey, {
            type: 'scan_added',
            data: {
              agency: roomInfo.agency,
              month: parseInt(roomInfo.month),
              year: parseInt(roomInfo.year),
              userId: ws.userId,
              userName: ws.userName,
              scanData: message.data.scanData,
              timestamp: new Date().toISOString()
            }
          });
          break;
          
        case 'scan_removed':
          // Broadcast scan removed to all users in room
          broadcastToRoom(roomInfo.roomKey, {
            type: 'scan_removed',
            data: {
              agency: roomInfo.agency,
              month: parseInt(roomInfo.month),
              year: parseInt(roomInfo.year),
              userId: ws.userId,
              userName: ws.userName,
              scanData: message.data.scanData,
              timestamp: new Date().toISOString()
            }
          });
          break;
          
        case 'inventory_completed':
          // Broadcast inventory completed to all users in room
          console.log(`🏁 Inventory completed by ${ws.userName} in room ${roomInfo.roomKey}`);
          broadcastToRoom(roomInfo.roomKey, {
            type: 'inventory_completed',
            data: {
              agency: roomInfo.agency,
              month: parseInt(roomInfo.month),
              year: parseInt(roomInfo.year),
              completedBy: ws.userName,
              inventoryId: `inv_${Date.now()}`,
              message: `El inventario ha sido completado por ${ws.userName}`,
              timestamp: new Date().toISOString()
            }
          });
          
          // Also send session_terminated to all users
          setTimeout(() => {
            broadcastToRoom(roomInfo.roomKey, {
              type: 'session_terminated',
              data: {
                agency: roomInfo.agency,
                month: parseInt(roomInfo.month),
                year: parseInt(roomInfo.year),
                completedBy: ws.userName,
                message: `La sesión ha sido terminada porque ${ws.userName} completó el inventario`,
                timestamp: new Date().toISOString()
              }
            });
          }, 1000);
          break;
          
        default:
          console.log(`❓ Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: {
          message: 'Invalid message format',
          timestamp: new Date().toISOString()
        }
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log(`🔌 Connection closed for room: ${roomInfo.roomKey}`);
    
    // Remove from room
    const room = rooms.get(roomInfo.roomKey);
    if (room) {
      room.delete(ws);
      
      // If user was connected, notify others
      if (ws.userName) {
        broadcastToRoom(roomInfo.roomKey, {
          type: 'user_left',
          data: {
            agency: roomInfo.agency,
            month: parseInt(roomInfo.month),
            year: parseInt(roomInfo.year),
            userId: ws.userId,
            userName: ws.userName,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(roomInfo.roomKey);
        console.log(`🧹 Cleaned up empty room: ${roomInfo.roomKey}`);
      }
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Mock WebSocket Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}${WS_PATH}/[agency]/[month]/[year]`);
  console.log(`📝 Example: ws://localhost:${PORT}${WS_PATH}/Alfa%20Romeo/10/2025`);
  console.log(`\n🔧 Test commands:`);
  console.log(`1. Open browser console and run: testWebSocketConnection()`);
  console.log(`2. Or use the manual test script: node src/__tests__/manual/websocketConnectionTest.js`);
  console.log(`\n⏹️  Press Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  wss.close(() => {
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
});
