import { useAuth0 } from '@auth0/auth0-react';
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { uploadCSVFile } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CSVUploadModal: React.FC<CSVUploadModalProps> = ({ isOpen, onClose }) => {
  const { selectedAgency } = useAppContext();
  const { user } = useAuth0();
  const { showSuccess, showError, showInfo } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'generated'>('upload');

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.xlsx')) {
        showError('Por favor selecciona un archivo CSV o Excel (.xlsx)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadAndGenerate = async () => {
    if (!selectedFile || !selectedAgency || !user) return;

    setIsProcessing(true);
    try {
      const response = await uploadCSVFile(
        selectedFile, 
        selectedAgency.name, 
        user.email || '', 
        user.name || ''
      );
      
      setResult(response);
      setStep('generated');
      showSuccess(`Se generaron ${response.result.totalGenerated} códigos QR exitosamente`);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Error al procesar el archivo CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadQRs = async () => {
    if (!result?.result?.sessionId) return;

    try {
      // Create the download URL using the sessionId
      const downloadUrl = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/qr/download/${result.result.sessionId}`;
      
      // Fetch the file as blob
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_Codes_${selectedAgency?.name}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
      showSuccess('Códigos QR descargados exitosamente');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Error al descargar códigos QR');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    setStep('upload');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="glass-effect rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-white/30 shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/30 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/30 rounded-full flex items-center justify-center shadow-lg border-2 border-blue-400/50">
                <FileSpreadsheet className="w-6 h-6 sm:w-8 sm:h-8 text-blue-300" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold uppercase tracking-hero leading-heading text-white mb-1">
                  Generar Códigos QR desde CSV
                </h2>
                <p className="text-xs sm:text-sm text-blue-200 font-medium">
                  Sistema de inventario vehicular
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 sm:p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300 border border-white/20 hover:border-white/40"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {step === 'upload' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 glass-effect rounded-full flex items-center justify-center mx-auto mb-6 glow border-2 border-white/20">
                  <FileSpreadsheet className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold uppercase tracking-hero leading-heading text-white mb-4">
                  Cargar Archivo CSV/Excel
                </h3>
                <p className="text-sm sm:text-base text-secondaryText mb-6">
                  El archivo debe contener las columnas: <span className="text-white font-semibold">serie, marca, color, ubicaciones</span>
                </p>
              </div>

              <div className="glass-effect border-2 border-dashed border-white/30 rounded-2xl p-6 sm:p-8 hover:border-white/50 transition-all duration-300">
                <div className="text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer inline-flex items-center px-6 py-3 border border-white rounded-pill text-sm font-semibold text-white bg-transparent hover:bg-white hover:text-black transition-all duration-300 hover:scale-105"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar Archivo
                  </label>
                  {selectedFile && (
                    <div className="mt-4 p-4 glass-effect rounded-xl border border-white/20">
                      <p className="text-sm text-white font-medium">
                        📄 Archivo seleccionado: <span className="text-blue-300">{selectedFile.name}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedFile && (
                <div className="flex justify-center">
                  <button
                    onClick={handleUploadAndGenerate}
                    disabled={isProcessing}
                    className="inline-flex items-center px-8 py-4 border border-white rounded-pill text-base font-semibold text-black bg-white hover:bg-transparent hover:text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Upload className="mr-2 h-5 w-5" />
                    )}
                    {isProcessing ? 'Procesando...' : 'Generar Códigos QR'}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'generated' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 glass-effect rounded-full flex items-center justify-center mx-auto mb-6 glow border-2 border-green-400/50 bg-green-500/20">
                  <FileSpreadsheet className="w-10 h-10 text-green-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold uppercase tracking-hero leading-heading text-white mb-4">
                  ¡Códigos QR Generados Exitosamente!
                </h3>
                <p className="text-sm sm:text-base text-secondaryText mb-6">
                  Se generaron <span className="text-green-300 font-bold">{result?.result?.totalGenerated || 0}</span> códigos QR listos para descargar
                </p>
              </div>

              <div className="flex justify-center mb-8">
                <button
                  onClick={handleDownloadQRs}
                  className="inline-flex items-center px-8 py-4 border border-white rounded-pill text-base font-semibold text-black bg-white hover:bg-transparent hover:text-white transition-all duration-300 hover:scale-105"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Descargar Códigos QR
                </button>
              </div>

              <div className="glass-effect border border-blue-400/50 rounded-2xl p-6 bg-blue-500/10">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-300 text-sm">ℹ️</span>
                  </div>
                  <div>
                    <h4 className="text-blue-300 font-bold text-sm uppercase tracking-wide mb-2">
                      Información Importante
                    </h4>
                    <p className="text-sm text-blue-200">
                      Los códigos QR contienen la información completa del vehículo (serie, marca, color, ubicaciones) 
                      y pueden ser escaneados directamente para actualizar el inventario automáticamente.
                    </p>
                    <p className="text-sm text-blue-200 mt-2">
                      <span className="font-semibold">Siguiente paso:</span> Necesitan imprimir estos QR's en la impresora Zebra de etiquetas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/30 bg-white/5 px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex justify-center">
            <button
              onClick={handleClose}
              className="px-6 py-3 border border-white rounded-pill text-sm font-semibold text-white bg-transparent hover:bg-white hover:text-black transition-all duration-300 hover:scale-105"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVUploadModal;
