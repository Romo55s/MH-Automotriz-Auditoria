import { useAuth0 } from '@auth0/auth0-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

const MonthlyInventoryManager: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const { selectedAgency } = useAppContext();
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
      setError(errorMessage);
      showError('Error de Carga', errorMessage);
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
    return monthNames[parseInt(month) - 1];
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

      if (response.exists && response.status === 'Completed') {
        showError(
          'Inventario Existe',
          `Un inventario para ${getMonthName(
            currentMonth
          )} ${currentYear} ya ha sido completado. No puedes iniciar uno nuevo para el mismo mes.`
        );
        return;
      }

      if (response.exists && response.status === 'Active') {
        showInfo(
          'Continuar Existente',
          `Un inventario activo para ${getMonthName(
            currentMonth
          )} ${currentYear} ya existe. Puedes continuarlo o completarlo primero.`
        );
        // Navigate to inventory page to continue
        navigate('/inventory');
        return;
      }

      // Navigate to inventory page to start new
      navigate('/inventory');
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
    navigate('/inventory');
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
              <div className='flex items-center space-x-3'>
                <AlertCircle className='w-5 h-5 text-red-400' />
                <span className='text-sm sm:text-base text-red-400 font-medium'>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className='text-red-400 hover:text-red-300 transition-colors'
              >
                <AlertCircle className='w-4 h-4' />
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
              {/* Desktop Table View */}
              <div className='hidden lg:block overflow-x-auto'>
                <table className='w-full'>
                  <thead className='border-b border-white/10'>
                    <tr>
                      <th className='px-6 lg:px-8 py-4 lg:py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Mes y Año
                      </th>
                      <th className='px-6 lg:px-8 py-4 lg:py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Estado
                      </th>
                      <th className='px-6 lg:px-8 py-4 lg:py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Creado Por
                      </th>
                      <th className='px-6 lg:px-8 py-4 lg:py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Creado En
                      </th>
                      <th className='px-6 lg:px-8 py-4 lg:py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Total de Escaneos
                      </th>
                      <th className='px-6 lg:px-8 py-4 lg:py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
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
                        <td className='px-6 lg:px-8 py-4 lg:py-8 whitespace-nowrap'>
                          <div className='flex items-center space-x-3 lg:space-x-4'>
                            <Calendar className='w-5 h-5 lg:w-6 lg:h-6 text-secondaryText' />
                            <span className='font-semibold text-white text-base lg:text-lg'>
                              {getMonthName(inventory.month)} {inventory.year}
                            </span>
                          </div>
                        </td>
                        <td className='px-6 lg:px-8 py-4 lg:py-8 whitespace-nowrap'>
                          <span
                            className={`inline-flex items-center px-3 lg:px-4 py-2 rounded-pill text-xs lg:text-sm font-semibold border ${getStatusColor(
                              inventory.status
                            )}`}
                          >
                            {getStatusIcon(inventory.status)}
                            <span className='ml-2 lg:ml-3'>
                              {getStatusText(inventory.status)}
                            </span>
                          </span>
                        </td>
                        <td className='px-6 lg:px-8 py-4 lg:py-8 whitespace-nowrap text-sm lg:text-base text-secondaryText'>
                          {inventory.createdBy}
                        </td>
                        <td className='px-6 lg:px-8 py-4 lg:py-8 whitespace-nowrap text-sm lg:text-base text-secondaryText'>
                          {formatDate(inventory.createdAt)}
                        </td>
                        <td className='px-6 lg:px-8 py-4 lg:py-8 whitespace-nowrap'>
                          <span className='font-mono text-lg lg:text-xl text-white bg-white/10 px-3 lg:px-4 py-2 rounded-lg'>
                            {inventory.totalScans}
                          </span>
                        </td>
                        <td className='px-6 lg:px-8 py-4 lg:py-8 whitespace-nowrap'>
                          {inventory.status !== 'Completed' && (
                            <button
                              onClick={() => handleContinueInventory(inventory)}
                              className='btn-secondary text-xs lg:text-sm py-2 lg:py-3 px-4 lg:px-6 flex items-center space-x-2 lg:space-x-3'
                            >
                              <span>Continuar</span>
                              <ChevronRight className='w-3 h-3 lg:w-4 lg:h-4' />
                            </button>
                          )}
                          {inventory.status === 'Completed' && (
                            <span className='text-secondaryText text-sm'>
                              Completado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className='lg:hidden space-y-4 p-4'>
                {inventories.map(inventory => (
                  <div
                    key={inventory.id}
                    className='glass-effect rounded-xl p-4 border border-white/20'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center space-x-3'>
                        <Calendar className='w-5 h-5 text-secondaryText' />
                        <span className='font-semibold text-white text-base'>
                          {getMonthName(inventory.month)} {inventory.year}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-pill text-xs font-semibold border ${getStatusColor(
                          inventory.status
                        )}`}
                      >
                        {getStatusIcon(inventory.status)}
                        <span className='ml-2'>
                          {getStatusText(inventory.status)}
                        </span>
                      </span>
                    </div>
                    
                    <div className='space-y-2 mb-4'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-secondaryText'>Creado Por:</span>
                        <span className='text-white'>{inventory.createdBy}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-secondaryText'>Creado:</span>
                        <span className='text-white'>{formatDate(inventory.createdAt)}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-secondaryText'>Total de Escaneos:</span>
                        <span className='font-mono text-white bg-white/10 px-2 py-1 rounded'>
                          {inventory.totalScans}
                        </span>
                      </div>
                    </div>
                    
                    {inventory.status !== 'Completed' && (
                      <button
                        onClick={() => handleContinueInventory(inventory)}
                        className='w-full btn-secondary text-sm py-3 px-4 flex items-center justify-center space-x-2'
                      >
                        <span>Continuar</span>
                        <ChevronRight className='w-4 h-4' />
                      </button>
                    )}
                    {inventory.status === 'Completed' && (
                      <div className='text-center py-3'>
                        <span className='text-secondaryText text-sm'>
                          Inventario Completado
                        </span>
                      </div>
                    )}
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
