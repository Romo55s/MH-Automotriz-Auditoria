import { AlertTriangle, Plus, X } from 'lucide-react';
import React from 'react';

interface NewInventoryConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  agencyName: string;
}

const NewInventoryConfirmationModal: React.FC<NewInventoryConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  agencyName,
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='glass-effect rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-white/20'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-white/20'>
          <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading text-shadow flex items-center'>
            <AlertTriangle className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-yellow-400' />
            Nuevo Inventario
          </h2>
          <button
            onClick={onCancel}
            className='p-2 sm:p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300'
          >
            <X className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
          </button>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6 lg:p-8'>
          {/* Warning Message */}
          <div className='mb-6 sm:mb-8'>
            <div className='bg-yellow-900/20 border border-yellow-500/50 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6'>
              <div className='flex items-center mb-3 sm:mb-4'>
                <AlertTriangle className='w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mr-2 sm:mr-3' />
                <h3 className='text-base sm:text-lg font-semibold text-yellow-400'>
                  ¿Estás seguro?
                </h3>
              </div>
              <p className='text-sm sm:text-base text-secondaryText'>
                Estás a punto de iniciar un nuevo inventario para <strong>{agencyName}</strong>. 
                Esto creará una nueva sesión de inventario y no afectará los inventarios anteriores.
              </p>
            </div>

            {/* Information */}
            <div className='glass-effect border border-white/20 rounded-2xl p-4 sm:p-6'>
              <h4 className='text-sm sm:text-base font-semibold text-white mb-3 sm:mb-4'>
                Información del Nuevo Inventario:
              </h4>
              <ul className='text-xs sm:text-sm text-secondaryText space-y-2'>
                <li className='flex items-center'>
                  <span className='w-2 h-2 bg-blue-400 rounded-full mr-2 sm:mr-3'></span>
                  Agencia: {agencyName}
                </li>
                <li className='flex items-center'>
                  <span className='w-2 h-2 bg-blue-400 rounded-full mr-2 sm:mr-3'></span>
                  Período: Mes actual
                </li>
                <li className='flex items-center'>
                  <span className='w-2 h-2 bg-blue-400 rounded-full mr-2 sm:mr-3'></span>
                  Estado: Nueva sesión
                </li>
                <li className='flex items-center'>
                  <span className='w-2 h-2 bg-blue-400 rounded-full mr-2 sm:mr-3'></span>
                  Códigos escaneados: 0
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-white/20 glass-effect'>
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
            <button
              onClick={onCancel}
              className='flex-1 btn-secondary py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base'
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className='flex-1 btn-primary py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-center space-x-2 sm:space-x-3 glow text-sm sm:text-base'
            >
              <Plus className='w-4 h-4 sm:w-5 sm:h-5' />
              <span>Iniciar Nuevo Inventario</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInventoryConfirmationModal;
