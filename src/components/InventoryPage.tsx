import { useAuth0 } from '@auth0/auth0-react';
import {
  AlertTriangle,
  Barcode,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  FileText,
  Info,
  Pause,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  User,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useInventory } from '../hooks/useInventory';
import {
  getAgencyInventories
} from '../services/api';
import { MonthlyInventory } from '../types';
import BarcodeScanner from './BarcodeScanner';
import CompletionModal from './CompletionModal';
import ConfirmationModal from './ConfirmationModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import Footer from './Footer';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';
import ManualInputModal from './ManualInputModal';
import NewInventoryConfirmationModal from './NewInventoryConfirmationModal';

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
  const [codeToDelete, setCodeToDelete] = useState<{code: string, index: number} | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showNewInventoryConfirmation, setShowNewInventoryConfirmation] = useState(false);
  const [completedInventoryData, setCompletedInventoryData] = useState<{
    totalScans: number;
    agencyName: string;
    monthName: string;
    year: number;
  } | null>(null);

  // State for monthly inventory management
  const [inventories, setInventories] = useState<MonthlyInventory[]>([]);
  const [isLoadingInventories, setIsLoadingInventories] = useState(false);
  const [inventoriesError, setInventoriesError] = useState<string | null>(null);

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
    addScannedCode,
    deleteScannedCode,
    finishInventorySession,
    pauseInventorySession,
    startSession,
    continueSession,
    clearError,
    reset,
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
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
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

  const handleScan = (code: string) => {
    setCurrentScannedCode(code);
    setShowScanner(false);
    setShowManualInput(false);
    setShowConfirmation(true);
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

      const success = await finishInventorySession();
      if (success) {
        showSuccess(
          'Sesión Completada',
          'La sesión de inventario ha sido finalizada exitosamente'
        );
        loadInventories();
        // Show completion modal instead of navigating away
        handleShowCompletionModal(scannedCodes.length);
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
    const monthIndex = parseInt(month) - 1;
    return monthNames[monthIndex] || month;
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

  const handleRefreshInventories = () => {
    loadInventories();
  };

  const handleDeleteCode = (code: string, index: number) => {
    setCodeToDelete({ code, index });
    setShowDeleteConfirmation(true);
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

  const handleShowCompletionModal = (totalScans: number) => {
    if (selectedAgency) {
      setCompletedInventoryData({
        totalScans,
        agencyName: selectedAgency.name,
        monthName,
        year: currentYear,
      });
      setShowCompletionModal(true);
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

  const handleDownloadBarcodes = () => {
    // TODO: Implement download functionality
    showInfo('Descarga', 'Función de descarga será implementada próximamente');
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

      // Check if the monthly inventory is completed (no more sessions allowed)
      const monthlyCompleted = inventories.some(
        inv => inv.month === currentMonth && 
               inv.year === currentYear && 
               inv.status === 'Completed'
      );

      if (monthlyCompleted) {
        showError(
          'Inventario Completado',
          `El inventario para ${monthName} ${currentYear} ya fue completado. No se pueden iniciar nuevas sesiones.`
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

  const handleContinueInventory = (inventory: MonthlyInventory) => {
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
      continueSession();
      return;
    }

    showInfo(
      'Continuando Inventario',
      `Continuando sesión de inventario para ${monthName} ${currentYear} con ${inventory.totalScans} escaneos existentes.`
    );
    continueSession();
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

  const existingInventory = inventories.find(
    inv => inv.month === currentMonth && inv.year === currentYear
  );

  if (!selectedAgency) {
    return null;
  }

  return (
    <div className='min-h-screen bg-background relative overflow-hidden flex flex-col'>
      {/* Floating 3D shapes */}
      <div className='floating-shape w-28 h-28 top-16 right-16'></div>
      <div
        className='floating-shape w-20 h-20 bottom-1/3 left-20'
        style={{ animationDelay: '2s' }}
      ></div>
      <div
        className='floating-shape w-16 h-16 top-1/2 right-3'
        style={{ animationDelay: '4s' }}
      ></div>

      {/* Header */}
      <Header
        title={`${selectedAgency.name} - Sesión de Inventario`}
        subtitle={`${monthName} ${currentYear} - Iniciado a las ${new Date().toLocaleTimeString()}`}
        showBackButton={true}
        onBackClick={() => navigate('/select-agency')}
        showUserInfo={true}
        showChangeAgency={true}
      />

      {/* Error Display */}
      {error && (
        <div className='max-w-max mx-auto px-8 py-4 relative z-10'>
          <div className='card border-red-500/20 bg-red-500/10'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <X className='w-5 h-5 text-red-400' />
                <span className='text-red-400 font-medium'>{error}</span>
              </div>
              <button
                onClick={clearError}
                className='text-red-400 hover:text-red-300 transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10'>
        {/* Monthly Inventory Info */}
        <div className='card mb-6'>
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
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
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
        <div className='card mb-6'>
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
              <p className='text-sm sm:text-base text-secondaryText mt-4'>
                Cargando inventarios...
              </p>
            </div>
          ) : inventories.length === 0 ? (
            <div className='p-8 text-center'>
              <FileText className='w-16 h-16 text-secondaryText mx-auto mb-4 opacity-50' />
              <p className='text-sm sm:text-base text-secondaryText'>
                No se encontraron inventarios para {selectedAgency.name}
              </p>
            </div>
          ) : (
            <div className='overflow-hidden'>
              {/* Desktop Table View */}
              <div className='hidden lg:block overflow-x-auto'>
                <table className='w-full'>
                  <thead className='border-b border-white/10'>
                    <tr>
                      <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Mes y Año
                      </th>
                      <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Estado
                      </th>
                      <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Creado Por
                      </th>
                      <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Total de Escaneos
                      </th>
                      <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-white/10'>
                    {inventories.map(inventory => (
                      <tr
                        key={inventory.id}
                        className='transition-colors hover:bg-white/5'
                      >
                        <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                          <div className='flex items-center space-x-2 lg:space-x-3'>
                            <Calendar className='w-4 h-4 lg:w-5 lg:h-5 text-secondaryText' />
                            <span className='font-semibold text-white text-sm lg:text-base'>
                              {getMonthName(inventory.month)} {inventory.year}
                            </span>
                          </div>
                        </td>
                        <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex items-center px-2 lg:px-3 py-1 lg:py-2 rounded-pill text-xs font-semibold border ${getStatusColor(
                              inventory.status
                            )}`}
                          >
                            {getStatusIcon(inventory.status)}
                            <span className='ml-2'>
                              {getStatusText(inventory.status)}
                            </span>
                          </span>
                        </td>
                        <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-secondaryText'>
                          {inventory.createdBy}
                        </td>
                        <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                          <span className='font-mono text-sm lg:text-base text-white bg-white/10 px-2 lg:px-3 py-1 lg:py-2 rounded-lg'>
                            {inventory.totalScans}
                          </span>
                        </td>
                        <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                          {inventory.status === 'Completed' ? (
                            <span className='text-xs lg:text-sm text-green-400 font-semibold'>
                              Completado
                            </span>
                          ) : (
                            <button
                              onClick={() => handleContinueInventory(inventory)}
                              className='btn-secondary text-xs lg:text-sm py-1 lg:py-2 px-2 lg:px-3 flex items-center space-x-1 lg:space-x-2'
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

              {/* Mobile Card View */}
              <div className='lg:hidden space-y-3 p-4'>
                {inventories.map(inventory => (
                  <div
                    key={inventory.id}
                    className='glass-effect rounded-xl p-3 border border-white/20'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center space-x-2'>
                        <Calendar className='w-4 h-4 text-secondaryText' />
                        <span className='font-semibold text-white text-sm'>
                          {getMonthName(inventory.month)} {inventory.year}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-pill text-xs font-semibold border ${getStatusColor(
                          inventory.status
                        )}`}
                      >
                        {getStatusIcon(inventory.status)}
                        <span className='ml-1'>
                          {getStatusText(inventory.status)}
                        </span>
                      </span>
                    </div>
                    
                    <div className='space-y-2 mb-3'>
                      <div className='flex justify-between text-xs'>
                        <span className='text-secondaryText'>Creado Por:</span>
                        <span className='text-white'>{inventory.createdBy}</span>
                      </div>
                      <div className='flex justify-between text-xs'>
                        <span className='text-secondaryText'>Total de Escaneos:</span>
                        <span className='font-mono text-white bg-white/10 px-2 py-1 rounded'>
                          {inventory.totalScans}
                        </span>
                      </div>
                    </div>
                    
                    {inventory.status === 'Completed' ? (
                      <div className='w-full text-center py-2 px-3'>
                        <span className='text-xs text-green-400 font-semibold'>
                          Completado
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleContinueInventory(inventory)}
                        className='w-full btn-secondary text-xs py-2 px-3 flex items-center justify-center space-x-1'
                      >
                        <span>Continuar</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Session Management Info */}
        <div className='card mb-6 border-green-500/20 bg-green-500/10'>
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

        {/* Paused Session Notice */}
        {existingInventory?.status === 'Paused' && (
          <div className='card mb-6 border-yellow-500/20 bg-yellow-500/10'>
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

        {/* REPUVE Manual Search Reminder */}
        <div className='card mb-6 border-orange-500/20 bg-orange-500/10'>
          <div className='flex items-start space-x-3 sm:space-x-4'>
            <AlertTriangle className='w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-base sm:text-lg font-semibold text-orange-400 mb-2 sm:mb-3'>
                Importante: Búsqueda Manual en REPUVE Requerida
              </h3>
              <p className='text-sm sm:text-base text-secondaryText mb-3'>
                Después de completar tu inventario, debes buscar manualmente cada
                código de barras escaneado en el sitio web de REPUVE para extraer la información
                completa del vehículo (marca, modelo, año, VIN, etc.).
              </p>
              <div className='p-3 sm:p-4 glass-effect border border-orange-500/20 rounded-xl'>
                <p className='text-xs sm:text-sm text-orange-300 mb-3'>
                  <strong>Proceso paso a paso:</strong>
                </p>
                <ol className='text-xs sm:text-sm text-orange-300 space-y-1 list-decimal list-inside'>
                  <li>Completa tu sesión de inventario</li>
                  <li>Ve al sitio web de REPUVE</li>
                  <li>Busca cada código de barras individualmente</li>
                  <li>Extrae y registra los detalles del vehículo</li>
                  <li>Actualiza tus registros con información completa</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Session Controls */}
        <div className='card mb-6'>
          <div className='text-center mb-6'>
            <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-4'>
              Controles de Sesión de Inventario
            </h2>
            <p className='text-sm sm:text-base text-secondaryText'>
              {isSessionActive
                ? 'Tu sesión de inventario está activa actualmente. Escanea códigos de barras o gestiona tu sesión abajo.'
                : hasExistingInventory && existingInventory?.status === 'Completed'
                ? `El inventario para ${monthName} ${currentYear} ha sido completado. No puedes iniciar uno nuevo para el mismo mes.`
                : 'Inicia una nueva sesión de inventario o continúa una existente.'}
            </p>
          </div>

          {!isSessionActive ? (
            // Session not active - show start/continue options
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center'>
              {/* Show active sessions count */}
              {activeSessionsThisMonth.length > 0 && (
                <div className='w-full text-center mb-4'>
                  <div className='inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg'>
                    <User className='w-4 h-4' />
                    <span className='text-sm'>
                      {activeSessionsThisMonth.length} usuario{activeSessionsThisMonth.length > 1 ? 's' : ''} activo{activeSessionsThisMonth.length > 1 ? 's' : ''} en este inventario
                    </span>
                  </div>
                </div>
              )}

              {/* Start new session button */}
              {!currentUserActiveSession && (
                <button
                  onClick={handleStartNewInventory}
                  className='btn-primary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
                >
                  <Plus className='w-5 h-5 sm:w-6 sm:h-6' />
                  <span>Iniciar Nueva Sesión</span>
                </button>
              )}

              {/* Continue user's active session */}
              {currentUserActiveSession && (
                <button
                  onClick={() => handleContinueInventory(currentUserActiveSession)}
                  className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
                >
                  <RotateCcw className='w-5 h-5 sm:w-6 sm:h-6' />
                  <span>Continuar Mi Sesión Activa</span>
                </button>
              )}

              {/* Continue user's paused session */}
              {currentUserPausedSession && (
                <button
                  onClick={() => handleContinueInventory(currentUserPausedSession)}
                  className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
                >
                  <RotateCcw className='w-5 h-5 sm:w-6 sm:h-6' />
                  <span>Continuar Mi Sesión Pausada</span>
                </button>
              )}

              {/* Show if monthly inventory is completed */}
              {hasExistingInventory && existingInventory?.status === 'Completed' && (
                <div className='text-center text-secondaryText py-4'>
                  <CheckCircle className='w-8 h-8 text-green-400 mx-auto mb-2' />
                  <p>El inventario para {monthName} {currentYear} ha sido completado.</p>
                  <p className='text-sm mt-1'>Puedes ver los datos pero no agregar nuevos escaneos.</p>
                </div>
              )}
            </div>
          ) : (
            // Session is active - show scanning and management options
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center'>
              <button
                onClick={() => setShowScanner(true)}
                className='btn-primary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <Camera className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Escanear Código de Barras</span>
              </button>

              <button
                onClick={() => setShowManualInput(true)}
                className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <FileText className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Entrada Manual</span>
              </button>

              <button
                onClick={handleStopInventory}
                className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <Pause className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Gestionar Sesión</span>
              </button>
            </div>
          )}
        </div>

        {/* Scanned Codes Display */}
        {scannedCodes.length > 0 && (
          <div className='card mb-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3'>
              <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
                <Barcode className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3' />
                Códigos Escaneados ({scannedCodes.length})
              </h2>
              <div className='flex items-center space-x-2 sm:space-x-3'>
                <span className='text-xs sm:text-sm text-secondaryText'>
                  Total de escaneos: {scannedCodes.length}
                </span>
                <button
                  onClick={() => setShowResetConfirmation(true)}
                  className='btn-secondary text-xs sm:text-sm py-2 px-3 flex items-center space-x-1 sm:space-x-2'
                >
                  <RotateCcw className='w-4 h-4' />
                  <span>Reiniciar</span>
                </button>
              </div>
            </div>

            <div className='overflow-hidden'>
              {/* Desktop Grid View */}
              <div className='hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'>
                {scannedCodes.map((code, index) => (
                  <div
                    key={index}
                    className='glass-effect rounded-xl p-3 sm:p-4 border border-white/20'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-xs sm:text-sm text-secondaryText'>
                        #{index + 1}
                      </span>
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs text-secondaryText'>
                          {formatTime(code.timestamp)}
                        </span>
                        <button
                          onClick={() => handleDeleteCode(code.code, index)}
                          className='p-1 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-300'
                          title='Eliminar código'
                        >
                          <Trash2 className='w-3 h-3 sm:w-4 sm:h-4' />
                        </button>
                      </div>
                    </div>
                    <div className='font-mono text-sm sm:text-base text-white break-all'>
                      {code.code}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile List View */}
              <div className='sm:hidden space-y-2'>
                {scannedCodes.map((code, index) => (
                  <div
                    key={index}
                    className='glass-effect rounded-xl p-3 border border-white/20'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-xs text-secondaryText'>
                        #{index + 1}
                      </span>
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs text-secondaryText'>
                          {formatTime(code.timestamp)}
                        </span>
                        <button
                          onClick={() => handleDeleteCode(code.code, index)}
                          className='p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-300'
                          title='Eliminar código'
                        >
                          <Trash2 className='w-3 h-3' />
                        </button>
                      </div>
                    </div>
                    <div className='font-mono text-sm text-white break-all'>
                      {code.code}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ready to Start Section - No Buttons, Just Info */}
        {!isSessionActive && (
          <div className='card text-center'>
            <Camera className='w-20 h-20 text-secondaryText mx-auto mb-6 opacity-50' />
            <h3 className='text-subheading font-bold uppercase tracking-hero leading-heading mb-4'>
              Listo para Comenzar
            </h3>
            <p className='text-body text-secondaryText mb-8 max-w-md mx-auto'>
              Usa los Controles de Sesión de Inventario de arriba para iniciar o continuar una sesión de inventario para{' '}
              {monthName} {currentYear}
            </p>
            
            {hasExistingInventory && existingInventory?.status === 'Completed' && (
              <div className='text-center text-secondaryText py-4'>
                <CheckCircle className='w-8 h-8 text-green-400 mx-auto mb-2' />
                <p>El inventario para {monthName} {currentYear} ha sido completado.</p>
                <p className='text-sm mt-1'>Puedes ver los datos pero no agregar nuevos escaneos.</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State - Session Active but No Scans */}
        {scannedCodes.length === 0 && isSessionActive && (
          <div className='card text-center'>
            <Camera className='w-20 h-20 text-secondaryText mx-auto mb-6 opacity-50' />
            <h3 className='text-subheading font-bold uppercase tracking-hero leading-heading mb-4'>
              Aún no se han escaneado códigos
            </h3>
            <p className='text-body text-secondaryText mb-8 max-w-md mx-auto'>
              Comienza a escanear códigos de barras para construir tu lista de inventario para{' '}
              {monthName} {currentYear}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showScanner && (
        <BarcodeScanner
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
          <div className='card max-w-md w-full'>
            <div className='text-center mb-6'>
              <h3 className='text-xl font-bold text-white mb-2'>
                Gestionar Sesión
              </h3>
              <p className='text-secondaryText'>
                ¿Qué te gustaría hacer con tu sesión actual?
              </p>
            </div>

            <div className='space-y-4'>
              <button
                onClick={() => void handleCompleteSession()}
                className='w-full btn-primary text-lg py-4 px-6 flex items-center justify-center space-x-3'
              >
                <CheckCircle className='w-6 h-6' />
                <span>Completar y Finalizar Sesión</span>
              </button>

              <button
                onClick={() => void handlePauseSession()}
                className='w-full bg-yellow-600 hover:bg-yellow-700 text-white text-lg py-4 px-6 rounded-pill font-bold transition-all duration-300 flex items-center justify-center space-x-3'
              >
                <Pause className='w-6 h-6' />
                <span>Pausar Sesión (Continuar Después)</span>
              </button>

              <button
                onClick={handleContinueSession}
                className='w-full btn-secondary text-lg py-4 px-6 flex items-center justify-center space-x-3'
              >
                <RotateCcw className='w-6 h-6' />
                <span>Continuar Escaneando</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='card max-w-md w-full'>
            <div className='text-center mb-6'>
              <AlertTriangle className='w-16 h-16 text-yellow-500 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-white mb-2'>
                Reiniciar Sesión de Inventario
              </h3>
              <p className='text-secondaryText'>
                ¿Estás seguro de que quieres reiniciar la sesión de inventario actual? Esto borrará todos los códigos escaneados y no se puede deshacer.
              </p>
            </div>

            <div className='space-y-4'>
              <button
                onClick={() => {
                  reset();
                  setShowResetConfirmation(false);
                }}
                className='w-full bg-red-600 hover:bg-red-700 text-white text-lg py-4 px-6 rounded-pill font-bold transition-all duration-300 flex items-center justify-center space-x-3'
              >
                <RotateCcw className='w-6 h-6' />
                <span>Sí, Reiniciar Sesión</span>
              </button>

              <button
                onClick={() => setShowResetConfirmation(false)}
                className='w-full btn-secondary text-lg py-4 px-6 flex items-center justify-center space-x-3'
              >
                <X className='w-6 h-6' />
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
          onDownloadBarcodes={handleDownloadBarcodes}
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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default InventoryPage;
