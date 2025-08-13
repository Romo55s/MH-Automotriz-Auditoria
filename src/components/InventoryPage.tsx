import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAppContext } from '../context/AppContext.tsx';
import BarcodeScanner from './BarcodeScanner.tsx';
import ConfirmationModal from './ConfirmationModal.tsx';
import { 
  Camera, 
  StopCircle, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  User,
  LogOut,
  Download,
  BarChart3
} from 'lucide-react';
import { ScannedCode } from '../types/index.ts';

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth0();
  const { 
    selectedAgency, 
    scannedCodes, 
    addScannedCode, 
    confirmScannedCode,
    clearScannedCodes 
  } = useAppContext();
  
  const [showScanner, setShowScanner] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentScannedCode, setCurrentScannedCode] = useState<string>('');
  const [sessionStartTime] = useState(new Date());
  const [isStopping, setIsStopping] = useState(false);

  // Redirect if no agency is selected
  useEffect(() => {
    if (!selectedAgency) {
      navigate('/select-agency');
    }
  }, [selectedAgency, navigate]);

  const handleScan = (code: string) => {
    setCurrentScannedCode(code);
    setShowScanner(false);
    setShowConfirmation(true);
  };

  const handleConfirmScan = (code: string, photo?: string) => {
    const newScannedCode: ScannedCode = {
      id: Date.now().toString(),
      code,
      timestamp: new Date(),
      photo,
      confirmed: true,
    };
    
    addScannedCode(newScannedCode);
    setShowConfirmation(false);
    setCurrentScannedCode('');
  };

  const handleCancelScan = () => {
    setShowConfirmation(false);
    setCurrentScannedCode('');
  };

  const handleStopInventory = async () => {
    if (scannedCodes.length === 0) {
      alert('No codes scanned yet. Please scan at least one barcode before stopping.');
      return;
    }

    setIsStopping(true);
    
    try {
      // Here you would typically send data to your backend/Google Sheets
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear the session and redirect
      clearScannedCodes();
      navigate('/select-agency');
    } catch (error) {
      console.error('Error stopping inventory:', error);
      alert('Error stopping inventory. Please try again.');
    } finally {
      setIsStopping(false);
    }
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSessionDuration = () => {
    const now = new Date();
    const diff = now.getTime() - sessionStartTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!selectedAgency) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating 3D shapes */}
      <div className="floating-shape w-28 h-28 top-16 right-16"></div>
      <div className="floating-shape w-20 h-20 bottom-1/3 left-20" style={{ animationDelay: '2s' }}></div>
      <div className="floating-shape w-16 h-16 top-1/2 right-1/3" style={{ animationDelay: '4s' }}></div>
      
      {/* Header */}
      <div className="glass-effect border-b border-white/20 relative z-10">
        <div className="max-w-max mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/select-agency')}
                className="p-3 glass-effect rounded-xl hover:scale-105 transition-all duration-300"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-subheading font-bold uppercase tracking-hero leading-heading text-shadow">
                  {selectedAgency.name} - Inventory Session
                </h1>
                <p className="text-body text-secondaryText">
                  Started at {sessionStartTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 text-secondaryText">
                <User className="w-5 h-5" />
                <span className="text-body">{user?.name || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm px-4 py-2"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-max mx-auto px-8 py-section relative z-10">
        {/* Session Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-section">
          <div className="card text-center">
            <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4 glow">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <p className="text-body text-secondaryText mb-2">Session Duration</p>
            <p className="text-2xl font-bold text-white">{getSessionDuration()}</p>
          </div>
          
          <div className="card text-center">
            <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4 glow">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-body text-secondaryText mb-2">Scanned Codes</p>
            <p className="text-2xl font-bold text-white">{scannedCodes.length}</p>
          </div>
          
          <div className="card text-center">
            <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4 glow">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <p className="text-body text-secondaryText mb-2">With Photos</p>
            <p className="text-2xl font-bold text-white">
              {scannedCodes.filter(code => code.photo).length}
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4 glow">
              <Download className="w-8 h-8 text-white" />
            </div>
            <p className="text-body text-secondaryText mb-2">Ready to Export</p>
            <p className="text-2xl font-bold text-white">
              {scannedCodes.filter(code => code.confirmed).length}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card mb-section">
          <div className="flex flex-col sm:flex-row gap-6">
            <button
              onClick={() => setShowScanner(true)}
              className="flex-1 btn-primary text-lg py-5 px-8 flex items-center justify-center space-x-4 glow"
            >
              <Camera className="w-6 h-6" />
              <span>Scan Barcode</span>
            </button>
            
            <button
              onClick={handleStopInventory}
              disabled={isStopping || scannedCodes.length === 0}
              className={`flex-1 text-lg py-5 px-8 rounded-pill font-bold transition-all duration-300 flex items-center justify-center space-x-4 ${
                isStopping || scannedCodes.length === 0
                  ? 'bg-border text-secondaryText cursor-not-allowed'
                  : 'btn-secondary glow'
              }`}
            >
              <StopCircle className="w-6 h-6" />
              <span>{isStopping ? 'Stopping...' : 'Stop Inventory'}</span>
            </button>
          </div>
        </div>

        {/* Scanned Codes Table */}
        {scannedCodes.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-8 py-6 border-b border-white/20">
              <h2 className="text-subheading font-bold uppercase tracking-hero leading-heading flex items-center">
                <BarChart3 className="w-6 h-6 mr-3" />
                Scanned Codes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {scannedCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="font-mono text-lg text-white bg-white/10 px-3 py-1 rounded-lg">
                          {code.code}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-body text-secondaryText">
                        {formatTime(code.timestamp)}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {code.photo ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden glass-effect">
                            <img
                              src={code.photo}
                              alt="Vehicle"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-secondaryText text-body">No photo</span>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-pill text-sm font-semibold ${
                          code.confirmed
                            ? 'bg-white/20 text-white border border-white/30'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}>
                          {code.confirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {scannedCodes.length === 0 && (
          <div className="card text-center">
            <Camera className="w-20 h-20 text-secondaryText mx-auto mb-6 opacity-50" />
            <h3 className="text-subheading font-bold uppercase tracking-hero leading-heading mb-4">
              No codes scanned yet
            </h3>
            <p className="text-body text-secondaryText mb-8 max-w-md mx-auto">
              Start scanning barcodes to build your inventory list
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="btn-primary text-lg px-8 py-4 glow"
            >
              Scan First Barcode
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showConfirmation && (
        <ConfirmationModal
          scannedCode={currentScannedCode}
          onConfirm={handleConfirmScan}
          onCancel={handleCancelScan}
        />
      )}
    </div>
  );
};

export default InventoryPage; 