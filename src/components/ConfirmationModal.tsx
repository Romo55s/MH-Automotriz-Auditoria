import React, { useState, useRef } from 'react';
import { Camera, X, Check, AlertCircle, QrCode } from 'lucide-react';

interface ConfirmationModalProps {
  scannedCode: string;
  onConfirm: (code: string, photo?: string) => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  scannedCode,
  onConfirm,
  onCancel,
}) => {
  const [photo, setPhoto] = useState<string>('');
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsTakingPhoto(true);
      setError('');
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      console.error('Camera access error:', err);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    const photoDataUrl = canvas.toDataURL('image/jpeg');
    setPhoto(photoDataUrl);
    setIsTakingPhoto(false);

    // Stop the camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const retakePhoto = () => {
    setPhoto('');
    setError('');
  };

  const handleConfirm = () => {
    onConfirm(scannedCode, photo);
  };

  const handleCancel = () => {
    // Stop camera if it's running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-effect rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/20">
          <h2 className="text-subheading font-bold uppercase tracking-hero leading-heading text-shadow">
            Confirm Scan
          </h2>
          <button
            onClick={handleCancel}
            className="p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Scanned Code Display */}
          <div className="mb-8">
            <label className="block text-body font-semibold text-secondaryText mb-4">
              Scanned Barcode
            </label>
            <div className="glass-effect border border-white/20 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4 glow">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-mono text-white font-bold tracking-wider">
                {scannedCode}
              </p>
            </div>
          </div>

          {/* Photo Section */}
          <div className="mb-8">
            <label className="block text-body font-semibold text-secondaryText mb-4">
              Vehicle Photo (Optional)
            </label>
            
            {!photo && !isTakingPhoto && (
              <button
                onClick={startCamera}
                className="w-full py-4 px-6 glass-effect border-2 border-dashed border-white/30 rounded-2xl text-secondaryText hover:border-white/50 hover:text-white transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105"
              >
                <Camera className="w-6 h-6" />
                <span>Take Photo</span>
              </button>
            )}

            {isTakingPhoto && (
              <div className="space-y-4">
                <div className="relative glass-effect rounded-2xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-56 object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={takePhoto}
                    className="flex-1 btn-primary py-3 px-6"
                  >
                    Capture Photo
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 btn-secondary py-3 px-6"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {photo && (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={photo}
                    alt="Vehicle"
                    className="w-full h-56 object-cover rounded-2xl glass-effect"
                  />
                  <button
                    onClick={retakePhoto}
                    className="absolute top-3 right-3 p-2 glass-effect rounded-full shadow-lg hover:scale-110 transition-all duration-300"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <p className="text-body text-green-400 text-center font-semibold">
                  ✓ Photo captured successfully
                </p>
              </div>
            )}

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 glass-effect border border-red-500/30 rounded-2xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-body text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/20 glass-effect">
          <div className="flex space-x-4">
            <button
              onClick={handleCancel}
              className="flex-1 btn-secondary py-4 px-6"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 btn-primary py-4 px-6 flex items-center justify-center space-x-3 glow"
            >
              <Check className="w-5 h-5" />
              <span>Confirm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 