import { Check, X } from 'lucide-react';
import React from 'react';

interface SessionEndedModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyName: string;
  monthName: string;
  year: number;
}

const SessionEndedModal: React.FC<SessionEndedModalProps> = ({
  isOpen,
  onClose,
  agencyName,
  monthName,
  year
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="glass-effect rounded-2xl sm:rounded-3xl w-full max-w-sm sm:max-w-md border border-white/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-white/30 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/30 rounded-full flex items-center justify-center border-2 border-green-400/50 flex-shrink-0">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold uppercase tracking-hero text-white mb-1 leading-heading">
                  Sesión Finalizada
                </h2>
                <p className="text-green-200 text-xs sm:text-sm">
                  Sesión cerrada exitosamente
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 glass-effect rounded-xl hover:scale-105 transition-all duration-300 border border-white/20 hover:border-white/40 flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Success Message */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-400/30">
              <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              ¡Sesión Finalizada Correctamente!
            </h3>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Tu sesión de inventario para <strong className="text-green-300">{agencyName}</strong> en {monthName} {year} ha sido cerrada exitosamente.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/50 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-300 text-sm">ℹ️</span>
              </div>
              <div>
                <h4 className="text-blue-300 font-semibold mb-2 text-sm sm:text-base">¿Qué significa esto?</h4>
                <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                  No se escanearon códigos durante esta sesión. Esto puede ocurrir si:
                </p>
                <ul className="text-blue-100 text-xs sm:text-sm mt-2 space-y-1 ml-4">
                  <li>• Visitaste la ubicación incorrecta</li>
                  <li>• No había vehículos para inventariar</li>
                  <li>• Decidiste cancelar el inventario</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-400/50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-300 text-sm">💡</span>
              </div>
              <div>
                <h4 className="text-yellow-300 font-semibold mb-2 text-sm sm:text-base">Próximos Pasos</h4>
                <p className="text-yellow-100 text-xs sm:text-sm leading-relaxed">
                  Puedes iniciar una nueva sesión cuando estés listo para realizar un inventario. 
                  Asegúrate de estar en la ubicación correcta antes de comenzar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-white/20 bg-white/5">
          <button
            onClick={onClose}
            className="w-full text-black py-3 px-4 font-semibold transition-all duration-300 hover:scale-105 text-sm sm:text-base"
            style={{
              background: '#FFFFFF',
              borderRadius: '9999px',
              padding: '0.75rem 1.5rem',
              border: '1px solid #fff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = '#000000';
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionEndedModal;
