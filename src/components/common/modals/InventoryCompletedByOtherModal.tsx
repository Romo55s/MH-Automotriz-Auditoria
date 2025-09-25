import { AlertTriangle, CheckCircle, User } from 'lucide-react';
import React from 'react';

interface InventoryCompletedByOtherModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedBy: string;
  agencyName: string;
  monthName: string;
  year: number;
  onEndSession: () => void;
}

const InventoryCompletedByOtherModal: React.FC<InventoryCompletedByOtherModalProps> = ({
  isOpen,
  onClose,
  completedBy,
  agencyName,
  monthName,
  year,
  onEndSession
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4'>
      <div 
        className='max-w-md w-full p-6 rounded-2xl border'
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #ef4444',
          boxShadow: '0px 4px 20px rgba(239, 68, 68, 0.3)'
        }}
      >
        <div className='text-center mb-6'>
          <div 
            className='w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4'
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.1) 100%)',
              border: '2px solid #ef4444'
            }}
          >
            <CheckCircle className='w-10 h-10 text-red-400' />
          </div>
          
           <h3 className='text-xl font-bold text-white mb-2 uppercase tracking-wide'>
             Notificación de Inventario
           </h3>
          
          <div className='space-y-3 text-sm text-gray-300'>
            <div className='flex items-center justify-center space-x-2'>
              <User className='w-4 h-4 text-red-400' />
              <span>Completado por: <span className='font-semibold text-white'>{completedBy}</span></span>
            </div>
            
            <div className='flex items-center justify-center space-x-2'>
              <AlertTriangle className='w-4 h-4 text-yellow-400' />
              <span>Agencia: <span className='font-semibold text-white'>{agencyName}</span></span>
            </div>
            
            <div className='flex items-center justify-center space-x-2'>
              <CheckCircle className='w-4 h-4 text-green-400' />
              <span>Período: <span className='font-semibold text-white'>{monthName} {year}</span></span>
            </div>
          </div>
        </div>

        <div className='mb-6 p-4 rounded-xl border border-red-500/30' style={{ background: 'rgba(239,68,68,0.1)' }}>
          <div className='flex items-start space-x-3'>
            <AlertTriangle className='w-5 h-5 text-red-400 mt-0.5 flex-shrink-0' />
            <div>
               <h4 className='text-sm font-semibold text-yellow-400 mb-2'>
                 Inventario Completado por Otro Usuario
               </h4>
               <p className='text-xs text-gray-300 leading-relaxed'>
                 El inventario para {monthName} {year} en {agencyName} ha sido completado por <strong>{completedBy}</strong>. 
                 Puedes continuar trabajando en tu sesión actual o finalizarla si lo deseas.
               </p>
            </div>
          </div>
        </div>

        <div className='space-y-3'>
           <button
             onClick={onEndSession}
             className='w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105'
             style={{
               background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
               color: 'white',
               boxShadow: '0px 4px 15px rgba(239, 68, 68, 0.3)'
             }}
           >
             Finalizar Mi Sesión
           </button>
          
          <button
            onClick={onClose}
            className='w-full py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105'
            style={{
              background: 'transparent',
              border: '1px solid #6b7280',
              color: '#9ca3af'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryCompletedByOtherModal;
