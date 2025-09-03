import { Barcode, CheckSquare, ChevronLeft, ChevronRight, Clock, Search, Square, Trash2, User } from 'lucide-react';
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
      <div className='card' style={{ background: 'rgba(0,0,0,0.6)' }}>
        <div className='text-center py-8'>
          <div className='w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-white'>Cargando códigos escaneados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='card' style={{ background: 'rgba(0,0,0,0.6)' }}>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
        <div>
          <h2 className='text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2'>
            <Barcode className='w-5 h-5 sm:w-6 sm:h-6' />
            CÓDIGOS ESCANEADOS ({scannedCodes.length})
          </h2>
          {searchTerm && (
            <p className='text-sm text-white'>
              Mostrando {filteredAndPaginatedCodes.totalFiltered} de {scannedCodes.length} códigos
            </p>
          )}
        </div>
        
        <div className='flex items-center gap-2'>
          <span className='text-sm text-white'>
            Total de escaneos: {scannedCodes.length}
          </span>
        </div>
      </div>

      {/* Search and Controls */}
      <div className='flex flex-col sm:flex-row gap-4 mb-6'>
        {/* Search */}
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white' />
          <input
            type='text'
            placeholder='Buscar código de barras...'
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className='w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-white/60 focus:outline-none border border-white/30 transition-all duration-300'
            style={{ background: 'rgba(0,0,0,0.4)' }}
          />
        </div>

        {/* Bulk Actions */}
        {selectedIndices.size > 0 && (
          <div className='flex items-center gap-2'>
            <button
              onClick={handleBulkDelete}
              className='px-4 py-3 text-white border border-white/30 rounded-xl hover:border-white/50 transition-all duration-300 flex items-center gap-2 font-semibold'
              style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)' }}
            >
              <Trash2 className='w-4 h-4' />
              Eliminar ({selectedIndices.size})
            </button>
            <button
              onClick={clearSelection}
              className='px-3 py-3 text-white hover:text-white/80 transition-colors'
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
            className='flex items-center gap-2 text-sm text-white hover:text-white/80 transition-colors'
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
          <p className='text-white'>
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
                  className={`relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                    isSelected 
                      ? 'border-white/50' 
                      : 'border-white/30 hover:border-white/50'
                  }`}
                  style={{
                    background: isSelected 
                      ? 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)'
                      : 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)'
                  }}
                >
                  {/* Decorative Background Elements */}
                  <div className='absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-xl'></div>
                  <div className='absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-tr from-blue-400/20 to-purple-500/20 rounded-full blur-xl'></div>
                  
                  {/* Selection Checkbox */}
                  <button
                    onClick={() => toggleSelection(index)}
                    className='absolute top-3 left-3 text-white hover:text-white/80 transition-colors z-10'
                  >
                    {isSelected ? (
                      <CheckSquare className='w-5 h-5 text-white' />
                    ) : (
                      <Square className='w-5 h-5' />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteCode(globalIndex)}
                    className='absolute top-3 right-3 text-red-400 hover:text-red-300 transition-colors z-10'
                  >
                    <Trash2 className='w-5 h-5' />
                  </button>

                  {/* Code Content */}
                  <div className='relative z-10 pt-8'>
                    <div className='flex items-center gap-3 mb-4'>
                      <div className='w-10 h-10 rounded-lg flex items-center justify-center border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                        <Barcode className='w-5 h-5 text-white' />
                      </div>
                      <div className='text-sm text-white font-medium'>
                        #{globalIndex + 1}
                      </div>
                    </div>
                    
                    <div className='text-lg font-mono text-white mb-4 break-all bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent'>
                      {code.code}
                    </div>
                    
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <Clock className='w-4 h-4 text-white' />
                        <span className='text-sm text-white'>
                          {formatTime(code.timestamp)}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <User className='w-4 h-4 text-white' />
                        <span className='text-sm text-white truncate'>
                          {code.user}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {filteredAndPaginatedCodes.totalPages > 1 && (
            <div className='flex items-center justify-between'>
              <div className='text-sm text-white'>
                Página {currentPage} de {filteredAndPaginatedCodes.totalPages}
              </div>
              
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className='p-3 border border-white/30 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/50 transition-all duration-300'
                  style={{ background: 'rgba(0,0,0,0.4)' }}
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
                        className={`px-4 py-2 text-sm rounded-xl transition-all duration-300 ${
                          currentPage === pageNum
                            ? 'text-white border border-white/50'
                            : 'text-white border border-white/30 hover:border-white/50'
                        }`}
                        style={{
                          background: currentPage === pageNum 
                            ? 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)'
                            : 'rgba(0,0,0,0.4)'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(filteredAndPaginatedCodes.totalPages, prev + 1))}
                  disabled={currentPage === filteredAndPaginatedCodes.totalPages}
                  className='p-3 border border-white/30 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/50 transition-all duration-300'
                  style={{ background: 'rgba(0,0,0,0.4)' }}
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
