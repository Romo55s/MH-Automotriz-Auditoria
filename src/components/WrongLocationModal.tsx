import { AlertTriangle, ArrowRight, Building2, X } from 'lucide-react';
import React from 'react';

interface WrongLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  qrLocation: string;
  vehicleInfo: {
    serie: string;
    marca: string;
    color: string;
  };
}

const WrongLocationModal: React.FC<WrongLocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  qrLocation,
  vehicleInfo
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="glass-effect rounded-2xl sm:rounded-3xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl border border-white/30 shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-b border-white/30 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/30 rounded-full flex items-center justify-center border-2 border-yellow-400/50 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold uppercase tracking-hero text-white mb-1 leading-heading truncate">
                  Vehículo de Otra Ubicación
                </h2>
                <p className="text-yellow-200 text-xs sm:text-sm truncate">
                  Código QR detectado
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
          {/* Vehicle Info */}
          <div className="glass-effect border border-white/30 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 bg-white/5">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
              <span className="text-white font-semibold text-sm sm:text-base">Vehículo Escaneado:</span>
            </div>
            <div className="space-y-2 ml-6 sm:ml-8">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-white/70 text-xs sm:text-sm w-16 flex-shrink-0">Serie:</span> 
                <span className="font-mono font-bold text-yellow-300 text-sm sm:text-base break-all">{vehicleInfo.serie}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-white/70 text-xs sm:text-sm w-16 flex-shrink-0">Marca:</span> 
                <span className="font-medium text-white text-sm sm:text-base">{vehicleInfo.marca}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-white/70 text-xs sm:text-sm w-16 flex-shrink-0">Color:</span> 
                <span className="font-medium text-white text-sm sm:text-base">{vehicleInfo.color}</span>
              </div>
            </div>
          </div>

          {/* Location Mismatch Info */}
          <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-400/50 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-300 flex-shrink-0" />
              <span className="text-red-300 font-semibold text-sm sm:text-base">Ubicación Incorrecta</span>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-white/80 text-xs sm:text-sm">Estás en:</span>
                <span className="px-2 sm:px-3 py-1 bg-red-500/20 rounded-full text-red-300 font-medium text-xs sm:text-sm border border-red-400/30 text-center">
                  {currentLocation}
                </span>
              </div>
              <div className="flex items-center justify-center my-2">
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-white/50" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-white/80 text-xs sm:text-sm">Vehículo pertenece a:</span>
                <span className="px-2 sm:px-3 py-1 bg-green-500/20 rounded-full text-green-300 font-medium text-xs sm:text-sm border border-green-400/30 text-center">
                  {qrLocation}
                </span>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/50 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-300 text-xs sm:text-sm">💡</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-blue-300 font-semibold mb-2 text-sm sm:text-base">¿Qué debes hacer?</h4>
                <p className="text-blue-100 text-xs sm:text-sm leading-relaxed mb-3">
                  Para mantener registros precisos y <strong>no perder tu inventario actual</strong>, debes:
                </p>
                <ol className="text-blue-100 text-xs sm:text-sm leading-relaxed space-y-1 ml-4">
                  <li><strong>1.</strong> Terminar tu sesión actual en <strong>{currentLocation}</strong></li>
                  <li><strong>2.</strong> Ir manualmente a <strong>{qrLocation}</strong></li>
                  <li><strong>3.</strong> Iniciar una nueva sesión allí</li>
                  <li><strong>4.</strong> Escanear este vehículo correctamente</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-400/50 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-300 text-xs sm:text-sm">⚠️</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-yellow-300 font-semibold mb-2 text-sm sm:text-base">Importante</h4>
                <p className="text-yellow-100 text-xs sm:text-sm leading-relaxed">
                  No cambiaremos tu ubicación automáticamente para evitar que pierdas el progreso de tu inventario actual.
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

export default WrongLocationModal;
