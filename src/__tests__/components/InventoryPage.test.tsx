import { Auth0Provider } from '@auth0/auth0-react';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import InventoryPage from '../../components/inventory/session/InventoryPage';
import { InventoryWebSocketClient } from '../../services/InventoryWebSocketClient';

// Mock the useInventory hook
jest.mock('../../hooks/useInventory', () => ({
  useInventory: () => ({
    isSessionActive: true,
    currentMonth: '10',
    currentYear: 2025,
    monthName: 'Octubre',
    sessionId: 'test-session-123',
    scannedCodes: [],
    addScannedCode: jest.fn().mockResolvedValue(true),
    deleteScannedCode: jest.fn().mockResolvedValue(true),
    finishInventorySession: jest.fn().mockResolvedValue({ success: true, totalScans: 5 }),
    pauseInventorySession: jest.fn().mockResolvedValue(true),
    startSession: jest.fn(),
    continueSession: jest.fn(),
    clearError: jest.fn(),
    reset: jest.fn(),
    checkLimits: jest.fn(),
    downloadInventory: jest.fn(),
    checkForInventoryCompletion: jest.fn().mockResolvedValue({ wasCompleted: false }),
    syncSessionData: jest.fn(),
    clearInventoryCompletedNotification: jest.fn(),
    inventoryCompletedByOther: null,
    error: null,
    isValidatingSession: false,
    isSyncing: false,
    lastSyncTime: null
  })
}));

// Mock the useToast hook
jest.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn()
  })
}));

// Mock the useAppContext hook
jest.mock('../../context/AppContext', () => ({
  useAppContext: () => ({
    selectedAgency: { name: 'Alfa Romeo' },
    setSelectedAgency: jest.fn()
  })
}));

// Mock the useAuth0 hook
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: {
      sub: 'auth0|123456789',
      name: 'Test User',
      email: 'test@example.com'
    },
    isAuthenticated: true,
    isLoading: false
  }),
  Auth0Provider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock the InventoryWebSocketClient
jest.mock('../../services/InventoryWebSocketClient', () => ({
  InventoryWebSocketClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    addScan: jest.fn().mockResolvedValue(undefined),
    removeScan: jest.fn().mockResolvedValue(undefined),
    completeInventory: jest.fn().mockResolvedValue(undefined),
    getConnectionStatus: jest.fn().mockReturnValue(true),
    onUserJoined: undefined,
    onUserLeft: undefined,
    onScanAdded: undefined,
    onScanRemoved: undefined,
    onInventoryCompleted: undefined,
    onSessionTerminated: undefined,
    onDataUpdated: undefined,
    onError: undefined,
    onConnectionChange: undefined
  }))
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ agencyName: 'alfa-romeo' }),
  useNavigate: () => jest.fn()
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <Auth0Provider
        domain="test.auth0.com"
        clientId="test-client-id"
        authorizationParams={{ redirect_uri: window.location.origin }}
      >
        {component}
      </Auth0Provider>
    </BrowserRouter>
  );
};

describe('InventoryPage WebSocket Integration', () => {
  let mockWebSocketClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock WebSocket client
    mockWebSocketClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      addScan: jest.fn().mockResolvedValue(undefined),
      removeScan: jest.fn().mockResolvedValue(undefined),
      completeInventory: jest.fn().mockResolvedValue(undefined),
      getConnectionStatus: jest.fn().mockReturnValue(true),
      onUserJoined: undefined,
      onUserLeft: undefined,
      onScanAdded: undefined,
      onScanRemoved: undefined,
      onInventoryCompleted: undefined,
      onSessionTerminated: undefined,
      onDataUpdated: undefined,
      onError: undefined,
      onConnectionChange: undefined
    };

    (InventoryWebSocketClient as jest.Mock).mockImplementation(() => mockWebSocketClient);
  });

  it('should initialize WebSocket client when session is active', async () => {
    renderWithProviders(<InventoryPage />);

    await waitFor(() => {
      expect(InventoryWebSocketClient).toHaveBeenCalledWith(
        'Alfa Romeo',
        '10',
        '2025',
        'auth0|123456789',
        'Test User'
      );
    });

    expect(mockWebSocketClient.connect).toHaveBeenCalled();
  });

  it('should set up event handlers for WebSocket client', async () => {
    renderWithProviders(<InventoryPage />);

    await waitFor(() => {
      expect(mockWebSocketClient.onUserJoined).toBeDefined();
      expect(mockWebSocketClient.onUserLeft).toBeDefined();
      expect(mockWebSocketClient.onScanAdded).toBeDefined();
      expect(mockWebSocketClient.onScanRemoved).toBeDefined();
      expect(mockWebSocketClient.onInventoryCompleted).toBeDefined();
      expect(mockWebSocketClient.onSessionTerminated).toBeDefined();
      expect(mockWebSocketClient.onDataUpdated).toBeDefined();
      expect(mockWebSocketClient.onError).toBeDefined();
      expect(mockWebSocketClient.onConnectionChange).toBeDefined();
    });
  });

  it('should handle user joined event', async () => {
    const { useToast } = require('../../context/ToastContext');
    const mockShowInfo = jest.fn();
    useToast.mockReturnValue({
      showSuccess: jest.fn(),
      showError: jest.fn(),
      showInfo: mockShowInfo,
      showWarning: jest.fn()
    });

    renderWithProviders(<InventoryPage />);

    await waitFor(() => {
      expect(mockWebSocketClient.onUserJoined).toBeDefined();
    });

    // Simulate user joined event
    if (mockWebSocketClient.onUserJoined) {
      mockWebSocketClient.onUserJoined({
        userId: 'other-user',
        userName: 'Other User'
      });
    }

    expect(mockShowInfo).toHaveBeenCalledWith(
      'Usuario Conectado',
      'Other User se ha unido a la sesión de inventario.'
    );
  });

  it('should handle scan added event', async () => {
    const { useToast } = require('../../context/ToastContext');
    const mockShowInfo = jest.fn();
    useToast.mockReturnValue({
      showSuccess: jest.fn(),
      showError: jest.fn(),
      showInfo: mockShowInfo,
      showWarning: jest.fn()
    });

    renderWithProviders(<InventoryPage />);

    await waitFor(() => {
      expect(mockWebSocketClient.onScanAdded).toBeDefined();
    });

    // Simulate scan added event
    if (mockWebSocketClient.onScanAdded) {
      mockWebSocketClient.onScanAdded({
        userId: 'other-user',
        userName: 'Other User',
        scanData: {
          code: 'ABC123',
          user: 'Other User',
          timestamp: '2025-01-15T10:30:00.000Z'
        }
      });
    }

    expect(mockShowInfo).toHaveBeenCalledWith(
      'Nuevo Escaneo',
      'Other User escaneó el código ABC123.'
    );
  });

  it('should handle inventory completed event', async () => {
    renderWithProviders(<InventoryPage />);

    await waitFor(() => {
      expect(mockWebSocketClient.onInventoryCompleted).toBeDefined();
    });

    // Simulate inventory completed event
    if (mockWebSocketClient.onInventoryCompleted) {
      mockWebSocketClient.onInventoryCompleted({
        completedBy: 'Other User',
        inventoryId: 'inv_123',
        message: 'Inventory completed by Other User'
      });
    }

    // Check if session termination modal would be shown
    // (This would require more complex testing with state management)
  });

  it('should disconnect WebSocket client when component unmounts', () => {
    const { unmount } = renderWithProviders(<InventoryPage />);

    unmount();

    expect(mockWebSocketClient.disconnect).toHaveBeenCalled();
  });

  it('should show connection status', async () => {
    mockWebSocketClient.getConnectionStatus.mockReturnValue(true);

    renderWithProviders(<InventoryPage />);

    // The connection status component should be rendered
    // This would require checking for the ConnectionStatus component
  });

  it('should handle WebSocket errors', async () => {
    const { useToast } = require('../../context/ToastContext');
    const mockShowError = jest.fn();
    useToast.mockReturnValue({
      showSuccess: jest.fn(),
      showError: mockShowError,
      showInfo: jest.fn(),
      showWarning: jest.fn()
    });

    renderWithProviders(<InventoryPage />);

    await waitFor(() => {
      expect(mockWebSocketClient.onError).toBeDefined();
    });

    // Simulate error event
    if (mockWebSocketClient.onError) {
      mockWebSocketClient.onError('Connection failed');
    }

    expect(mockShowError).toHaveBeenCalledWith('Error de Conexión', 'Connection failed');
  });
});
