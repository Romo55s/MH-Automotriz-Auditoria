import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Building2, Calendar, ChevronDown, Play } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { agencies } from '../data/agencies';
import Footer from './Footer';
import Header from './Header';

const AgencySelector: React.FC = () => {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { setSelectedAgency } = useAppContext();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Console log Auth0 and context data for debugging
  useEffect(() => {
    // Removed console logs for production
  }, [selectedAgencyId]);

  const handleStartInventory = () => {
    if (!selectedAgencyId) return;

    const agency = agencies.find(a => a.id === selectedAgencyId);
    if (agency) {
      setSelectedAgency(agency);
      navigate('/inventory');
    }
  };

  const handleManageInventories = () => {
    if (!selectedAgencyId) return;

    const agency = agencies.find(a => a.id === selectedAgencyId);
    if (agency) {
      setSelectedAgency(agency);
      navigate('/monthly-inventories');
    }
  };

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId);

  return (
    <div className='min-h-screen bg-background relative overflow-hidden'>
      {/* Floating 3D shapes */}
      <div className='floating-shape w-32 h-32 top-20 right-20'></div>
      <div
        className='floating-shape w-24 h-24 bottom-1/4 left-16'
        style={{ animationDelay: '3s' }}
      ></div>
      <div
        className='floating-shape w-20 h-20 top-1/3 left-1/4'
        style={{ animationDelay: '1s' }}
      ></div>

      <div className='max-w-max mx-auto relative z-10'>
        {/* Header */}
        <div className='mt-8 mb-section'>
          <Header
            title='Car Inventory App'
            subtitle='Select your agency to begin'
            showBackButton={false}
            showUserInfo={true}
          />
        </div>

        {/* Agency Selection */}
        <div className='card mb-section'>
          <h2 className='text-subheading font-bold uppercase tracking-hero leading-heading mb-8 text-center'>
            Choose Your Agency
          </h2>

          <div className='relative mb-12'>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className='w-full glass-effect rounded-2xl px-6 py-4 text-left flex items-center justify-between transition-all duration-300 focus:outline-none'
            >
              <span
                className={
                  selectedAgencyId ? 'text-white' : 'text-secondaryText'
                }
              >
                {selectedAgency ? selectedAgency.name : 'Select an agency...'}
              </span>
              <ChevronDown
                className={`w-6 h-6 text-white transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div
                className='relative top-full left-0 right-0 mt-2 glass-effect rounded-2xl shadow-lg z-50 overflow-y-auto border border-white/20'
                style={{ maxHeight: '300px' }}
                ref={dropdownRef}
              >
                <div className='py-2'>
                  {agencies.map(agency => (
                    <button
                      key={agency.id}
                      onClick={() => {
                        setSelectedAgencyId(agency.id);
                        setIsDropdownOpen(false);
                      }}
                      className='w-full px-6 py-4 text-left hover:bg-white/10 focus:bg-white/10 focus:outline-none transition-colors border-b border-white/10 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl'
                    >
                      <div className='font-semibold text-white text-lg'>
                        {agency.name}
                      </div>
                      <div className='text-sm text-secondaryText'>
                        ID: {agency.id}
                      </div>
                    </button>
                  ))}
                  {agencies.length > 3 && (
                    <div className='px-6 py-3 text-center text-xs text-secondaryText'>
                      Scroll to see more agencies
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='space-y-4'>
            <button
              onClick={handleStartInventory}
              disabled={!selectedAgencyId}
              className={`w-full py-5 px-8 rounded-pill font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                selectedAgencyId
                  ? 'btn-primary'
                  : 'bg-border text-secondaryText cursor-not-allowed'
              }`}
            >
              <Play className='w-6 h-6' />
              <span>
                {selectedAgencyId
                  ? 'Start New Inventory Session'
                  : 'Please select an agency'}
              </span>
            </button>

            {selectedAgencyId && (
              <button
                onClick={handleManageInventories}
                className='w-full py-4 px-8 rounded-pill font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 btn-secondary'
              >
                <Calendar className='w-6 h-6' />
                <span>Manage Monthly Inventories</span>
              </button>
            )}
          </div>

          {selectedAgency && (
            <div className='mt-8 p-6 glass-effect rounded-2xl border border-white/20'>
              <h3 className='font-bold text-white mb-4 flex items-center'>
                <Building2 className='w-5 h-5 mr-2' />
                Selected Agency Details
              </h3>
              <div className='text-secondaryText space-y-2'>
                <p>
                  <strong className='text-white'>Name:</strong>{' '}
                  {selectedAgency.name}
                </p>
                <p>
                  <strong className='text-white'>ID:</strong>{' '}
                  {selectedAgency.id}
                </p>
                <p>
                  <strong className='text-white'>Google Sheet ID:</strong>{' '}
                  {selectedAgency.googleSheetId}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className='card mb-section'>
          <h3 className='text-subheading font-bold uppercase tracking-hero leading-heading mb-8 text-center'>
            How it works
          </h3>
          <div className='grid md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-white font-bold text-xl'>1</span>
              </div>
              <p className='text-body text-secondaryText'>
                Select your agency
                <br />
                from the dropdown above
              </p>
            </div>
            <div className='text-center'>
              <div className='w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-white font-bold text-xl'>2</span>
              </div>
              <p className='text-body text-secondaryText'>
                Start an inventory session
                <br />
                to begin scanning
              </p>
            </div>
            <div className='text-center'>
              <div className='w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-white font-bold text-xl'>3</span>
              </div>
              <p className='text-body text-secondaryText'>
                Scan barcodes and
                <br />
                confirm each vehicle
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Inventory Info */}
        <div className='card border-blue-500/20 bg-blue-500/10'>
          <div className='flex items-start space-x-4'>
            <Calendar className='w-8 h-8 text-blue-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-blue-400 mb-2'>
                Monthly Inventory System
              </h3>
              <p className='text-body text-secondaryText mb-3'>
                Each agency can have one inventory per month. Use the "Manage
                Monthly Inventories" button to view existing inventories,
                continue incomplete ones, or start new monthly sessions.
              </p>
              <div className='p-3 glass-effect border border-blue-500/20 rounded-xl'>
                <p className='text-sm text-blue-300'>
                  <strong>Note:</strong> After completing an inventory, manually
                  search each barcode on the
                  <a
                    href='https://www.repuve.gob.mx/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-400 hover:text-blue-300 underline mx-1'
                  >
                    REPUVE website
                  </a>
                  to extract complete vehicle information.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default AgencySelector;
