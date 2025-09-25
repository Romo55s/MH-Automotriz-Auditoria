import { Calendar, Clock, Download, FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface InventoryFile {
  inventoryId: string;
  displayName: string;
  inventoryNumber: number;
  creationDate: string;
  size: number;
  fileId: string;
  sessionId: string;
}

interface MultipleInventorySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInventory: (inventoryId: string) => void;
  agency: string;
  month: string;
  year: number;
  fileType: 'csv' | 'xlsx';
}

const MultipleInventorySelector: React.FC<MultipleInventorySelectorProps> = ({
  isOpen,
  onClose,
  onSelectInventory,
  agency,
  month,
  year,
  fileType
}) => {
  const [inventories, setInventories] = useState<InventoryFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInventories();
    }
  }, [isOpen, agency, month, year]);

  const loadInventories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Import the API function
      const { getStoredFiles } = await import('../../../services/api');
      
      // Get stored files from Google Drive for this agency
      const response = await getStoredFiles(agency);
      
      // Filter files by month and year
      const filteredFiles = response.files?.filter((file: any) => {
        const fileName = file.name || '';
        const fileDate = fileName.split('_')[0]; // Extract date from filename like "2025-09-25_Jac_September_2025_4c4bc98e.csv"
        
        // Check if the file matches the requested month and year
        const fileYear = fileDate.split('-')[0];
        const fileMonth = fileDate.split('-')[1];
        
        return fileYear === year.toString() && fileMonth === month;
      }) || [];
      
      // Transform the files to match our interface
      const transformedInventories = filteredFiles.map((file: any, index: number) => {
        const fileName = file.name || '';
        const parts = fileName.split('_');
        const sessionId = parts[parts.length - 1]?.replace('.csv', '') || '';
        
        return {
          inventoryId: file.id,
          displayName: `${parts[2]} ${parts[3]} - ${sessionId.slice(-8)}`, // Show month, year, and last 8 chars of session ID
          inventoryNumber: index + 1,
          creationDate: file.createdTime || file.modifiedTime || new Date().toISOString(),
          size: file.size || 0,
          fileId: file.id,
          sessionId: sessionId
        };
      });
      
      setInventories(transformedInventories);
    } catch (err) {
      console.error('Error loading inventories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventories');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSpecific = async (inventoryId: string) => {
    try {
      onSelectInventory(inventoryId);
      onClose();
    } catch (error) {
      console.error('Error downloading specific inventory:', error);
      setError('Failed to download inventory');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'>
      <div 
        className='max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-2xl border'
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #333333',
          boxShadow: '0px 4px 20px rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className='text-center mb-6'>
          <div 
            className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              border: '1px solid #333333'
            }}
          >
            <FileText className='w-8 h-8 text-white' />
          </div>
          <h3 className='text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wide'>
            Seleccionar Inventario para Descargar
          </h3>
          <p className='text-sm text-gray-300'>
            {agency} - {month}/{year} - Formato: {fileType.toUpperCase()}
          </p>
          <p className='text-xs text-blue-300 mt-2'>
            💡 Cada inventario tiene un número diferente de códigos escaneados. Elige el que necesitas.
          </p>
        </div>

        {loading ? (
          <div className='text-center py-8'>
            <div className='w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
            <p className='text-white'>Cargando inventarios disponibles...</p>
          </div>
        ) : error ? (
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <FileText className='w-8 h-8 text-red-400' />
            </div>
            <p className='text-red-400 mb-4'>{error}</p>
            <button
              onClick={loadInventories}
              className='btn-primary text-sm py-2 px-4 rounded-lg'
            >
              Reintentar
            </button>
          </div>
        ) : inventories.length === 0 ? (
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <FileText className='w-8 h-8 text-gray-400' />
            </div>
            <p className='text-gray-400 mb-4'>No se encontraron inventarios para esta ubicación y período.</p>
            <button
              onClick={onClose}
              className='btn-secondary text-sm py-2 px-4 rounded-lg'
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className='space-y-4 mb-6'>
            <div className='text-center mb-4'>
              <p className='text-sm text-gray-300'>
                Se encontraron {inventories.length} inventario{inventories.length !== 1 ? 's' : ''} disponible{inventories.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {inventories.map((inventory) => (
                <div
                  key={inventory.inventoryId}
                  className='p-4 rounded-xl border transition-all duration-300 hover:scale-105'
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.05) 100%)',
                    border: '1px solid rgba(59,130,246,0.3)'
                  }}
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 rounded-lg flex items-center justify-center border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                        <Calendar className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <h4 className='text-sm font-bold text-white'>{inventory.displayName}</h4>
                        <p className='text-xs text-blue-300'>Sesión: {inventory.sessionId}</p>
                      </div>
                    </div>
                    <span className='text-xs text-gray-400'>#{inventory.inventoryNumber}</span>
                  </div>
                  
                  <div className='space-y-2 mb-4'>
                    <div className='flex items-center justify-between text-xs'>
                      <div className='flex items-center space-x-2'>
                        <Clock className='w-3 h-3 text-gray-400' />
                        <span className='text-gray-300'>Creado:</span>
                      </div>
                      <span className='text-white font-medium'>{formatDate(inventory.creationDate)}</span>
                    </div>
                    
                    <div className='flex items-center justify-between text-xs'>
                      <div className='flex items-center space-x-2'>
                        <FileText className='w-3 h-3 text-gray-400' />
                        <span className='text-gray-300'>Tamaño:</span>
                      </div>
                      <span className='text-white font-medium'>{formatFileSize(inventory.size)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDownloadSpecific(inventory.inventoryId)}
                    className='w-full btn-primary text-xs py-2 px-3 flex items-center justify-center space-x-2 rounded-lg transition-all duration-300 hover:scale-105'
                    style={{
                      background: 'linear-gradient(120deg, #10b981 0%, #059669 100%)',
                      fontWeight: '600'
                    }}
                  >
                    <Download className='w-3 h-3' />
                    <span>Descargar {fileType.toUpperCase()}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='flex justify-center'>
          <button
            onClick={onClose}
            className='text-sm py-3 px-6 flex items-center justify-center space-x-2 rounded-full font-semibold transition-all duration-300 hover:scale-105'
            style={{
              background: 'transparent',
              border: '1px solid #fff',
              color: '#fff',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#fff';
            }}
          >
            <span>Cancelar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultipleInventorySelector;
