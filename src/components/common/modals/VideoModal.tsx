import { motion } from 'framer-motion';
import { Play, X } from 'lucide-react';
import React from 'react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  title?: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ 
  isOpen, 
  onClose, 
  videoUrl, 
  title = "Demo del Sistema" 
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-black rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>
        
        <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title={title}
              className="w-full h-full rounded-xl"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <div className="text-center p-12">
              <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="w-12 h-12 text-black ml-1" />
              </div>
              <h4 className="text-2xl font-bold mb-4">Video Demo</h4>
              <p className="text-gray-300 mb-6 max-w-md mx-auto">
                Aquí se mostrará el video explicativo del funcionamiento del sistema de inventario automotriz.
              </p>
              <div className="bg-gray-800 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-400 mb-2">Para agregar tu video:</p>
                <ol className="text-sm text-gray-300 text-left space-y-1">
                  <li>1. Sube tu video a YouTube o Vimeo</li>
                  <li>2. Copia la URL del video</li>
                  <li>3. Pásala como prop 'videoUrl' al componente</li>
                </ol>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {videoUrl ? 'Video explicativo del sistema' : 'Reemplaza este contenido con tu video real'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VideoModal;
