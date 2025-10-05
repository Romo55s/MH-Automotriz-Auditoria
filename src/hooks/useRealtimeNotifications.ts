import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../context/ToastContext';

interface RealtimeNotification {
  type: 'inventory_completed' | 'session_terminated' | 'data_updated';
  data: {
    agency: string;
    month: string;
    year: number;
    completedBy?: string;
    inventoryId?: string;
    message?: string;
  };
}

interface UseRealtimeNotificationsProps {
  agency: string;
  month: string;
  year: number;
  isSessionActive: boolean;
  onInventoryCompleted?: (notification: RealtimeNotification) => void;
  onSessionTerminated?: (notification: RealtimeNotification) => void;
  onDataUpdated?: (notification: RealtimeNotification) => void;
}

export const useRealtimeNotifications = ({
  agency,
  month,
  year,
  isSessionActive,
  onInventoryCompleted,
  onSessionTerminated,
  onDataUpdated,
}: UseRealtimeNotificationsProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { showInfo, showWarning, showError } = useToast();

  const connect = useCallback(() => {
    if (!agency || !month || !year) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Create Server-Sent Events connection
      const eventSource = new EventSource(
        `/api/inventory/realtime/${encodeURIComponent(agency)}/${month}/${year}`
      );
      
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('🔗 Real-time notifications connected');
        setIsConnected(true);
        setConnectionError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const notification: RealtimeNotification = JSON.parse(event.data);
          console.log('📢 Real-time notification received:', notification);

          // Handle different notification types
          switch (notification.type) {
            case 'inventory_completed':
              handleInventoryCompleted(notification);
              onInventoryCompleted?.(notification);
              break;
            case 'session_terminated':
              handleSessionTerminated(notification);
              onSessionTerminated?.(notification);
              break;
            case 'data_updated':
              handleDataUpdated(notification);
              onDataUpdated?.(notification);
              break;
            default:
              console.warn('Unknown notification type:', notification.type);
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ Real-time notifications error:', error);
        setIsConnected(false);
        setConnectionError('Connection lost. Attempting to reconnect...');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connect();
          }
        }, 5000);
      };

    } catch (error) {
      console.error('Failed to create real-time connection:', error);
      setConnectionError('Failed to connect to real-time notifications');
    }
  }, [agency, month, year]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  const handleInventoryCompleted = (notification: RealtimeNotification) => {
    const { completedBy, message } = notification.data;
    
    showInfo(
      'Inventario Completado',
      message || `El inventario ha sido completado por ${completedBy || 'otro usuario'}.`
    );
  };

  const handleSessionTerminated = (notification: RealtimeNotification) => {
    const { completedBy, message } = notification.data;
    
    showWarning(
      'Sesión Terminada',
      message || `Tu sesión ha sido terminada porque ${completedBy || 'otro usuario'} completó el inventario.`
    );
  };

  const handleDataUpdated = (notification: RealtimeNotification) => {
    showInfo(
      'Datos Actualizados',
      'Los datos del inventario han sido actualizados. Recarga la página para ver los cambios más recientes.'
    );
  };

  // Connect when component mounts or dependencies change
  useEffect(() => {
    if (agency && month && year && isSessionActive) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [agency, month, year, isSessionActive, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
  };
};
