import { CheckCircle, ChevronRight, Clock, User } from 'lucide-react';
import React from 'react';
import { MonthlyInventory } from '../../../types';

interface InventoryTableProps {
  inventories: MonthlyInventory[];
  isSessionActive: boolean;
  onContinueInventory: (inventory: MonthlyInventory) => void;
  onDownloadInventory: (inventory: MonthlyInventory) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
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
    <div className='card'>
      <div className='overflow-x-auto'>
        <table className='w-full' style={{ minWidth: '920px' }}>
          <thead>
            <tr className='border-b border-white/20'>
              <th className='px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider' style={{ width: '200px' }}>
                Inventario
              </th>
              <th className='px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider' style={{ width: '120px' }}>
                Estado
              </th>
              <th className='px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider' style={{ width: '180px' }}>
                Creado Por
              </th>
              <th className='px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider' style={{ width: '200px' }}>
                Fecha de Creación
              </th>
              <th className='px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider' style={{ width: '100px' }}>
                Escaneos
              </th>
              <th className='px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider' style={{ width: '140px' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-white/10'>
            {inventories.map((inventory) => (
              <tr key={inventory.id} className='hover:bg-white/5 transition-colors duration-200'>
                <td className='px-4 py-4 whitespace-nowrap' style={{ width: '200px' }}>
                  <div className='flex items-center space-x-3'>
                    <div className='w-8 h-8 rounded-lg flex items-center justify-center border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <Clock className='w-4 h-4 text-white' />
                    </div>
                    <div>
                      <div className='text-sm font-medium text-white'>
                        {inventory.monthName || getMonthName(inventory.month)} {inventory.year}
                      </div>
                      <div className='text-xs text-gray-400'>
                        {inventory.sessionId ? `Sesión: ${inventory.sessionId.slice(-8)}` : 'Inventario mensual'}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className='px-4 py-4 whitespace-nowrap' style={{ width: '120px' }}>
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
                </td>
                
                <td className='px-4 py-4 whitespace-nowrap' style={{ width: '180px' }}>
                  <div className='flex items-center space-x-2'>
                    <User className='w-4 h-4 text-gray-400' />
                    <span className='text-sm text-white'>{inventory.createdBy}</span>
                  </div>
                </td>
                
                <td className='px-4 py-4 whitespace-nowrap' style={{ width: '200px' }}>
                  <div className='text-sm text-white'>{formatDate(inventory.createdAt)}</div>
                </td>
                
                <td className='px-4 py-4 whitespace-nowrap' style={{ width: '100px' }}>
                  <div className='text-sm font-medium text-white'>{inventory.totalScans}</div>
                </td>
                
                <td className='px-4 py-4 whitespace-nowrap' style={{ width: '140px' }}>
                  {inventory.status !== 'Completed' ? (
                    <button
                      onClick={() => onContinueInventory(inventory)}
                      disabled={isSessionActive}
                      className={`text-xs py-2 px-3 flex items-center space-x-2 rounded-lg border transition-all duration-300 font-semibold ${
                        isSessionActive
                          ? 'btn-disabled border-gray-500/30 cursor-not-allowed opacity-50'
                          : 'btn-secondary border-white/30 hover:border-white/50 hover:scale-105'
                      }`}
                      style={{
                        background: isSessionActive
                          ? 'linear-gradient(135deg, rgba(100,100,100,0.3) 0%, rgba(100,100,100,0.2) 100%)'
                          : 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                        backdropFilter: 'blur(20px)'
                      }}
                    >
                      <span>
                        {isSessionActive ? 'Activo' : 'Continuar'}
                      </span>
                      {!isSessionActive && <ChevronRight className='w-3 h-3' />}
                    </button>
                  ) : (
                    <div className='flex items-center justify-center'>
                      <span className='text-sm text-green-400 font-medium flex items-center space-x-1'>
                        <CheckCircle className='w-4 h-4' />
                        <span>Completado</span>
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
