import { CheckCircle, Download, Plus, X } from 'lucide-react';
import React from 'react';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewInventory: () => void;
  onDownloadBarcodes: () => void;
  totalScans: number;
  agencyName: string;
  monthName: string;
  year: number;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  onStartNewInventory,
  onDownloadBarcodes,
  totalScans,
  agencyName,
  monthName,
  year,
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='glass-effect rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/20'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-white/20'>
          <div className='flex items-center space-x-3 sm:space-x-4'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center'>
              <CheckCircle className='w-6 h-6 sm:w-8 sm:h-8 text-green-400' />
            </div>
            <div>
              <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading text-shadow'>
                ¡Inventario Completado!
              </h2>
              <p className='text-sm sm:text-base text-secondaryText'>
                Sesión finalizada exitosamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 sm:p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300'
          >
            <X className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
          </button>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6 lg:p-8'>
          {/* Success Message */}
          <div className='text-center mb-6 sm:mb-8'>
            <div className='bg-green-900/20 border border-green-500/50 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6'>
              <h3 className='text-base sm:text-lg font-semibold text-green-400 mb-2 sm:mb-3'>
                Felicitaciones
              </h3>
              <p className='text-sm sm:text-base text-secondaryText'>
                Has completado exitosamente el inventario de <strong>{agencyName}</strong> para {monthName} {year}.
              </p>
            </div>

            {/* Statistics */}
            <div className='glass-effect border border-white/20 rounded-2xl p-4 sm:p-6'>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6'>
                <div className='text-center'>
                  <div className='text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2'>
                    {totalScans}
                  </div>
                  <div className='text-xs sm:text-sm text-secondaryText'>
                    Códigos Escaneados
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2'>
                    {agencyName}
                  </div>
                  <div className='text-xs sm:text-sm text-secondaryText'>
                    Agencia
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2'>
                    {monthName} {year}
                  </div>
                  <div className='text-xs sm:text-sm text-secondaryText'>
                    Período
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className='bg-yellow-900/20 border border-yellow-500/50 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8'>
            <h4 className='text-sm sm:text-base font-semibold text-yellow-400 mb-2 sm:mb-3'>
              ⚠️ Importante: Búsqueda Manual en REPUVE Requerida
            </h4>
            <p className='text-xs sm:text-sm text-secondaryText'>
              Recuerda que debes buscar manualmente cada código de barras en el sitio web de REPUVE 
              para obtener la información completa de los vehículos. Los códigos han sido guardados 
              en Google Sheets para tu referencia.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className='px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-white/20 glass-effect'>
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
            <button
              onClick={onDownloadBarcodes}
              className='flex-1 btn-secondary py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base flex items-center justify-center space-x-2 sm:space-x-3'
            >
              <Download className='w-4 h-4 sm:w-5 sm:h-5' />
              <span>Descargar Lista</span>
            </button>
            <button
              onClick={onStartNewInventory}
              className='flex-1 btn-primary py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-center space-x-2 sm:space-x-3 glow text-sm sm:text-base'
            >
              <Plus className='w-4 h-4 sm:w-5 sm:h-5' />
              <span>Nuevo Inventario</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
