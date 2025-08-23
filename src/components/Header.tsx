import React from 'react';
import { ArrowLeft, User, LogOut } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';

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
      <div className='max-w-max mx-auto px-8 py-6'>
        <div className='flex items-center justify-between'>
          {/* Left Section - Back Button and Title */}
          <div className='flex items-center space-x-6'>
            {showBackButton && onBackClick && (
              <button
                onClick={onBackClick}
                className='p-3 glass-effect rounded-xl transition-all duration-300 hover:scale-105'
              >
                <ArrowLeft className='w-6 h-6 text-white' />
              </button>
            )}

            <div>
              <h1 className='text-subheading font-bold uppercase tracking-hero leading-heading text-shadow'>
                {title}
              </h1>
              {subtitle && (
                <p className='text-body text-secondaryText'>{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right Section - User Info and Logout */}
          {showUserInfo && (
            <div className='flex items-center space-x-6'>
              <div className='flex items-center space-x-3 text-secondaryText'>
                <User className='w-5 h-5' />
                <span className='text-body'>{user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className='btn-secondary text-sm px-4 py-2 flex items-center hover:scale-105 transition-all duration-300'
              >
                <LogOut className='w-4 h-4 mr-2' />
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
