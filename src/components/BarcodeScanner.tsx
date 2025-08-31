import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Camera, RotateCcw, ScanLine, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    initializeScanner();
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  const initializeScanner = async () => {
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Get available video devices
      const videoDevices = await reader.listVideoInputDevices();
      setDevices(videoDevices);

      if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
        startScanning(videoDevices[0].deviceId);
      }
    } catch (err) {
      setError(
        'Failed to initialize scanner. Please check camera permissions.'
      );
      // console.error('Scanner initialization error:', err); // Removed console.error
    }
  };

  const startScanning = async (deviceId: string) => {
    if (!videoRef.current || !readerRef.current) return;

    try {
      setIsScanning(true);
      setError('');

      // Ensure video element has proper dimensions
      if (videoRef.current) {
        videoRef.current.style.width = '640px';
        videoRef.current.style.height = '480px';
        videoRef.current.width = 640;
        videoRef.current.height = 480;
      }

      // First, get the video stream manually to ensure it's working
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Wait for video to be ready before starting scanner
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('Video element not found'));
          return;
        }

        const video = videoRef.current;

        const onCanPlay = () => {
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          resolve();
        };

        const onError = (e: Event) => {
          const target = e.target as HTMLVideoElement;
          const error = target.error;
          const errorMsg = error
            ? `Video error: ${error.code} - ${error.message}`
            : 'Unknown video error';
          reject(new Error(errorMsg));
        };

        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('error', onError);

        // Set a timeout in case the video never loads
        setTimeout(() => {
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          reject(
            new Error('Video loading timeout - camera may not be accessible')
          );
        }, 15000); // Increased timeout to 15 seconds
      });

      await readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result: Result | null, err: any) => {
          if (result) {
            const scannedCode = result.getText();

            // Validate that the scanned code is exactly 8 digits
            const codePattern = /^\d{8}$/;
            if (codePattern.test(scannedCode)) {
              onScan(scannedCode);
              stopScanning();
            } else {
              // Show error for invalid code format
              setError(
                `Invalid code format: "${scannedCode}". Expected 8-digit number (e.g., 12345678). Please scan a valid barcode or use manual input.`
              );
              // Don't stop scanning, let user try again
            }
          }
          if (err && err.name !== 'NotFoundException') {
            // setDebugInfo(`Scan error: ${err.message || err.name}`); // Removed debugInfo
          }
          // Remove the frequent "Looking for barcode" messages to reduce spam
        }
      );

      // setDebugInfo('Scanner started successfully - Ready to scan!'); // Removed debugInfo
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      // Provide more helpful error messages
      let userFriendlyError = 'Failed to start scanning. ';
      if (errorMsg.includes('timeout')) {
        userFriendlyError +=
          'Camera is not responding. Please check camera permissions and try again.';
      } else if (errorMsg.includes('NotAllowedError')) {
        userFriendlyError +=
          'Camera access denied. Please allow camera permissions.';
      } else if (errorMsg.includes('NotFoundError')) {
        userFriendlyError +=
          'Camera not found. Please check your camera connection.';
      } else {
        userFriendlyError += errorMsg;
      }

      setError(userFriendlyError);
      // setDebugInfo(`Start error: ${errorMsg}`); // Removed debugInfo
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
    // setDebugInfo('Scanner stopped'); // Removed debugInfo
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    stopScanning();
    startScanning(deviceId);
  };

  const retryScanning = () => {
    if (selectedDevice) {
      startScanning(selectedDevice);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='glass-effect rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/20'>
        {/* Header */}
        <div className='flex items-center justify-between p-8 border-b border-white/20'>
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 glass-effect rounded-full flex items-center justify-center glow'>
              <Camera className='w-6 h-6 text-white' />
            </div>
            <h2 className='text-subheading font-bold uppercase tracking-hero leading-heading text-shadow'>
              Scan Barcode
            </h2>
          </div>
          <button
            onClick={onClose}
            className='p-3 glass-effect rounded-xl transition-all duration-300'
          >
            <X className='w-6 h-6 text-white' />
          </button>
        </div>

        {/* Camera Selection */}
        {devices.length > 1 && (
          <div className='px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-white/20'>
            <label className='block text-sm sm:text-base font-semibold text-secondaryText mb-2 sm:mb-3'>
              Camera Device
            </label>
            <select
              value={selectedDevice}
              onChange={e => handleDeviceChange(e.target.value)}
              className='w-full px-3 sm:px-4 py-2 sm:py-3 glass-effect border border-white/20 rounded-xl focus:outline-none focus:border-white/40 text-white bg-transparent text-sm sm:text-base'
            >
              {devices.map(device => (
                <option
                  key={device.deviceId}
                  value={device.deviceId}
                  className='bg-background text-white'
                >
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video Container */}
        <div className='p-4 sm:p-6 lg:p-8'>
          <div className='relative glass-effect rounded-2xl overflow-hidden'>
            <video
              ref={videoRef}
              className='w-full h-48 sm:h-64 lg:h-80 object-cover'
              style={{ 
                width: '100%', 
                height: 'auto',
                maxWidth: '640px',
                maxHeight: '480px'
              }}
              width={640}
              height={480}
              playsInline
              muted
              autoPlay={false}
            />

            {/* Scanning Overlay */}
            {isScanning && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='border-2 border-white rounded-2xl p-2 sm:p-3 glow'>
                  <div className='w-40 h-32 sm:w-56 sm:h-40 border-2 border-white rounded-xl relative'>
                    <div className='absolute -top-2 -left-2 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-t-2 border-white'></div>
                    <div className='absolute -top-2 -right-2 w-4 h-4 sm:w-6 sm:h-6 border-r-2 border-t-2 border-white'></div>
                    <div className='absolute -bottom-2 -left-2 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-b-2 border-white'></div>
                    <div className='absolute -bottom-2 -right-2 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-b-2 border-white'></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className='mt-4 sm:mt-6 text-center'>
            <div className='flex items-center justify-center space-x-2 mb-2 sm:mb-3'>
              <ScanLine className='w-4 h-4 sm:w-5 sm:h-5 text-secondaryText' />
              <p className='text-sm sm:text-base text-secondaryText'>
                Position the barcode within the frame to scan
              </p>
            </div>
            <div className='mb-3 p-3 glass-effect border border-white/20 rounded-xl'>
              <p className='text-xs sm:text-sm text-secondaryText'>
                <strong>Expected Format:</strong> 8-digit numeric code (e.g.,
                12345678)
              </p>
              <p className='text-xs text-secondaryText mt-1'>
                QR codes and alphanumeric codes are not supported
              </p>
            </div>
            {isScanning && (
              <p className='text-sm sm:text-base text-white font-semibold animate-pulse'>
                Scanning... Please wait
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className='mt-4 sm:mt-6 p-3 sm:p-4 glass-effect border border-red-500/30 rounded-2xl'>
              <p className='text-sm sm:text-base text-red-300 mb-3'>{error}</p>
              <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
                <button
                  onClick={() => setError('')}
                  className='flex items-center justify-center space-x-2 text-sm sm:text-base text-red-300 hover:text-red-200 transition-colors'
                >
                  <X className='w-4 h-4' />
                  <span>Clear Error</span>
                </button>
                <button
                  onClick={retryScanning}
                  className='flex items-center justify-center space-x-2 text-sm sm:text-base text-red-300 hover:text-red-200 transition-colors'
                >
                  <RotateCcw className='w-4 h-4' />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-white/20 glass-effect'>
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
            <button
              onClick={retryScanning}
              className='flex-1 btn-secondary py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base'
            >
              Retry
            </button>
            <button onClick={onClose} className='flex-1 btn-primary py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base'>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
