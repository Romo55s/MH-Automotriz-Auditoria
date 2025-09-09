import { Check, QrCode, X } from 'lucide-react';
import React from 'react';

interface ConfirmationModalProps {
  scannedCode: string;
  onConfirm: (code: string) => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  scannedCode,
  onConfirm,
  onCancel,
}) => {
  const handleConfirm = () => {
    onConfirm(scannedCode);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className='fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4'>
      <div className='glass-effect rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[95vh] overflow-y-auto border border-white/30 shadow-2xl'>
        {/* Header */}
        <div className='relative bg-gradient-to-r from-blue-600/20 to-cyan-600/20 p-4 sm:p-6 lg:p-8 border-b border-white/20'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3 sm:space-x-4 lg:space-x-6'>
              <div className='w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-blue-500/30 rounded-full flex items-center justify-center shadow-lg border-2 border-blue-400/50'>
                <QrCode className='w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-300' />
              </div>
              <div>
                <h2 className='text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1 sm:mb-2'>
                  Confirmar Escaneo
                </h2>
                <p className='text-xs sm:text-sm lg:text-base text-blue-200 font-medium'>
                  Verificar código de barras
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className='p-2 sm:p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300 border border-white/20 hover:border-white/40'
            >
              <X className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6 lg:p-8'>
          {/* Scanned Code Display */}
          <div className='mb-6 sm:mb-8'>
            <label className='block text-sm sm:text-base font-semibold text-secondaryText mb-3 sm:mb-4'>
              Código de Barras Escaneado
            </label>
            <div className='glass-effect border border-white/30 rounded-2xl p-4 sm:p-6 text-center bg-white/5'>
              <div className='w-14 h-14 sm:w-16 sm:h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 glow border-2 border-blue-400/50'>
                <QrCode className='w-7 h-7 sm:w-8 sm:h-8 text-blue-300' />
              </div>
              <p className='text-xl sm:text-2xl lg:text-3xl font-mono text-white font-bold tracking-wider break-all bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent'>
                {scannedCode}
              </p>
            </div>
          </div>

          {/* Information Notice */}
          <div className='bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-400/50 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8'>
            <div className='flex items-start space-x-3 sm:space-x-4'>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
                <span className='text-yellow-300 text-sm sm:text-lg'>ℹ️</span>
              </div>
              <div>
                <h4 className='text-sm sm:text-base lg:text-lg font-bold text-yellow-300 mb-2 sm:mb-3'>
                  Información Importante
                </h4>
                <p className='text-xs sm:text-sm lg:text-base text-gray-300 leading-relaxed'>
                  Verifica que el código de barras escaneado sea correcto antes de confirmar. 
                  Una vez confirmado, el código se agregará a tu inventario actual.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 border-t border-white/20 bg-white/5'>
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
            <button
              onClick={handleCancel}
              className='flex-1 btn-secondary py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base border border-white/30 hover:border-white/50 transition-all duration-300'
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className='flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-pill font-bold transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 glow text-sm sm:text-base'
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <Check className='w-4 h-4 sm:w-5 sm:h-5' />
              <span>Confirmar Escaneo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
