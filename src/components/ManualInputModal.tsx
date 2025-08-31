import { AlertCircle, QrCode, X } from 'lucide-react';
import React, { useState } from 'react';

interface ManualInputModalProps {
  onConfirm: (code: string) => void;
  onCancel: () => void;
}

const ManualInputModal: React.FC<ManualInputModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!manualCode.trim()) {
      setError('Please enter a barcode/QR code');
      return;
    }

    // Validate 8-digit format
    const codePattern = /^\d{8}$/;
    if (!codePattern.test(manualCode.trim())) {
      setError('Code must be exactly 8 digits (e.g., 12345678)');
      return;
    }

    // Clear any previous errors
    setError('');

    // Call the same confirmation flow as scanning
    onConfirm(manualCode.trim());
  };

  const handleCancel = () => {
    setManualCode('');
    setError('');
    onCancel();
  };

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='glass-effect rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-white/20'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-white/20'>
          <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading text-shadow'>
            Manual Input
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
                Manual Input Mode
              </span>
            </div>
            <p className='text-sm sm:text-base text-secondaryText'>
              Use this option when the barcode scanner isn&apos;t working or the
              barcode is damaged. Enter the 8-digit code exactly as it appears
              on the vehicle or document.
            </p>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-6'>
            <div>
              <label className='block text-sm sm:text-base font-semibold text-secondaryText mb-3 sm:mb-4'>
                8-Digit Code
              </label>
              <div className='glass-effect border border-white/20 rounded-2xl p-4 sm:p-6'>
                <div className='flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4'>
                  <QrCode className='w-5 h-5 sm:w-6 sm:h-6 text-secondaryText' />
                  <input
                    type='text'
                    value={manualCode}
                    onChange={e => {
                      setManualCode(e.target.value);
                      if (error) setError(''); // Clear error when typing
                    }}
                    onKeyDown={e => {
                      if (
                        e.key === 'Enter' &&
                        /^\d{8}$/.test(manualCode.trim())
                      ) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder='Enter 8-digit code (e.g., 12345678)...'
                    className='flex-1 bg-transparent border-none outline-none text-white placeholder-secondaryText text-base sm:text-lg font-mono'
                    autoFocus
                    maxLength={8}
                  />
                </div>

                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm'>
                  <div className='text-secondaryText'>
                    {manualCode.length}/8 digits
                  </div>
                  {error && (
                    <div className='flex items-center space-x-2 text-red-400'>
                      <AlertCircle className='w-3 h-3 sm:w-4 sm:h-4' />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4'>
              <button
                type='button'
                onClick={handleCancel}
                className='flex-1 btn-secondary py-3 sm:py-4 px-4 sm:px-6 text-center text-sm sm:text-base'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='flex-1 btn-primary py-3 sm:py-4 px-4 sm:px-6 text-center text-sm sm:text-base'
              >
                Confirm Code
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManualInputModal;
