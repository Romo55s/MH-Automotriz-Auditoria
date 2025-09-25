import React from 'react';
import { CheckCircle, ChevronRight, Clock, User } from 'lucide-react';
import { MonthlyInventory } from '../../../types';

interface InventoryMobileCardsProps {
  inventories: MonthlyInventory[];
  isSessionActive: boolean;
  onContinueInventory: (inventory: MonthlyInventory) => void;
  onDownloadInventory: (inventory: MonthlyInventory) => void;
}

const InventoryMobileCards: React.FC<InventoryMobileCardsProps> = ({
  inventories,
  isSessionActive,
  onContinueInventory,
  onDownloadInventory
}) => {
  const getMonthName = (month: string) => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthIndex = parseInt(month) - 1;
    return monthNames[monthIndex] || 'Mes Inválido';
  };

  const formatDate = (date: Date) => {
    try {
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  return (
    <div className='lg:hidden space-y-4 p-3 sm:p-4'>
      {inventories.map(inventory => (
        <div
          key={inventory.id}
          className='relative overflow-hidden glass-effect rounded-xl p-4 border border-white/30 transition-all duration-300'
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Decorative elements */}
          <div className='absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-xl'></div>
          <div className='absolute -bottom-3 -left-3 w-10 h-10 bg-gradient-to-tr from-blue-400/20 to-purple-500/20 rounded-full blur-xl'></div>
          
          {/* Header Section */}
          <div className='relative z-10 mb-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 rounded-lg flex items-center justify-center border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <Clock className='w-5 h-5 text-white' />
                </div>
                <div>
                  <h4 className='text-sm font-bold text-white'>
                    {inventory.monthName || getMonthName(inventory.month)} {inventory.year}
                  </h4>
                  <p className='text-xs text-blue-300'>
                    {inventory.sessionId ? `Sesión: ${inventory.sessionId.slice(-8)}` : 'Inventario mensual'}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                inventory.status === 'Completed'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : inventory.status === 'Active'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {inventory.status === 'Completed' ? 'Completado' : 
                 inventory.status === 'Active' ? 'Activo' : 'Pausado'}
              </span>
            </div>
            
            <div className='text-xs text-gray-300 mb-3'>
              {inventory.status === 'Completed' ? 'Inventario Completado' : 
               inventory.status === 'Active' ? 'Inventario Activo' : 'Inventario Pausado'}
            </div>
          </div>
          
          {/* Details Section */}
          <div className='space-y-3 mb-4'>
            <div className='flex items-center justify-between text-xs'>
              <div className='flex items-center space-x-2'>
                <User className='w-3 h-3 text-gray-400' />
                <span className='text-gray-300'>Creado Por:</span>
              </div>
              <span className='text-white font-medium'>{inventory.createdBy}</span>
            </div>
            
            <div className='flex items-center justify-between text-xs'>
              <div className='flex items-center space-x-2'>
                <Clock className='w-3 h-3 text-gray-400' />
                <span className='text-gray-300'>Creado:</span>
              </div>
              <span className='text-white font-medium'>{formatDate(inventory.createdAt)}</span>
            </div>
            
            <div className='flex items-center justify-between text-xs'>
              <div className='flex items-center space-x-2'>
                <span className='text-gray-300'>Total de Escaneos:</span>
              </div>
              <span className='text-white font-medium bg-white/10 px-2 py-1 rounded'>{inventory.totalScans}</span>
            </div>
          </div>
          
          {/* Action Button */}
          <div className='relative z-10'>
            {inventory.status !== 'Completed' ? (
              <button
                onClick={() => onContinueInventory(inventory)}
                disabled={isSessionActive}
                className={`w-full text-xs py-3 px-4 flex items-center justify-center space-x-2 rounded-lg border border-white/30 transition-all duration-300 font-semibold ${
                  isSessionActive
                    ? 'btn-disabled cursor-not-allowed opacity-50'
                    : 'btn-secondary hover:border-white/50 hover:scale-105'
                }`}
                style={{
                  background: isSessionActive
                    ? 'linear-gradient(135deg, rgba(100,100,100,0.3) 0%, rgba(100,100,100,0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <span>
                  {isSessionActive ? 'Inventario Ya Activo' : 'Continuar Inventario'}
                </span>
                {!isSessionActive && <ChevronRight className='w-4 h-4' />}
              </button>
            ) : (
              <div className='w-full text-center py-3 px-4 rounded-lg border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                <span className='text-sm text-green-400 font-medium flex items-center justify-center space-x-2'>
                  <CheckCircle className='w-4 h-4' />
                  <span>Inventario Completado</span>
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InventoryMobileCards;
