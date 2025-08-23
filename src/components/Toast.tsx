import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'error':
        return <XCircle className='w-5 h-5 text-red-500' />;
      case 'warning':
        return <AlertCircle className='w-5 h-5 text-yellow-500' />;
      case 'info':
        return <AlertCircle className='w-5 h-5 text-blue-500' />;
      default:
        return <AlertCircle className='w-5 h-5 text-gray-500' />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-500/50 text-white';
      case 'error':
        return 'bg-red-900/90 border-red-500/50 text-white';
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-500/50 text-white';
      case 'info':
        return 'bg-blue-900/90 border-blue-500/50 text-white';
      default:
        return 'bg-gray-900/90 border-gray-500/50 text-white';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out`}
    >
      <div className='flex items-start space-x-3'>
        <div className='flex-shrink-0'>{getIcon()}</div>
        <div className='flex-1 min-w-0'>
          <h4 className='text-sm font-medium text-white'>{title}</h4>
          {message && <p className='mt-1 text-sm text-gray-300'>{message}</p>}
        </div>
        <div className='flex-shrink-0'>
          <button
            onClick={() => onClose(id)}
            className='inline-flex text-gray-400 hover:text-white focus:outline-none focus:text-white'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
