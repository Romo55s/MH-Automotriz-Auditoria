import { CheckCircle, Download, Users, X } from 'lucide-react';
import React from 'react';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewInventory: () => void;
  onDownloadCSV: () => void;
  totalScans: number;
  agencyName: string;
  monthName: string;
  year: number;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  onStartNewInventory,
  onDownloadCSV,
  totalScans,
  agencyName,
  monthName,
  year,
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4'>
      <div className='glass-effect rounded-2xl sm:rounded-3xl max-w-2xl sm:max-w-3xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-y-auto border border-white/30 shadow-2xl'>
        {/* Header */}
        <div className='relative bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-4 sm:p-6 lg:p-8 border-b border-white/20'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3 sm:space-x-4 lg:space-x-6'>
              <div className='w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-green-500/30 rounded-full flex items-center justify-center shadow-lg border-2 border-green-400/50'>
                <CheckCircle className='w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-green-300' />
              </div>
              <div>
                <h2 className='text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1 sm:mb-2'>
                  ¡Inventario Completado!
                </h2>
                <p className='text-xs sm:text-sm lg:text-base text-green-200 font-medium'>
                  Sesión finalizada exitosamente
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='p-2 sm:p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300 border border-white/20 hover:border-white/40'
            >
              <X className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6 lg:p-8'>
          {/* Success Message */}
          <div className='text-center mb-6 sm:mb-8'>
            <div className='bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-400/50 rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6'>
              <div className='flex items-center justify-center mb-3 sm:mb-4'>
                <div className='w-10 h-10 sm:w-12 sm:h-12 bg-green-500/30 rounded-full flex items-center justify-center mr-2 sm:mr-3'>
                  <CheckCircle className='w-5 h-5 sm:w-6 sm:h-6 text-green-300' />
                </div>
                <h3 className='text-base sm:text-lg lg:text-xl font-bold text-green-300'>
                  ¡Felicitaciones!
                </h3>
              </div>
              <p className='text-sm sm:text-base lg:text-lg text-white leading-relaxed'>
                Has completado exitosamente el inventario de{' '}
                <span className='font-bold text-green-300'>{agencyName}</span> para{' '}
                <span className='font-bold text-green-300'>{monthName} {year}</span>.
              </p>
            </div>

            {/* Statistics */}
            <div className='glass-effect border border-white/30 rounded-2xl p-4 sm:p-6 lg:p-8 bg-white/5'>
              <h4 className='text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 text-center'>
                Resumen del Inventario
              </h4>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6'>
                <div className='text-center p-3 sm:p-4 bg-white/10 rounded-xl border border-white/20'>
                  <div className='text-2xl sm:text-3xl lg:text-4xl font-bold text-green-300 mb-1 sm:mb-2'>
                    {totalScans}
                  </div>
                  <div className='text-xs sm:text-sm lg:text-base text-gray-300 font-medium'>
                    Códigos Escaneados
                  </div>
                </div>
                <div className='text-center p-3 sm:p-4 bg-white/10 rounded-xl border border-white/20'>
                  <div className='text-sm sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2 truncate'>
                    {agencyName}
                  </div>
                  <div className='text-xs sm:text-sm lg:text-base text-gray-300 font-medium'>
                    Agencia
                  </div>
                </div>
                <div className='text-center p-3 sm:p-4 bg-white/10 rounded-xl border border-white/20'>
                  <div className='text-sm sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2'>
                    {monthName} {year}
                  </div>
                  <div className='text-xs sm:text-sm lg:text-base text-gray-300 font-medium'>
                    Período
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className='bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-400/50 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8'>
            <div className='flex items-start space-x-3 sm:space-x-4'>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
                <span className='text-yellow-300 text-sm sm:text-lg'>⚠️</span>
              </div>
              <div>
                <h4 className='text-sm sm:text-base lg:text-lg font-bold text-yellow-300 mb-2 sm:mb-3'>
                  Importante: Búsqueda Manual en REPUVE Requerida
                </h4>
                <p className='text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed'>
                  Recuerda que debes buscar manualmente cada código de barras en el sitio web de REPUVE 
                  para obtener la información completa de los vehículos. Los códigos han sido guardados 
                  en Google Sheets para tu referencia.
                </p>
              </div>
            </div>
          </div>

          {/* Team Impact Notice */}
          <div className='bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-400/50 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8'>
            <div className='flex items-start space-x-3 sm:space-x-4'>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-orange-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
                <Users className='w-4 h-4 sm:w-5 sm:h-5 text-orange-300' />
              </div>
              <div>
                <h4 className='text-sm sm:text-base lg:text-lg font-bold text-orange-300 mb-2 sm:mb-3'>
                  Impacto en el Equipo
                </h4>
                <p className='text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed mb-3 sm:mb-4'>
                  Al completar este inventario, todas las sesiones activas de otros miembros del equipo que estaban trabajando en el mismo inventario han sido terminadas automáticamente para evitar duplicados.
                </p>
                <div className='bg-orange-500/20 rounded-lg p-3 sm:p-4 border border-orange-500/30'>
                  <p className='text-xs sm:text-sm text-orange-200'>
                    <strong>Nota:</strong> Esto es necesario para mantener la integridad de los datos y asegurar que solo exista un inventario por mes por agencia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 border-t border-white/20 bg-white/5'>
          <div className='space-y-4 sm:space-y-6'>
            {/* Download Section */}
            <div className='text-center'>
              <h4 className='text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4'>
                Descargar Inventario
              </h4>
              <button
                onClick={onDownloadCSV}
                className='w-full sm:w-auto btn-secondary py-3 sm:py-4 px-6 sm:px-8 text-sm sm:text-base flex items-center justify-center space-x-2 sm:space-x-3 mx-auto border border-white/30 hover:border-white/50 transition-all duration-300'
              >
                <Download className='w-4 h-4 sm:w-5 sm:h-5' />
                <span>Descargar CSV</span>
              </button>
              <p className='text-xs text-gray-400 mt-2 sm:mt-3'>
                Los datos serán eliminados del sistema después de la descarga
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
