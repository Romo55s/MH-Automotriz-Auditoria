import { Barcode, CheckSquare, ChevronLeft, ChevronRight, Search, Square, Trash2 } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { ScannedCode } from '../types';

interface ScannedCodesListProps {
  scannedCodes: ScannedCode[];
  onDeleteCode: (index: number) => void;
  onDeleteSelected: (selectedIndices: number[]) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 20;
const MOBILE_ITEMS_PER_PAGE = 10;

const ScannedCodesList: React.FC<ScannedCodesListProps> = ({
  scannedCodes,
  onDeleteCode,
  onDeleteSelected,
  isLoading = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update mobile state on resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter and paginate codes
  const filteredAndPaginatedCodes = useMemo(() => {
    const filtered = scannedCodes.filter(code =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const itemsPerPage = isMobile ? MOBILE_ITEMS_PER_PAGE : ITEMS_PER_PAGE;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCodes = filtered.slice(startIndex, endIndex);

    return {
      codes: paginatedCodes,
      totalPages,
      totalFiltered: filtered.length,
      startIndex
    };
  }, [scannedCodes, searchTerm, currentPage, isMobile]);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Handle selection
  const toggleSelection = useCallback((index: number) => {
    const globalIndex = filteredAndPaginatedCodes.startIndex + index;
    setSelectedIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(globalIndex)) {
        newSet.delete(globalIndex);
      } else {
        newSet.add(globalIndex);
      }
      return newSet;
    });
  }, [filteredAndPaginatedCodes.startIndex]);

  const selectAll = useCallback(() => {
    const allIndices = filteredAndPaginatedCodes.codes.map((_, index) => 
      filteredAndPaginatedCodes.startIndex + index
    );
    setSelectedIndices(new Set(allIndices));
  }, [filteredAndPaginatedCodes.codes, filteredAndPaginatedCodes.startIndex]);

  const clearSelection = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedIndices.size > 0) {
      onDeleteSelected(Array.from(selectedIndices));
      setSelectedIndices(new Set());
    }
  }, [selectedIndices, onDeleteSelected]);

  // Format timestamp
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className='card'>
        <div className='text-center py-8'>
          <div className='w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-secondaryText'>Cargando códigos escaneados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='card'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
        <div>
          <h2 className='text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2'>
            <Barcode className='w-5 h-5 sm:w-6 sm:h-6' />
            CÓDIGOS ESCANEADOS ({scannedCodes.length})
          </h2>
          {searchTerm && (
            <p className='text-sm text-secondaryText'>
              Mostrando {filteredAndPaginatedCodes.totalFiltered} de {scannedCodes.length} códigos
            </p>
          )}
        </div>
        
        <div className='flex items-center gap-2'>
          <span className='text-sm text-secondaryText'>
            Total de escaneos: {scannedCodes.length}
          </span>
        </div>
      </div>

      {/* Search and Controls */}
      <div className='flex flex-col sm:flex-row gap-4 mb-6'>
        {/* Search */}
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondaryText' />
          <input
            type='text'
            placeholder='Buscar código de barras...'
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
          />
        </div>

        {/* Bulk Actions */}
        {selectedIndices.size > 0 && (
          <div className='flex items-center gap-2'>
                         <button
               onClick={handleBulkDelete}
               className='px-4 py-2 bg-white/10 text-white border border-gray-600 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2'
             >
              <Trash2 className='w-4 h-4' />
              Eliminar ({selectedIndices.size})
            </button>
            <button
              onClick={clearSelection}
              className='px-3 py-2 text-secondaryText hover:text-white transition-colors'
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Selection Controls */}
      {filteredAndPaginatedCodes.codes.length > 0 && (
        <div className='flex items-center gap-4 mb-4'>
          <button
            onClick={selectedIndices.size === filteredAndPaginatedCodes.codes.length ? clearSelection : selectAll}
            className='flex items-center gap-2 text-sm text-secondaryText hover:text-white transition-colors'
          >
            {selectedIndices.size === filteredAndPaginatedCodes.codes.length ? (
              <CheckSquare className='w-4 h-4' />
            ) : (
              <Square className='w-4 h-4' />
            )}
            {selectedIndices.size === filteredAndPaginatedCodes.codes.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </button>
        </div>
      )}

      {/* Codes Grid */}
      {filteredAndPaginatedCodes.codes.length === 0 ? (
        <div className='text-center py-8'>
          <p className='text-secondaryText'>
            {searchTerm ? 'No se encontraron códigos que coincidan con la búsqueda' : 'No hay códigos escaneados'}
          </p>
        </div>
      ) : (
        <>
          <div className={`grid gap-3 mb-6 ${
            isMobile 
              ? 'grid-cols-1' 
              : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {filteredAndPaginatedCodes.codes.map((code, index) => {
              const globalIndex = filteredAndPaginatedCodes.startIndex + index;
              const isSelected = selectedIndices.has(globalIndex);
              
              return (
                                 <div
                   key={`${code.code}-${code.timestamp.getTime()}`}
                   className={`relative p-4 bg-gray-800/50 border rounded-lg transition-all duration-200 ${
                     isSelected 
                       ? 'border-white bg-white/10' 
                       : 'border-gray-600 hover:border-gray-500'
                   }`}
                 >
                  {/* Selection Checkbox */}
                  <button
                    onClick={() => toggleSelection(index)}
                    className='absolute top-2 left-2 text-secondaryText hover:text-white transition-colors'
                  >
                                         {isSelected ? (
                       <CheckSquare className='w-4 h-4 text-white' />
                     ) : (
                       <Square className='w-4 h-4' />
                     )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteCode(globalIndex)}
                    className='absolute top-2 right-2 text-red-400 hover:text-red-300 transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>

                                     {/* Code Content */}
                   <div className='pt-6'>
                     <div className='flex items-center gap-2 mb-2'>
                       <Barcode className='w-4 h-4 text-gray-400' />
                       <div className='text-xs text-secondaryText'>
                         #{globalIndex + 1}
                       </div>
                     </div>
                     <div className='text-lg font-mono text-white mb-2 break-all'>
                       {code.code}
                     </div>
                     <div className='text-xs text-secondaryText mb-1'>
                       {formatTime(code.timestamp)}
                     </div>
                     <div className='text-xs text-gray-400'>
                       {code.user}
                     </div>
                   </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {filteredAndPaginatedCodes.totalPages > 1 && (
            <div className='flex items-center justify-between'>
              <div className='text-sm text-secondaryText'>
                Página {currentPage} de {filteredAndPaginatedCodes.totalPages}
              </div>
              
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className='p-2 bg-gray-800 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors'
                >
                  <ChevronLeft className='w-4 h-4' />
                </button>
                
                <div className='flex items-center gap-1'>
                  {Array.from({ length: Math.min(5, filteredAndPaginatedCodes.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(
                      filteredAndPaginatedCodes.totalPages - 4,
                      currentPage - 2
                    )) + i;
                    
                    if (pageNum > filteredAndPaginatedCodes.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-800 text-secondaryText hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(filteredAndPaginatedCodes.totalPages, prev + 1))}
                  disabled={currentPage === filteredAndPaginatedCodes.totalPages}
                  className='p-2 bg-gray-800 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors'
                >
                  <ChevronRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScannedCodesList;
