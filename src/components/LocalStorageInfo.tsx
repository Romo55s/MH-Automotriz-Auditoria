import { Clock, Database, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cleanupExpiredLocalStorage, getLocalStorageInfo } from '../utils/localStorageManager';

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

  const refreshData = () => {
    const data = getLocalStorageInfo();
    setLocalStorageData(data);
  };

  useEffect(() => {
    refreshData();
  }, [agencyName, month, year]);

  const handleCleanup = () => {
    cleanupExpiredLocalStorage();
    refreshData();
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
      <div className='glass-effect rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-white/30 shadow-2xl'>
        {/* Header */}
        <div className='relative bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-4 sm:p-6 lg:p-8 border-b border-white/20'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3 sm:space-x-4 lg:space-x-6'>
              <div className='w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-purple-500/30 rounded-full flex items-center justify-center shadow-lg border-2 border-purple-400/50'>
                <Database className='w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-purple-300' />
              </div>
              <div>
                <h2 className='text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1 sm:mb-2'>
                  Almacenamiento Local
                </h2>
                <p className='text-xs sm:text-sm lg:text-base text-purple-200 font-medium'>
                  Datos de respaldo con expiración automática
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className='p-2 sm:p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300 border border-white/20 hover:border-white/40'
            >
              <span className='text-white text-xl'>×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6 lg:p-8'>
          {/* Current Session Info */}
          {currentData && (
            <div className='mb-6 sm:mb-8'>
              <div className='bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-400/50 rounded-2xl p-4 sm:p-6 lg:p-8'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-base sm:text-lg font-bold text-green-300'>
                    Sesión Actual: {agencyName} {month}/{year}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    currentData.isExpired 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
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
              <button
                onClick={handleCleanup}
                className='btn-secondary text-xs py-2 px-3 flex items-center space-x-2'
              >
                <Trash2 className='w-3 h-3' />
                <span>Limpiar Expirados</span>
              </button>
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
          <div className='bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/50 rounded-2xl p-4 sm:p-6 lg:p-8'>
            <div className='flex items-start space-x-3 sm:space-x-4'>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
                <span className='text-blue-300 text-sm sm:text-lg'>ℹ️</span>
              </div>
              <div>
                <h4 className='text-sm sm:text-base lg:text-lg font-bold text-blue-300 mb-2 sm:mb-3'>
                  Información sobre el Almacenamiento Local
                </h4>
                <ul className='text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed space-y-2'>
                  <li>• <strong>Respaldo automático:</strong> Los datos se guardan automáticamente en el navegador</li>
                  <li>• <strong>Expiración:</strong> Los datos se eliminan automáticamente después de 1.5 días (36 horas)</li>
                  <li>• <strong>Recuperación:</strong> Si pierdes la sesión, los datos se restauran desde el almacenamiento local</li>
                  <li>• <strong>Limpieza automática:</strong> Los datos expirados se eliminan automáticamente al abrir la aplicación</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 border-t border-white/20 bg-white/5'>
          <div className='flex justify-end'>
            <button
              onClick={() => setIsVisible(false)}
              className='btn-secondary py-3 sm:py-4 px-6 sm:px-8 text-sm sm:text-base'
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalStorageInfo;
