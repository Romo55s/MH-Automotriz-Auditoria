import { AlertTriangle, CheckCircle, Users } from 'lucide-react';
import React from 'react';

interface SessionTerminatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewInventory: () => void;
  agencyName: string;
  monthName: string;
  year: number;
  completedBy: string;
  isCurrentUser?: boolean; // Add flag to indicate if current user completed the inventory
}

const SessionTerminatedModal: React.FC<SessionTerminatedModalProps> = ({
  isOpen,
  onClose,
  onStartNewInventory,
  agencyName,
  monthName,
  year,
  completedBy,
  isCurrentUser = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
      <div className='bg-background border border-white/20 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='text-center mb-6 sm:mb-8'>
          <div className='w-16 h-16 sm:w-20 sm:h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6'>
            <AlertTriangle className='w-8 h-8 sm:w-10 sm:h-10 text-orange-400' />
          </div>
          <h2 className='text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3'>
            {isCurrentUser ? '¡Inventario Completado!' : 'Sesión Terminada'}
          </h2>
          <p className='text-sm sm:text-base text-secondaryText'>
            {isCurrentUser 
              ? 'Has completado exitosamente el inventario' 
              : 'Tu sesión de inventario ha sido terminada'
            }
          </p>
        </div>

        {/* Content */}
        <div className='space-y-4 sm:space-y-6 mb-6 sm:mb-8'>
          {/* Completion Info */}
          <div className='glass-effect rounded-xl p-4 sm:p-6 border border-green-500/20 bg-green-500/10'>
            <div className='flex items-start space-x-3 sm:space-x-4'>
              <CheckCircle className='w-6 h-6 sm:w-8 sm:h-8 text-green-400 mt-1 flex-shrink-0' />
              <div className='flex-1'>
                <h3 className='text-base sm:text-lg font-semibold text-green-400 mb-2 sm:mb-3'>
                  Inventario Completado
                </h3>
                <p className='text-sm sm:text-base text-secondaryText mb-3 sm:mb-4'>
                  {isCurrentUser ? (
                    <>
                      Has completado exitosamente el inventario para <strong className='text-white'>{agencyName}</strong> en{' '}
                      <strong className='text-white'>{monthName} {year}</strong>.
                    </>
                  ) : (
                    <>
                      El inventario para <strong className='text-white'>{agencyName}</strong> en{' '}
                      <strong className='text-white'>{monthName} {year}</strong> ha sido completado por{' '}
                      <strong className='text-white'>{completedBy}</strong>.
                    </>
                  )}
                </p>
                <p className='text-sm sm:text-base text-secondaryText'>
                  {isCurrentUser 
                    ? 'El inventario está oficialmente terminado y guardado en Google Sheets. No se pueden agregar más escaneos.'
                    : 'Esto significa que el inventario está oficialmente terminado y no se pueden agregar más escaneos.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Team Impact */}
          <div className='glass-effect rounded-xl p-4 sm:p-6 border border-orange-500/20 bg-orange-500/10'>
            <div className='flex items-start space-x-3 sm:space-x-4'>
              <Users className='w-6 h-6 sm:w-8 sm:h-8 text-orange-400 mt-1 flex-shrink-0' />
              <div className='flex-1'>
                <h3 className='text-base sm:text-lg font-semibold text-orange-400 mb-2 sm:mb-3'>
                  Impacto en el Equipo
                </h3>
                <p className='text-sm sm:text-base text-secondaryText mb-3 sm:mb-4'>
                  Al completar el inventario, todas las sesiones activas de otros miembros del equipo han sido terminadas automáticamente para evitar duplicados.
                </p>
                <div className='p-3 sm:p-4 bg-orange-500/20 rounded-lg border border-orange-500/30'>
                  <p className='text-xs sm:text-sm text-orange-300'>
                    <strong>Nota:</strong> Esto es necesario para mantener la integridad de los datos y asegurar que solo exista un inventario por mes por agencia.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className='glass-effect rounded-xl p-4 sm:p-6 border border-blue-500/20 bg-blue-500/10'>
            <h3 className='text-base sm:text-lg font-semibold text-blue-400 mb-2 sm:mb-3'>
              Próximos Pasos
            </h3>
            <ul className='text-sm sm:text-base text-secondaryText space-y-2'>
              <li className='flex items-start space-x-2'>
                <span className='text-blue-400 mt-1'>•</span>
                <span>Puedes ver los datos del inventario completado en la sección de inventarios mensuales</span>
              </li>
              <li className='flex items-start space-x-2'>
                <span className='text-blue-400 mt-1'>•</span>
                <span>Si necesitas hacer un nuevo inventario, puedes iniciar uno para el próximo mes</span>
              </li>
              <li className='flex items-start space-x-2'>
                <span className='text-blue-400 mt-1'>•</span>
                <span>Recuerda buscar manualmente los códigos de barras en REPUVE para obtener la información completa de los vehículos</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center'>
          <button
            onClick={onClose}
            className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
          >
            <span>Entendido</span>
          </button>
          <button
            onClick={onStartNewInventory}
            className='btn-primary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
          >
            <span>Ver Inventarios</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTerminatedModal;
