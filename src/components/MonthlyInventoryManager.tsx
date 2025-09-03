import { useAuth0 } from '@auth0/auth0-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { checkMonthlyInventory, getAgencyInventories } from '../services/api';
import { MonthlyInventory } from '../types/index';
import Footer from './Footer';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';

import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Database,
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

  const [inventories, setInventories] = useState<MonthlyInventory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<number>(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Initialize current month and year
  useEffect(() => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    setCurrentMonth(month);
    setCurrentYear(year);
  }, []);

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
        // Convert month name to month number
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
          createdAt: parseDateSafely(inv.createdAt),
          createdBy: inv.createdBy || inv.userName || 'Unknown',
          totalScans: parseInt(inv.totalScans) || 0,
          sessionId: inv.sessionId,
          lastUpdated: new Date()
        };
      });
      
      setInventories(transformedInventories);
      setLastRefresh(new Date());
      showSuccess(
        'Datos Cargados',
        `Se cargaron exitosamente ${transformedInventories.length} inventarios desde Google Sheets`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Falló al cargar inventarios';
      
      // Log detailed error information for debugging
      console.error('Error loading inventories:', {
        error: err,
        errorMessage,
        selectedAgency: selectedAgency?.name,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
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

  const parseDateSafely = (dateString: string | Date): Date => {
    if (!dateString) return new Date();
    
    try {
      // If it's already a Date object, return it
      if (dateString instanceof Date) return dateString;
      
      // Try to parse the date string
      const parsed = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(parsed.getTime())) {
        console.warn('Invalid date string:', dateString);
        return new Date();
      }
      
      return parsed;
    } catch (error) {
      console.warn('Error parsing date:', dateString, error);
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
    // For active/paused inventories, navigate to inventory page to continue
    showInfo(
      'Continuando Inventario',
      `Continuando sesión de inventario para ${getMonthName(inventory.month)} ${
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
    <div className='min-h-screen bg-background relative overflow-hidden flex flex-col'>
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

      {/* Header */}
      <Header
        title={`${selectedAgency.name} - Inventarios Mensuales`}
        subtitle='Gestiona y rastrea sesiones de inventario mensuales'
        showBackButton={true}
        onBackClick={() => navigate('/select-agency')}
        showUserInfo={true}
        showChangeAgency={true}
      />

      <div className='flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10'>
        {/* Current Month Info */}
        <div className='card mb-6'>
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
                <span>Iniciar Nuevo Inventario</span>
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
        <div className='card'>
          <div className='px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-white/20'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
                <FileText className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3' />
                Inventarios Existentes
              </h2>
              <div className='text-xs sm:text-sm text-secondaryText'>
                {inventories.length} inventario
                {inventories.length !== 1 ? 's' : ''} encontrado
              </div>
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
                Iniciar Primer Inventario
              </button>
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
                          Creado En
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
                                <p className='text-sm text-secondaryText'>
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
                            <div className='flex items-center space-x-3'>
                              <Clock className='w-4 h-4 text-white' />
                              <span className='text-white font-medium'>
                                {formatDate(inventory.createdAt)}
                              </span>
                            </div>
                          </td>
                          <td className='px-8 py-6 whitespace-nowrap'>
                            <span className='font-mono text-xl font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent px-4 py-2 rounded-lg border border-white/30'>
                              {inventory.totalScans}
                            </span>
                          </td>
                          <td className='px-8 py-6 whitespace-nowrap'>
                            {inventory.status !== 'Completed' && (
                              <button
                                onClick={() => handleContinueInventory(inventory)}
                                className='btn-secondary text-sm py-3 px-6 flex items-center space-x-3 rounded-xl border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 font-semibold'
                                style={{
                                  background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                                  backdropFilter: 'blur(20px)'
                                }}
                              >
                                <span>Continuar</span>
                                <ChevronRight className='w-4 h-4' />
                              </button>
                            )}
                            {inventory.status === 'Completed' && (
                              <div className='flex items-center space-x-2'>
                                <CheckCircle className='w-5 h-5 text-green-400' />
                                <span className='text-white text-sm font-medium'>
                                  Completado
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
                          <ChevronRight className='w-4 h-4' />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className='card border-blue-500/20 bg-blue-500/10 mt-6'>
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
              <div className='p-3 sm:p-4 glass-effect border border-blue-500/20 rounded-xl'>
                <p className='text-xs sm:text-sm text-blue-300'>
                  <strong>Nota:</strong> Después de completar un inventario, necesitarás
                  buscar manualmente cada código de barras en el sitio web de REPUVE para
                  extraer la información completa del vehículo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MonthlyInventoryManager;
