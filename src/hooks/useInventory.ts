import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import {
  checkMonthlyInventory,
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
  const { showInfo } = useToast();
  const [scannedCodes, setScannedCodes] = useState<ScannedCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize current month and year
  useEffect(() => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    setCurrentMonth(month);
    setCurrentYear(year);
  }, []);

  // Load existing session data from sessionStorage on component mount
  useEffect(() => {
    if (selectedAgency && currentMonth && currentYear) {
      loadExistingSession();
    }
  }, [selectedAgency, currentMonth, currentYear]);

  // Load existing session data from sessionStorage
  const loadExistingSession = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear) return;

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
          })
        );

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
  }, [selectedAgency, currentMonth, currentYear, showInfo]);

  // Check if monthly inventory exists and can be continued
  const checkAndLoadExistingInventory = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear) return;

    try {
      const response = await checkMonthlyInventory(
        selectedAgency.name,
        currentMonth,
        currentYear
      );

      if (
        response.exists &&
        response.inventory &&
        response.inventory.status === 'active'
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
              timestamp: new Date(scan.timestamp),
              confirmed: true,
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
          ...code,
          timestamp: code.timestamp.toISOString(),
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

      if (response.exists && response.inventory.status === 'completed') {
        setError(
          `An inventory for ${getMonthName(
            currentMonth
          )} ${currentYear} has already been completed. You cannot start a new one for the same month.`
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error checking existing inventory:', err);
      return true; // Allow to proceed if check fails
    }
  }, [selectedAgency, currentMonth, currentYear]);

  // Get month name from month number
  const getMonthName = (month: string) => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return monthNames[parseInt(month) - 1];
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
        setError(`Barcode ${barcode} has already been scanned in this session`);
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Save to backend/Google Sheets
        const timestamp = new Date().toISOString();
        console.log('📅 Timestamp being sent:', timestamp);

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

        console.log('📤 Sending scan data to backend:', scanData);

        const response = await saveScan(scanData);

        // Add to local state
        const newScan: ScannedCode = {
          id: response.data?.id || Date.now().toString(),
          code: barcode,
          timestamp: new Date(),
          confirmed: true,
        };

        const updatedCodes = [...scannedCodes, newScan];
        setScannedCodes(updatedCodes);
        setIsSessionActive(true);

        // Save to session storage
        saveSessionToStorage(updatedCodes, true, sessionId);

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to save scan';
        setError(errorMessage);
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
      return true;
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

  // Start new session
  const startSession = useCallback(async () => {
    // Check if monthly inventory already exists
    const canProceed = await checkExistingInventory();
    if (!canProceed) return;

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
  }, [checkExistingInventory, saveSessionToStorage]);

  // Continue existing session
  const continueSession = useCallback(() => {
    setIsSessionActive(true);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

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

  return {
    // State
    scannedCodes,
    isLoading,
    error,
    isSessionActive,
    currentMonth,
    currentYear,
    sessionId,

    // Actions
    addScannedCode,
    finishInventorySession,
    pauseInventorySession,
    startSession,
    continueSession,
    clearError,
    reset,

    // Computed
    scanCount: scannedCodes.length,
    hasActiveSession: isSessionActive && scannedCodes.length > 0,
    canFinishSession: scannedCodes.length > 0 && isSessionActive,
    monthName: getMonthName(currentMonth),
  };
};
