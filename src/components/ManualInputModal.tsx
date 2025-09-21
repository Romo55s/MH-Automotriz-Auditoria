import { AlertCircle, X } from 'lucide-react';
import React, { useState } from 'react';

interface ManualInputModalProps {
  onConfirm: (code: string, carData?: { serie: string; marca: string; color: string; ubicaciones: string }) => void;
  onCancel: () => void;
}

const ManualInputModal: React.FC<ManualInputModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [marca, setMarca] = useState('');
  const [color, setColor] = useState('');
  const [ubicaciones, setUbicaciones] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation for all fields
    if (!manualCode.trim()) {
      setError('Por favor ingresa el código de serie');
      return;
    }
    if (!marca.trim()) {
      setError('Por favor ingresa la marca del vehículo');
      return;
    }
    if (!color.trim()) {
      setError('Por favor ingresa el color del vehículo');
      return;
    }
    if (!ubicaciones.trim()) {
      setError('Por favor ingresa la ubicación del vehículo');
      return;
    }

    // Validate 17 alphanumeric format (VIN format)
    const codePattern = /^[A-Z0-9]{17}$/i;
    if (!codePattern.test(manualCode.trim())) {
      setError('El código de serie debe tener exactamente 17 caracteres alfanuméricos (ej., 1HGCM82633A123456)');
      return;
    }

    // Clear any previous errors
    setError('');

    // Create car data object
    const carData = {
      serie: manualCode.trim(),
      marca: marca.trim(),
      color: color.trim(),
      ubicaciones: ubicaciones.trim()
    };


    // Create QR-like JSON string for processing
    const qrData = JSON.stringify({
      ...carData,
      location: 'Manual Input',
      timestamp: new Date().toISOString(),
      type: 'car_inventory'
    });

    // Call with QR data format
    onConfirm(qrData, carData);
  };

  const handleCancel = () => {
    setManualCode('');
    setMarca('');
    setColor('');
    setUbicaciones('');
    setError('');
    onCancel();
  };

  return (
    <div className='fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4'>
      <div className='glass-effect rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-y-auto border border-white/30 shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-white/20'>
          <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading text-shadow'>
            Entrada Manual
          </h2>
          <button
            onClick={handleCancel}
            className='p-2 sm:p-3 glass-effect rounded-xl transition-all duration-300'
          >
            <X className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
          </button>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6 lg:p-8'>
          {/* Info Section */}
          <div className='mb-6 sm:mb-8'>
            <div className='flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4'>
              <AlertCircle className='w-5 h-5 sm:w-6 sm:h-6 text-yellow-400' />
              <span className='text-sm sm:text-base font-semibold text-yellow-400'>
                Modo de Entrada Manual
              </span>
            </div>
            <p className='text-sm sm:text-base text-secondaryText'>
              Usa esta opción cuando el escáner de códigos QR no funciona o el
              código QR está dañado. Ingresa toda la información del vehículo manualmente.
            </p>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-6'>
            {/* Serie Field */}
            <div>
              <label className='block text-sm font-semibold text-secondaryText mb-2'>
                Código de Serie (17 Caracteres Alfanuméricos)
              </label>
              <div className='glass-effect border border-white/20 rounded-xl p-3'>
                <input
                  type='text'
                  value={manualCode}
                  onChange={e => {
                    setManualCode(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  placeholder='1HGCM82633A123456'
                  className='w-full bg-transparent border-none outline-none text-white placeholder-secondaryText text-sm font-mono'
                  maxLength={17}
                  autoFocus
                />
              </div>
              <div className='text-xs text-secondaryText mt-1'>
                {manualCode.length}/17 caracteres
              </div>
            </div>

            {/* Marca Field */}
            <div>
              <label className='block text-sm font-semibold text-secondaryText mb-2'>
                Marca del Vehículo
              </label>
              <div className='glass-effect border border-white/20 rounded-xl p-3'>
                <input
                  type='text'
                  value={marca}
                  onChange={e => {
                    setMarca(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder='Toyota, Honda, Volkswagen...'
                  className='w-full bg-transparent border-none outline-none text-white placeholder-secondaryText text-sm'
                />
              </div>
            </div>

            {/* Color Field */}
            <div>
              <label className='block text-sm font-semibold text-secondaryText mb-2'>
                Color del Vehículo
              </label>
              <div className='glass-effect border border-white/20 rounded-xl p-3'>
                <input
                  type='text'
                  value={color}
                  onChange={e => {
                    setColor(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder='Blanco, Azul, Rojo...'
                  className='w-full bg-transparent border-none outline-none text-white placeholder-secondaryText text-sm'
                />
              </div>
            </div>

            {/* Ubicaciones Field */}
            <div>
              <label className='block text-sm font-semibold text-secondaryText mb-2'>
                Ubicación del Vehículo
              </label>
              <div className='glass-effect border border-white/20 rounded-xl p-3'>
                <input
                  type='text'
                  value={ubicaciones}
                  onChange={e => {
                    setUbicaciones(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder='Lote A-1, Área B-2...'
                  className='w-full bg-transparent border-none outline-none text-white placeholder-secondaryText text-sm'
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className='flex items-center space-x-2 text-red-400 p-3 glass-effect border border-red-500/30 rounded-xl bg-red-500/10'>
                <AlertCircle className='w-4 h-4' />
                <span className='text-sm'>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4'>
              <button
                type='button'
                onClick={handleCancel}
                className='flex-1 btn-secondary py-3 sm:py-4 px-4 sm:px-6 text-center text-sm sm:text-base'
              >
                Cancelar
              </button>
              <button
                type='submit'
                className='flex-1 btn-primary py-3 sm:py-4 px-4 sm:px-6 text-center text-sm sm:text-base'
              >
                Confirmar Código
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManualInputModal;
