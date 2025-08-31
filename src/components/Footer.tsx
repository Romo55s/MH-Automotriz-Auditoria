import React from 'react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer
      className={`glass-effect border-t border-white/20 relative z-10 ${className}`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6'>
        <div className='text-center'>
          <p className='text-sm sm:text-base text-secondaryText'>
            © 2024 Car Inventory App. Built with modern web technologies.
          </p>
          <div className='mt-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-secondaryText'>
            <span>React + TypeScript</span>
            <span className='hidden sm:inline'>•</span>
            <span>Tailwind CSS</span>
            <span className='hidden sm:inline'>•</span>
            <span>Auth0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
