import Quagga from '@ericblade/quagga2';
import { Camera, Monitor, RotateCcw, ScanLine, Smartphone, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface FastBarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const FastBarcodeScanner: React.FC<FastBarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const isQuaggaInitialized = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const initAttempts = useRef(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  useEffect(() => {
    detectOrientation();
    
    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(detectOrientation, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      // Comprehensive cleanup
      if (Quagga && isQuaggaInitialized.current) {
        try {
          Quagga.stop();
          // Remove all detection listeners
          if (typeof Quagga.offDetected === 'function') {
            Quagga.offDetected(() => {});
          }
        } catch (err) {
          console.log('Quagga cleanup error:', err);
        }
        isQuaggaInitialized.current = false;
      }
      
      // Stop the media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track in cleanup:', track.label);
        });
        mediaStreamRef.current = null;
      }
      
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Get available cameras on mount
  useEffect(() => {
    getAvailableCameras();
  }, []);

  // Separate effect to initialize scanner when element is ready
  useEffect(() => {
    if (scannerRef.current && selectedCamera) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      const initTimer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          initializeScanner();
        });
      });
      
      return () => {
        cancelAnimationFrame(initTimer);
      };
    }
  }, [scannerRef.current, selectedCamera]);

  const detectOrientation = () => {
    const isPortrait = window.innerHeight > window.innerWidth;
    setOrientation(isPortrait ? 'portrait' : 'landscape');
  };

  const getAvailableCameras = async () => {
    try {
      console.log('📷 Getting available cameras...');
      
      // First, try to get user media to trigger permission request
      try {
        console.log('📷 Requesting camera permission first...');
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(track => track.stop());
        console.log('✅ Camera permission granted');
      } catch (permError) {
        console.warn('⚠️ Camera permission denied or not available:', permError);
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('📷 Found cameras:', videoDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.substring(0, 8)}...`,
        groupId: device.groupId
      })));
      
      // Check if we have valid cameras (with proper deviceId)
      const validCameras = videoDevices.filter(device => device.deviceId && device.deviceId !== '');
      
      if (validCameras.length === 0 && videoDevices.length > 0) {
        console.warn('⚠️ No valid cameras found, but devices detected. This might be an external camera app.');
        console.log('📷 Using fallback mode for external camera apps...');
        
        // Create a fallback camera entry for external apps
        const fallbackCamera = {
          deviceId: 'fallback-camera',
          label: 'External Camera (Camo Studio/Other)',
          groupId: 'fallback-group',
          kind: 'videoinput' as MediaDeviceKind,
          toJSON: () => ({})
        };
        
        setAvailableCameras([fallbackCamera]);
        setSelectedCamera('fallback-camera');
        console.log('📷 Using fallback camera for external app');
        return;
      }
      
      setAvailableCameras(validCameras.length > 0 ? validCameras : videoDevices);
      
      // Auto-select the first camera if none is selected
      const camerasToUse = validCameras.length > 0 ? validCameras : videoDevices;
      if (camerasToUse.length > 0 && !selectedCamera) {
        setSelectedCamera(camerasToUse[0].deviceId);
        console.log('📷 Auto-selected camera:', camerasToUse[0].label || camerasToUse[0].deviceId);
      }
    } catch (error) {
      console.error('❌ Error getting cameras:', error);
    }
  };

  const handleCameraChange = (cameraId: string) => {
    console.log('📷 Camera changed to:', cameraId);
    setSelectedCamera(cameraId);
    // Stop current scanner and restart with new camera
    if (isQuaggaInitialized.current) {
      stopScanning();
    }
  };

  const initializeScanner = async () => {
    try {
      setError('');
      
      // Debug information
      console.log('🔍 Starting scanner initialization...');
      console.log('🌐 Browser info:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        host: window.location.host
      });
      
      // Check if we're in a secure context (HTTPS)
      if (!window.isSecureContext) {
        setError('Este sitio debe ser accedido a través de HTTPS para usar la cámara. Por favor usa https:// en lugar de http://');
        return;
      }
      
      // First, check if we have camera permissions and get the stream
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Get camera access and store the stream
          // Use more flexible constraints for mobile Safari with proper aspect ratio
          const constraints = {
            video: selectedCamera === 'fallback-camera' 
              ? {
                  // Fallback constraints for external camera apps
                  width: { ideal: 1280, max: 1920 },
                  height: { ideal: 720, max: 1080 },
                  frameRate: { ideal: 30, max: 60 },
                  aspectRatio: { ideal: 16/9 }
                }
              : {
                  deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                  facingMode: selectedCamera ? undefined : "environment",
                  width: { ideal: 1280, max: 1920 },
                  height: { ideal: 720, max: 1080 },
                  frameRate: { ideal: 30, max: 60 },
                  aspectRatio: { ideal: 16/9 } // Standard mobile aspect ratio
                }
          };
          
          console.log('📷 Camera constraints:', constraints);
          console.log('📷 Using fallback mode:', selectedCamera === 'fallback-camera');
          
          console.log('Requesting camera with constraints:', constraints);
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          mediaStreamRef.current = stream;
        } catch (permErr) {
          console.error('Camera permission error:', permErr);
          console.error('Permission error details:', {
            name: permErr.name,
            message: permErr.message,
            code: permErr.code,
            constraint: permErr.constraint
          });
          
          // Show detailed permission error for mobile debugging
          const detailedPermError = `DEBUG INFO:
Permission Error: ${permErr.name || 'Unknown'}
Message: ${permErr.message || 'No message'}
Code: ${permErr.code || 'No code'}
Constraint: ${permErr.constraint || 'No constraint'}
Browser: ${navigator.userAgent}
Platform: ${navigator.platform}`;
          
          setError(`Error de permisos: ${permErr.name || 'Unknown'} - ${permErr.message || 'No message'}\n\n${detailedPermError}`);
          return;
        }
      } else {
        setError('Tu navegador no soporta acceso a la cámara. Por favor usa un navegador moderno.');
        return;
      }
      
      // Quagga2 configuration - optimized for mobile video quality
      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: selectedCamera === 'fallback-camera'
            ? {
                // Fallback constraints for external camera apps
                width: { min: 1280 },
                height: { min: 720 },
                facingMode: "environment",
                aspectRatio: { min: 1.5, max: 2.0 }
              }
            : {
                width: { min: 1280 },
                height: { min: 720 },
                facingMode: selectedCamera ? "environment" : "environment",
                aspectRatio: { min: 1.5, max: 2.0 }
              }
        },
        locator: {
          patchSize: "large", // Larger patch for better mobile detection
          halfSample: false // Disable half sampling for better quality
        },
        numOfWorkers: 2, // Slightly more workers for better performance
        frequency: 10, // Higher frequency for better responsiveness
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "code_39_reader",
            "upc_reader"
          ]
        },
        locate: true
      };
      
      console.log('Quagga config:', config);
      console.log('Scanner target element:', scannerRef.current);

      // Ensure the target element is ready and has dimensions
      if (!scannerRef.current) {
        setError('Error: El elemento del escáner no está disponible');
        return;
      }

      // Check if element has dimensions
      const rect = scannerRef.current!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        initAttempts.current++;
        if (initAttempts.current < 10) {
          console.log(`Element not ready, retrying in 100ms... (attempt ${initAttempts.current})`);
          setTimeout(() => {
            initializeScanner();
          }, 100);
          return;
        } else {
          setError('Error: El elemento del escáner no se pudo inicializar después de varios intentos. Intenta recargar la página.');
          return;
        }
      }

      console.log('Element dimensions:', rect);

      // Initialize Quagga with better error handling
      Quagga.init(config, (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          console.error('Error details:', {
            name: err.name,
            message: err.message,
            stack: err.stack,
            code: err.code,
            constraint: err.constraint
          });
          
          // Also show detailed error in the UI for mobile debugging
          const detailedError = `DEBUG INFO:
          Error: ${err.name || 'Unknown'}
          Message: ${err.message || 'No message'}
          Code: ${err.code || 'No code'}
          Constraint: ${err.constraint || 'No constraint'}
          Browser: ${navigator.userAgent}
          Platform: ${navigator.platform}`;
          
          let errorMessage = 'Error al inicializar el escáner.';
          
          if (err.name === 'NotAllowedError') {
            errorMessage = 'Permisos de cámara denegados. Por favor permite el acceso a la cámara.';
          } else if (err.name === 'NotFoundError') {
            errorMessage = 'Cámara no encontrada. Verifica que tu dispositivo tenga una cámara.';
          } else if (err.name === 'NotReadableError') {
            errorMessage = 'La cámara está siendo usada por otra aplicación. Cierra otras apps que usen la cámara.';
          } else if (err.name === 'OverconstrainedError') {
            errorMessage = 'Configuración de cámara no soportada. Intenta con otra cámara.';
          } else {
            // Show the actual error for debugging
            errorMessage = `Error: ${err.name || 'Unknown'} - ${err.message || 'No message'}`;
          }
          
          // Show detailed error for mobile debugging
          setError(`${errorMessage}\n\n${detailedError}`);
          return;
        }
        
          setIsInitialized(true);
          isQuaggaInitialized.current = true;
          initAttempts.current = 0; // Reset counter on success
          startScanning();
        });

        // Listen for successful barcode detection
        Quagga.onDetected((result) => {
          const code = result.codeResult.code;
          
          // Validate the scanned code (same validation as before)
          const codePattern = /^\d{6,12}$/;
          if (codePattern.test(code)) {
            // Process the code (same logic as before)
            let processedCode = code;
            if (code.length < 8) {
              processedCode = code.padStart(8, '0');
            } else if (code.length > 8) {
              processedCode = code.slice(-8);
            }
            
            onScan(processedCode);
            stopScanning();
          } else {
            setError(
              `Código escaneado: "${code}"\n\nEste código no es válido para inventarios de vehículos. Se espera un código numérico de 6-12 dígitos.\n\nConsejos:\n• Verifica que estés escaneando el código correcto del vehículo\n• Asegúrate de que el código esté bien iluminado\n• Intenta desde un ángulo diferente`
            );
          }
        });

    } catch (err) {
      console.error('Scanner setup error:', err);
      setError('Falló al configurar el escáner. Por favor verifica los permisos de la cámara.');
    }
  };

  const startScanning = () => {
    if (isInitialized) {
      Quagga.start();
      setIsScanning(true);
    }
  };

  const stopScanning = () => {
    if (Quagga && isQuaggaInitialized.current) {
      try {
        Quagga.stop();
        // Clear all event listeners to prevent memory leaks
        if (typeof Quagga.offDetected === 'function') {
          Quagga.offDetected(() => {});
        }
      } catch (err) {
        console.log('Quagga stop error:', err);
      }
      isQuaggaInitialized.current = false;
    }
    
    // Stop the media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track in stopScanning:', track.label);
      });
      mediaStreamRef.current = null;
    }
    
    setIsScanning(false);
    setIsInitialized(false);
  };

  const retryScanning = () => {
    setError('');
    if (isInitialized) {
      startScanning();
    } else {
      initializeScanner();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleClose = () => {
    // Ensure proper cleanup before closing
    stopScanning();
    onClose();
  };

  return (
    <>
      {/* Global styles for Quagga video elements */}
      <style dangerouslySetInnerHTML={{
        __html: `
          #scanner-container video,
          #scanner-container canvas {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            border-radius: 12px !important;
          }
          
          #scanner-container .drawingBuffer {
            display: none !important;
          }
          
          /* Ensure proper aspect ratio on mobile */
          @media (max-width: 768px) {
            #scanner-container video {
              aspect-ratio: 16/9 !important;
            }
          }
        `
      }} />
      
      <div className={`fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div className={`glass-effect rounded-3xl w-full overflow-hidden border border-white/30 shadow-2xl ${
        isFullscreen 
          ? 'max-w-none max-h-none h-full rounded-none' 
          : orientation === 'portrait'
            ? 'max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh]'
            : 'max-w-4xl max-h-[80vh] sm:max-h-[75vh]'
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
                  Escáner Rápido (QuaggaJS)
                </h2>
                                 <p className={`text-white/70 truncate ${isFullscreen ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                   {isScanning 
                     ? 'Escaneando...' 
                     : isInitialized 
                       ? 'Listo para escanear' 
                       : 'Inicializando...'}
                 </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
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
                 onClick={handleClose}
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
          {/* Scanner Container */}
          <div className={`${isFullscreen ? 'p-4' : 'p-4 sm:p-6'}`}>
            <div className="relative glass-effect rounded-2xl overflow-hidden border border-white/20 shadow-lg">
              {/* QuaggaJS Scanner */}
              <div 
                id="scanner-container"
                ref={scannerRef}
                className={`w-full ${
                  orientation === 'portrait' 
                    ? isFullscreen 
                      ? 'h-[60vh]' 
                      : 'h-64 sm:h-80 md:h-96'
                    : isFullscreen
                      ? 'h-[50vh]'
                      : 'h-48 sm:h-64 md:h-80'
                }`}
                style={{ 
                  position: 'relative',
                  backgroundColor: '#000',
                  overflow: 'hidden',
                  borderRadius: '12px',
                  aspectRatio: orientation === 'portrait' ? '4/3' : '16/9'
                }}
              />

              {/* Scanning Overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Scanning frame */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className={`border-2 border-green-400 rounded-xl relative shadow-lg ${
                      orientation === 'portrait'
                        ? 'w-56 h-60 sm:w-64 sm:h-72 md:w-72 md:h-80'
                        : 'w-64 h-48 sm:w-80 sm:h-56 md:w-96 md:h-64'
                    }`}>
                      {/* Corner markers */}
                      <div className="absolute -top-3 -left-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 border-l-4 border-t-4 border-green-400 rounded-tl-lg"></div>
                      <div className="absolute -top-3 -right-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 border-r-4 border-t-4 border-green-400 rounded-tr-lg"></div>
                      <div className="absolute -bottom-3 -left-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 border-l-4 border-b-4 border-green-400 rounded-bl-lg"></div>
                      <div className="absolute -bottom-3 -right-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 border-r-4 border-b-4 border-green-400 rounded-br-lg"></div>
                      
                      {/* Scanning line animation */}
                      <div className={`absolute bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse shadow-lg ${
                        orientation === 'portrait'
                          ? 'w-64 h-1 sm:w-72 sm:h-1.5 md:w-80 md:h-2 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                          : 'w-64 h-1 sm:w-80 sm:h-1.5 md:w-96 md:h-2 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                      }`}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Camera Selector */}
              {availableCameras.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                  <select
                    value={selectedCamera}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className="bg-transparent text-white text-xs border-none outline-none cursor-pointer"
                  >
                    {availableCameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId} className="bg-gray-800 text-white">
                        {camera.label || `Camera ${camera.deviceId.substring(0, 8)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* External Camera App Notice */}
              {selectedCamera === 'fallback-camera' && (
                <div className="absolute top-12 right-3 bg-blue-500/80 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-white text-xs">
                    📱 External Camera App Detected
                  </span>
                </div>
              )}

              {/* Status indicator */}
              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isScanning 
                      ? 'bg-green-400 animate-pulse' 
                      : isInitialized 
                        ? 'bg-blue-400' 
                        : 'bg-yellow-400 animate-pulse'
                  }`}></div>
                  <span className="text-white text-xs font-medium">
                    {isScanning 
                      ? 'Escaneando' 
                      : isInitialized 
                        ? 'Listo' 
                        : 'Inicializando...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className={`text-center ${isFullscreen ? 'mt-4' : 'mt-4 sm:mt-6'}`}>
              <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <ScanLine className={`text-white ${isFullscreen ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                </div>
                <p className={`text-white font-medium ${isFullscreen ? 'text-sm' : 'text-sm sm:text-base'}`}>
                  Escáner optimizado para velocidad máxima
                </p>
              </div>
              
              <div className={`glass-effect border border-white/30 rounded-xl bg-white/5 ${
                isFullscreen ? 'mb-4 p-4' : 'mb-4 p-4 sm:p-5'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className={`text-white ${isFullscreen ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                      <strong>Velocidad:</strong> Escaneo en milisegundos (10x más rápido que ZXing)
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <p className={`text-white/80 ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                      <strong>Formato:</strong> Código numérico de 6-12 dígitos
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <p className={`text-white/80 ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                      <strong>Optimizado:</strong> Procesamiento en tiempo real con múltiples workers
                    </p>
                  </div>
                </div>
              </div>
              
                             {/* Status Messages */}
               {!isInitialized && (
                 <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-400/50 rounded-xl p-3 sm:p-4">
                   <div className="flex items-center justify-center space-x-2">
                     <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                     <p className={`text-yellow-300 font-semibold ${
                       isFullscreen ? 'text-sm' : 'text-sm sm:text-base'
                     }`}>
                       Configurando cámara y permisos...
                     </p>
                   </div>
                 </div>
               )}
               
               {isInitialized && !isScanning && (
                 <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-400/50 rounded-xl p-3 sm:p-4">
                   <div className="flex items-center justify-center space-x-2">
                     <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                     <p className={`text-blue-300 font-semibold ${
                       isFullscreen ? 'text-sm' : 'text-sm sm:text-base'
                     }`}>
                       ✅ Listo para escanear - Apunta al código de barras
                     </p>
                   </div>
                 </div>
               )}
               
               {isScanning && (
                 <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-400/50 rounded-xl p-3 sm:p-4">
                   <div className="flex items-center justify-center space-x-2">
                     <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                     <p className={`text-green-300 font-semibold ${
                       isFullscreen ? 'text-sm' : 'text-sm sm:text-base'
                     }`}>
                       🔍 Escaneando a alta velocidad...
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

        {/* Footer - Hidden in landscape orientation */}
        {orientation === 'portrait' && (
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
                onClick={handleClose} 
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
        )}
      </div>
    </div>
    </>
  );
};

export default FastBarcodeScanner;
