import { useCallback, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useWebSocket, WebSocketMessage } from './useWebSocket';

interface UseRealtimeSessionProps {
  agency: string;
  month: string;
  year: number;
  userId: string;
  userName: string;
  isSessionActive: boolean;
  onInventoryCompleted?: (message: WebSocketMessage) => void;
  onSessionTerminated?: (message: WebSocketMessage) => void;
  onDataUpdated?: (message: WebSocketMessage) => void;
}

export const useRealtimeSession = ({
  agency,
  month,
  year,
  userId,
  userName,
  isSessionActive,
  onInventoryCompleted,
  onSessionTerminated,
  onDataUpdated,
}: UseRealtimeSessionProps) => {
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [realtimeNotification, setRealtimeNotification] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    showRefresh?: boolean;
  } | null>(null);
  const { showInfo, showWarning, showError } = useToast();

  // Handle inventory completed
  const handleInventoryCompleted = useCallback((message: WebSocketMessage) => {
    const { completedBy, message: customMessage } = message.data;
    
    setRealtimeNotification({
      type: 'info',
      title: 'Inventario Completado',
      message: customMessage || `El inventario ha sido completado por ${completedBy || 'otro usuario'}.`,
      showRefresh: true,
    });

    onInventoryCompleted?.(message);
  }, [onInventoryCompleted]);

  // Handle session terminated
  const handleSessionTerminated = useCallback((message: WebSocketMessage) => {
    const { completedBy, message: customMessage } = message.data;
    
    setRealtimeNotification({
      type: 'warning',
      title: 'Sesión Terminada',
      message: customMessage || `Tu sesión ha sido terminada porque ${completedBy || 'otro usuario'} completó el inventario.`,
      showRefresh: true,
    });

    onSessionTerminated?.(message);
  }, [onSessionTerminated]);

  // Handle data updated
  const handleDataUpdated = useCallback((message: WebSocketMessage) => {
    setRealtimeNotification({
      type: 'success',
      title: 'Datos Actualizados',
      message: 'Los datos del inventario han sido actualizados. Recarga la página para ver los cambios más recientes.',
      showRefresh: true,
    });

    onDataUpdated?.(message);
  }, [onDataUpdated]);

  // Handle user joined
  const handleUserJoined = useCallback((message: WebSocketMessage) => {
    const { userName: joinedUserName } = message.data;
    
    if (joinedUserName && joinedUserName !== userName) {
      setActiveUsers(prev => [...prev.filter(name => name !== joinedUserName), joinedUserName]);
      
      showInfo(
        'Usuario Conectado',
        `${joinedUserName} se ha unido a la sesión de inventario.`
      );
    }
  }, [userName, showInfo]);

  // Handle user left
  const handleUserLeft = useCallback((message: WebSocketMessage) => {
    const { userName: leftUserName } = message.data;
    
    if (leftUserName && leftUserName !== userName) {
      setActiveUsers(prev => prev.filter(name => name !== leftUserName));
      
      showInfo(
        'Usuario Desconectado',
        `${leftUserName} ha dejado la sesión de inventario.`
      );
    }
  }, [userName, showInfo]);

  // Handle scan added
  const handleScanAdded = useCallback((message: WebSocketMessage) => {
    const { scanData, userName: scanUserName } = message.data;
    
    if (scanUserName && scanUserName !== userName && scanData) {
      showInfo(
        'Nuevo Escaneo',
        `${scanUserName} escaneó el código ${scanData.code}.`
      );
    }
  }, [userName, showInfo]);

  // Handle scan removed
  const handleScanRemoved = useCallback((message: WebSocketMessage) => {
    const { scanData, userName: scanUserName } = message.data;
    
    if (scanUserName && scanUserName !== userName && scanData) {
      showInfo(
        'Escaneo Eliminado',
        `${scanUserName} eliminó el código ${scanData.code}.`
      );
    }
  }, [userName, showInfo]);

  // WebSocket hook
  const { isConnected, connectionError, connect, disconnect, sendMessage } = useWebSocket({
    agency,
    month,
    year,
    userId,
    userName,
    isSessionActive,
    onInventoryCompleted: handleInventoryCompleted,
    onSessionTerminated: handleSessionTerminated,
    onDataUpdated: handleDataUpdated,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onScanAdded: handleScanAdded,
    onScanRemoved: handleScanRemoved,
  });

  // Send scan added message
  const notifyScanAdded = useCallback((code: string) => {
    sendMessage({
      type: 'scan_added',
      data: {
        scanData: {
          code,
          user: userName,
          timestamp: new Date().toISOString(),
        }
      }
    });
  }, [sendMessage, userName]);

  // Send scan removed message
  const notifyScanRemoved = useCallback((code: string) => {
    sendMessage({
      type: 'scan_removed',
      data: {
        scanData: {
          code,
          user: userName,
          timestamp: new Date().toISOString(),
        }
      }
    });
  }, [sendMessage, userName]);

  // Send inventory completed message
  const notifyInventoryCompleted = useCallback(() => {
    sendMessage({
      type: 'inventory_completed',
      data: {
        completedBy: userName,
        message: `El inventario ha sido completado por ${userName}.`
      }
    });
  }, [sendMessage, userName]);

  // Close notification
  const closeNotification = useCallback(() => {
    setRealtimeNotification(null);
  }, []);

  // Refresh page
  const refreshPage = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    // Connection status
    isConnected,
    connectionError,
    connect,
    disconnect,
    
    // Active users
    activeUsers,
    
    // Notifications
    realtimeNotification,
    closeNotification,
    refreshPage,
    
    // Actions
    notifyScanAdded,
    notifyScanRemoved,
    notifyInventoryCompleted,
  };
};
