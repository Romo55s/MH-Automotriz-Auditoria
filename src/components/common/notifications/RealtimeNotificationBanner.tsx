import { AlertCircle, CheckCircle, Info, RefreshCw, X } from 'lucide-react';
import React from 'react';

interface RealtimeNotificationBannerProps {
  isVisible: boolean;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  onRefresh?: () => void;
  showRefreshButton?: boolean;
}

const RealtimeNotificationBanner: React.FC<RealtimeNotificationBannerProps> = ({
  isVisible,
  type,
  title,
  message,
  onClose,
  onRefresh,
  showRefreshButton = false,
}) => {
  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'bg-orange-500/10 border-orange-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full animate-slide-in-right`}>
      <div className={`glass-effect rounded-xl p-4 border ${getBackgroundColor()} shadow-lg`}>
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white mb-1">
              {title}
            </h4>
            <p className="text-xs text-secondaryText mb-3">
              {message}
            </p>
            <div className="flex items-center space-x-2">
              {showRefreshButton && onRefresh && (
                <button
                  onClick={onRefresh}
                  className="btn-primary text-xs py-1 px-3 flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Recargar</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="btn-secondary text-xs py-1 px-3 flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeNotificationBanner;
