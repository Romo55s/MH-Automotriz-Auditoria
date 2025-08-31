import { useAuth0 } from '@auth0/auth0-react';
import { ArrowLeft, LogOut, User } from 'lucide-react';
import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showUserInfo?: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBackClick,
  showUserInfo = true,
  className = '',
}) => {
  const { user, logout } = useAuth0();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <div
      className={`glass-effect border-b border-white/20 relative z-10 ${className}`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6'>
          {/* Left Section - Back Button and Title */}
          <div className='flex items-center space-x-3 sm:space-x-6'>
            {showBackButton && onBackClick && (
              <button
                onClick={onBackClick}
                className='p-2 sm:p-3 glass-effect rounded-xl transition-all duration-300 hover:scale-105 flex-shrink-0'
              >
                <ArrowLeft className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
              </button>
            )}

            <div className='min-w-0 flex-1'>
              <h1 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading text-shadow truncate'>
                {title}
              </h1>
              {subtitle && (
                <p className='text-sm sm:text-base text-secondaryText truncate'>{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right Section - User Info and Logout */}
          {showUserInfo && (
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6'>
              <div className='flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 text-secondaryText'>
                <User className='w-4 h-4 sm:w-5 sm:h-5' />
                <span className='text-sm sm:text-base truncate'>{user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className='btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2 flex items-center justify-center hover:scale-105 transition-all duration-300'
              >
                <LogOut className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
