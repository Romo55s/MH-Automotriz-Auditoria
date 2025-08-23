import React from 'react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer
      className={`glass-effect border-t border-white/20 relative z-10 ${className}`}
    >
      <div className='max-w-max mx-auto px-8 py-6'>
        <div className='text-center'>
          <p className='text-body text-secondaryText'>
            © 2024 Car Inventory App. Built with modern web technologies.
          </p>
          <div className='mt-2 flex items-center justify-center space-x-4 text-sm text-secondaryText'>
            <span>React + TypeScript</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Auth0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
