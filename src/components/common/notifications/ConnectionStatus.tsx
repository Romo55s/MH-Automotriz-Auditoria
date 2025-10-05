import { Wifi, WifiOff } from 'lucide-react';
import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionError: string | null;
  onReconnect: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  connectionError,
  onReconnect,
}) => {
  if (!connectionError && isConnected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="glass-effect rounded-lg p-3 border border-white/20 shadow-lg">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400">Conectado</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-orange-400" />
              <div className="flex flex-col">
                <span className="text-xs text-orange-400">Desconectado</span>
                {connectionError && (
                  <button
                    onClick={onReconnect}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Reconectar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;
