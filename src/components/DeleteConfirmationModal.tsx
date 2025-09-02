import { AlertTriangle, Trash2, X } from 'lucide-react';
import React from 'react';

interface DeleteConfirmationModalProps {
  scannedCode: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  scannedCode,
  onConfirm,
  onCancel,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='glass-effect rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-white/20'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-white/20'>
          <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading text-shadow flex items-center'>
            <AlertTriangle className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-red-400' />
            Eliminar Código
          </h2>
          <button
            onClick={handleCancel}
            className='p-2 sm:p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300'
          >
            <X className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
          </button>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6 lg:p-8'>
          {/* Warning Message */}
          <div className='mb-6 sm:mb-8'>
            <div className='bg-red-900/20 border border-red-500/50 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6'>
              <div className='flex items-center mb-3 sm:mb-4'>
                <AlertTriangle className='w-5 h-5 sm:w-6 sm:h-6 text-red-400 mr-2 sm:mr-3' />
                <h3 className='text-base sm:text-lg font-semibold text-red-400'>
                  ¿Estás seguro?
                </h3>
              </div>
              <p className='text-sm sm:text-base text-secondaryText'>
                Esta acción eliminará permanentemente el código de barras escaneado. 
                Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Code to Delete */}
            <div>
              <label className='block text-sm sm:text-base font-semibold text-secondaryText mb-3 sm:mb-4'>
                Código a Eliminar
              </label>
              <div className='glass-effect border border-white/20 rounded-2xl p-4 sm:p-6 text-center'>
                <p className='text-lg sm:text-xl lg:text-2xl font-mono text-white font-bold tracking-wider break-all'>
                  {scannedCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-white/20 glass-effect'>
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
            <button
              onClick={handleCancel}
              className='flex-1 btn-secondary py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base'
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className='flex-1 bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base'
            >
              <Trash2 className='w-4 h-4 sm:w-5 sm:h-5' />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
