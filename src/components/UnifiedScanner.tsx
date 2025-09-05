import Quagga from '@ericblade/quagga2';
import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType, Result } from '@zxing/library';
import { Camera, Flashlight, FlashlightOff, Focus, Monitor, RotateCcw, ScanLine, Smartphone, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Extend MediaTrackCapabilities to include torch
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

// Extend MediaTrackConstraints to include torch
interface ExtendedMediaTrackConstraints extends MediaTrackConstraints {
  advanced?: Array<MediaTrackConstraintSet & { torch?: boolean }>;
}

interface UnifiedScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const UnifiedScanner: React.FC<UnifiedScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isFocusing, setIsFocusing] = useState(false);
  const [focusCapabilities, setFocusCapabilities] = useState<string[]>([]);
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);
  const [scannerType, setScannerType] = useState<'qr' | 'barcode' | 'auto'>('auto');
  const [detectedType, setDetectedType] = useState<'qr' | 'barcode' | null>(null);
  
  // QR Scanner refs
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  
  // Barcode Scanner refs
  const isQuaggaInitialized = useRef(false);
  const initAttempts = useRef(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  useEffect(() => {
    initializeScanner();
    detectOrientation();
    
    const handleOrientationChange = () => {
      setTimeout(detectOrientation, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      cleanup();
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  const detectOrientation = () => {
    const isPortrait = window.innerHeight > window.innerWidth;
    setOrientation(isPortrait ? 'portrait' : 'landscape');
  };

  const cleanup = () => {
    // Cleanup QR scanner
    if (readerRef.current) {
      readerRef.current.reset();
    }
    
    // Cleanup barcode scanner
    if (Quagga && isQuaggaInitialized.current) {
      try {
        Quagga.stop();
        if (typeof Quagga.offDetected === 'function') {
          Quagga.offDetected(() => {});
        }
      } catch (err) {
        console.log('Quagga cleanup error:', err);
      }
      isQuaggaInitialized.current = false;
    }
    
    // Stop media stream
    if (streamRef) {
      streamRef.getTracks().forEach(track => track.stop());
      setStreamRef(null);
    }
    
    setIsScanning(false);
    setIsInitialized(false);
  };

  const initializeScanner = async () => {
    try {
      setError('');
      
      // Get available video devices
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = videoDevices.filter(device => device.kind === 'videoinput');
      setDevices(cameras);

      if (cameras.length > 0) {
        setSelectedDevice(cameras[0].deviceId);
        await startScanning(cameras[0].deviceId);
      }
    } catch (err) {
      setError('Falló al inicializar el escáner. Por favor verifica los permisos de la cámara.');
    }
  };

  const startScanning = async (deviceId: string) => {
    try {
      setIsScanning(true);
      setError('');

      // Get video stream
      const constraints = getVideoConstraints();
      let stream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            ...constraints
          },
        });
      } catch (error) {
        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment'
          }
        });
      }

      setStreamRef(stream);

      // Check camera capabilities
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities() as any;
        const focusModes = capabilities.focusMode || [];
        setFocusCapabilities(focusModes);
      }

      // Initialize both scanners
      await initializeQRScanner(stream);
      await initializeBarcodeScanner(stream);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Falló al iniciar el escaneo: ${errorMsg}`);
      setIsScanning(false);
    }
  };

  const initializeQRScanner = async (stream: MediaStream) => {
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      
      reader.timeBetweenDecodingAttempts = 50;
      
      // Configure hints for maximum precision
      try {
        reader.hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODABAR,
          BarcodeFormat.ITF
        ]);
        
        reader.hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
        reader.hints.set(DecodeHintType.TRY_HARDER, true);
        reader.hints.set(DecodeHintType.PURE_BARCODE, false);
      } catch (e) {
        console.log('Could not set hints, using default formats');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Wait for video to be ready
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
          const errorMsg = error ? `Video error: ${error.code} - ${error.message}` : 'Unknown video error';
          reject(new Error(errorMsg));
        };

        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('error', onError);

        setTimeout(() => {
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          reject(new Error('Tiempo de espera agotado para el video'));
        }, 15000);
      });

      // Start QR scanning
      await readerRef.current.decodeFromVideoDevice(
        selectedDevice,
        videoRef.current,
        (result: Result | null, err: any) => {
          if (result) {
            const scannedCode = result.getText().trim();
            const format = result.getBarcodeFormat();
            const resultPoints = result.getResultPoints();
            const confidence = resultPoints ? resultPoints.length : 0;
            
            console.log('QR Scanner - Detected:', {
              text: scannedCode,
              format: format,
              confidence: confidence
            });

            if (confidence >= 2 && scannedCode.length >= 3) {
              setDetectedType('qr');
              processScannedCode(scannedCode, 'qr');
            }
          }
          if (err && err.name !== 'NotFoundException') {
            if (err.name === 'ChecksumException' || err.name === 'FormatException') {
              setError('Código dañado o ilegible. Intenta escanear desde un ángulo diferente.');
            }
          }
        }
      );
    } catch (err) {
      console.log('QR Scanner initialization failed:', err);
    }
  };

  const initializeBarcodeScanner = async (stream: MediaStream) => {
    try {
      const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
      
      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: { min: 1280, ideal: 1920 },
            height: { min: 720, ideal: 1080 },
            facingMode: "environment",
            aspectRatio: { min: 1.5, max: 2.0 }
          }
        },
        locator: {
          patchSize: isSafariIOS ? "small" : "large",
          halfSample: false,
          showCanvas: false,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showPatchLabels: false,
          showBoundingBox: false,
          showCrosshair: false
        },
        numOfWorkers: isSafariIOS ? 0 : 4,
        frequency: isSafariIOS ? 10 : 100,
        decoder: {
          readers: isSafariIOS 
            ? ["code_128_reader", "ean_reader", "code_39_reader", "code_39_vin_reader"]
            : ["code_39_vin_reader", "code_39_reader", "code_128_reader", "ean_reader", "ean_8_reader", "codabar_reader", "upc_reader", "upc_e_reader", "i2of5_reader"]
        },
        locate: true,
        debug: {
          drawBoundingBox: false,
          showFrequency: true,
          drawScanline: true,
          showPattern: false
        }
      };

      if (!scannerRef.current) {
        setError('Error: El elemento del escáner no está disponible');
        return;
      }

      const rect = scannerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        initAttempts.current++;
        if (initAttempts.current < 10) {
          setTimeout(() => initializeBarcodeScanner(stream), 100);
          return;
        } else {
          setError('Error: El elemento del escáner no se pudo inicializar');
          return;
        }
      }

      Quagga.init(config, (err) => {
        if (err) {
          console.log('Barcode scanner initialization failed:', err);
          return;
        }
        
        setIsInitialized(true);
        isQuaggaInitialized.current = true;
        
        // Listen for barcode detection
        Quagga.onDetected((result) => {
          const code = result.codeResult.code;
          const format = result.codeResult.format;
          const confidence = result.codeResult.decodedCodes?.length || 0;
          const quality = result.codeResult.decodedCodes?.reduce((acc, item) => acc + (item.error || 0), 0) || 0;
          const avgQuality = confidence > 0 ? quality / confidence : 0;
          
          console.log('Barcode Scanner - Detected:', {
            code: code,
            format: format,
            confidence: confidence,
            quality: avgQuality
          });
          
          if (confidence >= 4 && avgQuality <= 0.5 && code.length >= 3 && code.length <= 50) {
            // Debounce mechanism
            const currentTime = Date.now();
            if (code !== lastScannedCode || currentTime - lastScanTime > 1500) {
              setLastScannedCode(code);
              setLastScanTime(currentTime);
              setDetectedType('barcode');
              processScannedCode(code, 'barcode');
            }
          }
        });
      });
    } catch (err) {
      console.log('Barcode scanner setup error:', err);
    }
  };

  const processScannedCode = (code: string, type: 'qr' | 'barcode') => {
    // Only accept 8-digit numeric codes
    const eightDigitPattern = /^\d{8}$/;
    const numericPattern = /^\d+$/;
    
    if (eightDigitPattern.test(code)) {
      // Perfect 8-digit code
      onScan(code);
      stopScanning();
    } else if (numericPattern.test(code)) {
      // Numeric code that needs to be adjusted to 8 digits
      let processedCode = code;
      if (code.length < 8) {
        processedCode = code.padStart(8, '0');
      } else if (code.length > 8) {
        processedCode = code.slice(-8);
      }
      onScan(processedCode);
      stopScanning();
    } else if (type === 'qr') {
      // For QR codes, try to extract 8-digit numeric part
      const numericMatch = code.match(/\d{8}/);
      if (numericMatch) {
        onScan(numericMatch[0]);
        stopScanning();
      } else {
        // Try to extract any numeric part and pad/trim to 8 digits
        const anyNumericMatch = code.match(/\d+/);
        if (anyNumericMatch) {
          let processedCode = anyNumericMatch[0];
          if (processedCode.length < 8) {
            processedCode = processedCode.padStart(8, '0');
          } else if (processedCode.length > 8) {
            processedCode = processedCode.slice(-8);
          }
          onScan(processedCode);
          stopScanning();
        } else {
          setError(
            `Código QR escaneado: "${code}"\n\nNo se pudo extraer un código numérico de 8 dígitos del QR.\n\nConsejos:\n• Verifica que el QR contenga un código numérico\n• Asegúrate de que el QR esté bien iluminado\n• Intenta usar el enfoque manual si el QR se ve borroso`
          );
        }
      }
    } else {
      setError(
        `Código escaneado: "${code}"\n\nEste código no es válido para inventarios de vehículos. Se espera un código numérico de 8 dígitos.\n\nConsejos:\n• Verifica que estés escaneando el código correcto del vehículo\n• Asegúrate de que el código esté bien iluminado\n• Intenta desde un ángulo diferente`
      );
    }
  };

  const stopScanning = () => {
    cleanup();
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    stopScanning();
    startScanning(deviceId);
  };

  const getVideoConstraints = () => {
    if (orientation === 'portrait') {
      return {
        width: { ideal: 1920, max: 2560 },
        height: { ideal: 1080, max: 1440 },
        facingMode: 'environment',
        focusMode: 'continuous',
        exposureMode: 'continuous',
        whiteBalanceMode: 'continuous',
        frameRate: { ideal: 30, max: 60 }
      };
    } else {
      return {
        width: { ideal: 2560, max: 3840 },
        height: { ideal: 1440, max: 2160 },
        facingMode: 'environment',
        focusMode: 'continuous',
        exposureMode: 'continuous',
        whiteBalanceMode: 'continuous',
        frameRate: { ideal: 30, max: 60 }
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
    if (!streamRef) return;

    try {
      const videoTrack = streamRef.getVideoTracks()[0];
      if (!videoTrack) return;

      const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
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

  const manualFocus = async () => {
    if (!streamRef || isFocusing) return;

    try {
      setIsFocusing(true);
      const videoTrack = streamRef.getVideoTracks()[0];
      if (!videoTrack) {
        setIsFocusing(false);
        setError('No se pudo acceder al control de la cámara');
        return;
      }

      const capabilities = videoTrack.getCapabilities() as any;
      
      if (capabilities.focusMode && capabilities.focusMode.includes('manual')) {
        try {
          await videoTrack.applyConstraints({
            advanced: [
              { focusMode: 'manual' },
              { exposureMode: 'manual' },
              { whiteBalanceMode: 'manual' }
            ] as any
          });
          
          setTimeout(async () => {
            try {
              await videoTrack.applyConstraints({
                advanced: [
                  { focusMode: 'continuous' },
                  { exposureMode: 'continuous' },
                  { whiteBalanceMode: 'continuous' }
                ] as any
              });
            } catch (err) {
              console.log('Error resetting to auto mode:', err);
            }
          }, 800);
        } catch (err) {
          console.log('Manual focus failed:', err);
        }
      }

      setTimeout(() => {
        setIsFocusing(false);
      }, 2000);

    } catch (err) {
      setIsFocusing(false);
      setError('No se pudo controlar el enfoque. Intenta acercar o alejar el teléfono del código.');
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
                  Escáner Universal (QR + Códigos de Barras)
                </h2>
                <p className={`text-white/70 truncate ${isFullscreen ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                  {isScanning ? 'Escaneando...' : 'Listo para escanear'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Manual Focus Button */}
              <button
                onClick={manualFocus}
                disabled={isFocusing || focusCapabilities.length === 0}
                className={`glass-effect rounded-xl transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/40 ${
                  isFocusing ? 'bg-blue-500/20 border-blue-400/50' : 
                  focusCapabilities.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                } ${isFullscreen ? 'p-2' : 'p-2 sm:p-3'}`}
                title={
                  focusCapabilities.length === 0 
                    ? 'Enfoque manual no disponible en este dispositivo' 
                    : isFocusing 
                      ? 'Enfocando...' 
                      : 'Enfoque manual'
                }
              >
                <Focus className={`${
                  isFocusing ? 'text-blue-300 animate-pulse' : 
                  focusCapabilities.length === 0 ? 'text-gray-400' : 'text-white'
                } ${isFullscreen ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
              </button>
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
              {/* QR Scanner Video */}
              <video
                ref={videoRef}
                className={`w-full h-full object-cover cursor-pointer ${
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
                onClick={manualFocus}
                title="Toca para enfocar"
              />

              {/* Barcode Scanner Container */}
              <div 
                ref={scannerRef}
                className="absolute inset-0 w-full h-full"
                style={{ 
                  position: 'absolute',
                  backgroundColor: 'transparent',
                  overflow: 'hidden',
                  borderRadius: '12px'
                }}
              />

              {/* Scanning Overlay */}
              {isScanning && (
                <div className="absolute inset-0">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className={`border-2 border-white rounded-xl relative shadow-lg ${
                      orientation === 'portrait'
                        ? 'w-40 h-48 sm:w-48 sm:h-56 md:w-56 md:h-64'
                        : 'w-48 h-40 sm:w-64 sm:h-48 md:w-72 md:h-56'
                    }`}>
                      {/* Corner markers */}
                      <div className="absolute -top-3 -left-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
                      <div className="absolute -top-3 -right-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
                      <div className="absolute -bottom-3 -left-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
                      <div className="absolute -bottom-3 -right-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 border-r-4 border-b-4 border-white rounded-br-lg"></div>
                      
                      {/* Scanning line animation */}
                      <div className={`absolute bg-gradient-to-r from-transparent via-white to-transparent animate-pulse shadow-lg ${
                        orientation === 'portrait'
                          ? 'w-40 h-1 sm:w-48 sm:h-1.5 md:w-56 md:h-2 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                          : 'w-48 h-1 sm:w-64 sm:h-1.5 md:w-72 md:h-2 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                      }`}></div>
                      
                      {/* Center crosshair */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                      </div>
                      
                      {/* Code type indicator */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white/90 text-black px-2 py-1 rounded text-xs font-medium">
                          {detectedType === 'qr' ? 'QR Code' : detectedType === 'barcode' ? 'Código de Barras' : 'QR + Códigos de Barras'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status indicators */}
              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-white text-xs font-medium">
                    {isScanning ? 'Buscando código...' : 'Listo para escanear'}
                  </span>
                </div>
              </div>

              <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-white text-xs font-medium">
                    Detección Automática
                  </span>
                </div>
              </div>

              {/* Flash indicator */}
              {isFlashOn && (
                <div className="absolute top-12 right-3 bg-yellow-500/20 backdrop-blur-sm rounded-lg px-2 py-1 border border-yellow-400/50">
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
                  Escáner inteligente que detecta automáticamente QR y códigos de barras
                </p>
              </div>
              
              <div className={`glass-effect border border-white/30 rounded-xl bg-white/5 ${
                isFullscreen ? 'mb-4 p-4' : 'mb-4 p-4 sm:p-5'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className={`text-white ${isFullscreen ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                      <strong>Detección Automática:</strong> QR Codes y códigos de barras lineales
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <p className={`text-white/80 ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                      <strong>Formato:</strong> Código numérico de 8 dígitos
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <p className={`text-white/80 ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                      <strong>Optimizado:</strong> Máxima precisión con detección dual
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <p className={`text-white/80 ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                      <strong>Para vehículos:</strong> Busca el código en el parabrisas, puerta o motor
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <p className={`text-white/80 ${isFullscreen ? 'text-xs' : 'text-xs'}`}>
                      <strong>Consejo:</strong> Mantén el teléfono estable y a 15-30cm del código
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

export default UnifiedScanner;
