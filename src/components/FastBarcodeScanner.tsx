import Quagga from '@ericblade/quagga2';
import { Camera, Monitor, RotateCcw, ScanLine, Smartphone, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Extend MediaTrackCapabilities to include torch
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

// Extend MediaTrackConstraints to include torch
interface ExtendedMediaTrackConstraints extends MediaTrackConstraints {
  advanced?: Array<MediaTrackConstraintSet & { torch?: boolean }>;
}

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
  const [flashEnabled, setFlashEnabled] = useState<boolean>(false);
  const [flashSupported, setFlashSupported] = useState<boolean>(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState<number>(0);

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
      // First, try to get user media to trigger permission request
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        // Permission denied or not available
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Check if we have valid cameras (with proper deviceId)
      const validCameras = videoDevices.filter(device => device.deviceId && device.deviceId !== '');
      
      if (validCameras.length === 0 && videoDevices.length > 0) {
        // Create a fallback camera entry for external apps
        const fallbackCamera = {
          deviceId: 'fallback-camera',
          label: 'External Camera App',
          groupId: 'fallback-group',
          kind: 'videoinput' as MediaDeviceKind,
          toJSON: () => ({})
        };
        
        setAvailableCameras([fallbackCamera]);
        setSelectedCamera('fallback-camera');
        return;
      }
      
      // Process cameras
      const cameras = validCameras.length > 0 ? validCameras : videoDevices;
      const processedCameras = cameras.map(camera => ({
        ...camera,
        label: camera.label || `Camera ${camera.deviceId.substring(0, 8)}...`,
        isExternal: camera.label.toLowerCase().includes('camo') ||
                   camera.label.toLowerCase().includes('obs') ||
                   camera.label.toLowerCase().includes('virtual') ||
                   camera.label.toLowerCase().includes('studio') ||
                   camera.label.toLowerCase().includes('external')
      }));
      
      setAvailableCameras(processedCameras);
      
      // Auto-select the first camera if none is selected
      if (processedCameras.length > 0 && !selectedCamera) {
        setSelectedCamera(processedCameras[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
    }
  };

  const handleCameraChange = (cameraId: string) => {
    // Stop current scanner completely
    stopScanning();
    
    // Update selected camera
    setSelectedCamera(cameraId);
    
    // Clear any existing error
    setError('');
    
    // Reinitialize scanner with new camera after a short delay
    setTimeout(() => {
      initializeScanner();
    }, 1000);
  };

  const toggleFlash = async () => {
    if (!mediaStreamRef.current) {
      return;
    }

    try {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (!videoTrack) {
        return;
      }

      const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

      if (capabilities.torch) {
        const newFlashState = !flashEnabled;
        await videoTrack.applyConstraints({
          advanced: [{ torch: newFlashState }]
        } as ExtendedMediaTrackConstraints);
        setFlashEnabled(newFlashState);
      } else {
        setFlashSupported(false);
      }
    } catch (error) {
      setFlashSupported(false);
    }
  };

  const initializeScanner = async () => {
    try {
      setError('');
      
      
      // Check if we're in a secure context (HTTPS)
      if (!window.isSecureContext) {
        setError('Este sitio debe ser accedido a través de HTTPS para usar la cámara. Por favor usa https:// en lugar de http://');
        return;
      }
      
      // Detect if using external camera app
      const isExternalCamera = selectedCamera === 'fallback-camera' || 
        (availableCameras.find(cam => cam.deviceId === selectedCamera) as any)?.isExternal;

      // First, check if we have camera permissions and get the stream
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Get camera access and store the stream
          // Use more flexible constraints for external camera apps like Camo Studio
          const constraints = {
            video: selectedCamera === 'fallback-camera' 
              ? {
                  // Very flexible constraints for external camera apps
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  frameRate: { ideal: 30 }
                }
              : isExternalCamera
                ? {
                    // Flexible constraints for detected external cameras
                    deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                  }
                : {
                    // Standard constraints for regular cameras
                    deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                    facingMode: selectedCamera ? undefined : "environment",
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 },
                    aspectRatio: { ideal: 16/9 }
                  }
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          mediaStreamRef.current = stream;
          
          // Check flash/torch capabilities
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
            setFlashSupported(!!capabilities.torch);
          }
        } catch (permErr) {
          // Try fallback with minimal constraints
          if (permErr.name === 'OverconstrainedError' || permErr.name === 'NotReadableError') {
            try {
              const fallbackConstraints = {
                video: {
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                  frameRate: { ideal: 15 }
                }
              };
              
              const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
              mediaStreamRef.current = fallbackStream;
              
              // Check flash/torch capabilities
              const videoTrack = fallbackStream.getVideoTracks()[0];
              if (videoTrack) {
                const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
                setFlashSupported(!!capabilities.torch);
              }
            } catch (fallbackErr) {
              // Try with absolute minimal constraints
              try {
                const minimalConstraints = { video: true };
                const minimalStream = await navigator.mediaDevices.getUserMedia(minimalConstraints);
                mediaStreamRef.current = minimalStream;
                
                // Check flash/torch capabilities
                const videoTrack = minimalStream.getVideoTracks()[0];
                if (videoTrack) {
                  const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
                  setFlashSupported(!!capabilities.torch);
                }
              } catch (minimalErr) {
                setError(`Error de cámara: ${permErr.name} - ${permErr.message}`);
                return;
              }
            }
          } else {
            setError(`Error de permisos: ${permErr.name} - ${permErr.message}`);
            return;
          }
        }
      } else {
        setError('Tu navegador no soporta acceso a la cámara. Por favor usa un navegador moderno.');
        return;
      }
      
      // Detect Safari iOS for special configuration
      const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);

      // Quagga2 configuration - optimized for maximum precision
      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: selectedCamera === 'fallback-camera'
            ? {
                // Fallback constraints for external camera apps
                width: { min: 1280, ideal: 1920 },
                height: { min: 720, ideal: 1080 },
                facingMode: "environment",
                aspectRatio: { min: 1.5, max: 2.0 }
              }
            : {
                width: { min: 1280, ideal: 1920 },
                height: { min: 720, ideal: 1080 },
                facingMode: selectedCamera ? "environment" : "environment",
                aspectRatio: { min: 1.5, max: 2.0 }
              }
        },
        locator: {
          patchSize: (isSafariIOS || isExternalCamera) ? "small" : "large", // Use large patch for better precision
          halfSample: false, // Disable half sampling for maximum precision
          showCanvas: false,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showPatchLabels: false,
          showBoundingBox: false,
          showCrosshair: false
        },
        numOfWorkers: (isSafariIOS || isExternalCamera) ? 0 : 4, // More workers for better precision
        frequency: (isSafariIOS || isExternalCamera) ? 10 : 100, // Higher frequency for better detection
        decoder: {
          readers: isSafariIOS 
            ? [
                // Minimal readers for Safari iOS to avoid constructor issues
                "code_128_reader",
                "ean_reader",
                "code_39_reader",
                "code_39_vin_reader"
              ]
            : [
                "code_39_vin_reader",  // Prioritize VIN reader for vehicle barcodes
                "code_39_reader",
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
                "i2of5_reader"
              ]
        },
        locate: true,
        debug: {
          drawBoundingBox: false,
          showFrequency: true, // Shows the detected frequency of the barcode
          drawScanline: true, // Draws the red line for better visual feedback
          showPattern: false
        }
      };
      

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
          setTimeout(() => {
            initializeScanner();
          }, 100);
          return;
        } else {
          setError('Error: El elemento del escáner no se pudo inicializar después de varios intentos. Intenta recargar la página.');
          return;
        }
      }

      // Initialize Quagga with Safari iOS compatibility
      const initQuagga = () => {
        Quagga.init(config, (err) => {
          if (err) {
            // Special handling for Safari iOS constructor errors
            if (isSafariIOS && (err.message.includes('is not a constructor') || err.message.includes('Ut[e]'))) {
              // Try with ultra-minimal config for Safari iOS
              const fallbackConfig = {
                inputStream: {
                  name: "Live",
                  type: "LiveStream",
                  target: scannerRef.current,
                  constraints: {
                    width: { min: 640 },
                    height: { min: 480 },
                    facingMode: "environment"
                  }
                },
                locator: {
                  patchSize: "small", // Use small patch for better iPhone performance
                  halfSample: true
                },
                numOfWorkers: 0,
                frequency: 10, // Optimized frequency for iPhone
                decoder: {
                  readers: [
                    "code_128_reader",
                    "code_39_reader",
                    "code_39_vin_reader",
                    "ean_reader"
                  ]
                },
                locate: true,
                debug: {
                  drawBoundingBox: false,
                  showFrequency: true,
                  drawScanline: true,
                  showPattern: false
                }
              };
              
              Quagga.init(fallbackConfig, (err2) => {
                if (err2) {
                  setError(`Error de Escaneo en Safari iOS\n\nError: ${err2.name} - ${err2.message}\n\nSafari iOS tiene limitaciones conocidas con Quagga2.\n\nSugerencias:\n• Usa Chrome o Firefox en iOS\n• Asegúrate de tener buena iluminación\n• Intenta reiniciar el escáner`);
                } else {
                  setIsInitialized(true);
                  isQuaggaInitialized.current = true;
                  startScanning();
                }
              });
              return;
            }
            
            let errorMessage = 'Error al inicializar el escáner.';
            
            if (err.name === 'NotAllowedError') {
              errorMessage = 'Permisos de cámara denegados. Por favor permite el acceso a la cámara.';
            } else if (err.name === 'NotFoundError') {
              errorMessage = 'Cámara no encontrada. Verifica que tu dispositivo tenga una cámara.';
            } else if (err.name === 'NotReadableError') {
              errorMessage = 'La cámara está siendo usada por otra aplicación. Cierra otras apps que usen la cámara.';
            } else if (err.name === 'OverconstrainedError') {
              errorMessage = 'Configuración de cámara no soportada. Intenta con otra cámara.';
            } else if (err.name === 'SecurityError') {
              errorMessage = 'Error de seguridad. Asegúrate de acceder desde HTTPS.';
            } else if (err.name === 'TypeError') {
              errorMessage = 'Error de tipo. Esto puede ser un problema de compatibilidad del navegador.';
            } else {
              errorMessage = `Error: ${err.name || 'Unknown'} - ${err.message || 'No message'}`;
            }
            
            setError(errorMessage);
            return;
          }
          
          setIsInitialized(true);
          isQuaggaInitialized.current = true;
          initAttempts.current = 0; // Reset counter on success
          startScanning();
        });
      };
      
      // Initialize Quagga
      initQuagga();

        // Listen for successful barcode detection
        Quagga.onDetected((result) => {
          const code = result.codeResult.code;
          const format = result.codeResult.format;
          const confidence = result.codeResult.decodedCodes?.length || 0;
          const quality = result.codeResult.decodedCodes?.reduce((acc, item) => acc + (item.error || 0), 0) || 0;
          const avgQuality = confidence > 0 ? quality / confidence : 0;
          
          console.log('Fast Scanner - Detected:', {
            code: code,
            format: format,
            confidence: confidence,
            quality: avgQuality,
            length: code.length
          });
          
          // Enhanced confidence threshold for better precision
          if (confidence < 4 || avgQuality > 0.5) {
            console.log('Fast Scanner - Low confidence, ignoring:', code);
            return;
          }
          
          // Additional validation for code length
          if (code.length < 3 || code.length > 50) {
            console.log('Fast Scanner - Invalid length, ignoring:', code);
            return;
          }
          
          // Debounce mechanism to prevent duplicate scans
          const currentTime = Date.now();
          if (code === lastScannedCode && currentTime - lastScanTime < 1500) {
            console.log('Fast Scanner - Duplicate scan, ignoring:', code);
            return;
          }
          
          setLastScannedCode(code);
          setLastScanTime(currentTime);
          
          // This scanner is for barcodes only, not QR codes
          
          // Validate the scanned code - support both numeric codes and VIN codes
          const numericPattern = /^\d{6,12}$/;
          const vinPattern = /^[A-HJ-NPR-Z0-9]{6,17}$/; // VIN pattern (alphanumeric, 6-17 chars)
          
          if (numericPattern.test(code)) {
            // Process numeric code (original logic)
            let processedCode = code;
            if (code.length < 8) {
              processedCode = code.padStart(8, '0');
            } else if (code.length > 8) {
              processedCode = code.slice(-8);
            }
            
            onScan(processedCode);
            stopScanning();
          } else if (vinPattern.test(code)) {
            // Process VIN code - use as is or extract numeric part
            if (format === 'code_39_vin_reader' || format === 'code_39') {
              // For VIN codes, try to extract numeric part if it exists
              const numericMatch = code.match(/\d{6,12}/);
              if (numericMatch) {
                const numericCode = numericMatch[0];
                let processedCode = numericCode;
                if (numericCode.length < 8) {
                  processedCode = numericCode.padStart(8, '0');
                } else if (numericCode.length > 8) {
                  processedCode = numericCode.slice(-8);
                }
                onScan(processedCode);
                stopScanning();
              } else {
                // Use the full VIN code if no numeric part found
                onScan(code);
                stopScanning();
              }
            } else {
              // For other formats, try to extract numeric part
              const numericMatch = code.match(/\d{6,12}/);
              if (numericMatch) {
                const numericCode = numericMatch[0];
                let processedCode = numericCode;
                if (numericCode.length < 8) {
                  processedCode = numericCode.padStart(8, '0');
                } else if (numericCode.length > 8) {
                  processedCode = numericCode.slice(-8);
                }
                onScan(processedCode);
                stopScanning();
              } else {
                onScan(code);
                stopScanning();
              }
            }
          } else {
            setError(
              `Código escaneado: "${code}"\n\nFormato: ${format}\n\nEste código no es válido para inventarios de vehículos. Se espera un código numérico de 6-12 dígitos o un VIN válido.\n\nConsejos:\n• Verifica que estés escaneando el código correcto del vehículo\n• Asegúrate de que el código esté bien iluminado\n• Intenta desde un ángulo diferente\n• Para códigos VIN, asegúrate de que el código esté completo`
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
        // Quagga stop error
      }
      isQuaggaInitialized.current = false;
    }
    
    // Stop the media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    
    // Clear the scanner container
    if (scannerRef.current) {
      scannerRef.current.innerHTML = '';
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

  const resetCamera = async () => {
    // Stop current scanner
    stopScanning();
    
    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear any existing error
    setError('');
    
    // Reinitialize
    initializeScanner();
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
                  Escáner de Códigos de Barras
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
                    {availableCameras.map((camera, index) => (
                      <option key={camera.deviceId || `camera-${index}`} value={camera.deviceId} className="bg-gray-800 text-white">
                        {(camera as any).isExternal ? `📱 ${camera.label}` : camera.label || `Camera ${camera.deviceId.substring(0, 8)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* External Camera App Notice */}
              {(selectedCamera === 'fallback-camera' || (availableCameras.find(cam => cam.deviceId === selectedCamera) as any)?.isExternal) && (
                <div className="absolute top-12 right-3 bg-blue-500/80 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-white text-xs">
                    📱 {selectedCamera === 'fallback-camera' ? 'External Camera App' : 'External Camera (Camo Studio/Other)'}
                  </span>
                </div>
              )}

              {/* Flash Toggle Button */}
              {flashSupported && (
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={toggleFlash}
                    className={`glass-effect rounded-xl transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 p-2 ${
                      flashEnabled ? 'bg-yellow-500/20 border-yellow-400/50' : 'bg-black/50'
                    }`}
                    title={flashEnabled ? 'Apagar flash' : 'Encender flash'}
                  >
                    {flashEnabled ? (
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </button>
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
                  Escáner optimizado para códigos de barras lineales
                </p>
              </div>
              
              <div className={`glass-effect border border-white/30 rounded-xl bg-white/5 ${
                isFullscreen ? 'mb-4 p-4' : 'mb-4 p-4 sm:p-5'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className={`text-white ${isFullscreen ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                      <strong>Especializado:</strong> Códigos de barras lineales (Code 128, Code 39, EAN, UPC)
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
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <p className={`text-white/80 ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                      <strong>Nota:</strong> Los QR Codes deben escanearse con el escáner de QR
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
                onClick={resetCamera}
                className={`flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 hover:border-blue-400/70 text-blue-200 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 ${
                  isFullscreen 
                    ? 'py-3 px-4 text-sm' 
                    : 'py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Reiniciar Cámara</span>
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
