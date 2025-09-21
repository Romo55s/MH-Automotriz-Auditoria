import { useAuth0 } from '@auth0/auth0-react';
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    Camera,
    CheckCircle,
    Clock,
    Download,
    FileText,
    Info,
    Pause,
    Plus,
    RefreshCw,
    RotateCcw,
    User,
    X
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useInventory } from '../hooks/useInventory';
import {
    getAgencyInventories,
    getMonthlyInventory
} from '../services/api';
import { MonthlyInventory, ScannedCode } from '../types';
import BulkDeleteConfirmationModal from './BulkDeleteConfirmationModal';
import CompletionModal from './CompletionModal';
import ConfirmationModal from './ConfirmationModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import DownloadConfirmationModal from './DownloadConfirmationModal';
import Footer from './Footer';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';
import LocalStorageInfo from './LocalStorageInfo';
import ManualInputModal from './ManualInputModal';
import NewInventoryConfirmationModal from './NewInventoryConfirmationModal';
import ScannedCodesList from './ScannedCodesList';
import SessionTerminatedModal from './SessionTerminatedModal';
import UnifiedScanner from './UnifiedScanner';

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { agencyName } = useParams<{ agencyName?: string }>();
  const { user } = useAuth0();
  const { selectedAgency, setSelectedAgency } = useAppContext();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // State for UI modals and displays
  const [showScanner, setShowScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentScannedCode, setCurrentScannedCode] = useState('');
  const [showStopOptions, setShowStopOptions] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<{code: string, index: number} | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showNewInventoryConfirmation, setShowNewInventoryConfirmation] = useState(false);
  const [showSessionTerminatedModal, setShowSessionTerminatedModal] = useState(false);
  const [completedInventoryData, setCompletedInventoryData] = useState<{
    totalScans: number;
    agencyName: string;
    monthName: string;
    year: number;
  } | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedIndicesForBulkDelete, setSelectedIndicesForBulkDelete] = useState<number[]>([]);
  const [selectedBarcodesForBulkDelete, setSelectedBarcodesForBulkDelete] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showDownloadConfirmation, setShowDownloadConfirmation] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadInventoryData, setDownloadInventoryData] = useState<{
    monthName: string;
    year: number;
    totalScans: number;
    createdBy: string;
    scannedCodes?: ScannedCode[];
  } | null>(null);
  const [sessionTerminationData, setSessionTerminationData] = useState<{
    completedBy: string;
    isCurrentUser?: boolean;
  } | null>(null);

  // State for monthly inventory management
  const [inventories, setInventories] = useState<MonthlyInventory[]>([]);
  const [isLoadingInventories, setIsLoadingInventories] = useState(false);
  const [inventoriesError, setInventoriesError] = useState<string | null>(null);
  const [previousScanCount, setPreviousScanCount] = useState(0);

  // Get inventory functions from the hook
  const {
    scannedCodes,
    isLoading,
    error,
    isSessionActive,
    currentMonth,
    currentYear,
    monthName,
    sessionId,
    isValidatingSession,
    isSyncing,
    lastSyncTime,
    addScannedCode,
    deleteScannedCode,
    deleteMultipleScannedCodes,
    finishInventorySession,
    pauseInventorySession,
    startSession,
    continueSession,
    clearError,
    reset,
    checkLimits,
    deleteScannedEntryFromBackend,
    downloadInventory,
    checkForInventoryCompletion,
    syncSessionData,
  } = useInventory();

  // Handle agency name from URL
  useEffect(() => {
    if (agencyName && !selectedAgency) {
      // Find agency by name and set it
      const agencies = [
        { id: '1', name: 'Suzuki', googleSheetId: 'suzuki-sheet-id' },
        { id: '2', name: 'Honda', googleSheetId: 'honda-sheet-id' },
        { id: '3', name: 'Toyota', googleSheetId: 'toyota-sheet-id' },
        { id: '4', name: 'Nissan', googleSheetId: 'nissan-sheet-id' },
        { id: '5', name: 'Hyundai', googleSheetId: 'hyundai-sheet-id' },
        { id: '6', name: 'Kia', googleSheetId: 'kia-sheet-id' },
        { id: '7', name: 'Mazda', googleSheetId: 'mazda-sheet-id' },
        { id: '8', name: 'Ford', googleSheetId: 'ford-sheet-id' },
        { id: '9', name: 'Chevrolet', googleSheetId: 'chevrolet-sheet-id' },
        { id: '10', name: 'Volkswagen', googleSheetId: 'volkswagen-sheet-id' },
      ];
      
      const agency = agencies.find(a => 
        a.name.toLowerCase() === agencyName.toLowerCase()
      );
      
      if (agency) {
        setSelectedAgency(agency);
      } else {
        // Agency not found, redirect to select-agency
        navigate('/select-agency');
      }
    }
  }, [agencyName, selectedAgency, setSelectedAgency, navigate]);

  // Load agency inventories
  const loadInventories = useCallback(async () => {
    if (!selectedAgency) return;

    setIsLoadingInventories(true);
    setInventoriesError(null);
    
    try {
      const response = await getAgencyInventories(selectedAgency.name);
      
      // Handle different response formats
      let inventories = [];
      
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          inventories = response;
        } else if (response.data && Array.isArray(response.data.inventories)) {
          inventories = response.data.inventories;
        } else if (Array.isArray(response.inventories)) {
          inventories = response.inventories;
        }
      }
      
      // Transform backend data to match frontend interface
      const transformedInventories = inventories.map((inv: any, index: number) => {
        // Convert month name to month number - backend sends English month names
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthNumber = (monthNames.indexOf(inv.month) + 1).toString().padStart(2, '0');
        
        return {
          id: inv.sessionId || `inv_${index}`,
          agencyId: inv.agency?.toLowerCase() || 'unknown',
          month: monthNumber,
          year: parseInt(inv.year) || new Date().getFullYear(),
          monthName: inv.month,
          status: inv.status,
          createdAt: new Date(inv.createdAt),
          createdBy: inv.createdBy || inv.userName || 'Unknown',
          totalScans: parseInt(inv.totalScans) || 0,
          sessionId: inv.sessionId,
          lastUpdated: new Date()
        };
      });
      
      setInventories(transformedInventories);
      
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load inventories';
      
      setInventoriesError(errorMessage);
    } finally {
      setIsLoadingInventories(false);
    }
  }, [selectedAgency]);

  // Load inventories when agency changes
  useEffect(() => {
    if (!selectedAgency) {
      navigate('/select-agency');
      return;
    }
    
    loadInventories();
  }, [selectedAgency, navigate, loadInventories]);

  // Check for inventory completion on page load (which would terminate active sessions)
  useEffect(() => {
    const checkCompletion = async () => {
      if (selectedAgency && isSessionActive) {
        const result = await checkForInventoryCompletion();
        if (result.wasCompleted) {
          setSessionTerminationData({ 
            completedBy: result.completedBy,
            isCurrentUser: false
          });
          setShowSessionTerminatedModal(true);
        }
      }
    };

    checkCompletion();
  }, [selectedAgency, isSessionActive]); // Removed checkForInventoryCompletion from dependencies

  // Detect new barcodes added by other users
  useEffect(() => {
    if (isSessionActive && scannedCodes.length > previousScanCount && previousScanCount > 0) {
      const newBarcodesCount = scannedCodes.length - previousScanCount;
      showInfo(
        'Nuevos Códigos Detectados',
        `${newBarcodesCount} nuevo${newBarcodesCount > 1 ? 's' : ''} código${newBarcodesCount > 1 ? 's' : ''} agregado${newBarcodesCount > 1 ? 's' : ''} por otro${newBarcodesCount > 1 ? 's' : ''} usuario${newBarcodesCount > 1 ? 's' : ''}`
      );
    }
    setPreviousScanCount(scannedCodes.length);
  }, [scannedCodes.length, isSessionActive, previousScanCount, showInfo]);

  const handleScan = async (code: string, carData?: { serie: string; marca: string; color: string; ubicaciones: string }) => {
    
    // Check if this is from manual input (has carData but from manual input)
    if (carData && code.includes('"location":"Manual Input"')) {
      // Handle manual input with car data - use regular inventory system
      try {
        const success = await addScannedCode(carData.serie, carData);
        if (success) {
          showSuccess(`Vehículo agregado: ${carData.serie} - ${carData.marca} (${carData.color})`);
          setShowScanner(false);
          setShowManualInput(false);
        }
      } catch (error) {
        console.error('🚨 Error processing manual input:', error);
        showError(error instanceof Error ? error.message : 'Error al procesar el vehículo');
      }
    } else if (carData && code.startsWith('{')) {
      // Handle actual QR codes from QR generation system
      try {
        const { scanQRCode } = await import('../services/api');
        const result = await scanQRCode(code, user?.email || '', user?.name || '');
        
        if (result.success) {
          showSuccess(`Escaneado: ${carData.serie} - ${carData.marca} (${carData.color})`);
          setShowScanner(false);
          setShowManualInput(false);
          // Trigger a sync to refresh the inventory data
          syncSessionData();
        } else {
          showError(result.message || 'Error al procesar el código QR');
        }
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Error al procesar el código QR');
      }
    } else if (/^[A-Z0-9]{17}$/i.test(code)) {
      // Handle 17-character VIN codes (legacy)
      try {
        const success = await addScannedCode(code);
        if (success) {
          showSuccess(`Código confirmado: ${code}`);
          setShowScanner(false);
          setShowManualInput(false);
        }
      } catch (error) {
        console.error('🚨 Error processing VIN code:', error);
        showError(error instanceof Error ? error.message : 'Error al procesar el código');
      }
    } else {
      // Handle legacy barcode scanning (8 digits)
      setCurrentScannedCode(code);
      setShowScanner(false);
      setShowManualInput(false);
      setShowConfirmation(true);
    }
  };

  const handleConfirmScan = async (code: string) => {
    try {
      const success = await addScannedCode(code);
      if (success) {
        showSuccess(
          'Escaneo Confirmado',
          `El código de barras ${code} ha sido guardado exitosamente`
        );
        setShowConfirmation(false);
        setCurrentScannedCode('');
      }
      // Note: If success is false, the useInventory hook will handle showing the appropriate toast
      // (like duplicate barcode warning), so we don't need to show an additional error here
    } catch (error) {
      showError('Error de Escaneo', 'Ocurrió un error al guardar el escaneo');
    }
  };

  const handleCancelScan = () => {
    setShowConfirmation(false);
    setShowScanner(false);
    setShowManualInput(false);
    setCurrentScannedCode('');
  };

  const handleStopInventory = () => {
    if (scannedCodes.length === 0) {
      showWarning(
        'Sin Escaneos',
        'Por favor escanea al menos un código de barras antes de detener la sesión'
      );
      return;
    }
    setShowStopOptions(true);
  };

  const handleCompleteSession = async () => {
    setShowStopOptions(false);

    try {
      showInfo(
        'Procesando Sesión',
        'Finalizando sesión de inventario y guardando en Google Sheets...'
      );

      const result = await finishInventorySession();
      if (result && result.success) {
        showSuccess(
          'Sesión Completada',
          'La sesión de inventario ha sido finalizada exitosamente'
        );
        loadInventories();
        
        // Show completion modal with download functionality for the user who completed the inventory
        handleShowCompletionModal(result.totalScans);
      } else {
        showError('Error de Sesión', 'Falló al finalizar la sesión de inventario');
      }
    } catch (error) {
      console.error('Error stopping inventory:', error);
      showError(
        'Error de Sesión',
        'Ocurrió un error al finalizar la sesión'
      );
    }
  };

  const handlePauseSession = async () => {
    setShowStopOptions(false);

    try {
      const success = await pauseInventorySession();
      if (success) {
        showSuccess(
          'Sesión Pausada',
          'Tu sesión ha sido pausada. Puedes continuar más tarde o completarla cuando estés listo.'
        );
        loadInventories();
        navigate('/select-agency');
      } else {
        showError('Error de Pausa', 'Falló al pausar la sesión');
      }
    } catch (error) {
      console.error('Error pausing session:', error);
      showError(
        'Error de Pausa',
        'Ocurrió un error al pausar la sesión'
      );
    }
  };

  const handleContinueSession = () => {
    continueSession();
    setShowStopOptions(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSessionDuration = () => {
    const now = new Date();
    const startTime = new Date(); // This should come from the hook
    const diff = now.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getMonthName = (month: string) => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Handle edge cases
    if (!month || month === '00' || month === '0') {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Paused':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Active':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className='w-4 h-4' />;
      case 'Paused':
        return <Clock className='w-4 h-4' />;
      case 'Active':
      default:
        return <Clock className='w-4 h-4' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'Completado';
      case 'Paused':
        return 'Pausado';
      case 'Active':
      default:
        return 'Activo';
    }
  };

  // Check if a completed inventory is still downloadable (within 1.5 days)
  const isInventoryDownloadable = (inventory: MonthlyInventory) => {
    if (inventory.status !== 'Completed') return false;
    
    const now = new Date();
    const completedDate = new Date(inventory.lastUpdated);
    const diffHours = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
    
    return diffHours <= 36; // 1.5 days = 36 hours
  };

  // Get time remaining for download
  const getDownloadTimeRemaining = (inventory: MonthlyInventory) => {
    if (inventory.status !== 'Completed') return null;
    
    const now = new Date();
    const completedDate = new Date(inventory.lastUpdated);
    const diffHours = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
    const remainingHours = 36 - diffHours;
    
    if (remainingHours <= 0) return null;
    
    const hours = Math.floor(remainingHours);
    const minutes = Math.floor((remainingHours - hours) * 60);
    
    return `${hours}h ${minutes}m`;
  };

  const handleRefreshInventories = () => {
    loadInventories();
  };

  const handleDeleteCode = (code: string, index: number) => {
    setCodeToDelete({ code, index });
    setShowDeleteConfirmation(true);
  };

  const handleDeleteCodeByIndex = (index: number) => {
    const code = scannedCodes[index];
    if (code) {
      setCodeToDelete({ code: code.code, index });
      setShowDeleteConfirmation(true);
    }
  };

  const handleBulkDelete = (selectedIndices: number[]) => {
    // Get the barcodes to delete
    const barcodesToDelete = selectedIndices.map(index => scannedCodes[index].code);
    
    // Store the selected indices and barcodes, then show the modal
    setSelectedIndicesForBulkDelete(selectedIndices);
    setSelectedBarcodesForBulkDelete(barcodesToDelete);
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedBarcodesForBulkDelete.length === 0) return;
    
    setIsBulkDeleting(true);
    
    try {
      // Use the stored barcodes for deletion
      await deleteMultipleScannedCodes(selectedBarcodesForBulkDelete);
      
      // Close the modal and reset state
      setShowBulkDeleteModal(false);
      setSelectedIndicesForBulkDelete([]);
      setSelectedBarcodesForBulkDelete([]);
    } catch (error) {
      console.error('Error in bulk delete:', error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false);
    setSelectedIndicesForBulkDelete([]);
    setSelectedBarcodesForBulkDelete([]);
  };

  const handleDeleteConfirmation = () => {
    if (codeToDelete) {
      deleteScannedCode(codeToDelete.index);
      setShowDeleteConfirmation(false);
      setCodeToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
    setCodeToDelete(null);
  };

  const handleShowCompletionModal = async (localTotalScans: number) => {
    if (selectedAgency) {
      try {
        // Fetch the actual monthly inventory data to get the correct total
        const monthlyInventory = await getMonthlyInventory(
          selectedAgency.name,
          currentMonth,
          currentYear
        );
        
        // Use the total from the monthly inventory if available, otherwise use local total
        const actualTotalScans = monthlyInventory?.totalScans || localTotalScans;
        
        setCompletedInventoryData({
          totalScans: actualTotalScans,
          agencyName: selectedAgency.name,
          monthName,
          year: currentYear,
        });
        setShowCompletionModal(true);
      } catch (error) {
        console.error('Error fetching monthly inventory for completion modal:', error);
        // Fallback to local total if API call fails
        setCompletedInventoryData({
          totalScans: localTotalScans,
          agencyName: selectedAgency.name,
          monthName,
          year: currentYear,
        });
        setShowCompletionModal(true);
      }
    }
  };

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
    setCompletedInventoryData(null);
  };

  const handleStartNewInventoryFromCompletion = () => {
    setShowCompletionModal(false);
    setShowNewInventoryConfirmation(true);
  };

  const handleConfirmNewInventory = async () => {
    setShowNewInventoryConfirmation(false);
    await handleStartNewInventory();
  };

  const handleCancelNewInventory = () => {
    setShowNewInventoryConfirmation(false);
  };

  const handleDownloadCSV = async () => {
    // Set the download inventory data for the download confirmation modal
    setDownloadInventoryData({
      monthName: monthName,
      year: currentYear,
      totalScans: scannedCodes.length,
      createdBy: user?.name || user?.email || 'Usuario desconocido',
      scannedCodes: scannedCodes // Include the complete scanned codes with car data
    });
    setShowDownloadConfirmation(true);
  };

  const handleDownloadConfirm = async () => {
    if (!downloadInventoryData) return;

    try {
      setIsDownloading(true);
      setShowDownloadConfirmation(false);
      
      showInfo(
        'Iniciando Descarga',
        'Preparando el archivo CSV del inventario y configurando almacenamiento local...'
      );

      await downloadInventory('csv');
      
      showSuccess(
        'Descarga Completada',
        'El inventario ha sido descargado y los datos se han eliminado de Google Sheets. Los datos están ahora almacenados localmente y se eliminarán automáticamente al inicio del próximo mes.'
      );
    } catch (error) {
      console.error('Error downloading inventory:', error);
      showError(
        'Error de Descarga',
        'Ocurrió un error al descargar el inventario. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setIsDownloading(false);
      setDownloadInventoryData(null);
    }
  };

  const handleDownloadCancel = () => {
    setShowDownloadConfirmation(false);
    setDownloadInventoryData(null);
  };

  const handleDownloadInventory = async (inventory: MonthlyInventory) => {
    if (!isInventoryDownloadable(inventory)) {
      showError('Descarga No Disponible', 'Este inventario ya no está disponible para descarga. El período de descarga ha expirado.');
      return;
    }

    // Set the download inventory data for the download confirmation modal
    setDownloadInventoryData({
      monthName: getMonthName(inventory.month),
      year: inventory.year,
      totalScans: inventory.totalScans,
      createdBy: inventory.createdBy
    });
    
    setShowDownloadConfirmation(true);
  };

  const handleStartNewInventory = async () => {
    if (!selectedAgency) return;

    try {
      // Check if this specific user already has an active session
      const userHasActiveSession = inventories.some(
        inv => inv.month === currentMonth && 
               inv.year === currentYear && 
               inv.status === 'Active' && 
               inv.createdBy === user?.email
      );

      if (userHasActiveSession) {
        showInfo(
          'Sesión Activa',
          `Ya tienes una sesión activa para ${monthName} ${currentYear}. Puedes continuar tu sesión existente.`
        );
        return;
      }

      // Check if the monthly inventory limit is reached (2 completed inventories)
      const completedCount = inventories.filter(
        inv => inv.month === currentMonth && 
               inv.year === currentYear && 
               inv.status === 'Completed'
      ).length;

      if (completedCount >= 2) {
        showError(
          'Límite de Inventarios Alcanzado',
          `Ya se han completado 2 inventarios para ${monthName} ${currentYear}. El límite máximo es de 2 inventarios por mes.`
        );
        return;
      }

      // Allow starting new session (multiple users can have active sessions)
      startSession();
      showSuccess(
        'Nueva Sesión Iniciada',
        `Sesión de inventario iniciada para ${monthName} ${currentYear}. Otros usuarios también pueden trabajar en el mismo inventario.`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to check inventory status';
      showError('Error', errorMessage);
    }
  };

  const handleContinueInventory = async (inventory: MonthlyInventory) => {
    if (inventory.status === 'Completed') {
      showInfo(
        'Inventario Completado',
        'Este inventario ya ha sido completado. Puedes ver los datos pero no agregar nuevos escaneos.'
      );
      return;
    }

    if (inventory.status === 'Paused') {
      showInfo(
        'Continuando Inventario Pausado',
        `Continuando sesión de inventario pausada para ${monthName} ${currentYear} con ${inventory.totalScans} escaneos existentes.`
      );
      await continueSession();
      return;
    }

    showInfo(
      'Continuando Inventario',
      `Continuando sesión de inventario para ${monthName} ${currentYear} con ${inventory.totalScans} escaneos existentes.`
    );
    await continueSession();
  };

  // Check if there's existing inventory data for current month
  const hasExistingInventory = inventories.some(
    inv => inv.month === currentMonth && inv.year === currentYear
  );

  // Check if current user has an active session
  const currentUserActiveSession = inventories.find(
    inv => inv.month === currentMonth && 
           inv.year === currentYear && 
           inv.status === 'Active' && 
           inv.createdBy === user?.email
  );

  // Check if current user has a paused session
  const currentUserPausedSession = inventories.find(
    inv => inv.month === currentMonth && 
           inv.year === currentYear && 
           inv.status === 'Paused' && 
           inv.createdBy === user?.email
  );

  // Get all active sessions for this month (for display)
  const activeSessionsThisMonth = inventories.filter(
    inv => inv.month === currentMonth && 
           inv.year === currentYear && 
           inv.status === 'Active'
  );

  // Check if there are completed inventories for this month
  const completedInventoriesThisMonth = inventories.filter(
    inv => inv.month === currentMonth && 
           inv.year === currentYear && 
           inv.status === 'Completed'
  );

  const existingInventory = inventories.find(
    inv => inv.month === currentMonth && inv.year === currentYear
  );

  if (!selectedAgency) {
    return null;
  }

  return (
    <div className='min-h-screen bg-background relative overflow-hidden'>
      {/* Floating 3D shapes */}
      <div className='floating-shape w-32 h-32 top-20 right-20'></div>
      <div
        className='floating-shape w-24 h-24 bottom-1/4 left-16'
        style={{ animationDelay: '3s' }}
      ></div>
      <div
        className='floating-shape w-20 h-20 top-1/3 left-1/4'
        style={{ animationDelay: '1s' }}
      ></div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Header */}
        <div className='mt-6 sm:mt-8 mb-6 sm:mb-section'>
          <Header
            title='MH Automotriz'
            subtitle={`${selectedAgency.name} - Sesión de Inventario - ${monthName} ${currentYear}`}
            showBackButton={true}
            onBackClick={() => navigate('/select-agency')}
            showUserInfo={true}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className='card border-red-500/20 bg-red-500/10 mb-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <X className='w-5 h-5 text-red-400' />
                <div className='flex flex-col'>
                  <span className='text-red-400 font-medium'>{error}</span>
                  {/* Show detailed error info for debugging */}
                  <details className='mt-2'>
                    <summary className='text-red-300 text-sm cursor-pointer hover:text-red-200'>
                      Ver detalles del error
                    </summary>
                    <div className='mt-2 p-3 bg-red-900/20 rounded border border-red-500/30'>
                      <pre className='text-red-200 text-xs whitespace-pre-wrap break-words'>
                        {JSON.stringify({
                          error: error,
                          timestamp: new Date().toISOString(),
                          userAgent: navigator.userAgent,
                          url: window.location.href,
                          agency: selectedAgency?.name || 'No agency selected'
                        }, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
              <button
                onClick={clearError}
                className='text-red-400 hover:text-red-300 transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}

        {/* Monthly Inventory Info */}
        <div className='card mb-6 sm:mb-section'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3'>
            <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
              <Calendar className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3' />
              Detalles del Inventario Mensual
            </h2>
            {sessionId && (
              <div className='text-xs sm:text-sm text-secondaryText bg-white/10 px-2 sm:px-3 py-1 rounded-lg'>
                Sesión: {sessionId.slice(-8)}
              </div>
            )}
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6'>
            <div className='text-center'>
              <div className='w-14 h-14 sm:w-16 sm:h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4'>
                <Calendar className='w-7 h-7 sm:w-8 sm:h-8 text-white' />
              </div>
              <p className='text-xs sm:text-sm text-secondaryText mb-2'>Mes y Año</p>
              <p className='text-lg sm:text-xl lg:text-2xl font-bold text-white'>
                {monthName} {currentYear}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-14 h-14 sm:w-16 sm:h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4'>
                <User className='w-7 h-7 sm:w-8 sm:h-8 text-white' />
              </div>
              <p className='text-xs sm:text-sm text-secondaryText mb-2'>
                Creador del Inventario
              </p>
              <p className='text-sm sm:text-base lg:text-lg font-semibold text-white truncate px-2'>
                {user?.name || user?.email || 'Usuario Desconocido'}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-14 h-14 sm:w-16 sm:h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4'>
                <Clock className='w-7 h-7 sm:w-8 sm:h-8 text-white' />
              </div>
              <p className='text-xs sm:text-sm text-secondaryText mb-2'>Duración de Sesión</p>
              <p className='text-lg sm:text-xl lg:text-2xl font-bold text-white'>
                {getSessionDuration()}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Inventory Management */}
        <div className='card mb-6 sm:mb-section'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3'>
            <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
              <FileText className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3' />
              Gestión de Inventarios Mensuales
            </h2>
            <button
              onClick={handleRefreshInventories}
              disabled={isLoadingInventories}
              className='btn-secondary text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4 flex items-center justify-center space-x-2'
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingInventories ? 'animate-spin' : ''}`}
              />
              <span>Actualizar</span>
            </button>
          </div>

          {isLoadingInventories ? (
            <div className='p-8 text-center'>
              <LoadingSpinner />
              <p className='text-sm sm:text-base text-white mt-4'>
                Cargando inventarios...
              </p>
            </div>
          ) : inventories.length === 0 ? (
            <div className='p-8 text-center'>
              <FileText className='w-16 h-16 text-white mx-auto mb-4 opacity-50' />
              <p className='text-sm sm:text-base text-white'>
                No se encontraron inventarios para {selectedAgency.name}
              </p>
            </div>
          ) : (
            <div className='overflow-hidden'>
              {/* Desktop Table View - Design System Compliant */}
              <div className='hidden lg:block overflow-x-auto'>
                <div className='rounded-2xl border border-white/30 overflow-hidden' style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <table className='w-full'>
                    <thead className='border-b border-white/20' style={{ background: 'rgba(0,0,0,0.8)' }}>
                      <tr>
                        <th className='px-8 py-6 text-left text-xs font-bold text-white uppercase tracking-wider'>
                          Mes y Año
                        </th>
                        <th className='px-8 py-6 text-left text-xs font-bold text-white uppercase tracking-wider'>
                          Estado
                        </th>
                        <th className='px-8 py-6 text-left text-xs font-bold text-white uppercase tracking-wider'>
                          Creado Por
                        </th>
                        <th className='px-8 py-6 text-left text-xs font-bold text-white uppercase tracking-wider'>
                          Total de Escaneos
                        </th>
                        <th className='px-8 py-6 text-left text-xs font-bold text-white uppercase tracking-wider'>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-white/10'>
                      {inventories.map((inventory, index) => (
                        <tr
                          key={inventory.id}
                          className='transition-all duration-300 hover:bg-white/10 hover:scale-[1.01]'
                          style={{
                            background: index % 2 === 0 
                              ? 'rgba(0,0,0,0.3)'
                              : 'transparent'
                          }}
                        >
                          <td className='px-8 py-6 whitespace-nowrap'>
                            <div className='flex items-center space-x-4'>
                              <div className='w-10 h-10 rounded-lg flex items-center justify-center border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                                <Calendar className='w-5 h-5 text-white' />
                              </div>
                              <div>
                                <span className='font-bold text-white text-lg'>
                                  {getMonthName(inventory.month)} {inventory.year}
                                </span>
                                <p className='text-sm text-white'>
                                  Inventario Mensual
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className='px-8 py-6 whitespace-nowrap'>
                            <span
                              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border transition-all duration-300 ${getStatusColor(
                                inventory.status
                              )}`}
                            >
                              {getStatusIcon(inventory.status)}
                              <span className='ml-3'>
                                {getStatusText(inventory.status)}
                              </span>
                            </span>
                          </td>
                          <td className='px-8 py-6 whitespace-nowrap'>
                            <div className='flex items-center space-x-3'>
                              <User className='w-4 h-4 text-white' />
                              <span className='text-white font-medium'>
                                {inventory.createdBy}
                              </span>
                            </div>
                          </td>
                          <td className='px-8 py-6 whitespace-nowrap'>
                            <span className='font-mono text-xl font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent px-4 py-2 rounded-lg border border-white/30'>
                              {inventory.totalScans}
                            </span>
                          </td>
                          <td className='px-8 py-6 whitespace-nowrap'>
                            {inventory.status === 'Completed' ? (
                              <div className='flex items-center space-x-2'>
                                <CheckCircle className='w-5 h-5 text-green-400' />
                                <span className='text-white text-sm font-medium'>
                                  Completado
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleContinueInventory(inventory)}
                                className='btn-secondary text-sm py-3 px-6 flex items-center space-x-3 rounded-xl border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 font-semibold'
                                style={{
                                  background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                                  backdropFilter: 'blur(20px)'
                                }}
                              >
                                <span>Continuar</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View - Optimized for Narrow Screens */}
              <div className='lg:hidden space-y-4 p-3 sm:p-4'>
                {inventories.map(inventory => (
                  <div
                    key={inventory.id}
                    className='relative overflow-hidden glass-effect rounded-xl p-4 border border-white/30 transition-all duration-300'
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)',
                      backdropFilter: 'blur(20px)'
                    }}
                  >
                    {/* Decorative Background Elements - Smaller for narrow screens */}
                    <div className='absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-xl'></div>
                    <div className='absolute -bottom-3 -left-3 w-10 h-10 bg-gradient-to-tr from-blue-400/20 to-purple-500/20 rounded-full blur-xl'></div>
                    
                    {/* Header Section - Stacked for narrow screens */}
                    <div className='relative z-10 mb-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center space-x-3'>
                          <div className='w-10 h-10 rounded-lg flex items-center justify-center border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                            <Calendar className='w-5 h-5 text-white' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <h3 className='text-base font-bold text-white uppercase tracking-wider truncate'>
                              {getMonthName(inventory.month)} {inventory.year}
                            </h3>
                            <p className='text-xs text-white'>
                              Inventario Mensual
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 ${getStatusColor(
                            inventory.status
                          )}`}
                        >
                          {getStatusIcon(inventory.status)}
                          <span className='ml-1.5'>
                            {getStatusText(inventory.status)}
                          </span>
                        </span>
                      </div>
                      
                      {/* Completed Status - Full width for narrow screens */}
                      {inventory.status === 'Completed' && (
                        <div className='w-full text-center py-2 px-3 rounded-lg border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                          <span className='text-xs text-white font-medium'>
                            Inventario Completado
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Details Section - Compact for narrow screens */}
                    <div className='relative z-10 space-y-3 mb-4'>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between p-3 rounded-lg border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                          <div className='flex items-center space-x-2'>
                            <User className='w-4 h-4 text-white' />
                            <span className='text-xs font-medium text-white'>Creado Por:</span>
                          </div>
                          <span className='text-xs font-semibold text-white truncate max-w-[120px]'>
                            {inventory.createdBy}
                          </span>
                        </div>
                        
                        <div className='flex items-center justify-between p-3 rounded-lg border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                          <div className='flex items-center space-x-2'>
                            <BarChart3 className='w-4 h-4 text-white' />
                            <span className='text-xs font-medium text-white'>Total de Escaneos:</span>
                          </div>
                          <span className='font-mono text-base font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent px-2 py-1 rounded border border-white/30'>
                            {inventory.totalScans}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Section - Only show for non-completed */}
                    <div className='relative z-10'>
                      {inventory.status !== 'Completed' && (
                        <button
                          onClick={() => handleContinueInventory(inventory)}
                          className='w-full btn-secondary text-xs py-3 px-4 flex items-center justify-center space-x-2 rounded-lg border border-white/30 hover:border-white/50 transition-all duration-300 font-semibold'
                          style={{
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                            backdropFilter: 'blur(20px)'
                          }}
                        >
                          <span>Continuar Inventario</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Session Management Info */}
        <div className='card mb-6 sm:mb-section border-green-500/20 bg-green-500/10'>
          <div className='flex items-start space-x-3 sm:space-x-4'>
            <Info className='w-5 h-5 sm:w-6 sm:h-6 text-green-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-base sm:text-lg font-semibold text-green-400 mb-2 sm:mb-3'>
                Gestión de Sesión
              </h3>
              <p className='text-sm sm:text-base text-secondaryText mb-3'>
                Tu sesión de inventario se guarda automáticamente mientras escaneas. Puedes
                pausar en cualquier momento y continuar más tarde, o completar la sesión cuando
                termines. Todos los datos se sincronizan con Google Sheets en tiempo real.
              </p>
              <div className='p-3 sm:p-4 glass-effect border border-green-500/20 rounded-xl'>
                <p className='text-xs sm:text-sm text-green-300'>
                  <strong>Consejo:</strong> Usa el botón "Pausar Sesión" si necesitas
                  tomar un descanso. Tu progreso se guardará y podrás continuar
                  más tarde exactamente desde donde lo dejaste.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Section for Completed Inventories */}
        {completedInventoriesThisMonth.length > 0 && (
          <div className='card mb-6 sm:mb-section border-blue-500/20 bg-blue-500/10'>
            <div className='flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4'>
              <Download className='w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mt-1 flex-shrink-0' />
              <div className='flex-1'>
                <h3 className='text-base sm:text-lg font-semibold text-blue-400 mb-2 sm:mb-3'>
                  Inventarios Completados Disponibles para Descarga
                </h3>
                <p className='text-sm sm:text-base text-secondaryText mb-4'>
                  Los inventarios completados están disponibles para descarga hasta el final del mes actual.
                </p>
                <div className='space-y-3'>
                  {completedInventoriesThisMonth.map((inventory, index) => (
                    <div
                      key={inventory.id}
                      className='p-3 sm:p-4 glass-effect border border-white/20 rounded-xl'
                      style={{
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      <div className='flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0'>
                        <div className='flex-1 min-w-0'>
                          <div className='flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2'>
                            <div className='flex items-center space-x-2'>
                              <CheckCircle className='w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0' />
                              <h4 className='text-sm sm:text-base font-bold text-white truncate'>
                                {getMonthName(inventory.month)} {inventory.year} - {inventory.totalScans} códigos
                              </h4>
                            </div>
                            <span className='text-xs text-secondaryText'>
                              por {inventory.createdBy}
                            </span>
                          </div>
                          <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-secondaryText'>
                            <span>Completado: {inventory.lastUpdated.toLocaleDateString()}</span>
                            {isInventoryDownloadable(inventory) && (
                              <span className='text-blue-300'>
                                Tiempo restante: {getDownloadTimeRemaining(inventory)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='flex-shrink-0 sm:ml-4'>
                          {isInventoryDownloadable(inventory) ? (
                            <button
                              onClick={() => handleDownloadInventory(inventory)}
                              className='w-full sm:w-auto btn-primary text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-4 flex items-center justify-center space-x-2'
                              style={{
                                background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '9999px',
                                fontWeight: '600',
                                border: '1px solid #fff'
                              }}
                            >
                              <Download className='w-3 h-3 sm:w-4 sm:h-4' />
                              <span>Descargar</span>
                            </button>
                          ) : (
                            <div className='flex flex-col items-center space-y-1'>
                              <button
                                disabled
                                className='w-full sm:w-auto bg-gray-600 text-gray-400 py-2 px-3 sm:px-4 rounded-pill font-bold text-xs sm:text-sm cursor-not-allowed opacity-50'
                                style={{ borderRadius: '9999px' }}
                              >
                                <Download className='w-3 h-3 sm:w-4 sm:h-4' />
                              </button>
                              <span className='text-xs text-gray-400'>
                                Expirado
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paused Session Notice */}
        {existingInventory?.status === 'Paused' && (
          <div className='card mb-6 sm:mb-section border-yellow-500/20 bg-yellow-500/10'>
            <div className='flex items-start space-x-3 sm:space-x-4'>
              <Clock className='w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mt-1 flex-shrink-0' />
              <div className='flex-1'>
                <h3 className='text-base sm:text-lg font-semibold text-yellow-400 mb-2 sm:mb-3'>
                  Sesión Pausada Disponible
                </h3>
                <p className='text-sm sm:text-base text-secondaryText mb-3'>
                  Tienes una sesión de inventario pausada para {monthName} {currentYear}
                  con {existingInventory.totalScans} escaneos. Puedes continuar esta
                  sesión o iniciar una nueva.
                </p>
                <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
                  <button
                    onClick={() => handleContinueInventory(existingInventory)}
                    className='btn-secondary text-sm py-2 px-4 flex items-center justify-center space-x-2'
                  >
                    <RotateCcw className='w-4 h-4' />
                    <span>Continuar Sesión</span>
                  </button>
                  <button
                    onClick={handleStartNewInventory}
                    className='btn-primary text-sm py-2 px-4 flex items-center justify-center space-x-2'
                  >
                    <Plus className='w-4 h-4' />
                    <span>Iniciar Nueva</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Session Controls */}
        <div className='card mb-6 sm:mb-section'>
          <div className='text-center mb-6'>
            <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-4'>
              Controles de Sesión de Inventario
            </h2>
            
            {/* Sync Status Indicator */}
            {isSessionActive && (
              <div className='flex items-center justify-center gap-3 mb-4'>
                <div className='flex items-center gap-2 text-sm text-secondaryText'>
                  {isSyncing ? (
                    <>
                      <div className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin'></div>
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                      <span>
                        Sincronizado {lastSyncTime ? `hace ${Math.floor((Date.now() - lastSyncTime.getTime()) / 1000)}s` : 'recientemente'}
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={syncSessionData}
                  disabled={isSyncing}
                  className='text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </div>
            )}

            {/* Local Storage Info */}
            {selectedAgency && (
              <div className='flex justify-center mb-4'>
                <LocalStorageInfo
                  agencyName={selectedAgency.name}
                  month={currentMonth}
                  year={currentYear}
                />
              </div>
            )}
            <p className='text-sm sm:text-base text-secondaryText'>
              {isSessionActive
                ? 'Tu sesión de inventario está activa actualmente. Escanea códigos de barras o gestiona tu sesión abajo.'
                : completedInventoriesThisMonth.length >= 2
                ? `Ya se han completado 2 inventarios para ${monthName} ${currentYear}. El límite máximo es de 2 inventarios por mes.`
                : activeSessionsThisMonth.length > 0
                ? 'Hay un inventario activo en curso. Puedes continuar trabajando en él.'
                : 'Inicia una nueva sesión de inventario.'}
            </p>
          </div>

          {!isSessionActive ? (
            // Session not active - show start/continue options
            <div className='flex flex-col items-center gap-4'>
              {/* Main action button - shows different text/behavior based on active sessions */}
              
              {/* Show active sessions count - positioned below the button */}
              {activeSessionsThisMonth.length > 0 && (
                <div className='flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg border border-blue-500/30'>
                  <User className='w-4 h-4' />
                  <span className='text-sm font-medium'>
                    {activeSessionsThisMonth.length} usuario{activeSessionsThisMonth.length > 1 ? 's' : ''} activo{activeSessionsThisMonth.length > 1 ? 's' : ''} en este inventario
                  </span>
                </div>
              )}
              
              <div className='btn-group mb-4'>
                {!currentUserActiveSession && completedInventoriesThisMonth.length < 2 && (
                  <button
                    onClick={() => {
                      if (activeSessionsThisMonth.length > 0) {
                        // Continue existing active session
                        const activeSession = activeSessionsThisMonth[0];
                        handleContinueInventory(activeSession);
                      } else {
                        // Start new session
                        handleStartNewInventory();
                      }
                    }}
                    className='btn-primary text-sm sm:text-base py-3 sm:py-4 px-4 sm:px-6 md:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
                  >
                    {activeSessionsThisMonth.length > 0 ? (
                      <>
                        <RotateCcw className='w-5 h-5 sm:w-6 sm:h-6' />
                        <span>Continuar Sesión</span>
                      </>
                    ) : (
                      <>
                        <Plus className='w-5 h-5 sm:w-6 sm:h-6' />
                        <span>Iniciar Nueva Sesión</span>
                      </>
                    )}
                  </button>
                )}

                {/* Continue user's active session */}
                {currentUserActiveSession && (
                  <button
                    onClick={() => handleContinueInventory(currentUserActiveSession)}
                    className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-4 sm:px-6 md:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
                  >
                    <RotateCcw className='w-5 h-5 sm:w-6 sm:h-6' />
                    <span>Continuar Mi Sesión Activa</span>
                  </button>
                )}

                {/* Continue user's paused session */}
                {currentUserPausedSession && (
                  <button
                    onClick={() => handleContinueInventory(currentUserPausedSession)}
                    className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-4 sm:px-6 md:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
                  >
                    <RotateCcw className='w-5 h-5 sm:w-6 sm:h-6' />
                    <span>Continuar Mi Sesión Pausada</span>
                  </button>
                )}
              </div>

              {/* Show if monthly inventory limit is reached */}
              {completedInventoriesThisMonth.length >= 2 && (
                <div className='text-center text-secondaryText py-4'>
                  <CheckCircle className='w-8 h-8 text-green-400 mx-auto mb-2' />
                  <p>Ya se han completado 2 inventarios para {monthName} {currentYear}.</p>
                  <p className='text-sm mt-1'>El límite máximo es de 2 inventarios por mes.</p>
                </div>
              )}
            </div>
          ) : (
            // Session is active - show scanning and management options
            <div className='flex flex-col gap-4 mb-6'>
              
              <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center'>
                <button
                  onClick={() => setShowScanner(true)}
                  className='btn-primary text-sm sm:text-base py-3 sm:py-4 px-4 sm:px-6 md:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
                >
                  <Camera className='w-5 h-5 sm:w-6 sm:h-6' />
                  <span>Escanear Código</span>
                </button>

                <button
                  onClick={() => setShowManualInput(true)}
                  className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-4 sm:px-6 md:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
                >
                  <FileText className='w-5 h-5 sm:w-6 sm:h-6' />
                  <span>Entrada Manual</span>
                </button>


                <button
                  onClick={handleStopInventory}
                  className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-4 sm:px-6 md:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
                >
                  <Pause className='w-5 h-5 sm:w-6 sm:h-6' />
                  <span>Gestionar Sesión</span>
                </button>

                <button
                  onClick={() => setShowFinishConfirmation(true)}
                  className='btn-primary text-sm sm:text-base py-3 sm:py-4 px-4 sm:px-6 md:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
                >
                  <CheckCircle className='w-5 h-5 sm:w-6 sm:h-6' />
                  <span>Finalizar Sesión</span>
                </button>
              </div>
          </div>
        )}

        {/* Session Validation Loading */}
        {isValidatingSession && (
          <div className='card mb-6 sm:mb-section'>
            <div className='text-center py-8'>
              <LoadingSpinner />
              <p className='text-sm sm:text-base text-secondaryText mt-4'>
                Validando sesión de inventario...
              </p>
            </div>
          </div>
        )}

        {/* Scanned Codes Display - Optimized for 300+ barcodes */}
        {!isValidatingSession && scannedCodes.length > 0 && (
          <ScannedCodesList
            scannedCodes={scannedCodes}
            onDeleteCode={handleDeleteCodeByIndex}
            onDeleteSelected={handleBulkDelete}
            isLoading={isLoading}
          />
        )}

        {/* Ready to Start Section - No Buttons, Just Info */}
        {!isSessionActive && completedInventoriesThisMonth.length < 2 && (
          <div className='card mb-6 sm:mb-section text-center'>
            <Camera className='w-16 h-16 sm:w-20 sm:h-20 text-secondaryText mx-auto mb-6 opacity-50' />
            <h3 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-4'>
              Listo para Comenzar
            </h3>
            <p className='text-sm sm:text-base text-secondaryText mb-8 max-w-md mx-auto'>
              Usa los Controles de Sesión de Inventario de arriba para iniciar o continuar una sesión de inventario para{' '}
              {monthName} {currentYear}
            </p>
          </div>
        )}

        {/* Empty State - Session Active but No Scans */}
        {!isValidatingSession && scannedCodes.length === 0 && isSessionActive && (
          <div className='card mb-6 sm:mb-section text-center'>
            <Camera className='w-16 h-16 sm:w-20 sm:h-20 text-secondaryText mx-auto mb-6 opacity-50' />
            <h3 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-4'>
              Aún no se han escaneado códigos
            </h3>
            <p className='text-sm sm:text-base text-secondaryText mb-8 max-w-md mx-auto'>
              Comienza a escanear códigos de barras para construir tu lista de inventario para{' '}
              {monthName} {currentYear}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>

    {/* Modals */}
      {showScanner && (
        <UnifiedScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}


      {showConfirmation && (
        <ConfirmationModal
          scannedCode={currentScannedCode}
          onConfirm={handleConfirmScan}
          onCancel={handleCancelScan}
        />
      )}

      {showManualInput && (
        <ManualInputModal
          onConfirm={handleScan}
          onCancel={() => setShowManualInput(false)}
        />
      )}

      {/* Stop Options Modal */}
      {showStopOptions && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='responsive-card max-w-md w-full'>
            <div className='text-center mb-6'>
              <h3 className='text-section text-white mb-2'>
                Gestionar Sesión
              </h3>
              <p className='text-body text-secondaryText'>
                ¿Qué te gustaría hacer con tu sesión actual?
              </p>
            </div>

            <div className='space-y-4'>
              <button
                onClick={() => void handleCompleteSession()}
                className='w-full btn-primary text-sm sm:text-lg py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <CheckCircle className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Completar y Finalizar Sesión</span>
              </button>

              <button
                onClick={() => void handlePauseSession()}
                className='w-full btn-accent text-sm sm:text-lg py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <Pause className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Pausar Sesión (Continuar Después)</span>
              </button>

              <button
                onClick={handleContinueSession}
                className='w-full btn-secondary text-sm sm:text-lg py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <RotateCcw className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Continuar Escaneando</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Session Confirmation Modal */}
      {showFinishConfirmation && (
        <div className='fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4'>
          <div className='glass-effect rounded-3xl max-w-md w-full overflow-hidden border border-white/30 shadow-2xl'>
            {/* Header */}
            <div className='relative bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-white/30 p-4 sm:p-6'>
              <div className='flex items-center space-x-3 sm:space-x-4'>
                <div className='w-12 h-12 sm:w-16 sm:h-16 bg-green-500/30 rounded-full flex items-center justify-center shadow-lg border-2 border-green-400/50'>
                  <CheckCircle className='w-6 h-6 sm:w-8 sm:h-8 text-green-300' />
                </div>
                <div>
                  <h2 className='text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-hero leading-heading text-white mb-1'>
                    Finalizar Sesión
                  </h2>
                  <p className='text-xs sm:text-sm text-green-200 font-medium'>
                    Confirmar finalización del inventario
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className='p-4 sm:p-6'>
              <div className='text-center mb-6'>
                <h3 className='text-lg font-bold text-white mb-3'>
                  ¿Estás seguro que deseas finalizar la sesión?
                </h3>
                <p className='text-sm text-secondaryText mb-4'>
                  Esta acción completará tu sesión de inventario y guardará todos los datos escaneados.
                </p>
                <div className='glass-effect rounded-xl p-4 border border-white/20 bg-white/5'>
                  <p className='text-sm text-white font-medium'>
                    📊 Total de códigos escaneados: <span className='text-green-300 font-bold'>{scannedCodes.length}</span>
                  </p>
                </div>
              </div>

              <div className='space-y-3'>
                <button
                  onClick={() => {
                    setShowFinishConfirmation(false);
                    void handleCompleteSession();
                  }}
                  className='w-full px-6 py-3 border border-white rounded-pill text-base font-semibold text-black bg-white hover:bg-transparent hover:text-white transition-all duration-300 hover:scale-105'
                >
                  Sí, Finalizar Sesión
                </button>
                <button
                  onClick={() => setShowFinishConfirmation(false)}
                  className='w-full px-6 py-3 border border-white rounded-pill text-base font-semibold text-white bg-transparent hover:bg-white hover:text-black transition-all duration-300 hover:scale-105'
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='responsive-card max-w-md w-full'>
            <div className='text-center mb-6'>
              <AlertTriangle className='w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4' />
              <h3 className='text-section text-white mb-2'>
                Reiniciar Sesión de Inventario
              </h3>
              <p className='text-body text-secondaryText'>
                ¿Estás seguro de que quieres reiniciar la sesión de inventario actual? Esto borrará todos los códigos escaneados y no se puede deshacer.
              </p>
            </div>

            <div className='space-y-4'>
              <button
                onClick={() => {
                  reset();
                  setShowResetConfirmation(false);
                }}
                className='w-full bg-red-600 hover:bg-red-700 text-white text-sm sm:text-lg py-3 sm:py-4 px-4 sm:px-6 rounded-pill font-bold transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <RotateCcw className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Sí, Reiniciar Sesión</span>
              </button>

              <button
                onClick={() => setShowResetConfirmation(false)}
                className='w-full btn-secondary text-sm sm:text-lg py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <X className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && codeToDelete && (
        <DeleteConfirmationModal
          scannedCode={codeToDelete.code}
          onConfirm={handleDeleteConfirmation}
          onCancel={handleDeleteCancel}
        />
      )}

      {/* Completion Modal */}
      {showCompletionModal && completedInventoryData && (
        <CompletionModal
          isOpen={showCompletionModal}
          onClose={handleCloseCompletionModal}
          onStartNewInventory={handleStartNewInventoryFromCompletion}
          onDownloadCSV={handleDownloadCSV}
          totalScans={completedInventoryData.totalScans}
          agencyName={completedInventoryData.agencyName}
          monthName={completedInventoryData.monthName}
          year={completedInventoryData.year}
        />
      )}

      {/* New Inventory Confirmation Modal */}
      {showNewInventoryConfirmation && selectedAgency && (
        <NewInventoryConfirmationModal
          isOpen={showNewInventoryConfirmation}
          onConfirm={handleConfirmNewInventory}
          onCancel={handleCancelNewInventory}
          agencyName={selectedAgency.name}
        />
      )}

      {/* Session Terminated Modal */}
      {showSessionTerminatedModal && selectedAgency && sessionTerminationData && (
        <SessionTerminatedModal
          isOpen={showSessionTerminatedModal}
          onClose={() => setShowSessionTerminatedModal(false)}
          onStartNewInventory={() => {
            setShowSessionTerminatedModal(false);
            navigate(`/monthly-inventories/${selectedAgency.name.toLowerCase()}`);
          }}
          agencyName={selectedAgency.name}
          monthName={monthName}
          year={currentYear}
          completedBy={sessionTerminationData.completedBy}
          isCurrentUser={sessionTerminationData.isCurrentUser}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      <BulkDeleteConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={handleBulkDeleteCancel}
        onConfirm={handleBulkDeleteConfirm}
        selectedCount={selectedIndicesForBulkDelete.length}
        selectedBarcodes={selectedBarcodesForBulkDelete}
        isLoading={isBulkDeleting}
      />

      {/* Download Confirmation Modal */}
      <DownloadConfirmationModal
        isOpen={showDownloadConfirmation && !!downloadInventoryData}
        onClose={handleDownloadCancel}
        onConfirm={handleDownloadConfirm}
        inventoryData={downloadInventoryData || {
          monthName: '',
          year: 0,
          totalScans: 0,
          createdBy: ''
        }}
      />
    </div>
  );
};

export default InventoryPage;
