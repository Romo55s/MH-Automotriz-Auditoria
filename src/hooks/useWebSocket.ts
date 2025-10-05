import { useCallback, useEffect, useRef, useState } from 'react';
import { WS_BASE_URL } from '../config/environment';
import { useToast } from '../context/ToastContext';

export interface WebSocketMessage {
  type: 'inventory_completed' | 'session_terminated' | 'data_updated' | 'user_joined' | 'user_left' | 'scan_added' | 'scan_removed' | 'ping' | 'pong' | 'error';
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

interface UseWebSocketProps {
  agency: string;
  month: string;
  year: number;
  userId: string;
  userName: string;
  isSessionActive: boolean;
  onInventoryCompleted?: (message: WebSocketMessage) => void;
  onSessionTerminated?: (message: WebSocketMessage) => void;
  onDataUpdated?: (message: WebSocketMessage) => void;
  onUserJoined?: (message: WebSocketMessage) => void;
  onUserLeft?: (message: WebSocketMessage) => void;
  onScanAdded?: (message: WebSocketMessage) => void;
  onScanRemoved?: (message: WebSocketMessage) => void;
}

export const useWebSocket = ({
  agency,
  month,
  year,
  userId,
  userName,
  isSessionActive,
  onInventoryCompleted,
  onSessionTerminated,
  onDataUpdated,
  onUserJoined,
  onUserLeft,
  onScanAdded,
  onScanRemoved,
}: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showInfo, showWarning, showError } = useToast();

  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (!agency || !month || !year || !userId || !userName) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      // Create WebSocket connection
      const wsUrl = `${WS_BASE_URL}/ws/inventory/${encodeURIComponent(agency)}/${month}/${year}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);

        // Send join message
        const joinMessage = {
          type: 'user_joined',
          data: {
            agency,
            month: parseInt(month),
            year: year,
            userId,
            userName,
          }
        };
        ws.send(JSON.stringify(joinMessage));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📢 WebSocket message received:', message);

          // Handle different message types
          switch (message.type) {
            case 'inventory_completed':
              onInventoryCompleted?.(message);
              break;
            case 'session_terminated':
              onSessionTerminated?.(message);
              break;
            case 'data_updated':
              onDataUpdated?.(message);
              break;
            case 'user_joined':
              onUserJoined?.(message);
              break;
            case 'user_left':
              onUserLeft?.(message);
              break;
            case 'scan_added':
              onScanAdded?.(message);
              break;
            case 'scan_removed':
              onScanRemoved?.(message);
              break;
            case 'pong':
              // Handle ping/pong for health checks
              console.log('🏓 Pong received');
              break;
            case 'error':
              console.error('❌ WebSocket error:', message.data?.message);
              setConnectionError(message.data?.message || 'WebSocket error');
              break;
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
        setConnectionError('Connection error occurred');
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          setConnectionError(`Connection lost. Reconnecting... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectDelay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionError('Failed to reconnect. Please refresh the page.');
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to connect to real-time updates');
    }
  }, [agency, month, year, userId, userName, reconnectAttempts, onInventoryCompleted, onSessionTerminated, onDataUpdated, onUserJoined, onUserLeft, onScanAdded, onScanRemoved]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'data'> & { data: Partial<WebSocketMessage['data']> }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        data: {
          agency,
          month: parseInt(month),
          year: year,
          userId,
          userName,
          ...message.data,
        }
      };
      
      wsRef.current.send(JSON.stringify(fullMessage));
      console.log('📤 WebSocket message sent:', fullMessage);
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, [agency, month, year, userId, userName]);

  // Send ping for health check
  const sendPing = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'ping',
        data: {
          timestamp: new Date().toISOString()
        }
      }));
    }
  }, []);

  // Connect when component mounts or dependencies change
  useEffect(() => {
    if (agency && month && year && userId && userName && isSessionActive) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [agency, month, year, userId, userName, isSessionActive, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Set up ping interval for health checks
  useEffect(() => {
    if (isConnected) {
      const pingInterval = setInterval(() => {
        sendPing();
      }, 30000); // Ping every 30 seconds

      return () => clearInterval(pingInterval);
    }
  }, [isConnected, sendPing]);

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
    sendPing,
  };
};
