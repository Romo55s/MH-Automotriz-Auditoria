import React from 'react';
import { Calendar, Database, RefreshCw } from 'lucide-react';

interface MonthlyInfoCardProps {
  currentMonth: string;
  currentYear: number;
  lastRefresh: Date;
  onRefresh: () => void;
  isLoading: boolean;
}

const MonthlyInfoCard: React.FC<MonthlyInfoCardProps> = ({
  currentMonth,
  currentYear,
  lastRefresh,
  onRefresh,
  isLoading
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
    <div className='card mb-6 sm:mb-section'>
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4'>
        <div className='flex items-center space-x-4'>
          <div className='w-12 h-12 rounded-xl flex items-center justify-center border border-white/30' style={{ background: 'rgba(0,0,0,0.4)' }}>
            <Calendar className='w-6 h-6 text-white' />
          </div>
          <div>
            <h3 className='text-lg sm:text-xl font-bold text-white uppercase tracking-wide'>
              {getMonthName(currentMonth)} {currentYear}
            </h3>
            <p className='text-sm text-gray-300'>Período de inventario actual</p>
          </div>
        </div>
        
        <div className='flex items-center space-x-4'>
          <div className='text-right'>
            <p className='text-xs text-gray-400 uppercase tracking-wide'>Última actualización</p>
            <p className='text-sm text-white font-medium'>{formatDate(lastRefresh)}</p>
          </div>
          
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-3 rounded-xl border transition-all duration-300 ${
              isLoading
                ? 'border-gray-500/30 cursor-not-allowed opacity-50'
                : 'border-white/30 hover:border-white/50 hover:scale-105'
            }`}
            style={{
              background: isLoading
                ? 'rgba(100,100,100,0.3)'
                : 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <RefreshCw className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className='flex items-center space-x-2 text-sm text-blue-300'>
        <Database className='w-4 h-4' />
        <span>Los datos se sincronizan automáticamente con Google Sheets</span>
      </div>
    </div>
  );
};

export default MonthlyInfoCard;
