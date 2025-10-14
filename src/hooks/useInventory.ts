import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import {
  checkInventoryCompletion,
  checkInventoryCompletionByOther,
  checkInventoryLimits,
  checkMonthlyInventory,
  deleteMultipleScannedEntries,
  deleteScannedEntry,
  finishSession,
  getMonthlyInventory,
  saveScan
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
  const { showInfo, showWarning, showError, showSuccess } = useToast();
  const [scannedCodes, setScannedCodes] = useState<ScannedCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentInventoryId, setCurrentInventoryId] = useState<string>('');
  const [isValidatingSession, setIsValidatingSession] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [inventoryCompletedByOther, setInventoryCompletedByOther] = useState<{
    isCompleted: boolean;
    completedBy: string;
    completedAt: string;
  } | null>(null);
  const [lastCompletionCheck, setLastCompletionCheck] = useState<number>(0);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(false);
  const [lastNotifiedCompletion, setLastNotifiedCompletion] = useState<string | null>(() => {
    // Initialize from localStorage to persist across page reloads and session changes
    const stored = localStorage.getItem('lastNotifiedCompletion');
    return stored ? JSON.parse(stored) : null;
  });

  // Reset inventory status when month changes
  const resetInventoryStatusForNewMonth = useCallback(() => {
    console.log('🗓️ Month changed - resetting inventory status');
    
    // Clear current session data for the new month
    setScannedCodes([]);
    setIsSessionActive(false);
    setSessionId('');
    setCurrentInventoryId('');
    setError(null);
    setIsLoading(false);
    setInventoryCompletedByOther(null);
    setLastCompletionCheck(0);
    setIsCheckingCompletion(false);
    setLastNotifiedCompletion(null);
    
    // Clear any cached session data
    if (selectedAgency && currentMonth && currentYear) {
      clearSession(selectedAgency.name, currentMonth, currentYear);
    }
  }, [selectedAgency, currentMonth, currentYear]);

  // Initialize current month and year
  useEffect(() => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    setCurrentMonth(month);
    setCurrentYear(year);
  }, []);

  // Periodic check for month changes (in case app is left open across midnight)
  useEffect(() => {
    const checkForMonthChange = () => {
      const now = new Date();
      const currentMonthNum = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentYearNum = now.getFullYear();
      
      // Check if month or year has changed
      if (currentMonth && currentYear && 
          (currentMonth !== currentMonthNum || currentYear !== currentYearNum)) {
        console.log(`🗓️ Month/Year changed from ${currentMonth}/${currentYear} to ${currentMonthNum}/${currentYearNum}`);
        
        // Update the month and year state (this will trigger other effects)
        setCurrentMonth(currentMonthNum);
        setCurrentYear(currentYearNum);
        
        // Reset inventory status for the new month
        resetInventoryStatusForNewMonth();
      }
    };

    // Check every minute for month changes
    const interval = setInterval(checkForMonthChange, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, [currentMonth, currentYear, resetInventoryStatusForNewMonth]);




  // Sync current session data with backend to get latest barcodes from other users
  const syncSessionData = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear || !isSessionActive) {
      return;
    }
    
    setIsSyncing(true);
    try {
      const response = await getMonthlyInventory(selectedAgency.name, currentMonth, currentYear);
      
      if (response && response.scans && Array.isArray(response.scans)) {
        const latestScans: ScannedCode[] = response.scans.map((scan: any) => {
          // Build carData from direct fields if they exist
          const carData = (scan.serie || scan.marca || scan.color || scan.ubicaciones) ? {
            serie: scan.serie || scan.identifier || scan.barcode || scan.code,
            marca: scan.marca || '',
            color: scan.color || '',
            ubicaciones: scan.ubicaciones || ''
          } : scan.carData; // Fall back to carData object if it exists
          
          return {
            id: scan.id || `${scan.barcode || scan.code}-${Date.now()}`,
            code: scan.barcode || scan.code,
            timestamp: new Date(scan.timestamp || scan.scannedAt || scan.date || new Date()),
            confirmed: scan.confirmed || true,
            user: scan.scannedBy || scan.user || scan.userName || 'Usuario desconocido',
            carData: carData // Use the constructed or existing car data
          };
        });
        
        
        // Only update if we got new data or if the data is different
        const hasNewData = latestScans.length !== scannedCodes.length;
        const hasDifferentData = latestScans.some((scan, index) => 
          !scannedCodes[index] || scan.code !== scannedCodes[index].code
        );
        
        // Also check if carData has changed
        const hasCarDataChanges = latestScans.some((scan, index) => {
          const existingCode = scannedCodes[index];
          if (!existingCode) return true;
          
          const hasExistingCarData = !!existingCode.carData;
          const hasNewCarData = !!scan.carData;
          
          // If one has carData and the other doesn't, it's a change
          if (hasExistingCarData !== hasNewCarData) return true;
          
          // If both have carData, compare the fields
          if (hasExistingCarData && hasNewCarData) {
            return existingCode.carData?.serie !== scan.carData?.serie ||
                   existingCode.carData?.marca !== scan.carData?.marca ||
                   existingCode.carData?.color !== scan.carData?.color ||
                   existingCode.carData?.ubicaciones !== scan.carData?.ubicaciones;
          }
          
          return false;
        });
        
        
        if (hasNewData || hasDifferentData || hasCarDataChanges) {
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
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error syncing session data:', error);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [selectedAgency, currentMonth, currentYear, isSessionActive, scannedCodes, sessionId, showInfo]);

  // Force sync if we have codes without car data (from old storage)
  useEffect(() => {
    if (selectedAgency && currentMonth && currentYear && isSessionActive && scannedCodes.length > 0) {
      const hasCodesWithoutCarData = scannedCodes.some(code => !code.carData);
      if (hasCodesWithoutCarData) {
        syncSessionData();
      }
    }
  }, [selectedAgency, currentMonth, currentYear, isSessionActive, scannedCodes, syncSessionData]);

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
      // 3. We've reached the 2-inventory limit (completedInventories >= 2) AND
      // 4. It was completed by someone else (not the current user)
      if ((completionCheck.completed || completionCheck.isCompleted) && 
          isSessionActive && 
          completionCheck.completedInventories >= 2 &&
          completionCheck.completedBy !== user?.name &&
          completionCheck.completedBy !== user?.email) {
        
        // Clear any cached session since inventory was completed by someone else
        clearSession(selectedAgency.name, currentMonth, currentYear);
        setScannedCodes([]);
        setIsSessionActive(false);
        setSessionId('');
        
        showError(
          'Inventario Completado',
          `El inventario para ${getMonthName(currentMonth)} ${currentYear} ha sido completado por ${completionCheck.completedBy || 'otro usuario'}. Tu sesión ha sido terminada y los datos de respaldo han sido limpiados.`
        );
        return true; // Inventory was completed and session was terminated
      }
      
      return false; // No session termination needed
    } catch (error) {
      console.error('Error checking global inventory completion:', error);
      return false; // Assume not completed if check fails
    }
  }, [selectedAgency, currentMonth, currentYear, isSessionActive, showError]);

  // Load existing session data from sessionStorage and local storage
  const loadExistingSession = useCallback(async () => {
    if (!selectedAgency || !currentMonth || !currentYear) return;

    // First, always check if inventory was completed by someone else
    setIsValidatingSession(true);
    const wasCompleted = await checkGlobalInventoryCompletion();
    setIsValidatingSession(false);

    if (wasCompleted) {
      // Inventory was completed, clear any existing session but allow new sessions
      clearSession(selectedAgency.name, currentMonth, currentYear);
      setScannedCodes([]);
      setIsSessionActive(false);
      setSessionId('');
      return;
    }

  // Check for cached session in sessionStorage first
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
          carData: code.carData, // Include car data if available
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

  // No longer needed - Google Drive handles file cleanup automatically

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
          currentYear,
          sessionId
        );

        if (inventoryResponse.success && inventoryResponse.data.scans) {
          const existingScans: ScannedCode[] = inventoryResponse.data.scans.map(
            (scan: any) => ({
              id: scan.id,
              code: scan.code,
              timestamp: new Date(scan.timestamp || scan.date),
              confirmed: true,
              user: scan.scannedBy || scan.user || scan.userName || 'Usuario desconocido',
              carData: scan.carData, // Include car data if available from backend
            })
          );

          setScannedCodes(existingScans);
          setIsSessionActive(true);
          
          // Set the current inventory ID when joining an existing inventory
          setCurrentInventoryId(inventoryResponse.data.id);
          
          // Generate a unique user session ID
          const userSessionId = `sess_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          setSessionId(userSessionId);

          // Save to session storage
          saveSessionToStorage(existingScans, true, userSessionId);

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

  // Save session data to sessionStorage and local storage
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
          carData: code.carData, // Include car data if available
        })),
        isSessionActive: active,
        sessionId: id,
        lastUpdated: new Date().toISOString(),
        agency: selectedAgency.name,
        month: currentMonth,
        year: currentYear,
      };

      // Save to session storage
      saveSession(sessionData);

      // No longer saving to localStorage - Google Drive integration handles file storage
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
      // For active inventories, allow users to join the session (multi-user collaboration)
      if (response.exists && response.status === 'Active') {
        showInfo(
          'Inventario Activo Encontrado',
          `Hay un inventario activo para ${getMonthName(currentMonth)} ${currentYear}. Puedes unirte a la sesión existente.`
        );
        return true; // Allow joining active session
      }

      // For completed inventories, allow starting new sessions (up to 2 per month)
      if (response.exists && response.status === 'Completed') {
        // The backend will handle the 2-inventory limit check
        return true; // Allow starting new session
      }

      // For completed inventories, let the backend's check-inventory-limits handle the blocking
      // This allows the proper 2-inventory-per-month logic to work
      return true;
    } catch (err) {
      console.error('Error checking existing inventory:', err);
      return true; // Allow to proceed if check fails
    }
  }, [selectedAgency, currentMonth, currentYear]);

  // Check if inventory was completed by another user (with throttling and deduplication)
  const checkForInventoryCompletion = useCallback(async () => {
    console.log('🔍 DEBUG [MAIN CHECK]: Starting completion check');
    console.log('🔍 DEBUG [MAIN CHECK]: selectedAgency:', selectedAgency?.name);
    console.log('🔍 DEBUG [MAIN CHECK]: currentMonth:', currentMonth);
    console.log('🔍 DEBUG [MAIN CHECK]: currentYear:', currentYear);
    console.log('🔍 DEBUG [MAIN CHECK]: user.sub:', user?.sub);
    console.log('🔍 DEBUG [MAIN CHECK]: isSessionActive:', isSessionActive);
    console.log('🔍 DEBUG [MAIN CHECK]: sessionId:', sessionId);
    
    if (!selectedAgency || !currentMonth || !currentYear || !user?.sub) {
      console.log('⏭️ DEBUG [MAIN CHECK]: Missing required data, skipping check');
      return { wasCompleted: false, completedBy: null };
    }

    // Always check for completion, but only notify if it's our current session
    if (isSessionActive && sessionId) {
      console.log('✅ DEBUG [MAIN CHECK]: User has active session, checking session completion');
      return await checkSessionCompletion();
    }

    // If no active session, check for any completion but don't notify
    // This helps with session state management
    console.log('✅ DEBUG [MAIN CHECK]: No active session, checking global completion');
    return await checkGlobalCompletion();
  }, [selectedAgency, currentMonth, currentYear, isSessionActive, sessionId, user]);

  // Check completion for specific session
  const checkSessionCompletion = useCallback(async () => {
    if (!sessionId) return { wasCompleted: false, completedBy: null };

    // Throttle requests - only check every 3 seconds for immediate responsiveness
    const now = Date.now();
    if (now - lastCompletionCheck < 3000) {
      return { wasCompleted: false, completedBy: null };
    }

    // Prevent concurrent requests
    if (isCheckingCompletion) {
      return { wasCompleted: false, completedBy: null };
    }

    try {
      setIsCheckingCompletion(true);
      setLastCompletionCheck(now);

      const result = await checkInventoryCompletionByOther(
        selectedAgency.name,
        currentMonth,
        currentYear,
        user.sub,
        sessionId
      );

      if (result.completed && result.completedBy !== user.name) {
        console.log('🔍 DEBUG [SESSION CHECK]: Completion detected!');
        console.log('🔍 DEBUG [SESSION CHECK]: Result:', result);
        console.log('🔍 DEBUG [SESSION CHECK]: Inventory completed by:', result.completedBy);
        console.log('🔍 DEBUG [SESSION CHECK]: isSessionActive:', isSessionActive);
        console.log('🔍 DEBUG [SESSION CHECK]: Inventory ID:', result.sessionId);
        console.log('🔍 DEBUG [SESSION CHECK]: Inventory status: completed');
        
        // If inventory is completed, check if we've reached the 2-inventory limit
        if (result.completed) {
          console.log('✅ DEBUG [SESSION CHECK]: Inventory ID:', result.sessionId, 'is completed');
          console.log('🔍 DEBUG [SESSION CHECK]: The inventory', result.sessionId, 'is completed');
          console.log('🔍 DEBUG [SESSION CHECK]: Current user sessionId:', sessionId);
          console.log('🔍 DEBUG [SESSION CHECK]: Current user inventoryId:', currentInventoryId);
          console.log('🔍 DEBUG [SESSION CHECK]: Completed inventory ID:', result.sessionId);
          
          // Check if we've reached the 2-inventory limit
          if (result.completedInventories >= 2) {
            console.log('🚨 DEBUG [SESSION CHECK]: 2-inventory limit reached - terminating all sessions');
            
            // Terminate ALL active sessions when limit is reached
            if (isSessionActive) {
              console.log('🧹 DEBUG [SESSION CHECK]: Terminating current user session - 2-inventory limit reached');
              setIsSessionActive(false);
              setSessionId('');
              setCurrentInventoryId('');
              setScannedCodes([]);
              
              // Clear session storage
              if (selectedAgency && currentMonth && currentYear) {
                clearSession(selectedAgency.name, currentMonth, currentYear);
              }
            }
            
            return {
              wasCompleted: true, // Terminate session
              completedBy: result.completedBy || 'Usuario desconocido',
            };
          } else {
            console.log('⏭️ DEBUG [SESSION CHECK]: First inventory completed - allowing second inventory');
            return {
              wasCompleted: false, // Don't terminate, allow second inventory
              completedBy: result.completedBy || 'Usuario desconocido',
            };
          }
        } else {
          console.log('⏭️ DEBUG [SESSION CHECK]: Inventory is not completed, continuing current session');
        }
      } else {
        console.log('🔍 DEBUG [SESSION CHECK]: No completion detected or completed by current user');
        console.log('🔍 DEBUG [SESSION CHECK]: Result completed:', result.completed);
        console.log('🔍 DEBUG [SESSION CHECK]: Completed by:', result.completedBy);
        console.log('🔍 DEBUG [SESSION CHECK]: Current user:', user.name);
      }

      return { wasCompleted: false, completedBy: null };
    } catch (error) {
      console.error('Error checking inventory completion:', error);
      return { wasCompleted: false, completedBy: null };
    } finally {
      setIsCheckingCompletion(false);
    }
  }, [selectedAgency, currentMonth, currentYear, sessionId, user, lastCompletionCheck, isCheckingCompletion, lastNotifiedCompletion]);

  // Check global completion - always check but only notify for our specific session
  const checkGlobalCompletion = useCallback(async () => {
    // Throttle requests - only check every 3 seconds for immediate responsiveness
    const now = Date.now();
    if (now - lastCompletionCheck < 3000) {
      return { wasCompleted: false, completedBy: null };
    }

    // Prevent concurrent requests
    if (isCheckingCompletion) {
      return { wasCompleted: false, completedBy: null };
    }

    try {
      setIsCheckingCompletion(true);
      setLastCompletionCheck(now);

      // Check for any completed inventory in this month/year
      const result = await checkInventoryCompletion({
        agency: selectedAgency.name,
        month: currentMonth,
        year: currentYear,
      });

      if ((result.completed || result.isCompleted) && result.completedBy !== user.name) {
        console.log('🔍 DEBUG [GLOBAL CHECK]: Completion detected!');
        console.log('🔍 DEBUG [GLOBAL CHECK]: Result:', result);
        console.log('🔍 DEBUG [GLOBAL CHECK]: Inventory completed by:', result.completedBy);
        console.log('🔍 DEBUG [GLOBAL CHECK]: isSessionActive:', isSessionActive);
        console.log('🔍 DEBUG [GLOBAL CHECK]: Inventory ID:', result.sessionId);
        console.log('🔍 DEBUG [GLOBAL CHECK]: Inventory status: completed');
        
        // If inventory is completed, check if we've reached the 2-inventory limit
        if (result.completed) {
          console.log('✅ DEBUG [GLOBAL CHECK]: Inventory ID:', result.sessionId, 'is completed');
          console.log('🔍 DEBUG [GLOBAL CHECK]: The inventory', result.sessionId, 'is completed');
          
          // Check if we've reached the 2-inventory limit
          if (result.completedInventories >= 2) {
            console.log('🚨 DEBUG [GLOBAL CHECK]: 2-inventory limit reached - terminating all sessions');
            
            // Terminate ALL active sessions when limit is reached
            if (isSessionActive) {
              console.log('🧹 DEBUG [GLOBAL CHECK]: Terminating current user session - 2-inventory limit reached');
              setIsSessionActive(false);
              setSessionId('');
              setCurrentInventoryId('');
              setScannedCodes([]);
              
              // Clear session storage
              if (selectedAgency && currentMonth && currentYear) {
                clearSession(selectedAgency.name, currentMonth, currentYear);
              }
            }
            
            return {
              wasCompleted: true, // Terminate session
              completedBy: result.completedBy || 'Usuario desconocido',
            };
          } else {
            console.log('⏭️ DEBUG [GLOBAL CHECK]: First inventory completed - allowing second inventory');
            return {
              wasCompleted: false, // Don't terminate, allow second inventory
              completedBy: result.completedBy || 'Usuario desconocido',
            };
          }
        } else {
          console.log('⏭️ DEBUG [GLOBAL CHECK]: Inventory is not completed, continuing current session');
        }
      } else {
        console.log('🔍 DEBUG [GLOBAL CHECK]: No completion detected or completed by current user');
        console.log('🔍 DEBUG [GLOBAL CHECK]: Result completed:', result.completed);
        console.log('🔍 DEBUG [GLOBAL CHECK]: Completed by:', result.completedBy);
        console.log('🔍 DEBUG [GLOBAL CHECK]: Current user:', user.name);
      }

      return { wasCompleted: false, completedBy: null };
    } catch (error) {
      console.error('Error checking global inventory completion:', error);
      return { wasCompleted: false, completedBy: null };
    } finally {
      setIsCheckingCompletion(false);
    }
  }, [selectedAgency, currentMonth, currentYear, user, lastCompletionCheck, isCheckingCompletion, lastNotifiedCompletion, isSessionActive, sessionId]);

  // Clear inventory completed by other notification
  const clearInventoryCompletedNotification = useCallback(() => {
    setInventoryCompletedByOther(null);
    setLastCompletionCheck(0); // Reset the throttle timer
    setIsCheckingCompletion(false); // Reset the checking flag
    setLastNotifiedCompletion(null); // Reset completion tracking
    localStorage.removeItem('lastNotifiedCompletion'); // Clear from localStorage
    
    // Clear any remaining session state
    setIsSessionActive(false);
    setSessionId('');
    setScannedCodes([]);
    
    // Clear session storage
    if (selectedAgency && currentMonth && currentYear) {
      clearSession(selectedAgency.name, currentMonth, currentYear);
    }
  }, [selectedAgency, currentMonth, currentYear]);

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
    async (barcode: string, carData?: { serie: string; marca: string; color: string; ubicaciones: string }, scanTimestamp?: Date) => {
      if (!selectedAgency) {
        setError('No agency selected');
        return false;
      }

      if (!user?.email && !user?.name) {
        setError('User information not available');
        return false;
      }

      // For new QR system with car data, validate 17 character VIN
      if (carData) {
        const codePattern = /^[A-Z0-9]{17}$/i;
        if (!codePattern.test(carData.serie)) {
          setError(
            `Invalid VIN format. Expected 17-character alphanumeric code, got: "${carData.serie}". Please scan a valid QR code or use manual input.`
          );
          return false;
        }
        // Use the serie from carData as the barcode for duplicate checking
        barcode = carData.serie;
      } else {
        // Legacy barcode validation (8 digits)
        const codePattern = /^\d{8}$/;
        if (!codePattern.test(barcode)) {
          setError(
            `Invalid code format. Expected 8-digit number, got: "${barcode}". Please scan a valid 8-digit barcode or use manual input.`
          );
          return false;
        }
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
        // Use the provided scan timestamp or create a new one if not provided
        const actualScanTime = scanTimestamp || new Date();
        const timestamp = actualScanTime.toISOString();

        // Prepare the data for the API call
        const scanData = {
          agency: selectedAgency.name,
          code: barcode,
          timestamp,
          user: user.email || user.name || '',
          userName: user.name || user.email || 'Unknown User',
          month: currentMonth,
          year: currentYear,
          carData: carData, // Include car data if available
        };

        const response = await saveScan(scanData);

        // Add to local state with the actual scan time
        const newScan: ScannedCode = {
          id: response.data?.id || Date.now().toString(),
          code: barcode,
          timestamp: actualScanTime,
          confirmed: true,
          user: user.name || user.email || 'Usuario desconocido',
          carData: carData, // Include car data if available
        };

        const updatedCodes = [...scannedCodes, newScan];
        setScannedCodes(updatedCodes);
        setIsSessionActive(true);

        // Save to session storage
        saveSessionToStorage(updatedCodes, true, sessionId);

        // Check for completion immediately after successful scan
        setTimeout(async () => {
          await checkForInventoryCompletion();
        }, 1000); // Check 1 second after scan

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save scan';
        
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
    if (!selectedAgency) {
      setError('No active session');
      return false;
    }

    if (!user?.email && !user?.name) {
      setError('User information not available');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If no codes were scanned, just clear the session locally
      // No need to call backend since no inventory was created
      if (scannedCodes.length === 0) {
        // Clear session storage
        clearSession(selectedAgency.name, currentMonth, currentYear);
        
        // Reset local state
        setScannedCodes([]);
        setIsSessionActive(false);
        setSessionId('');
        
        // Return completion info for the UI
        return {
          success: true,
          completedBy: user.name || user.email || 'Usuario desconocido',
          isCurrentUser: true,
          totalScans: 0
        };
      }

      // Call backend to finish session and save to Google Sheets (only when there are scanned codes)
      await finishSession({
        agency: selectedAgency.name,
        user: user.email || user.name || '',
        userName: user.name || user.email || 'Unknown User',
        month: currentMonth,
        year: currentYear,
        totalScans: scannedCodes.length,
      });

      // Note: Google Drive backup now happens automatically on download
      // No manual backup call needed - the backend handles it automatically

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

      // No longer needed - Google Drive handles file management

    // Generate new session ID
    const newSessionId = `sess_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setSessionId(newSessionId);

    setScannedCodes([]);
    setIsSessionActive(true);
    setError(null);
    
    // Set current inventory ID when starting a new session
    // This will be updated when the user actually joins a specific inventory
    setCurrentInventoryId('');

    // Save to session storage
    saveSessionToStorage([], true, newSessionId);
    return true;
  }, [checkLimits, checkExistingInventory, saveSessionToStorage, showError, selectedAgency, currentMonth, currentYear]);

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
          user: scan.scannedBy || scan.user || scan.userName || 'Usuario desconocido',
          carData: scan.carData // Include car data if available from backend
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
      
      // Set current inventory ID when continuing a session
      // This will be updated when we know which specific inventory the user is working on
      setCurrentInventoryId('');
    } catch (error) {
      console.error('Error loading existing scans when continuing session:', error);
      // Continue with empty scans if loading fails
      setScannedCodes([]);
      setIsSessionActive(true);
      setError(null);
      
      // Set current inventory ID when continuing a session
      setCurrentInventoryId('');
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
    setCurrentInventoryId('');

    // Clear session storage
    if (selectedAgency && currentMonth && currentYear) {
      clearSession(selectedAgency.name, currentMonth, currentYear);
    }
  }, [selectedAgency, currentMonth, currentYear]);

  // Check if any inventory has been started for the current month/agency
  const hasAnyInventoryStarted = useCallback(async (): Promise<boolean> => {
    if (!selectedAgency || !currentMonth || !currentYear) return false;

    try {
      const response = await checkMonthlyInventory(
        selectedAgency.name,
        currentMonth,
        currentYear
      );

      // Return true if any inventory exists (active or completed)
      return response.exists;
    } catch (error) {
      console.error('Error checking if inventory has started:', error);
      return false;
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
    isValidatingSession,
    isSyncing,
    lastSyncTime,

    // New Backend Features
    checkLimits,
    deleteScannedEntryFromBackend,
    downloadInventory: useCallback(async (inventoryData: {
      agencyName: string;
      monthName: string;
      year: number;
      totalScans: number;
      createdBy: string;
      sessionId?: string; // Add session ID for multiple inventories
      scannedCodes?: ScannedCode[];
    }) => {
      if (!inventoryData) {
        showError('Error', 'No hay datos de inventario para descargar');
        return false;
      }

      setIsLoading(true);
      try {
        // Use the new Google Drive download logic
        const { getStoredFiles, downloadStoredFile } = await import('../services/api');
        
        // Get stored files from Google Drive for this agency
        const storedFiles = await getStoredFiles(inventoryData.agencyName);
        
        // Find the file that matches this inventory's session ID or get the most recent
        let matchingFile;
        if (inventoryData.sessionId) {
          matchingFile = storedFiles.files?.find((file: any) => {
            const fileName = file.name || '';
            const fileSessionId = fileName.split('_').pop()?.replace('.csv', '');
            return fileSessionId === inventoryData.sessionId;
          });
        } else {
          // Get the most recent file
          matchingFile = storedFiles.files?.[0];
        }
        
        if (!matchingFile) {
          throw new Error('No se encontró el archivo correspondiente en Google Drive');
        }
        
        // Download the specific file using its Google Drive file ID
        const blob = await downloadStoredFile(matchingFile.id);
        
        // Create download link with the correct filename
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = matchingFile.name || `${inventoryData.agencyName}_${inventoryData.monthName}_${inventoryData.year}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showSuccess('Descarga Completada', 'El archivo CSV ha sido descargado exitosamente desde Google Drive.');
        
        return true;
      } catch (error) {
        console.error('Error downloading inventory:', error);
        
        // Handle different types of errors
        if (error.message.includes('Google Drive') || error.message.includes('backup')) {
          showError('Error de Respaldo', 'El archivo se descargó pero el respaldo en Google Drive falló. Por favor contacta al soporte.');
        } else {
          showError('Error de Descarga', 'No se pudo descargar el archivo CSV');
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    }, [currentMonth, currentYear, showSuccess, showError]),
    checkForInventoryCompletion,
    syncSessionData,
    clearInventoryCompletedNotification,
    reset,

    // Actions
    addScannedCode,
    deleteScannedCode,
    deleteMultipleScannedCodes,
    finishInventorySession,
    pauseInventorySession,
    startSession,
    continueSession,
    clearError,

    // State
    inventoryCompletedByOther,

    // Computed
    scanCount: scannedCodes.length,
    hasActiveSession: isSessionActive && scannedCodes.length > 0,
    canFinishSession: scannedCodes.length > 0 && isSessionActive,
    monthName: currentMonth ? getMonthName(currentMonth) : 'Mes Inválido',
    
    // Inventory status check
    hasAnyInventoryStarted,
    resetInventoryStatusForNewMonth,
  };
};
