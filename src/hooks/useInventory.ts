import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import {
    checkInventoryCompletion,
    checkInventoryLimits,
    checkMonthlyInventory,
    deleteMultipleScannedEntries,
    deleteScannedEntry,
    downloadInventoryCSV,
    downloadInventoryExcel,
    finishSession,
    getMonthlyInventory,
    saveScan,
} from '../services/api';
import { ScannedCode } from '../types/index';
import {
    clearSession,
    loadSession,
    saveSession,
    SessionData,
} from '../utils/sessionManager';

export const useInventory = () => {
  const { selectedAgency } = useAppContext();
  const { user } = useAuth0();
  const { showInfo, showWarning, showError } = useToast();
  const [scannedCodes, setScannedCodes] = useState<ScannedCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [isValidatingSession, setIsValidatingSession] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Initialize current month and year
  useEffect(() => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    setCurrentMonth(month);
    setCurrentYear(year);
  }, []);



  // Sync current session data with backend to get latest barcodes from other users
  const syncSessionData = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear || !isSessionActive) return;
    
    setIsSyncing(true);
    try {
      const response = await getMonthlyInventory(selectedAgency.name, currentMonth, currentYear);
      
      if (response && response.scans && Array.isArray(response.scans)) {
        const latestScans: ScannedCode[] = response.scans.map((scan: any) => ({
          id: scan.id || `${scan.barcode || scan.code}-${Date.now()}`,
          code: scan.barcode || scan.code,
          timestamp: new Date(scan.timestamp || scan.scannedAt || scan.date || new Date()),
          confirmed: scan.confirmed || true,
          user: scan.scannedBy || scan.user || scan.userName || 'Usuario desconocido'
        }));
        
        // Only update if we got new data or if the data is different
        const hasNewData = latestScans.length !== scannedCodes.length;
        const hasDifferentData = latestScans.some((scan, index) => 
          !scannedCodes[index] || scan.code !== scannedCodes[index].code
        );
        
        if (hasNewData || hasDifferentData) {
          setScannedCodes(latestScans);
          setLastSyncTime(new Date());
          
          // Save updated data to session storage
          if (selectedAgency && currentMonth && currentYear) {
            saveSessionToStorage(latestScans, isSessionActive, sessionId);
          }
          
          // Show notification if new barcodes were added by other users
          if (latestScans.length > scannedCodes.length) {
            const newCount = latestScans.length - scannedCodes.length;
            showInfo(
              'Nuevos Escaneos',
              `${newCount} nuevo${newCount !== 1 ? 's' : ''} código${newCount !== 1 ? 's' : ''} agregado${newCount !== 1 ? 's' : ''} por otros usuarios`
            );
          }
        }
      }
    } catch (error) {
      console.error('Error syncing session data:', {
        error: error,
        selectedAgency: selectedAgency?.name,
        currentMonth,
        currentYear,
        isSessionActive,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    } finally {
      setIsSyncing(false);
    }
  }, [selectedAgency, currentMonth, currentYear, isSessionActive, scannedCodes, sessionId, showInfo]);

  // Check if inventory was completed by someone else (global check)
  const checkGlobalInventoryCompletion = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear) return false;

    try {
      const completionCheck = await checkInventoryCompletion({
        agency: selectedAgency.name,
        month: currentMonth,
        year: currentYear,
      });

      // Only trigger session termination if:
      // 1. The inventory is completed AND
      // 2. The user currently has an active session AND
      // 3. We've reached the 2-inventory limit (completedInventories >= 2)
      if ((completionCheck.completed || completionCheck.isCompleted) && 
          isSessionActive && 
          completionCheck.completedInventories >= 2) {
        
        // Clear any cached session since inventory was completed by someone else
        clearSession(selectedAgency.name, currentMonth, currentYear);
        setScannedCodes([]);
        setIsSessionActive(false);
        setSessionId('');
        
        showError(
          'Inventario Completado',
          `El inventario para ${getMonthName(currentMonth)} ${currentYear} ha sido completado por ${completionCheck.completedBy || 'otro usuario'}. Tu sesión ha sido terminada.`
        );
        return true; // Inventory was completed and session was terminated
      }
      
      return false; // No session termination needed
    } catch (error) {
      console.error('Error checking global inventory completion:', error);
      return false; // Assume not completed if check fails
    }
  }, [selectedAgency, currentMonth, currentYear, isSessionActive, showError]);

  // Load existing session data from sessionStorage
  const loadExistingSession = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear) return;

    // First, always check if inventory was completed by someone else
    setIsValidatingSession(true);
    const wasCompleted = await checkGlobalInventoryCompletion();
    setIsValidatingSession(false);

    if (wasCompleted) {
      // Inventory was completed, don't restore any session
      return;
    }

    // If inventory is still active, check for cached session
    const savedSession = loadSession(
      selectedAgency.name,
      currentMonth,
      currentYear
    );

    if (savedSession) {
      try {
        // Convert timestamp strings back to Date objects
        const codesWithDates: ScannedCode[] = savedSession.scannedCodes.map(
          code => ({
            ...code,
            timestamp: new Date(code.timestamp),
            user: code.user || 'Usuario desconocido', // Ensure user property exists
          })
        );

        // Restore session data
        setScannedCodes(codesWithDates);
        setIsSessionActive(savedSession.isSessionActive);
        setSessionId(savedSession.sessionId);

        // Check if we can continue this session
        if (savedSession.isSessionActive) {
          showInfo(
            'Session Restored',
            `Restored ${
              savedSession.scannedCodes?.length || 0
            } scanned codes from previous session`
          );
        } else if (savedSession.scannedCodes.length > 0) {
          showInfo(
            'Paused Session Found',
            `Found paused session with ${
              savedSession.scannedCodes?.length || 0
            } scanned codes. You can continue or complete it.`
          );
        }
      } catch (err) {
        console.error('Error loading session data:', err);
        // Clear corrupted session data
        clearSession(selectedAgency.name, currentMonth, currentYear);
      }
    } else {
      // Check if monthly inventory exists and can be continued
      await checkAndLoadExistingInventory();
    }
  }, [selectedAgency, currentMonth, currentYear, showInfo, checkGlobalInventoryCompletion]);

  // Load existing session data from sessionStorage on component mount
  useEffect(() => {
    if (selectedAgency && currentMonth && currentYear) {
      loadExistingSession();
    }
  }, [selectedAgency, currentMonth, currentYear, loadExistingSession]);

  // Periodic sync effect - sync every 10 seconds when session is active
  useEffect(() => {
    if (!isSessionActive) return;

    const syncInterval = setInterval(() => {
      syncSessionData();
    }, 10000); // Sync every 10 seconds

    return () => clearInterval(syncInterval);
  }, [isSessionActive, syncSessionData]);

  // Check if monthly inventory exists and can be continued
  const checkAndLoadExistingInventory = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear) return;

    try {
      // First check if monthly inventory exists
      const checkResponse = await checkMonthlyInventory(
        selectedAgency.name,
        currentMonth,
        currentYear
      );

      if (
        checkResponse.exists &&
        checkResponse.status === 'Active'
      ) {
        // Load existing inventory data
        const inventoryResponse = await getMonthlyInventory(
          selectedAgency.name,
          currentMonth,
          currentYear
        );

        if (inventoryResponse.success && inventoryResponse.data.scans) {
          const existingScans: ScannedCode[] = inventoryResponse.data.scans.map(
            (scan: any) => ({
              id: scan.id,
              code: scan.code,
              timestamp: new Date(scan.timestamp || scan.date),
              confirmed: true,
              user: scan.scannedBy || scan.user || scan.userName || 'Usuario desconocido',
            })
          );

          setScannedCodes(existingScans);
          setIsSessionActive(true);
          setSessionId(inventoryResponse.data.id);

          // Save to session storage
          saveSessionToStorage(existingScans, true, inventoryResponse.data.id);

          showInfo(
            'Inventory Continued',
            `Loaded ${existingScans.length} existing scans from previous session`
          );
        }
      }
    } catch (err) {
      console.error('Error checking existing inventory:', err);
    }
  }, [selectedAgency, currentMonth, currentYear, showInfo]);

  // Save session data to sessionStorage
  const saveSessionToStorage = useCallback(
    (codes: ScannedCode[], active: boolean, id: string) => {
      if (!selectedAgency || !currentMonth || !currentYear) return;

      const sessionData: SessionData = {
        scannedCodes: codes.map(code => ({
          id: code.id,
          code: code.code,
          timestamp: code.timestamp.toISOString(),
          confirmed: code.confirmed,
          user: code.user || 'Usuario desconocido', // Ensure user is always present
        })),
        isSessionActive: active,
        sessionId: id,
        lastUpdated: new Date().toISOString(),
        agency: selectedAgency.name,
        month: currentMonth,
        year: currentYear,
      };

      saveSession(sessionData);
    },
    [selectedAgency, currentMonth, currentYear]
  );

  // Check if monthly inventory already exists
  const checkExistingInventory = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear) return;

    try {
      const response = await checkMonthlyInventory(
        selectedAgency.name,
        currentMonth,
        currentYear
      );

      // The backend's check-inventory-limits endpoint already handles the 2-inventory limit
      // This function should only check for active inventories that need to be continued
      if (response.exists && response.status === 'Active') {
        showInfo(
          'Inventario Activo Encontrado',
          `Hay un inventario activo para ${getMonthName(currentMonth)} ${currentYear}. Puedes continuar trabajando en él.`
        );
        return false;
      }

      // For completed inventories, let the backend's check-inventory-limits handle the blocking
      // This allows the proper 2-inventory-per-month logic to work
      console.log('Monthly inventory check result:', response);
      return true;
    } catch (err) {
      console.error('Error checking existing inventory:', err);
      return true; // Allow to proceed if check fails
    }
  }, [selectedAgency, currentMonth, currentYear]);

  // Check if inventory was completed (which would terminate all active sessions)
  const checkForInventoryCompletion = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear) {
      return { wasCompleted: false };
    }

    try {
      const result = await checkInventoryCompletion({
        agency: selectedAgency.name,
        month: currentMonth,
        year: currentYear,
      });

      if ((result.completed || result.isCompleted) && 
          isSessionActive && 
          result.completedInventories >= 2) {
        
        // Clear the local session since inventory was completed by someone else AND limit reached
        if (sessionId && selectedAgency) {
          clearSession(selectedAgency.name, currentMonth, currentYear);
        }
        setIsSessionActive(false);
        setScannedCodes([]);
        setSessionId('');
        
        return {
          wasCompleted: true,
          completedBy: result.completedBy || 'Usuario desconocido',
        };
      }

      return { wasCompleted: false };
    } catch (error) {
      console.error('Error checking inventory completion:', error);
      return { wasCompleted: false };
    }
  }, [selectedAgency, currentMonth, currentYear, isSessionActive, sessionId]);

  // Get month name from month number
  const getMonthName = (month: string) => {
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    
    // Handle edge cases
    if (!month || month === '00' || month === '0' || month.trim() === '') {
      console.warn('Invalid month value:', month);
      return 'Mes Inválido';
    }
    
    const monthIndex = parseInt(month) - 1;
    
    // Validate month index
    if (monthIndex < 0 || monthIndex >= monthNames.length) {
      console.warn('Month index out of range:', monthIndex, 'for month:', month);
      return 'Mes Inválido';
    }
    
    return monthNames[monthIndex];
  };

  // Add scanned code and save to backend
  const addScannedCode = useCallback(
    async (barcode: string) => {
      if (!selectedAgency) {
        setError('No agency selected');
        return false;
      }

      if (!user?.email && !user?.name) {
        setError('User information not available');
        return false;
      }

      // Validate that the code is exactly 8 digits
      const codePattern = /^\d{8}$/;
      if (!codePattern.test(barcode)) {
        setError(
          `Invalid code format. Expected 8-digit number, got: "${barcode}". Please scan a valid 8-digit barcode or use manual input.`
        );
        return false;
      }

      // Check if code was already scanned
      const isDuplicate = scannedCodes.some(code => code.code === barcode);
      if (isDuplicate) {
        showWarning('Código ya escaneado', `El código ${barcode} ya fue escaneado en esta sesión.`);
        return false;
      }

      // Check if inventory was completed by someone else before adding new scan
      try {
        const completionCheck = await checkInventoryCompletion({
          agency: selectedAgency.name,
          month: currentMonth,
          year: currentYear,
        });

        if ((completionCheck.completed || completionCheck.isCompleted) && 
            completionCheck.completedInventories >= 2) {
          // Clear the local session since inventory was completed by someone else AND limit reached
          if (sessionId && selectedAgency) {
            clearSession(selectedAgency.name, currentMonth, currentYear);
          }
          setIsSessionActive(false);
          setScannedCodes([]);
          setSessionId('');
          
          showError(
            'Límite de Inventarios Alcanzado',
            `Ya se han completado 2 inventarios para ${getMonthName(currentMonth)} ${currentYear}. El límite máximo es de 2 inventarios por mes. Tu sesión ha sido terminada.`
          );
          return false;
        }
      } catch (error) {
        console.error('Error checking inventory completion before scan:', error);
        // Continue with scan if check fails (don't block user unnecessarily)
      }

      setIsLoading(true);
      setError(null);

      try {
        // Save to backend/Google Sheets
        const timestamp = new Date().toISOString();

        // Prepare the data for the API call
        const scanData = {
          agency: selectedAgency.name,
          code: barcode,
          timestamp,
          user: user.email || user.name || '',
          userName: user.name || user.email || 'Unknown User',
          month: currentMonth,
          year: currentYear,
        };

        const response = await saveScan(scanData);

        // Add to local state
        const newScan: ScannedCode = {
          id: response.data?.id || Date.now().toString(),
          code: barcode,
          timestamp: new Date(),
          confirmed: true,
          user: user.name || user.email || 'Usuario desconocido',
        };

        const updatedCodes = [...scannedCodes, newScan];
        setScannedCodes(updatedCodes);
        setIsSessionActive(true);

        // Save to session storage
        saveSessionToStorage(updatedCodes, true, sessionId);

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save scan';
        
        // Log detailed error information
        console.error('Error saving scan:', {
          error: err,
          errorMessage,
          barcode,
          selectedAgency: selectedAgency?.name,
          user: user?.email || user?.name,
          currentMonth,
          currentYear,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
        
        // Check if it's a duplicate barcode error
        if (errorMessage.includes('has already been scanned')) {
          // Extract the barcode from the error message
          const barcodeMatch = errorMessage.match(/Barcode (\d+) has already been scanned/);
          const barcode = barcodeMatch ? barcodeMatch[1] : 'este código';
          
          // Show a specific warning toast for duplicate barcode
          showWarning(
            'Código de Barras Duplicado',
            `El código de barras ${barcode} ya ha sido escaneado en este inventario. Cada código solo puede ser escaneado una vez por mes.`
          );
        } else if (errorMessage.includes('already completed')) {
          // Check if it's the monthly inventory already completed error
          showError(
            'Inventario Ya Completado',
            'No se pueden agregar más escaneos porque el inventario mensual ya ha sido completado.'
          );
        } else {
          // For other errors, set the error state
          setError(errorMessage);
        }
        
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedAgency,
      user,
      currentMonth,
      currentYear,
      scannedCodes,
      sessionId,
      saveSessionToStorage,
      showWarning,
      checkInventoryCompletion,
      getMonthName,
      showError,
    ]
  );

  // Finish inventory session (complete and close)
  const finishInventorySession = useCallback(async () => {
    if (!selectedAgency || scannedCodes.length === 0) {
      setError('No active session or no codes scanned');
      return false;
    }

    if (!user?.email && !user?.name) {
      setError('User information not available');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call backend to finish session and save to Google Sheets
      await finishSession({
        agency: selectedAgency.name,
        user: user.email || user.name || '',
        userName: user.name || user.email || 'Unknown User',
        month: currentMonth,
        year: currentYear,
        totalScans: scannedCodes.length,
      });

      // Clear session storage
      clearSession(selectedAgency.name, currentMonth, currentYear);

      // Reset local state
      setScannedCodes([]);
      setIsSessionActive(false);
      setSessionId('');
      
      // Return completion info for the UI to show appropriate modal
      return {
        success: true,
        completedBy: user.name || user.email || 'Usuario desconocido',
        totalScans: scannedCodes.length
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to finish session';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgency, scannedCodes.length, user, currentMonth, currentYear]);

  // Pause inventory session (save progress but keep open)
  const pauseInventorySession = useCallback(() => {
    if (!selectedAgency || scannedCodes.length === 0) {
      setError('No active session or no codes scanned');
      return false;
    }

    // Save current progress to session storage
    saveSessionToStorage(scannedCodes, true, sessionId);

    showInfo(
      'Session Paused',
      `Session paused with ${scannedCodes.length} scans. You can continue later or complete the session.`
    );
    return true;
  }, [selectedAgency, scannedCodes, sessionId, saveSessionToStorage, showInfo]);

  // Check inventory limits before starting new inventory
  const checkLimits = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear) {
      return { canStart: false, message: 'Información de agencia o fecha faltante' };
    }

    try {
      const result = await checkInventoryLimits(
        selectedAgency.name,
        currentMonth,
        currentYear
      );
      
      console.log('Inventory limits check result:', result);
      
      // If the backend says we can't start, provide a specific message
      if (!result.canStart) {
        // Check if it's because we've reached the monthly limit
        if (result.currentMonthCount >= 2) {
          return {
            canStart: false,
            message: `Ya se han completado 2 inventarios para ${getMonthName(currentMonth)} ${currentYear}. El límite máximo es de 2 inventarios por mes.`
          };
        }
        
        // Check if there's an active inventory
        if (result.activeCount > 0) {
          return {
            canStart: false,
            message: `Hay un inventario activo para ${getMonthName(currentMonth)} ${currentYear}. Solo puede haber un inventario activo a la vez.`
          };
        }
        
        // Use the backend message if available
        return {
          canStart: false,
          message: result.message || 'No se puede iniciar un nuevo inventario en este momento.'
        };
      }
      
      return result;
    } catch (error: any) {
      console.error('Error checking inventory limits:', error);
      
      // Handle 400 errors specifically - these contain the backend's limit message
      if (error.message && error.message.includes('400')) {
        // Extract the backend's specific error message
        const backendMessage = error.message.split(' - ')[1] || error.message;
        
        // Translate common backend messages to Spanish
        if (backendMessage.includes('Monthly inventory limit reached')) {
          return {
            canStart: false,
            message: `Ya se han completado 2 inventarios para ${getMonthName(currentMonth)} ${currentYear}. El límite máximo es de 2 inventarios por mes.`
          };
        }
        
        if (backendMessage.includes('Active inventory exists')) {
          return {
            canStart: false,
            message: `Hay un inventario activo para ${getMonthName(currentMonth)} ${currentYear}. Solo puede haber un inventario activo a la vez.`
          };
        }
        
        // Use the backend message if it's already in Spanish or we can't translate it
        return {
          canStart: false,
          message: backendMessage
        };
      }
      
      // For other errors, return a generic message
      return { canStart: false, message: 'Error al verificar límites de inventario' };
    }
  }, [selectedAgency, currentMonth, currentYear]);

  // Start new session
  const startSession = useCallback(async () => {
    // Check inventory limits first
    const limitsResult = await checkLimits();
    if (!limitsResult.canStart) {
      showError('No se puede iniciar inventario', limitsResult.message || 'Límite de inventarios alcanzado');
      return false;
    }

    // Check if monthly inventory already exists
    const canProceed = await checkExistingInventory();
    if (!canProceed) {
      // Error toast is already shown in checkExistingInventory
      return false;
    }

    // Generate new session ID
    const newSessionId = `sess_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setSessionId(newSessionId);

    setScannedCodes([]);
    setIsSessionActive(true);
    setError(null);

    // Save to session storage
    saveSessionToStorage([], true, newSessionId);
    return true;
  }, [checkLimits, checkExistingInventory, saveSessionToStorage, showError]);

  // Continue existing session
  const continueSession = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear) {
      showError('Error', 'Información de inventario faltante');
      return;
    }

    try {
      // Load existing scanned codes from backend
      const response = await getMonthlyInventory(selectedAgency.name, currentMonth, currentYear);
      
      if (response && response.scans && Array.isArray(response.scans)) {
        // Convert backend scans to frontend format
        const existingScans: ScannedCode[] = response.scans.map((scan: any) => ({
          id: scan.id || `${scan.barcode || scan.code}-${Date.now()}`,
          code: scan.barcode || scan.code,
          timestamp: new Date(scan.timestamp || scan.scannedAt || scan.date || new Date()),
          confirmed: scan.confirmed || true,
          user: scan.scannedBy || scan.user || scan.userName || 'Usuario desconocido'
        }));

        setScannedCodes(existingScans);
        showInfo(
          'Sesión Continuada',
          `Sesión de inventario continuada con ${existingScans.length} códigos escaneados existentes.`
        );
      } else {
        setScannedCodes([]);
        showInfo('Sesión Continuada', 'Sesión de inventario continuada.');
      }

      setIsSessionActive(true);
      setError(null);
    } catch (error) {
      console.error('Error loading existing scans when continuing session:', error);
      // Continue with empty scans if loading fails
      setScannedCodes([]);
      setIsSessionActive(true);
      setError(null);
      showWarning('Advertencia', 'No se pudieron cargar los escaneos existentes, pero la sesión se ha continuado.');
    }
  }, [selectedAgency, currentMonth, currentYear, showError, showInfo, showWarning]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Delete scanned entry from backend
  const deleteScannedEntryFromBackend = useCallback(async (barcode: string) => {
    if (!selectedAgency) {
      showError('Error', 'No hay agencia seleccionada');
      return false;
    }

    try {
      await deleteScannedEntry({
        agency: selectedAgency.name,
        barcode,
      });
      return true;
    } catch (error) {
      console.error('Error deleting scanned entry:', error);
      showError('Error', 'No se pudo eliminar el código escaneado del servidor');
      return false;
    }
  }, [selectedAgency, showError]);

  // Delete a scanned code
  const deleteScannedCode = useCallback(async (index: number): Promise<boolean> => {
    if (index < 0 || index >= scannedCodes.length) {
      showError('Error', 'Índice de código inválido');
      return false;
    }

    const codeToDelete = scannedCodes[index];
    
    // Delete from backend first
    const backendSuccess = await deleteScannedEntryFromBackend(codeToDelete.code);
    if (!backendSuccess) {
      return false; // Error already shown in deleteScannedEntryFromBackend
    }

    // Update local state
    const updatedCodes = scannedCodes.filter((_, i) => i !== index);
    setScannedCodes(updatedCodes);

    // Update session storage
    if (selectedAgency && currentMonth && currentYear) {
      saveSessionToStorage(updatedCodes, isSessionActive, sessionId);
    }

    showInfo('Código Eliminado', 'El código de barras ha sido eliminado exitosamente');
    return true;
  }, [scannedCodes, selectedAgency, currentMonth, currentYear, isSessionActive, sessionId, saveSessionToStorage, showError, showInfo, deleteScannedEntryFromBackend]);

  // Delete multiple scanned codes using bulk delete endpoint
  const deleteMultipleScannedCodes = useCallback(async (barcodes: string[]) => {
    if (!selectedAgency) {
      showError('Error', 'No hay agencia seleccionada');
      return { success: false, deletedCount: 0, notFound: [] };
    }

    if (barcodes.length === 0) {
      showError('Error', 'No hay códigos seleccionados para eliminar');
      return { success: false, deletedCount: 0, notFound: [] };
    }

    try {
      const response = await deleteMultipleScannedEntries({
        agency: selectedAgency.name,
        barcodes: barcodes,
      });

      if (response.success) {
        // Remove deleted codes from local state
        const updatedCodes = scannedCodes.filter(code => !barcodes.includes(code.code));
        setScannedCodes(updatedCodes);

        // Update session storage
        if (selectedAgency && currentMonth && currentYear) {
          saveSessionToStorage(updatedCodes, isSessionActive, sessionId);
        }

        // Show success message
        showInfo(
          'Códigos Eliminados',
          `Se eliminaron exitosamente ${response.deletedEntries?.length || barcodes.length} código${response.deletedEntries?.length !== 1 ? 's' : ''}`
        );

        // Show warning if some entries weren't found
        if (response.notFound && response.notFound.length > 0) {
          showWarning(
            'Algunos Códigos No Encontrados',
            `${response.notFound.length} código${response.notFound.length > 1 ? 's' : ''} no se encontraron: ${response.notFound.join(', ')}`
          );
        }

        return {
          success: true,
          deletedCount: response.deletedEntries?.length || barcodes.length,
          notFound: response.notFound || []
        };
      } else {
        showError('Error', 'No se pudieron eliminar los códigos seleccionados');
        return { success: false, deletedCount: 0, notFound: [] };
      }
    } catch (error) {
      console.error('Error deleting multiple scanned entries:', error);
      showError('Error', 'No se pudo eliminar los códigos seleccionados del servidor');
      return { success: false, deletedCount: 0, notFound: [] };
    }
  }, [selectedAgency, scannedCodes, currentMonth, currentYear, isSessionActive, sessionId, saveSessionToStorage, showError, showInfo, showWarning]);

  // Reset inventory state
  const reset = useCallback(() => {
    setScannedCodes([]);
    setIsSessionActive(false);
    setError(null);
    setIsLoading(false);
    setSessionId('');

    // Clear session storage
    if (selectedAgency && currentMonth && currentYear) {
      clearSession(selectedAgency.name, currentMonth, currentYear);
    }
  }, [selectedAgency, currentMonth, currentYear]);





  // Download inventory data
  const downloadInventory = useCallback(async (format: 'csv' | 'excel') => {
    if (!selectedAgency || !currentMonth || !currentYear) {
      showError('Error', 'Información de inventario faltante');
      return false;
    }

    try {
      setIsLoading(true);
      
      const blob = format === 'csv' 
        ? await downloadInventoryCSV(selectedAgency.name, currentMonth, currentYear)
        : await downloadInventoryExcel(selectedAgency.name, currentMonth, currentYear);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedAgency.name}_${currentMonth}_${currentYear}_inventory.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showInfo('Descarga Completada', 'El archivo se ha descargado exitosamente. Los datos han sido eliminados del sistema.');
      return true;
    } catch (error) {
      console.error('Error downloading inventory:', error);
      showError('Error', 'No se pudo descargar el inventario');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgency, currentMonth, currentYear, showError, showInfo]);

  return {
    // State
    scannedCodes,
    isLoading,
    error,
    isSessionActive,
    currentMonth,
    currentYear,
    sessionId,
    isValidatingSession,
    isSyncing,
    lastSyncTime,

    // Actions
    addScannedCode,
    deleteScannedCode,
    finishInventorySession,
    pauseInventorySession,
    startSession,
    continueSession,
    clearError,
    reset,

    // New Backend Features
    checkLimits,
    deleteScannedEntryFromBackend,
    deleteMultipleScannedCodes,
    downloadInventory,
    checkForInventoryCompletion,
    syncSessionData,

    // Computed
    scanCount: scannedCodes.length,
    hasActiveSession: isSessionActive && scannedCodes.length > 0,
    canFinishSession: scannedCodes.length > 0 && isSessionActive,
    monthName: currentMonth ? getMonthName(currentMonth) : 'Mes Inválido',
  };
};
