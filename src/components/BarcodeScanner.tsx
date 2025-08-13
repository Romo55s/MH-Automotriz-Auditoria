import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Camera, X, RotateCcw, ScanLine } from 'lucide-react';

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
      setError('Failed to initialize scanner. Please check camera permissions.');
      console.error('Scanner initialization error:', err);
    }
  };

  const startScanning = async (deviceId: string) => {
    if (!videoRef.current || !readerRef.current) return;

    try {
      setIsScanning(true);
      setError('');

      await readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result: Result | null, err: any) => {
          if (result) {
            onScan(result.getText());
            stopScanning();
          }
          if (err && err.name !== 'NotFoundException') {
            console.error('Scanning error:', err);
          }
        }
      );
    } catch (err) {
      setError('Failed to start scanning. Please try again.');
      console.error('Scanning start error:', err);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-effect rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 glass-effect rounded-full flex items-center justify-center glow">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-subheading font-bold uppercase tracking-hero leading-heading text-shadow">
              Scan Barcode
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Camera Selection */}
        {devices.length > 1 && (
          <div className="px-8 py-6 border-b border-white/20">
            <label className="block text-body font-semibold text-secondaryText mb-3">
              Camera Device
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full px-4 py-3 glass-effect border border-white/20 rounded-xl focus:outline-none focus:border-white/40 text-white bg-transparent"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId} className="bg-background text-white">
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video Container */}
        <div className="p-8">
          <div className="relative glass-effect rounded-2xl overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-80 object-cover"
              playsInline
              muted
            />
            
            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white rounded-2xl p-3 glow">
                  <div className="w-56 h-40 border-2 border-white rounded-xl relative">
                    <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-white"></div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-white"></div>
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-white"></div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-white"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <ScanLine className="w-5 h-5 text-secondaryText" />
              <p className="text-body text-secondaryText">
                Position the barcode within the frame to scan
              </p>
            </div>
            {isScanning && (
              <p className="text-body text-white font-semibold animate-pulse">
                Scanning... Please wait
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 glass-effect border border-red-500/30 rounded-2xl">
              <p className="text-body text-red-300 mb-3">{error}</p>
              <button
                onClick={retryScanning}
                className="flex items-center space-x-2 text-body text-red-300 hover:text-red-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/20 glass-effect">
          <div className="flex space-x-4">
            <button
              onClick={retryScanning}
              className="flex-1 btn-secondary py-4 px-6"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="flex-1 btn-primary py-4 px-6"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 