import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useAppContext } from '../context/AppContext.tsx';
import { agencies } from '../data/agencies.ts';
import { Car, ChevronDown, LogOut, User, Building2, Play } from 'lucide-react';

const AgencySelector: React.FC = () => {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth0();
  const { setSelectedAgency } = useAppContext();
  const navigate = useNavigate();

  // Console log Auth0 and context data for debugging
  useEffect(() => {
    console.log('🏢 AgencySelector Component Data:', {
      user,
      selectedAgencyId,
      agencies: agencies.length,
      timestamp: new Date().toISOString()
    });
  }, [user, selectedAgencyId]);

  const handleStartInventory = () => {
    if (!selectedAgencyId) return;
    
    const agency = agencies.find(a => a.id === selectedAgencyId);
    if (agency) {
      setSelectedAgency(agency);
      navigate('/inventory');
    }
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating 3D shapes */}
      <div className="floating-shape w-32 h-32 top-20 right-20"></div>
      <div className="floating-shape w-24 h-24 bottom-1/4 left-16" style={{ animationDelay: '3s' }}></div>
      <div className="floating-shape w-20 h-20 top-1/3 left-1/4" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-max mx-auto relative z-10">
        {/* Header */}
        <div className="card mt-8 mb-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center glow">
                <Car className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-section font-bold uppercase tracking-hero leading-heading text-shadow">
                  Car Inventory App
                </h1>
                <p className="text-subheading text-secondaryText">Select your agency to begin</p>
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

        {/* Agency Selection */}
        <div className="card mb-section">
          <h2 className="text-subheading font-bold uppercase tracking-hero leading-heading mb-8 text-center">
            Choose Your Agency
          </h2>
          
          <div className="relative mb-8">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full glass-effect rounded-2xl px-6 py-4 text-left flex items-center justify-between hover:scale-105 transition-all duration-300 focus:outline-none"
            >
              <span className={selectedAgencyId ? 'text-white' : 'text-secondaryText'}>
                {selectedAgency ? selectedAgency.name : 'Select an agency...'}
              </span>
              <ChevronDown className={`w-6 h-6 text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 glass-effect rounded-2xl shadow-lg z-20 max-h-60 overflow-y-auto">
                {agencies.map((agency) => (
                  <button
                    key={agency.id}
                    onClick={() => {
                      setSelectedAgencyId(agency.id);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-6 py-4 text-left hover:bg-white/10 focus:bg-white/10 focus:outline-none transition-colors border-b border-white/10 last:border-b-0"
                  >
                    <div className="font-semibold text-white text-lg">{agency.name}</div>
                    <div className="text-sm text-secondaryText">ID: {agency.id}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleStartInventory}
            disabled={!selectedAgencyId}
            className={`w-full py-5 px-8 rounded-pill font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
              selectedAgencyId
                ? 'btn-primary glow'
                : 'bg-border text-secondaryText cursor-not-allowed'
            }`}
          >
            <Play className="w-6 h-6" />
            <span>{selectedAgencyId ? 'Start Inventory Session' : 'Please select an agency'}</span>
          </button>

          {selectedAgency && (
            <div className="mt-8 p-6 glass-effect rounded-2xl border border-white/20">
              <h3 className="font-bold text-white mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Selected Agency Details
              </h3>
              <div className="text-secondaryText space-y-2">
                <p><strong className="text-white">Name:</strong> {selectedAgency.name}</p>
                <p><strong className="text-white">ID:</strong> {selectedAgency.id}</p>
                <p><strong className="text-white">Google Sheet ID:</strong> {selectedAgency.googleSheetId}</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="card mb-section">
          <h3 className="text-subheading font-bold uppercase tracking-hero leading-heading mb-8 text-center">
            How it works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4 glow">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <p className="text-body text-secondaryText">Select your agency from the dropdown above</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4 glow">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <p className="text-body text-secondaryText">Start an inventory session to begin scanning</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4 glow">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <p className="text-body text-secondaryText">Scan barcodes and confirm each vehicle</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencySelector; 