import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Camera, Flashlight, FlashlightOff, Monitor, RotateCcw, ScanLine, Smartphone, X } from 'lucide-react';
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
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeScanner();
    detectOrientation();
    
    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(detectOrientation, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  const detectOrientation = () => {
    const isPortrait = window.innerHeight > window.innerWidth;
    setOrientation(isPortrait ? 'portrait' : 'landscape');
  };

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
        'Falló al inicializar el escáner. Por favor verifica los permisos de la cámara.'
      );
      // console.error('Scanner initialization error:', err); // Removed console.error
    }
  };

  const startScanning = async (deviceId: string) => {
    if (!videoRef.current || !readerRef.current) return;

    try {
      setIsScanning(true);
      setError('');

      // Get optimal video constraints based on orientation
      const constraints = getVideoConstraints();
      
      // First, get the video stream manually to ensure it's working
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          ...constraints
        },
      });

      // Store stream reference for flash control
      streamRef.current = stream;

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
            new Error('Tiempo de espera agotado para el video - la cámara puede no ser accesible')
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
                `Formato de código inválido: "${scannedCode}". Se esperaba un número de 8 dígitos (ej., 12345678). Por favor escanea un código de barras válido o usa entrada manual.`
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
      let userFriendlyError = 'Falló al iniciar el escaneo. ';
      if (errorMsg.includes('timeout')) {
        userFriendlyError +=
          'La cámara no responde. Por favor verifica los permisos de la cámara e intenta de nuevo.';
      } else if (errorMsg.includes('NotAllowedError')) {
        userFriendlyError +=
          'Acceso a la cámara denegado. Por favor permite los permisos de la cámara.';
      } else if (errorMsg.includes('NotFoundError')) {
        userFriendlyError +=
          'Cámara no encontrada. Por favor verifica la conexión de tu cámara.';
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
    setIsFlashOn(false);
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    stopScanning();
    startScanning(deviceId);
  };

  const getVideoConstraints = () => {
    if (orientation === 'portrait') {
      return {
        width: { ideal: 480, max: 640 },
        height: { ideal: 640, max: 800 },
        facingMode: 'environment' // Use back camera on mobile
      };
    } else {
      return {
        width: { ideal: 640, max: 800 },
        height: { ideal: 480, max: 600 },
        facingMode: 'environment'
      };
    }
  };

  const retryScanning = () => {
    if (selectedDevice) {
      startScanning(selectedDevice);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;

      const capabilities = videoTrack.getCapabilities() as any;
      if (!capabilities.torch) {
        setError('Flash no disponible en este dispositivo');
        return;
      }

      const newFlashState = !isFlashOn;
      await videoTrack.applyConstraints({
        advanced: [{ torch: newFlashState }] as any
      });
      
      setIsFlashOn(newFlashState);
    } catch (err) {
      setError('Error al controlar el flash');
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div className={`glass-effect rounded-3xl w-full overflow-hidden border border-white/30 shadow-2xl ${
        isFullscreen 
          ? 'max-w-none max-h-none h-full rounded-none' 
          : 'max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh]'
      }`}>
        {/* Header */}
        <div className={`relative bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/30 ${
          isFullscreen ? 'p-4' : 'p-4 sm:p-6'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className={`glass-effect rounded-full flex items-center justify-center glow border-2 border-white/20 flex-shrink-0 ${
                isFullscreen ? 'w-10 h-10' : 'w-10 h-10 sm:w-12 sm:h-12'
              }`}>
                <Camera className={`text-white ${isFullscreen ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className={`font-bold uppercase tracking-hero leading-heading text-shadow truncate ${
                  isFullscreen ? 'text-lg' : 'text-lg sm:text-xl'
                }`}>
                  Escanear Código de Barras
                </h2>
                <p className={`text-white/70 truncate ${isFullscreen ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                  {isScanning ? 'Escaneando...' : 'Listo para escanear'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Flash Toggle */}
              <button
                onClick={toggleFlash}
                className={`glass-effect rounded-xl transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 ${
                  isFlashOn ? 'bg-yellow-500/20 border-yellow-400/50' : ''
                } ${isFullscreen ? 'p-2' : 'p-2 sm:p-3'}`}
                title={isFlashOn ? 'Apagar flash' : 'Encender flash'}
              >
                {isFlashOn ? (
                  <Flashlight className={`text-yellow-300 ${isFullscreen ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
                ) : (
                  <FlashlightOff className={`text-white ${isFullscreen ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
                )}
              </button>
              {/* Orientation Toggle */}
              <button
                onClick={toggleFullscreen}
                className={`glass-effect rounded-xl transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 ${
                  isFullscreen ? 'p-2' : 'p-2 sm:p-3'
                }`}
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? (
                  <Monitor className={`text-white ${isFullscreen ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
                ) : (
                  <Smartphone className={`text-white ${isFullscreen ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
                )}
              </button>
              <button
                onClick={onClose}
                className={`glass-effect rounded-xl transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 ${
                  isFullscreen ? 'p-2' : 'p-2 sm:p-3'
                }`}
              >
                <X className={`text-white ${isFullscreen ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className={`overflow-y-auto ${isFullscreen ? 'h-[calc(100vh-100px)]' : 'max-h-[calc(95vh-150px)] sm:max-h-[calc(90vh-200px)]'}`}>
          {/* Camera Selection */}
          {devices.length > 1 && (
            <div className={`border-b border-white/20 ${
              isFullscreen ? 'px-4 py-3' : 'px-4 sm:px-6 py-4 sm:py-5'
            }`}>
              <label className={`block font-semibold text-white mb-3 ${
                isFullscreen ? 'text-sm' : 'text-sm sm:text-base'
              }`}>
                📷 Dispositivo de Cámara
              </label>
              <div className="relative">
                <select
                  value={selectedDevice}
                  onChange={e => handleDeviceChange(e.target.value)}
                  className={`w-full glass-effect border border-white/30 rounded-xl focus:outline-none focus:border-white/50 text-white bg-transparent appearance-none cursor-pointer ${
                    isFullscreen 
                      ? 'px-4 py-3 text-sm' 
                      : 'px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base'
                  }`}
                >
                  {devices.map(device => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}
                      className="bg-black text-white"
                    >
                      {device.label || `Cámara ${device.deviceId.slice(0, 8)}...`}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Video Container */}
          <div className={`${isFullscreen ? 'p-4' : 'p-4 sm:p-6'}`}>
            <div className="relative glass-effect rounded-2xl overflow-hidden border border-white/20 shadow-lg flex items-center justify-center">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${
                  orientation === 'portrait' 
                    ? isFullscreen 
                      ? 'h-[50vh]' 
                      : 'h-48 sm:h-64 md:h-80'
                    : isFullscreen
                      ? 'h-[40vh]'
                      : 'h-40 sm:h-56 md:h-72'
                }`}
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
                playsInline
                muted
                autoPlay={false}
              />

              {/* Scanning Overlay - Perfectly Centered */}
              {isScanning && (
                <div className="absolute inset-0">
                  {/* Scanning frame - absolutely centered */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className={`border-2 border-white rounded-xl relative ${
                      orientation === 'portrait'
                        ? 'w-32 h-40 sm:w-40 sm:h-48 md:w-48 md:h-56'
                        : 'w-40 h-32 sm:w-56 sm:h-40 md:w-64 md:h-48'
                    }`}>
                      {/* Corner markers */}
                      <div className="absolute -top-2 -left-2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 border-l-2 border-t-2 border-white"></div>
                      <div className="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 border-r-2 border-t-2 border-white"></div>
                      <div className="absolute -bottom-2 -left-2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 border-l-2 border-b-2 border-white"></div>
                      <div className="absolute -bottom-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 border-r-2 border-b-2 border-white"></div>
                      
                      {/* Scanning line animation */}
                      <div className={`absolute bg-gradient-to-r from-transparent via-white/60 to-transparent animate-pulse ${
                        orientation === 'portrait'
                          ? 'w-32 h-0.5 sm:w-40 sm:h-1 md:w-48 md:h-1 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                          : 'w-40 h-0.5 sm:w-56 sm:h-1 md:w-64 md:h-1 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                      }`}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Video overlay info */}
              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-white text-xs font-medium">
                    {isScanning ? 'Escaneando' : 'Listo'}
                  </span>
                </div>
              </div>

              {/* Flash indicator */}
              {isFlashOn && (
                <div className="absolute top-3 right-3 bg-yellow-500/20 backdrop-blur-sm rounded-lg px-2 py-1 border border-yellow-400/50">
                  <div className="flex items-center space-x-2">
                    <Flashlight className="w-3 h-3 text-yellow-300" />
                    <span className="text-yellow-300 text-xs font-medium">
                      Flash ON
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className={`text-center ${isFullscreen ? 'mt-4' : 'mt-4 sm:mt-6'}`}>
              <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <ScanLine className={`text-white ${isFullscreen ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                </div>
                <p className={`text-white font-medium ${isFullscreen ? 'text-sm' : 'text-sm sm:text-base'}`}>
                  Posiciona el código de barras dentro del marco para escanear
                </p>
              </div>
              
              <div className={`glass-effect border border-white/30 rounded-xl bg-white/5 ${
                isFullscreen ? 'mb-4 p-4' : 'mb-4 p-4 sm:p-5'
              }`}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className={`text-white ${isFullscreen ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                      <strong>Formato Esperado:</strong> Código numérico de 8 dígitos (ej., 12345678)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <p className={`text-white/80 ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                      Los códigos QR y códigos alfanuméricos no son compatibles
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <p className={`text-white/80 ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                      <strong>Orientación:</strong> Funciona en vertical y horizontal
                    </p>
                  </div>
                </div>
              </div>
              
              {isScanning && (
                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-400/50 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className={`text-green-300 font-semibold ${
                      isFullscreen ? 'text-sm' : 'text-sm sm:text-base'
                    }`}>
                      Escaneando... Por favor espera
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className={`bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-400/50 rounded-2xl ${
                isFullscreen ? 'mt-4 p-4' : 'mt-4 sm:mt-6 p-4 sm:p-5'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <X className="w-4 h-4 text-red-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-300 font-semibold mb-2 text-base">
                      Error de Escaneo
                    </h4>
                    <p className={`text-red-200 mb-4 ${isFullscreen ? 'text-sm' : 'text-sm sm:text-base'}`}>
                      {error}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => setError('')}
                        className={`flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 rounded-lg px-4 py-2 text-red-200 hover:text-red-100 transition-all duration-300 ${
                          isFullscreen ? 'text-sm' : 'text-sm sm:text-base'
                        }`}
                      >
                        <X className="w-4 h-4" />
                        <span>Limpiar Error</span>
                      </button>
                      <button
                        onClick={retryScanning}
                        className={`flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 rounded-lg px-4 py-2 text-red-200 hover:text-red-100 transition-all duration-300 ${
                          isFullscreen ? 'text-sm' : 'text-sm sm:text-base'
                        }`}
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reintentar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t border-white/30 bg-white/5 ${
          isFullscreen ? 'px-4 py-4' : 'px-4 sm:px-6 py-4 sm:py-5'
        }`}>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={retryScanning}
              className={`flex-1 bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 text-white rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 ${
                isFullscreen 
                  ? 'py-3 px-4 text-sm' 
                  : 'py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
            <button 
              onClick={onClose} 
              className={`flex-1 bg-white text-black hover:bg-transparent hover:text-white border border-white rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 font-semibold ${
                isFullscreen 
                  ? 'py-3 px-4 text-sm' 
                  : 'py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base'
              }`}
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
