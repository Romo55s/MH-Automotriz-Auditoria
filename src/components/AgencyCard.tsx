import { Building2, ChevronDown } from 'lucide-react';
import React from 'react';
import { Agency } from '../types';

interface AgencyCardProps {
  agency: Agency;
  isSelected: boolean;
  onClick: () => void;
  isDropdownOpen?: boolean;
  onToggleDropdown?: () => void;
  showDropdown?: boolean;
}

const AgencyCard: React.FC<AgencyCardProps> = ({
  agency,
  isSelected,
  onClick,
  isDropdownOpen = false,
  onToggleDropdown,
  showDropdown = false,
}) => {
  return (
    <div className='glass-effect rounded-2xl p-4 sm:p-6 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3 sm:space-x-4'>
          <div className='w-10 h-10 sm:w-12 sm:h-12 glass-effect rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300'>
            <Building2 className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
          </div>
          <div>
            <h3 className='text-base sm:text-lg font-semibold text-white group-hover:text-blue-300 transition-colors duration-300'>
              {agency.name}
            </h3>
            <p className='text-xs sm:text-sm text-secondaryText'>
              Agencia de vehículos
            </p>
          </div>
        </div>
        
        {showDropdown ? (
          <button
            onClick={onToggleDropdown}
            className='p-2 glass-effect rounded-xl hover:scale-105 transition-all duration-300'
          >
            <ChevronDown
              className={`w-4 h-4 sm:w-5 sm:h-5 text-secondaryText transition-transform duration-300 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        ) : (
          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all duration-300 ${
            isSelected 
              ? 'bg-blue-500 border-blue-500' 
              : 'border-white/30 group-hover:border-white/60'
          }`}>
            {isSelected && (
              <div className='w-full h-full rounded-full bg-white scale-50'></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyCard;
