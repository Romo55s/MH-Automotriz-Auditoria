import { Calendar, Database, Play } from 'lucide-react';
import React from 'react';
import { MonthlyInventory } from '../types';

interface MonthlyInventoryTableProps {
  inventories: MonthlyInventory[];
  onContinueInventory: (inventory: MonthlyInventory) => void;
  formatDate: (date: Date) => string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getMonthName: (month: string) => string;
}

const MonthlyInventoryTable: React.FC<MonthlyInventoryTableProps> = ({
  inventories,
  onContinueInventory,
  formatDate,
  getStatusColor,
  getStatusIcon,
  getMonthName,
}) => {
  if (inventories.length === 0) {
    return null;
  }

  return (
    <div className='card'>
      <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-6 sm:mb-8 text-center'>
        Inventarios Mensuales
      </h2>

      {/* Desktop Table View */}
      <div className='hidden lg:block overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-white/20'>
                <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-secondaryText uppercase tracking-wider'>
                  Período
                </th>
                <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-secondaryText uppercase tracking-wider'>
                  Estado
                </th>
                <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-secondaryText uppercase tracking-wider'>
                  Creado por
                </th>
                <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-secondaryText uppercase tracking-wider'>
                  Creado en
                </th>
                <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-secondaryText uppercase tracking-wider'>
                  Escaneos
                </th>
                <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-secondaryText uppercase tracking-wider'>
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-white/10'>
              {inventories.map((inventory, index) => (
                <tr key={index} className='hover:bg-white/5 transition-colors duration-200'>
                  <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                    <div className='flex items-center space-x-2'>
                      <Calendar className='w-4 h-4 text-secondaryText' />
                      <span className='text-sm lg:text-base text-white'>
                        {getMonthName(inventory.month)} {inventory.year}
                      </span>
                    </div>
                  </td>
                  <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                    <div className='flex items-center space-x-2'>
                      {getStatusIcon(inventory.status)}
                      <span className={`text-xs lg:text-sm font-semibold ${getStatusColor(inventory.status)}`}>
                        {inventory.status}
                      </span>
                    </div>
                  </td>
                  <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                    <span className='text-sm lg:text-base text-white'>
                      {inventory.createdBy}
                    </span>
                  </td>
                  <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                    <span className='text-sm lg:text-base text-white'>
                      {formatDate(inventory.createdAt)}
                    </span>
                  </td>
                  <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                    <span className='font-mono text-sm lg:text-base text-white bg-white/10 px-2 lg:px-3 py-1 lg:py-2 rounded-lg'>
                      {inventory.totalScans}
                    </span>
                  </td>
                  <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                    {inventory.status === 'Completed' ? (
                      <span className='text-xs lg:text-sm text-green-400 font-semibold'>
                        Completado
                      </span>
                    ) : (
                      <button
                        onClick={() => onContinueInventory(inventory)}
                        className='btn-secondary text-xs lg:text-sm py-1 lg:py-2 px-2 lg:px-3 flex items-center space-x-1 lg:space-x-2'
                      >
                        <Play className='w-3 h-3 lg:w-4 lg:h-4' />
                        <span>Continuar</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className='lg:hidden space-y-4'>
        {inventories.map((inventory, index) => (
          <div
            key={index}
            className='glass-effect rounded-xl p-4 border border-white/20'
          >
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center space-x-2'>
                <Calendar className='w-4 h-4 text-secondaryText' />
                <span className='text-sm font-semibold text-white'>
                  {getMonthName(inventory.month)} {inventory.year}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                {getStatusIcon(inventory.status)}
                <span className={`text-xs font-semibold ${getStatusColor(inventory.status)}`}>
                  {inventory.status}
                </span>
              </div>
            </div>
            
            <div className='grid grid-cols-2 gap-3 mb-3'>
              <div>
                <span className='text-xs text-secondaryText'>Creado por:</span>
                <div className='text-sm text-white'>{inventory.createdBy}</div>
              </div>
              <div>
                <span className='text-xs text-secondaryText'>Creado en:</span>
                <div className='text-sm text-white'>{formatDate(inventory.createdAt)}</div>
              </div>
            </div>
            
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Database className='w-4 h-4 text-secondaryText' />
                <span className='text-xs text-secondaryText'>Escaneos:</span>
                <span className='font-mono text-sm text-white bg-white/10 px-2 py-1 rounded-lg'>
                  {inventory.totalScans}
                </span>
              </div>
              
              {inventory.status === 'Completed' ? (
                <div className='text-center py-2 px-3'>
                  <span className='text-xs text-green-400 font-semibold'>
                    Completado
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => onContinueInventory(inventory)}
                  className='btn-secondary text-xs py-2 px-3 flex items-center justify-center space-x-1'
                >
                  <Play className='w-3 h-3' />
                  <span>Continuar</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyInventoryTable;
