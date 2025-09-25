import { useAuth0 } from '@auth0/auth0-react';
import { FileSpreadsheet, Printer, QrCode, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContext';
import { Footer, Header } from '../../common/display';
import { CSVUploadModal } from '../../common/modals';

const InventoryQRPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const { selectedAgency } = useAppContext();
  const [showCSVUpload, setShowCSVUpload] = useState(false);

  // Redirect if no agency selected
  if (!selectedAgency) {
    navigate('/select-agency');
    return null;
  }

  return (
    <div className='min-h-screen bg-background relative overflow-hidden'>
      {/* Floating 3D shapes */}
      <div className='floating-shape w-32 h-32 top-20 right-20'></div>
      <div
        className='floating-shape w-24 h-24 bottom-1/4 left-16'
        style={{ animationDelay: '3s' }}
      ></div>
      <div
        className='floating-shape w-20 h-20 top-1/3 left-1/4'
        style={{ animationDelay: '1s' }}
      ></div>

      <div className='flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Header */}
        <div className='mt-6 sm:mt-8 mb-6 sm:mb-section'>
          <Header
            title='MH Automotriz'
            subtitle='Generador de códigos QR para inventario vehicular'
            showBackButton={true}
            onBackClick={() => navigate('/select-agency')}
            showUserInfo={true}
          />
        </div>
        {/* Main Content Card */}
        <div className='card mb-6 sm:mb-section'>
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 glass-effect rounded-full flex items-center justify-center mx-auto mb-6 glow border-2 border-white/20">
              <QrCode className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-hero leading-heading text-white mb-4">
              Generador de Códigos QR
            </h1>
            <p className="text-lg sm:text-xl text-secondaryText max-w-2xl mx-auto">
              Crea códigos QR para el inventario de vehículos desde archivos CSV
            </p>
          </div>

          {/* Instructions Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            
            {/* Step 1 */}
            <div className="glass-effect rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wide text-white mb-3">
                  1. Subir CSV
                </h3>
                <p className="text-sm text-secondaryText">
                  Carga un archivo CSV con los datos de los vehículos: serie, marca, color, ubicaciones
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-effect rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wide text-white mb-3">
                  2. Generar QR
                </h3>
                <p className="text-sm text-secondaryText">
                  El sistema genera automáticamente códigos QR con toda la información del vehículo
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-effect rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                  <Printer className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wide text-white mb-3">
                  3. Imprimir
                </h3>
                <p className="text-sm text-secondaryText">
                  Imprime los códigos QR en la impresora Zebra de etiquetas y pégalos en los vehículos
                </p>
              </div>
            </div>
          </div>

          {/* Requirements Section */}
          <div className="glass-effect rounded-2xl p-8 border border-white/20 mb-12">
            <h3 className="text-xl font-bold uppercase tracking-wide text-white mb-6 text-center">
              Formato del Archivo CSV
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Columnas Requeridas:</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 glass-effect rounded-lg border border-white/10">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">S</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">serie</p>
                      <p className="text-xs text-secondaryText">Número de serie del vehículo (17 caracteres)</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 glass-effect rounded-lg border border-white/10">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">M</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">marca</p>
                      <p className="text-xs text-secondaryText">Marca del vehículo (Toyota, Honda, etc.)</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 glass-effect rounded-lg border border-white/10">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">C</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">color</p>
                      <p className="text-xs text-secondaryText">Color del vehículo (Blanco, Rojo, etc.)</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 glass-effect rounded-lg border border-white/10">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">U</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">ubicaciones</p>
                      <p className="text-xs text-secondaryText">Ubicación física (Lote A-1, Área B, etc.)</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Ejemplo:</h4>
                <div className="glass-effect rounded-lg p-4 border border-white/10 bg-black/20">
                  <pre className="text-xs text-white font-mono">
{`serie,marca,color,ubicaciones
1HGCM82633A001234,Honda,Blanco,Lote A-1
2T1BURHE0JC002345,Toyota,Azul,Área B-2
3VW3AW7AJ0K003456,Volkswagen,Rojo,Lote C-3`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={() => setShowCSVUpload(true)}
              className="inline-flex items-center px-12 py-6 border border-white rounded-pill text-lg font-bold text-black bg-white hover:bg-transparent hover:text-white transition-all duration-300 hover:scale-105 shadow-2xl"
            >
              <FileSpreadsheet className="mr-3 h-6 w-6" />
              Generar Códigos QR para Inventario
            </button>
          </div>

          {/* Important Notice */}
          <div className="mt-12 glass-effect border border-white/30 rounded-2xl p-6 bg-white/5">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm">⚠️</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-2">
                  Importante
                </h4>
                <ul className="text-sm text-secondaryText space-y-2">
                  <li>• Los códigos QR generados contienen toda la información del vehículo</li>
                  <li>• Cada QR es único para un vehículo específico</li>
                  <li>• Imprimir en etiquetas resistentes al agua y sol</li>
                  <li>• Usar la impresora Zebra configurada para etiquetas de inventario</li>
                  <li>• Pegar los QR en lugares visibles y accesibles del vehículo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={showCSVUpload}
        onClose={() => setShowCSVUpload(false)}
      />
    </div>
  );
};

export default InventoryQRPage;
