import { AlertTriangle, Trash2, X } from 'lucide-react';
import React from 'react';

interface BulkDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  selectedBarcodes: string[];
  isLoading?: boolean;
}

const BulkDeleteConfirmationModal: React.FC<BulkDeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  selectedBarcodes,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-black border border-gray-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-800'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-white/10 rounded-full flex items-center justify-center'>
              <Trash2 className='w-5 h-5 text-white' />
            </div>
            <h3 className='text-lg font-bold text-white uppercase tracking-wider'>
              Eliminar Códigos Seleccionados
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          <div className='flex items-start gap-4 mb-6'>
            <div className='w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
              <AlertTriangle className='w-4 h-4 text-white' />
            </div>
            <div>
              <p className='text-white mb-2'>
                ¿Estás seguro de que quieres eliminar{' '}
                <span className='font-bold text-white'>{selectedCount}</span>{' '}
                código{selectedCount > 1 ? 's' : ''} escaneado{selectedCount > 1 ? 's' : ''}?
              </p>
              <p className='text-sm text-gray-400'>
                Esta acción no se puede deshacer. Los códigos serán eliminados permanentemente del inventario.
              </p>
            </div>
          </div>

                     {/* Codes to Delete List */}
           <div className='mb-6'>
             <h4 className='text-sm font-semibold text-white mb-3 uppercase tracking-wider'>
               Códigos a Eliminar:
             </h4>
             <div className='bg-black border border-gray-800 rounded-lg p-4 max-h-40 overflow-y-auto'>
               <div className='grid grid-cols-2 gap-2'>
                 {selectedBarcodes.map((barcode, index) => (
                   <div
                     key={index}
                     className='bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono text-white'
                   >
                     {barcode}
                   </div>
                 ))}
               </div>
             </div>
           </div>

           {/* Warning Box */}
           <div className='bg-white/5 border border-gray-800 rounded-lg p-4 mb-6'>
             <div className='flex items-start gap-3'>
               <AlertTriangle className='w-5 h-5 text-white flex-shrink-0 mt-0.5' />
               <div>
                 <h4 className='text-sm font-semibold text-white mb-1 uppercase tracking-wider'>
                   Advertencia
                 </h4>
                 <p className='text-xs text-gray-400 leading-relaxed'>
                   Esta acción eliminará los códigos tanto del sistema como de la hoja de cálculo de Google Sheets.
                   Asegúrate de que realmente quieres eliminar estos elementos.
                 </p>
               </div>
             </div>
           </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end gap-3 p-6 border-t border-gray-800'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className='px-6 py-2 bg-white text-black border border-white rounded-full hover:bg-transparent hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold'
          >
            {isLoading ? (
              <>
                <div className='w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin'></div>
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className='w-4 h-4' />
                <span>Eliminar {selectedCount} Código{selectedCount > 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteConfirmationModal;
