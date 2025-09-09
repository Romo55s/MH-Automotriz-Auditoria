import { AlertTriangle, Clock, Database, Download } from 'lucide-react';
import React from 'react';

interface DownloadConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  inventoryData: {
    monthName: string;
    year: number;
    totalScans: number;
    createdBy: string;
  };
}

const DownloadConfirmationModal: React.FC<DownloadConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  inventoryData
}) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'>
      <div 
        className='max-w-md w-full p-6 rounded-2xl border'
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #333333',
          boxShadow: '0px 4px 20px rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className='text-center mb-6'>
          <div 
            className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              border: '1px solid #333333'
            }}
          >
            <Download className='w-8 h-8 text-white' />
          </div>
          <h3 className='text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wide'>
            Confirmar Descarga de Inventario
          </h3>
          <p className='text-sm text-gray-300'>
            Descargando: {inventoryData.monthName} {inventoryData.year} - {inventoryData.totalScans} códigos
          </p>
        </div>

        <div className='space-y-4 mb-6'>
          <div 
            className='p-4 rounded-xl border'
            style={{
              background: 'linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(255,193,7,0.05) 100%)',
              border: '1px solid rgba(255,193,7,0.3)'
            }}
          >
            <div className='flex items-start space-x-3'>
              <AlertTriangle className='w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0' />
              <div className='flex-1'>
                <h4 className='text-sm font-semibold text-yellow-400 mb-2 uppercase tracking-wide'>
                  ⚠️ Importante: Cambios en los Datos
                </h4>
                <p className='text-xs text-gray-300'>
                  Al descargar este inventario, los datos serán <strong className='text-white'>eliminados permanentemente</strong> de Google Sheets y almacenados localmente hasta el próximo mes.
                </p>
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            <div 
              className='flex items-center space-x-3 p-3 rounded-lg border'
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)',
                border: '1px solid rgba(59,130,246,0.3)'
              }}
            >
              <Database className='w-4 h-4 text-blue-400' />
              <div className='flex-1'>
                <p className='text-xs font-medium text-blue-300 uppercase tracking-wide'>Google Sheets</p>
                <p className='text-xs text-gray-300'>Los datos serán eliminados permanentemente</p>
              </div>
            </div>

            <div 
              className='flex items-center space-x-3 p-3 rounded-lg border'
              style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)',
                border: '1px solid rgba(34,197,94,0.3)'
              }}
            >
              <Download className='w-4 h-4 text-green-400' />
              <div className='flex-1'>
                <p className='text-xs font-medium text-green-300 uppercase tracking-wide'>Almacenamiento Local</p>
                <p className='text-xs text-gray-300'>Los datos se guardarán en tu dispositivo hasta el próximo mes</p>
              </div>
            </div>

            <div 
              className='flex items-center space-x-3 p-3 rounded-lg border'
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(249,115,22,0.05) 100%)',
                border: '1px solid rgba(249,115,22,0.3)'
              }}
            >
              <Clock className='w-4 h-4 text-orange-400' />
              <div className='flex-1'>
                <p className='text-xs font-medium text-orange-300 uppercase tracking-wide'>Expiración Automática</p>
                <p className='text-xs text-gray-300'>Los datos se eliminarán automáticamente al inicio del próximo mes</p>
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-3'>
          <button
            onClick={onClose}
            className='flex-1 text-sm py-3 px-6 flex items-center justify-center space-x-2 rounded-full font-semibold transition-all duration-300 hover:scale-105'
            style={{
              background: 'transparent',
              border: '1px solid #fff',
              color: '#fff',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#fff';
            }}
          >
            <span>Cancelar</span>
          </button>
          <button
            onClick={onConfirm}
            className='flex-1 text-sm py-3 px-6 flex items-center justify-center space-x-2 rounded-full font-semibold transition-all duration-300 hover:scale-105'
            style={{
              background: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
              border: '1px solid #fff',
              color: '#000',
              fontWeight: '600',
              boxShadow: '0px 4px 20px rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)';
              e.currentTarget.style.color = '#000';
            }}
          >
            <Download className='w-4 h-4' />
            <span>Confirmar Descarga</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadConfirmationModal;