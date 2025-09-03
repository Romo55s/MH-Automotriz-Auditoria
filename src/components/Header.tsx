import { useAuth0 } from '@auth0/auth0-react';
import { ArrowLeft, Building2, LogOut, User } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showUserInfo?: boolean;
  showChangeAgency?: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackClick,
  showUserInfo = true,
  showChangeAgency = false,
  className = '',
}) => {
  const { user, logout } = useAuth0();
  const { selectedAgency, setSelectedAgency } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear selected agency when logging out
    setSelectedAgency(null);
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleChangeAgency = () => {
    setSelectedAgency(null);
    navigate('/select-agency');
  };

  return (
    <div
      className={`glass-effect border-b border-white/20 relative z-10 ${className}`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6'>
        {/* Mobile Layout */}
        <div className='block sm:hidden'>
          <div className='space-y-4'>
            {/* Top Row - Back Button and Title */}
            <div className='flex items-center space-x-3'>
              {showBackButton && onBackClick && (
                <button
                  onClick={onBackClick}
                  className='p-3 glass-effect rounded-xl transition-all duration-300 hover:scale-105 flex-shrink-0'
                >
                  <ArrowLeft className='w-6 h-6 text-white' />
                </button>
              )}

              <div className='min-w-0 flex-1'>
                <div className='flex items-center space-x-3'>
                  <img
                    src="/MH Automotriz-White.svg"
                    alt="MH Automotriz Logo"
                    className='w-8 h-8 flex-shrink-0'
                  />
                  <h1 className='text-lg font-bold uppercase tracking-hero leading-heading text-shadow truncate'>
                    {title}
                  </h1>
                </div>
                {subtitle && (
                  <p className='text-sm text-secondaryText truncate mt-1'>{subtitle}</p>
                )}
              </div>
            </div>

            {/* User Profile Section */}
            {showUserInfo && (
              <div className='flex items-center space-x-4 p-4 glass-effect rounded-2xl border border-white/20'>
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user?.name || 'User'}
                    className='w-16 h-16 rounded-full border-3 border-white/30 object-cover flex-shrink-0'
                  />
                ) : (
                  <div className='w-16 h-16 rounded-full bg-white/10 border-3 border-white/30 flex items-center justify-center flex-shrink-0'>
                    <User className='w-8 h-8 text-white' />
                  </div>
                )}
                <div className='flex-1 min-w-0'>
                  <p className='text-white font-semibold text-base truncate'>
                    {user?.name || 'Usuario'}
                  </p>
                  <p className='text-secondaryText text-sm truncate'>
                    {user?.email}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className='grid grid-cols-1 gap-3'>
              {showChangeAgency && selectedAgency && (
                <button
                  onClick={handleChangeAgency}
                  className='btn-secondary text-sm px-4 py-3 flex items-center justify-center space-x-3 hover:scale-105 transition-all duration-300 rounded-xl'
                >
                  <Building2 className='w-5 h-5' />
                  <span>Cambiar Agencia</span>
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className='btn-secondary text-sm px-4 py-3 flex items-center justify-center space-x-3 hover:scale-105 transition-all duration-300 rounded-xl'
              >
                <LogOut className='w-5 h-5' />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className='hidden sm:flex sm:flex-row sm:items-center sm:justify-between gap-6'>
          {/* Left Section - Back Button and Title */}
          <div className='flex items-center space-x-6'>
            {showBackButton && onBackClick && (
              <button
                onClick={onBackClick}
                className='p-3 glass-effect rounded-xl transition-all duration-300 hover:scale-105 flex-shrink-0'
              >
                <ArrowLeft className='w-6 h-6 text-white' />
              </button>
            )}

            <div className='min-w-0 flex-1'>
              <div className='flex items-center space-x-3'>
                <img
                  src="/MH Automotriz-White.svg"
                  alt="MH Automotriz Logo"
                  className='w-8 h-8 flex-shrink-0'
                />
                <h1 className='text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading text-shadow truncate'>
                  {title}
                </h1>
              </div>
              {subtitle && (
                <p className='text-base text-secondaryText truncate'>{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right Section - User Info, Change Agency, and Logout */}
          {showUserInfo && (
            <div className='flex flex-row items-center gap-6'>
              <div className='flex items-center space-x-3 text-secondaryText'>
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user?.name || 'User'}
                    className='w-8 h-8 rounded-full border-2 border-white/20 object-cover'
                  />
                ) : (
                  <div className='w-8 h-8 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center'>
                    <User className='w-4 h-4' />
                  </div>
                )}
                <span className='text-base truncate'>{user?.name || user?.email}</span>
              </div>
              
              {showChangeAgency && selectedAgency && (
                <button
                  onClick={handleChangeAgency}
                  className='btn-secondary text-sm px-4 py-2 flex items-center justify-center hover:scale-105 transition-all duration-300'
                >
                  <Building2 className='w-4 h-4 mr-2' />
                  Cambiar Agencia
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className='btn-secondary text-sm px-4 py-2 flex items-center justify-center hover:scale-105 transition-all duration-300'
              >
                <LogOut className='w-4 h-4 mr-2' />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
