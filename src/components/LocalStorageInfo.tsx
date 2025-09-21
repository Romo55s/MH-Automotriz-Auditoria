import { Clock, Database, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cleanupExpiredLocalStorage, getLocalStorageInfo, LOCAL_STORAGE_PREFIX } from '../utils/localStorageManager';

interface LocalStorageInfoProps {
  agencyName: string;
  month: string;
  year: number;
}

const LocalStorageInfo: React.FC<LocalStorageInfoProps> = ({
  agencyName,
  month,
  year,
}) => {
  const [localStorageData, setLocalStorageData] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [showForceCleanup, setShowForceCleanup] = useState(false);

  const refreshData = () => {
    const data = getLocalStorageInfo();
    setLocalStorageData(data);
  };

  useEffect(() => {
    refreshData();
  }, [agencyName, month, year]);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    
    const beforeCount = localStorageData.length;
    const expiredCount = localStorageData.filter(item => item.isExpired).length;
    
    try {
      cleanupExpiredLocalStorage();
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      refreshData();
      
      // Show feedback after refresh completes
      setTimeout(() => {
        const afterCount = getLocalStorageInfo().length;
        const cleanedCount = beforeCount - afterCount;
      }, 100);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleForceCleanup = async () => {
    setIsCleaningUp(true);
    
    const beforeCount = localStorageData.length;
    
    try {
      // Remove all inventory-related local storage items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      refreshData();
      
      // Show feedback after refresh completes
      setTimeout(() => {
        const afterCount = getLocalStorageInfo().length;
      }, 100);
    } finally {
      setIsCleaningUp(false);
      setShowForceCleanup(false);
    }
  };

  const currentKey = `inventory_scans_${agencyName}_${month}_${year}`;
  const currentData = localStorageData.find(item => item.key === currentKey);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className='text-xs text-gray-400 hover:text-white transition-colors flex items-center space-x-1'
      >
        <Database className='w-3 h-3' />
        <span>Ver Almacenamiento Local</span>
      </button>
    );
  }

  return (
    <div className='fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4'>
      <div className='bg-black glass-effect rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-white/30 shadow-2xl'>
        {/* Header */}
        <div className='relative bg-gradient-to-r from-gray-600/20 to-gray-700/20 p-4 sm:p-6 border-b border-white/30'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3 sm:space-x-4'>
              <div className='w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30'>
                <Database className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
              </div>
              <div>
                <h2 className='text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-hero leading-heading text-white mb-1'>
                  Almacenamiento Local
                </h2>
                <p className='text-xs sm:text-sm text-secondaryText font-medium'>
                  Datos de respaldo con expiración automática
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className='p-2 sm:p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300 border border-white/20 hover:border-white/40'
            >
              <X className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6 lg:p-8'>
          {/* Current Session Info */}
          {currentData && (
            <div className='mb-6 sm:mb-8'>
              <div className='glass-effect border border-white/30 rounded-2xl p-4 sm:p-6 bg-white/5'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-base sm:text-lg font-bold uppercase tracking-wide text-white'>
                    Sesión Actual: {agencyName} {month}/{year}
                  </h3>
                  <span className={`px-3 py-1 rounded-pill text-xs font-bold ${
                    currentData.isExpired 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-white/20 text-white border border-white/30'
                  }`}>
                    {currentData.isExpired ? 'Expirado' : 'Activo'}
                  </span>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                  <div className='text-center p-3 bg-white/10 rounded-xl border border-white/20'>
                    <div className='text-2xl sm:text-3xl font-bold text-white mb-1'>
                      {currentData.data.scannedCodes.length}
                    </div>
                    <div className='text-xs sm:text-sm text-gray-300'>
                      Códigos Escaneados
                    </div>
                  </div>
                  <div className='text-center p-3 bg-white/10 rounded-xl border border-white/20'>
                    <div className='text-sm sm:text-base font-bold text-white mb-1'>
                      {new Date(currentData.data.createdAt).toLocaleDateString()}
                    </div>
                    <div className='text-xs sm:text-sm text-gray-300'>
                      Fecha de Creación
                    </div>
                  </div>
                  <div className='text-center p-3 bg-white/10 rounded-xl border border-white/20'>
                    <div className='text-sm sm:text-base font-bold text-white mb-1'>
                      {currentData.timeUntilExpiry}
                    </div>
                    <div className='text-xs sm:text-sm text-gray-300'>
                      Tiempo Restante
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Local Storage Data */}
          <div className='mb-6 sm:mb-8'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-base sm:text-lg font-bold text-white'>
                Todos los Datos Almacenados
              </h3>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={handleCleanup}
                  disabled={isCleaningUp}
                  className={`px-4 py-2 border border-white rounded-pill text-xs font-semibold text-white bg-transparent transition-all duration-300 flex items-center space-x-2 ${
                    isCleaningUp 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-white hover:text-black hover:scale-105'
                  }`}
                >
                  {isCleaningUp ? (
                    <>
                      <div className='w-3 h-3 border border-white border-t-transparent rounded-full animate-spin' />
                      <span>Limpiando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className='w-3 h-3' />
                      <span>Limpiar Expirados</span>
                    </>
                  )}
                </button>
                
                {localStorageData.length > 0 && !isCleaningUp && (
                  <button
                    onClick={() => setShowForceCleanup(true)}
                    className='px-4 py-2 border border-red-500 rounded-pill text-xs font-semibold text-red-400 bg-transparent hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-105 flex items-center space-x-2'
                  >
                    <Trash2 className='w-3 h-3' />
                    <span>Limpiar Todo</span>
                  </button>
                )}
              </div>
            </div>

            {localStorageData.length === 0 ? (
              <div className='text-center py-8'>
                <Database className='w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50' />
                <p className='text-gray-300'>No hay datos en el almacenamiento local</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {localStorageData.map((item, index) => (
                  <div
                    key={item.key}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      item.isExpired
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-white/5 border-white/20'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center space-x-3 mb-2'>
                          <h4 className='text-sm sm:text-base font-bold text-white'>
                            {item.data.agency} - {item.data.month}/{item.data.year}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.isExpired
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {item.isExpired ? 'Expirado' : 'Activo'}
                          </span>
                        </div>
                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm'>
                          <div>
                            <span className='text-gray-400'>Códigos:</span>
                            <span className='text-white font-bold ml-1'>
                              {item.data.scannedCodes.length}
                            </span>
                          </div>
                          <div>
                            <span className='text-gray-400'>Creado:</span>
                            <span className='text-white ml-1'>
                              {new Date(item.data.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className='text-gray-400'>Expira:</span>
                            <span className='text-white ml-1'>
                              {new Date(item.data.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className='flex items-center space-x-1'>
                            <Clock className='w-3 h-3 text-gray-400' />
                            <span className='text-gray-400'>Restante:</span>
                            <span className='text-white ml-1'>
                              {item.timeUntilExpiry}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Information Notice */}
          <div className='glass-effect border border-white/30 rounded-2xl p-4 sm:p-6 bg-white/5'>
            <div className='flex items-start space-x-3 sm:space-x-4'>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
                <span className='text-white text-sm sm:text-lg'>ℹ️</span>
              </div>
              <div>
                <h4 className='text-sm sm:text-base font-bold uppercase tracking-wide text-white mb-2 sm:mb-3'>
                  Información sobre el Almacenamiento Local
                </h4>
                <ul className='text-xs sm:text-sm text-secondaryText leading-relaxed space-y-2'>
                  <li>• <strong className='text-white'>Respaldo automático:</strong> Los datos se guardan automáticamente en el navegador</li>
                  <li>• <strong className='text-white'>Expiración:</strong> Los datos se eliminan automáticamente después de 1.5 días (36 horas)</li>
                  <li>• <strong className='text-white'>Recuperación:</strong> Si pierdes la sesión, los datos se restauran desde el almacenamiento local</li>
                  <li>• <strong className='text-white'>Limpieza automática:</strong> Los datos expirados se eliminan automáticamente al abrir la aplicación</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='border-t border-white/30 bg-white/5 px-4 sm:px-6 py-4 sm:py-5'>
          <div className='flex justify-center'>
            <button
              onClick={() => setIsVisible(false)}
              className='px-6 py-3 border border-white rounded-pill text-sm font-semibold text-white bg-transparent hover:bg-white hover:text-black transition-all duration-300 hover:scale-105'
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Force Cleanup Confirmation Modal */}
      {showForceCleanup && (
        <div className='fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4'>
          <div className='glass-effect rounded-2xl max-w-md w-full border border-red-500/30 shadow-2xl'>
            <div className='p-6'>
              <div className='flex items-center space-x-3 mb-4'>
                <div className='w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center'>
                  <Trash2 className='w-6 h-6 text-red-400' />
                </div>
                <div>
                  <h3 className='text-lg font-bold text-white'>¿Limpiar Todo?</h3>
                  <p className='text-sm text-red-300'>Esta acción no se puede deshacer</p>
                </div>
              </div>
              
              <p className='text-sm text-gray-300 mb-6'>
                Esto eliminará <strong>TODOS</strong> los datos del almacenamiento local, 
                incluyendo sesiones activas que aún no han expirado. 
                <br/><br/>
                <strong className='text-red-400'>¡Perderás todos los datos de respaldo!</strong>
              </p>
              
              <div className='flex space-x-3'>
                <button
                  onClick={() => setShowForceCleanup(false)}
                  className='flex-1 px-4 py-2 border border-white/30 rounded-pill text-sm font-semibold text-white bg-transparent hover:bg-white/10 transition-all duration-300'
                >
                  Cancelar
                </button>
                <button
                  onClick={handleForceCleanup}
                  className='flex-1 px-4 py-2 bg-red-500 rounded-pill text-sm font-semibold text-white hover:bg-red-600 transition-all duration-300'
                >
                  Sí, Limpiar Todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalStorageInfo;
