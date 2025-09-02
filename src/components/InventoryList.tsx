import { Trash2 } from 'lucide-react';
import React from 'react';
import { ScannedCode } from '../types';

interface InventoryListProps {
  scannedCodes: ScannedCode[];
  onDeleteCode: (code: string, index: number) => void;
  formatTime: (timestamp: Date) => string;
}

const InventoryList: React.FC<InventoryListProps> = ({
  scannedCodes,
  onDeleteCode,
  formatTime,
}) => {
  if (scannedCodes.length === 0) {
    return null;
  }

  return (
    <div className='card mb-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3'>
        <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
          <span className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3'>📊</span>
          Códigos Escaneados ({scannedCodes.length})
        </h2>
        <div className='flex items-center space-x-2 sm:space-x-3'>
          <span className='text-xs sm:text-sm text-secondaryText'>
            Total de escaneos: {scannedCodes.length}
          </span>
        </div>
      </div>

      <div className='overflow-hidden'>
        {/* Desktop Grid View */}
        <div className='hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'>
          {scannedCodes.map((code, index) => (
            <div
              key={index}
              className='glass-effect rounded-xl p-3 sm:p-4 border border-white/20'
            >
              <div className='flex items-center justify-between mb-2'>
                <span className='text-xs sm:text-sm text-secondaryText'>
                  #{index + 1}
                </span>
                <div className='flex items-center space-x-2'>
                  <span className='text-xs text-secondaryText'>
                    {formatTime(code.timestamp)}
                  </span>
                  <button
                    onClick={() => onDeleteCode(code.code, index)}
                    className='p-1 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-300'
                    title='Eliminar código'
                  >
                    <Trash2 className='w-3 h-3 sm:w-4 sm:h-4' />
                  </button>
                </div>
              </div>
              <div className='font-mono text-sm sm:text-base text-white break-all'>
                {code.code}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile List View */}
        <div className='sm:hidden space-y-2'>
          {scannedCodes.map((code, index) => (
            <div
              key={index}
              className='glass-effect rounded-xl p-3 border border-white/20'
            >
              <div className='flex items-center justify-between mb-2'>
                <span className='text-xs text-secondaryText'>
                  #{index + 1}
                </span>
                <div className='flex items-center space-x-2'>
                  <span className='text-xs text-secondaryText'>
                    {formatTime(code.timestamp)}
                  </span>
                  <button
                    onClick={() => onDeleteCode(code.code, index)}
                    className='p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-300'
                    title='Eliminar código'
                  >
                    <Trash2 className='w-3 h-3' />
                  </button>
                </div>
              </div>
              <div className='font-mono text-sm text-white break-all'>
                {code.code}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryList;
