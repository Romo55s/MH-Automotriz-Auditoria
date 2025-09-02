import { Camera, FileText, Plus } from 'lucide-react';
import React from 'react';

interface ScanControlsProps {
  onStartScanning: () => void;
  onManualInput: () => void;
  isSessionActive: boolean;
  canStartSession: boolean;
  onStartSession: () => void;
}

const ScanControls: React.FC<ScanControlsProps> = ({
  onStartScanning,
  onManualInput,
  isSessionActive,
  canStartSession,
  onStartSession,
}) => {
  if (!isSessionActive && !canStartSession) {
    return null;
  }

  return (
    <div className='card mb-6'>
      <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-6 sm:mb-8 text-center'>
        {isSessionActive ? 'Controles de Escaneo' : 'Listo para Comenzar'}
      </h2>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
        <button
          onClick={onStartScanning}
          className='btn-primary py-4 sm:py-6 px-6 sm:px-8 flex items-center justify-center space-x-3 sm:space-x-4 glow'
        >
          <Camera className='w-6 h-6 sm:w-8 sm:h-8' />
          <span className='text-sm sm:text-base font-semibold'>
            {isSessionActive ? 'Escanear Código' : 'Iniciar Escaneo'}
          </span>
        </button>

        <button
          onClick={onManualInput}
          className='btn-secondary py-4 sm:py-6 px-6 sm:px-8 flex items-center justify-center space-x-3 sm:space-x-4'
        >
          <FileText className='w-6 h-6 sm:w-8 sm:h-8' />
          <span className='text-sm sm:text-base font-semibold'>
            Entrada Manual
          </span>
        </button>
      </div>

      {!isSessionActive && canStartSession && (
        <div className='mt-6 text-center'>
          <button
            onClick={onStartSession}
            className='btn-primary py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3 mx-auto glow'
          >
            <Plus className='w-5 h-5 sm:w-6 sm:h-6' />
            <span className='text-sm sm:text-base font-semibold'>
              Iniciar Nueva Sesión
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ScanControls;
