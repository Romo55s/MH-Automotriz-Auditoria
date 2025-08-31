import { Check, QrCode, X } from 'lucide-react';
import React from 'react';

interface ConfirmationModalProps {
  scannedCode: string;
  onConfirm: (code: string) => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  scannedCode,
  onConfirm,
  onCancel,
}) => {
  const handleConfirm = () => {
    onConfirm(scannedCode);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='glass-effect rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-white/20'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-white/20'>
          <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading text-shadow'>
            Confirm Scan
          </h2>
          <button
            onClick={handleCancel}
            className='p-2 sm:p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300'
          >
            <X className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
          </button>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-6 lg:p-8'>
          {/* Scanned Code Display */}
          <div className='mb-6 sm:mb-8'>
            <label className='block text-sm sm:text-base font-semibold text-secondaryText mb-3 sm:mb-4'>
              Scanned Barcode
            </label>
            <div className='glass-effect border border-white/20 rounded-2xl p-4 sm:p-6 text-center'>
              <div className='w-14 h-14 sm:w-16 sm:h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 glow'>
                <QrCode className='w-7 h-7 sm:w-8 sm:h-8 text-white' />
              </div>
              <p className='text-xl sm:text-2xl lg:text-3xl font-mono text-white font-bold tracking-wider break-all'>
                {scannedCode}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-white/20 glass-effect'>
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
            <button
              onClick={handleCancel}
              className='flex-1 btn-secondary py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base'
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className='flex-1 btn-primary py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-center space-x-2 sm:space-x-3 glow text-sm sm:text-base'
            >
              <Check className='w-4 h-4 sm:w-5 sm:h-5' />
              <span>Confirm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
