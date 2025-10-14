import { useAuth0 } from '@auth0/auth0-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MonthlyInventoryHeader } from '.';
import { Footer, LoadingSpinner } from '../../../components/common/display';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { useInventory } from '../../../hooks/useInventory';
import { checkMonthlyInventory, downloadStoredFile, getAgencyInventories } from '../../../services/api';
import { MonthlyInventory } from '../../../types/index';
import { MultipleInventorySelector } from '../modals';

import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Database,
  Download,
  FileText,
  Plus,
  RefreshCw,
  User,
  X,
} from 'lucide-react';

const MonthlyInventoryManager: React.FC = () => {
  const navigate = useNavigate();
  const { agencyName } = useParams<{ agencyName?: string }>();
  const { user } = useAuth0();
  const { selectedAgency, setSelectedAgency } = useAppContext();
  const { showSuccess, showError, showInfo } = useToast();
  const { isSessionActive, sessionId, hasAnyInventoryStarted, resetInventoryStatusForNewMonth } = useInventory();

  const [inventories, setInventories] = useState<MonthlyInventory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [hasAnyStarted, setHasAnyStarted] = useState<boolean>(false);
  const [currentYear, setCurrentYear] = useState<number>(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showMultipleInventorySelector, setShowMultipleInventorySelector] = useState(false);
  const [selectedInventoryForDownload, setSelectedInventoryForDownload] = useState<MonthlyInventory | null>(null);

  // Initialize current month and year
  useEffect(() => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    setCurrentMonth(month);
    setCurrentYear(year);
  }, []);

  // Monitor for month changes and reset status
  useEffect(() => {
    const checkForMonthChange = () => {
      const now = new Date();
      const currentMonthNum = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentYearNum = now.getFullYear();
      
      if (currentMonth && currentYear && 
          (currentMonth !== currentMonthNum || currentYear !== currentYearNum)) {
        console.log(`🗓️ MonthlyInventoryManager: Month/Year changed from ${currentMonth}/${currentYear} to ${currentMonthNum}/${currentYearNum}`);
        
        // Update the month and year state
        setCurrentMonth(currentMonthNum);
        setCurrentYear(currentYearNum);
        
        // Reset inventory status for the new month
        setHasAnyStarted(false);
        setInventories([]);
      }
    };

    // Check every minute for month changes
    const interval = setInterval(checkForMonthChange, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, [currentMonth, currentYear]);

  // Check if any inventory has started
  useEffect(() => {
    const checkStatus = async () => {
      if (selectedAgency) {
        try {
          const hasStarted = await hasAnyInventoryStarted();
          setHasAnyStarted(hasStarted);
        } catch (error) {
          console.error('Error checking inventory status:', error);
          setHasAnyStarted(false);
        }
      }
    };

    checkStatus();
  }, [selectedAgency, hasAnyInventoryStarted]);


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



  const loadInventories = async () => {
    if (!selectedAgency) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getAgencyInventories(selectedAgency.name);
      
      // Handle different response formats
      let inventories = [];
      
      if (response && typeof response === 'object') {
        // Check if response is an array itself (getAgencyInventories returns array directly)
        if (Array.isArray(response)) {
          inventories = response;
        }
        // Check if response has a data property
        else if (response.data && Array.isArray(response.data.inventories)) {
          inventories = response.data.inventories;
        }
        // Check if response has inventories directly
        else if (Array.isArray(response.inventories)) {
          inventories = response.inventories;
        }
        else {
          throw new Error('Invalid response format from backend');
        }
      }
      
      // Transform backend data to match frontend interface
      const transformedInventories = inventories.map((inv: any, index: number) => {
        
        // Convert month name to month number - handle both English and Spanish
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const spanishMonthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        let monthNumber = '01'; // Default to January
        if (inv.month) {
          const englishIndex = monthNames.indexOf(inv.month);
          const spanishIndex = spanishMonthNames.indexOf(inv.month);
          
          if (englishIndex !== -1) {
            monthNumber = (englishIndex + 1).toString().padStart(2, '0');
          } else if (spanishIndex !== -1) {
            monthNumber = (spanishIndex + 1).toString().padStart(2, '0');
          } else {
            console.warn('Unknown month name:', inv.month);
            // Try to extract month from date if available
            if (inv.createdAt) {
              const date = parseDateSafely(inv.createdAt);
              monthNumber = (date.getMonth() + 1).toString().padStart(2, '0');
            }
          }
        }
        
        return {
          id: inv.sessionId || `inv_${index}`,
          agencyId: inv.agency?.toLowerCase() || 'unknown',
          month: monthNumber,
          year: parseInt(inv.year) || new Date().getFullYear(),
          monthName: inv.month,
          status: inv.status,
          createdAt: parseDateSafely(inv.createdAt),
          createdBy: inv.createdBy || inv.userName || 'Unknown',
          totalScans: parseInt(inv.totalScans) || 0,
          sessionId: inv.sessionId,
          lastUpdated: new Date()
        };
      });
      
      setInventories(transformedInventories);
      setLastRefresh(new Date());
      
      // Update inventory status based on loaded inventories
      setHasAnyStarted(transformedInventories.length > 0);
      
      showSuccess(
        'Datos Cargados',
        `Se cargaron exitosamente ${transformedInventories.length} inventarios desde Google Sheets`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Falló al cargar inventarios';
      
      setError(errorMessage);
      showError('Error de Carga', `Error al cargar inventarios: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadInventories();
  };

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
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex >= monthNames.length) {
      console.warn('Month index out of range:', monthIndex, 'for month:', month);
      return 'Mes Inválido';
    }
    
    return monthNames[monthIndex];
  };

  const parseDateSafely = (dateString: string | Date): Date => {
    if (!dateString) return new Date();
    
    try {
      // If it's already a Date object, return it
      if (dateString instanceof Date) return dateString;
      
      // Try ISO format first
      let parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      
      // Try human-readable format (e.g., "September 24, 2025 at 5:10:37 PM")
      const humanReadableDate = dateString.replace(' at ', ' ');
      parsed = new Date(humanReadableDate);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      
      // Try other common formats
      parsed = new Date(dateString.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3'));
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      
      console.warn('❌ Could not parse date string:', dateString);
      return new Date();
    } catch (error) {
      console.warn('❌ Error parsing date:', dateString, error);
      return new Date();
    }
  };

  const formatDate = (date: Date) => {
    try {
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.warn('Error formatting date:', date, error);
      return 'Fecha no disponible';
    }
  };

  const handleDownloadInventory = async (inventory: MonthlyInventory) => {
    // Show the inventory selector to let user choose from available files
    setSelectedInventoryForDownload(inventory);
    setShowMultipleInventorySelector(true);
  };

  const handleSelectInventoryFromSelector = async (fileId: string) => {
    try {
      // First, get the stored files to find the correct filename
      const { getStoredFiles } = await import('../../../services/api');
      const storedFiles = await getStoredFiles(selectedAgency?.name || '');
      
      // Find the file that matches this fileId
      const matchingFile = storedFiles.files?.find((file: any) => file.id === fileId);
      const filename = matchingFile?.name || `inventory_${fileId.slice(-8)}.csv`;
      
      // Use the downloadStoredFile function with the specific file ID
      const blob = await downloadStoredFile(fileId);
      
      // Create download link with the correct filename
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess('Descarga Completada', 'El archivo CSV ha sido descargado exitosamente desde Google Drive.');
    } catch (error) {
      console.error('Error downloading specific inventory:', error);
      showError('Error de Descarga', 'No se pudo descargar el inventario específico');
    }
  };

  const downloadSpecificInventory = async (inventory: MonthlyInventory) => {
    try {
      // First, get the stored files to find the correct file ID for this inventory
      const { getStoredFiles } = await import('../../../services/api');
      const storedFiles = await getStoredFiles(selectedAgency?.name || '');
      
      // Find the file that matches this inventory's session ID
      const matchingFile = storedFiles.files?.find((file: any) => {
        const fileName = file.name || '';
        // Extract session ID from filename (last part before .csv)
        const fileSessionId = fileName.split('_').pop()?.replace('.csv', '');
        return fileSessionId === inventory.sessionId;
      });
      
      if (!matchingFile) {
        throw new Error('No se encontró el archivo correspondiente en Google Drive');
      }
      
      // Download the specific file using its Google Drive file ID
      const blob = await downloadStoredFile(matchingFile.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `${selectedAgency?.name}_${inventory.monthName}_${inventory.year}_${inventory.sessionId}.csv`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess('Descarga Completada', 'El archivo CSV ha sido descargado exitosamente desde Google Drive.');
    } catch (error) {
      console.error('Error downloading inventory:', error);
      
      // Handle different types of errors
      if (error.message && (error.message.includes('Google Drive') || error.message.includes('backup'))) {
        showError('Error de Respaldo', 'El archivo se descargó pero el respaldo en Google Drive falló. Por favor contacta al soporte.');
      } else {
        showError('Error de Descarga', 'No se pudo descargar el inventario');
      }
    }
  };



  const handleStartNewInventory = async () => {
    if (!selectedAgency) return;

    try {
      // Check if monthly inventory already exists
      const response = await checkMonthlyInventory(
        selectedAgency.name,
        currentMonth,
        currentYear
      );

      // Check if we've reached the 2-inventory limit
      if (response.completedInventories >= 2) {
        showError(
          'Límite de Inventarios Alcanzado',
          `Ya se han completado 2 inventarios para ${getMonthName(
            currentMonth
          )} ${currentYear}. El límite máximo es de 2 inventarios por mes.`
        );
        return;
      }

      // Check if there's an active inventory that needs to be completed first
      if (response.exists && response.status === 'Active') {
        showInfo(
          'Continuar Existente',
          `Un inventario activo para ${getMonthName(
            currentMonth
          )} ${currentYear} ya existe. Puedes continuarlo o completarlo primero.`
        );
        // Navigate to inventory page to continue
        navigate(`/inventory/${selectedAgency.name.toLowerCase()}`);
        return;
      }

      // Navigate to inventory page to start new
      navigate(`/inventory/${selectedAgency.name.toLowerCase()}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Falló al verificar el estado del inventario';
      showError('Error', errorMessage);
    }
  };

  const handleContinueInventory = (inventory: MonthlyInventory) => {
    // Check if we're already in an active session
    if (isSessionActive) {
      showInfo(
        'Inventario Ya Activo',
        `Ya tienes una sesión de inventario activa. Ve a "Gestión de Sesión" para continuar.`
      );
      return;
    }

    // For active/paused inventories, navigate to inventory page to continue
    showInfo(
      'Continuando Inventario',
      `Continuando sesión de inventario para ${inventory.monthName || getMonthName(inventory.month)} ${
        inventory.year
      } con ${inventory.totalScans} escaneos existentes.`
    );
    navigate(`/inventory/${selectedAgency.name.toLowerCase()}`);
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

  // Handle agency selection - if no agency is selected, redirect to agency selector
  useEffect(() => {
    if (!selectedAgency) {
      navigate('/select-agency');
      return;
    }
    
    // If we have an agency, load inventories
    loadInventories();
  }, [selectedAgency, navigate]);

  if (!selectedAgency) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className='min-h-screen bg-background relative overflow-hidden'>
      {/* Floating 3D shapes */}
      <div className='floating-shape w-28 h-28 top-16 right-16'></div>
      <div
        className='floating-shape w-20 h-20 bottom-1/3 left-20'
        style={{ animationDelay: '2s' }}
      ></div>
      <div
        className='floating-shape w-16 h-16 top-1/2 right-1/3'
        style={{ animationDelay: '4s' }}
      ></div>

      <div className='flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Header */}
        <MonthlyInventoryHeader
          agencyName={selectedAgency.name}
          subtitle="Gestiona y rastrea sesiones de inventario mensuales"
        />
        
        {/* Current Month Info */}
        <div className='card mb-6 sm:mb-section'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4'>
            <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
              <Calendar className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3' />
              Mes Actual: {getMonthName(currentMonth)} {currentYear}
            </h2>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4'>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className='btn-secondary text-sm sm:text-base py-3 px-4 sm:px-6 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <RefreshCw
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`}
                />
                <span>Actualizar Datos</span>
              </button>
              <button
                onClick={handleStartNewInventory}
                className='btn-primary text-sm sm:text-base py-3 px-4 sm:px-6 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <Plus className='w-4 h-4 sm:w-5 sm:h-5' />
                <span>
                  {hasAnyStarted 
                    ? 'Iniciar Nuevo Inventario' 
                    : 'Iniciar Inventario'
                  }
                </span>
              </button>
            </div>
          </div>

          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'>
            <div className='text-center'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6'>
                <Calendar className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
              </div>
              <p className='text-xs sm:text-sm text-secondaryText mb-2 sm:mb-3'>Mes Actual</p>
              <p className='text-lg sm:text-xl lg:text-2xl font-bold text-white'>
                {getMonthName(currentMonth)} {currentYear}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6'>
                <User className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
              </div>
              <p className='text-xs sm:text-sm text-secondaryText mb-2 sm:mb-3'>Usuario Actual</p>
              <p className='text-sm sm:text-base lg:text-lg font-semibold text-white truncate px-2'>
                {user?.name || user?.email || 'Usuario Desconocido'}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6'>
                <BarChart3 className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
              </div>
              <p className='text-xs sm:text-sm text-secondaryText mb-2 sm:mb-3'>
                Total de Inventarios
              </p>
              <p className='text-lg sm:text-xl lg:text-2xl font-bold text-white'>
                {inventories.length}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 sm:w-20 sm:h-20 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6'>
                <Database className='w-8 h-8 sm:w-10 sm:h-10 text-white' />
              </div>
              <p className='text-xs sm:text-sm text-secondaryText mb-2 sm:mb-3'>Última Actualización</p>
              <p className='text-sm sm:text-base lg:text-lg font-semibold text-white'>
                {lastRefresh.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Data Source Info */}
        <div className='card mb-6 border-blue-500/20 bg-blue-500/10'>
          <div className='flex items-start space-x-3 sm:space-x-4'>
            <Database className='w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-base sm:text-lg font-semibold text-blue-400 mb-2 sm:mb-3'>
                Fuente de Datos: Google Sheets
              </h3>
              <p className='text-sm sm:text-base text-secondaryText mb-3 sm:mb-4'>
                Todos los datos del inventario se sincronizan automáticamente con Google
                Sheets en tiempo real. Cada escaneo se guarda inmediatamente, y los datos
                de la sesión se actualizan mientras trabajas.
              </p>
              <div className='p-3 sm:p-4 glass-effect border border-blue-500/20 rounded-xl'>
                <p className='text-xs sm:text-sm text-blue-300'>
                  <strong>Nota:</strong> Los datos mostrados aquí se obtienen directamente
                  de tus Google Sheets. Si no ves datos recientes, haz clic en
                  el botón "Actualizar Datos" de arriba.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className='card border-red-500/20 bg-red-500/10 mb-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3 flex-1'>
                <AlertCircle className='w-5 h-5 text-red-400' />
                <div className='flex flex-col flex-1'>
                  <span className='text-sm sm:text-base text-red-400 font-medium'>{error}</span>
                  {/* Show detailed error info for debugging */}
                  <details className='mt-2'>
                    <summary className='text-red-300 text-xs cursor-pointer hover:text-red-200'>
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
                onClick={() => setError(null)}
                className='text-red-400 hover:text-red-300 transition-colors ml-3'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}

        {/* Existing Inventories */}
        <div className='card mb-6 sm:mb-section'>
          <div className='px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-white/20'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div className='flex items-center space-x-4'>
                <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
                  <FileText className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3' />
                  Inventarios Existentes
                </h2>
                <div className='text-xs sm:text-sm text-secondaryText'>
                  {inventories.length} inventario
                  {inventories.length !== 1 ? 's' : ''} encontrado
                </div>
              </div>
              
              {/* Download Button - Only show if there are completed inventories available for download */}
              {inventories.some(inv => inv.status === 'Completed') && (
                <button
                  onClick={() => {
                    const completedInventory = inventories.find(inv => inv.status === 'Completed');
                    if (completedInventory) {
                      setSelectedInventoryForDownload(completedInventory);
                      setShowMultipleInventorySelector(true);
                    }
                  }}
                  className='flex items-center space-x-2 px-4 py-2 rounded-lg border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 font-semibold text-sm'
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                    backdropFilter: 'blur(20px)',
                    color: 'white'
                  }}
                >
                  <Download className='w-4 h-4' />
                  <span>Descargar Inventarios</span>
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className='p-8 sm:p-16 text-center'>
              <LoadingSpinner />
              <p className='text-sm sm:text-base lg:text-lg text-secondaryText mt-4 sm:mt-6'>
                Cargando inventarios desde Google Sheets...
              </p>
            </div>
          ) : inventories.length === 0 ? (
            <div className='p-8 sm:p-16 text-center'>
              <FileText className='w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-secondaryText mx-auto mb-4 sm:mb-6 lg:mb-8 opacity-50' />
              <h3 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-4 sm:mb-6'>
                No Se Encontraron Inventarios
              </h3>
              <p className='text-sm sm:text-base text-secondaryText mb-6 sm:mb-8 lg:mb-10 max-w-md mx-auto px-4'>
                No se encontraron datos de inventario para {selectedAgency.name} en Google
                Sheets. Inicia tu primera sesión de inventario para{' '}
                {getMonthName(currentMonth)} {currentYear}
              </p>
              <button
                onClick={handleStartNewInventory}
                className='btn-primary text-sm sm:text-base px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5'
              >
                Iniciar Inventario
              </button>
            </div>
          ) : (
            <div className='overflow-hidden'>
              {/* Desktop Table View - Design System Compliant */}
              <div className='hidden lg:block overflow-x-auto'>
                <div className='rounded-2xl border border-white/30 overflow-hidden' style={{ background: 'rgba(0,0,0,0.6)', minWidth: '920px' }}>
                  <table className='w-full' style={{ minWidth: '920px' }}>
                    <thead className='border-b border-white/20' style={{ background: 'rgba(0,0,0,0.8)' }}>
                      <tr>
                        <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider' style={{ width: '180px' }}>
                          Mes y Año
                        </th>
                        <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider' style={{ width: '120px' }}>
                          Estado
                        </th>
                        <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider' style={{ width: '180px' }}>
                          Creado Por
                        </th>
                        <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider' style={{ width: '180px' }}>
                          Creado En
                        </th>
                        <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider' style={{ width: '120px' }}>
                          Escaneos
                        </th>
                        <th className='px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider' style={{ width: '140px' }}>
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
                          <td className='px-4 py-4 whitespace-nowrap' style={{ width: '180px' }}>
                            <div className='flex items-center space-x-3'>
                              <div className='w-8 h-8 rounded-lg flex items-center justify-center border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                                <Calendar className='w-4 h-4 text-white' />
                              </div>
                              <div>
                                <span className='font-bold text-white text-sm'>
                                  {inventory.monthName || getMonthName(inventory.month)} {inventory.year}
                                </span>
                                <p className='text-xs text-secondaryText'>
                                  Mensual
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap' style={{ width: '120px' }}>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${getStatusColor(
                                inventory.status
                              )}`}
                            >
                              {getStatusIcon(inventory.status)}
                              <span className='ml-2'>
                                {getStatusText(inventory.status)}
                              </span>
                            </span>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap' style={{ width: '180px' }}>
                            <div className='flex items-center space-x-2'>
                              <User className='w-4 h-4 text-white' />
                              <span className='text-white font-medium text-sm truncate'>
                                {inventory.createdBy}
                              </span>
                            </div>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap' style={{ width: '180px' }}>
                            <div className='flex items-center space-x-2'>
                              <Clock className='w-4 h-4 text-white' />
                              <span className='text-white font-medium text-sm'>
                                {formatDate(inventory.createdAt)}
                              </span>
                            </div>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap' style={{ width: '120px' }}>
                            <span className='font-mono text-lg font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent px-3 py-1 rounded-lg border border-white/30'>
                              {inventory.totalScans}
                            </span>
                          </td>
                          <td className='px-4 py-4 whitespace-nowrap' style={{ width: '140px' }}>
                            {inventory.status !== 'Completed' ? (
                              <button
                                onClick={() => handleContinueInventory(inventory)}
                                disabled={isSessionActive}
                                className={`text-xs py-2 px-3 flex items-center space-x-2 rounded-lg border transition-all duration-300 font-semibold ${
                                  isSessionActive
                                    ? 'btn-disabled border-gray-500/30 cursor-not-allowed opacity-50'
                                    : 'btn-secondary border-white/30 hover:border-white/50 hover:scale-105'
                                }`}
                                style={{
                                  background: isSessionActive
                                    ? 'linear-gradient(135deg, rgba(100,100,100,0.3) 0%, rgba(100,100,100,0.2) 100%)'
                                    : 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                                  backdropFilter: 'blur(20px)'
                                }}
                              >
                                <span>
                                  {isSessionActive ? 'Activo' : 'Continuar'}
                                </span>
                                {!isSessionActive && <ChevronRight className='w-3 h-3' />}
                              </button>
                            ) : (
                              <div className='flex items-center justify-center'>
                                <span className='text-sm text-green-400 font-medium flex items-center space-x-1'>
                                  <CheckCircle className='w-4 h-4' />
                                  <span>Completado</span>
                                </span>
                              </div>
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
                              {inventory.monthName || getMonthName(inventory.month)} {inventory.year}
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
                            <Clock className='w-4 h-4 text-white' />
                            <span className='text-xs font-medium text-white'>Creado:</span>
                          </div>
                          <span className='text-xs font-semibold text-white text-right'>
                            {formatDate(inventory.createdAt)}
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
                    
                    {/* Action Section */}
                    <div className='relative z-10'>
                      {inventory.status !== 'Completed' ? (
                        <button
                          onClick={() => handleContinueInventory(inventory)}
                          disabled={isSessionActive}
                          className={`w-full text-xs py-3 px-4 flex items-center justify-center space-x-2 rounded-lg border transition-all duration-300 font-semibold ${
                            isSessionActive
                              ? 'btn-disabled border-gray-500/30 cursor-not-allowed opacity-50'
                              : 'btn-secondary border-white/30 hover:border-white/50'
                          }`}
                          style={{
                            background: isSessionActive
                              ? 'linear-gradient(135deg, rgba(100,100,100,0.3) 0%, rgba(100,100,100,0.2) 100%)'
                              : 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                            backdropFilter: 'blur(20px)'
                          }}
                        >
                          <span>
                            {isSessionActive ? 'Inventario Ya Activo' : 'Continuar Inventario'}
                          </span>
                          {!isSessionActive && <ChevronRight className='w-4 h-4' />}
                        </button>
                      ) : (
                        <div className='w-full text-center py-3 px-4 rounded-lg border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                          <span className='text-sm text-green-400 font-medium flex items-center justify-center space-x-2'>
                            <CheckCircle className='w-4 h-4' />
                            <span>Inventario Completado</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className='card border-blue-500/20 bg-blue-500/10 mb-6 sm:mb-section'>
          <div className='flex items-start space-x-3 sm:space-x-4'>
            <AlertCircle className='w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-base sm:text-lg font-semibold text-blue-400 mb-2 sm:mb-4'>
                Gestión de Inventarios Mensuales
              </h3>
              <p className='text-sm sm:text-base text-secondaryText mb-3 sm:mb-4'>
                Cada agencia puede tener un inventario por mes. Una vez que un inventario
                es completado para un mes, no puedes iniciar uno nuevo para el
                mismo mes. Esto asegura la integridad de los datos y previene duplicados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Multiple Inventory Selector Modal */}
      {showMultipleInventorySelector && selectedInventoryForDownload && (
        <MultipleInventorySelector
          isOpen={showMultipleInventorySelector}
          onClose={() => {
            setShowMultipleInventorySelector(false);
            setSelectedInventoryForDownload(null);
          }}
          onSelectInventory={handleSelectInventoryFromSelector}
          agency={selectedAgency?.name || ''}
          month={selectedInventoryForDownload.month}
          year={selectedInventoryForDownload.year}
          fileType="csv"
        />
      )}

    </div>
  );
};

export default MonthlyInventoryManager;
