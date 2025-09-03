import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AlertTriangle, Building2, Calendar, ChevronDown, Play } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { agencies } from '../data/agencies';
import { clearAllSessions, getSessionInfo } from '../utils/sessionManager';
import Footer from './Footer';
import Header from './Header';

const AgencySelector: React.FC = () => {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSessionConflictModal, setShowSessionConflictModal] = useState(false);
  const [conflictAgency, setConflictAgency] = useState<string>('');
  const [pendingAgency, setPendingAgency] = useState<any>(null);

  const { selectedAgency, setSelectedAgency } = useAppContext();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Don't auto-redirect - let user see their selection and choose when to proceed
  // useEffect(() => {
  //   if (selectedAgency) {
  //     navigate('/inventory');
  //   }
  // }, [selectedAgency, navigate]);

  // Initialize dropdown selection when component mounts
  useEffect(() => {
    if (selectedAgency) {
      setSelectedAgencyId(selectedAgency.id);
    }
  }, [selectedAgency]);

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

  // If user already has an agency selected, show a message and option to continue
  if (selectedAgency) {
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

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
          {/* Header */}
          <div className='mt-6 sm:mt-8 mb-6 sm:mb-section'>
            <Header
              title='MH Automotriz'
              subtitle='Agencia ya seleccionada'
              showBackButton={false}
              showUserInfo={true}
            />
          </div>

          {/* Agency Already Selected */}
          <div className='card mb-6 sm:mb-section'>
            <div className='text-center mb-6'>
              <div className='w-20 h-20 glass-effect rounded-full flex items-center justify-center mx-auto mb-6'>
                <Building2 className='w-10 h-10 text-white' />
              </div>
              <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-4'>
                Agencia Ya Seleccionada
              </h2>
              <p className='text-sm sm:text-base text-secondaryText mb-6'>
                Ya has seleccionado <strong className='text-white'>{selectedAgency.name}</strong> como tu agencia.
              </p>
            </div>

            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6'>
              <button
                onClick={() => navigate(`/inventory/${selectedAgency?.name.toLowerCase()}`)}
                className='btn-primary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <Play className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Continuar al Inventario</span>
              </button>
              <button
                onClick={() => navigate(`/monthly-inventories/${selectedAgency?.name.toLowerCase()}`)}
                className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <Calendar className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Gestionar Inventarios</span>
              </button>
            </div>

            <div className='text-center'>
              <button
                onClick={() => {
                  // Check for active sessions before clearing agency
                  const sessions = getSessionInfo();
                  const activeSessions = sessions.filter(session => session.data.isSessionActive);
                  
                  if (activeSessions.length > 0) {
                    setConflictAgency(activeSessions[0].data.agency);
                    setPendingAgency({ agency: null, action: 'clear' });
                    setShowSessionConflictModal(true);
                  } else {
                    setSelectedAgency(null);
                  }
                }}
                className='text-sm text-secondaryText hover:text-white transition-colors underline'
              >
                Seleccionar Diferente Agencia
              </button>
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    );
  }

  // Check for active sessions in other agencies
  const checkForActiveSessions = (targetAgency: any) => {
    const sessions = getSessionInfo();
    const activeSessions = sessions.filter(session => 
      session.data.isSessionActive && 
      session.data.agency !== targetAgency.name
    );
    
    return activeSessions;
  };

  const handleAgencySwitch = (agency: any, action: 'inventory' | 'monthly' | 'clear') => {
    const activeSessions = checkForActiveSessions(agency);
    
    if (activeSessions.length > 0) {
      // Show conflict modal
      setConflictAgency(activeSessions[0].data.agency);
      setPendingAgency({ agency, action });
      setShowSessionConflictModal(true);
    } else {
      // No conflict, proceed normally
      proceedWithAgencySwitch(agency, action);
    }
  };

  const proceedWithAgencySwitch = (agency: any, action: 'inventory' | 'monthly' | 'clear') => {
    if (action === 'clear') {
      setSelectedAgency(null);
    } else {
      setSelectedAgency(agency);
      
      if (action === 'inventory') {
        navigate(`/inventory/${agency.name.toLowerCase()}`);
      } else {
        navigate(`/monthly-inventories/${agency.name.toLowerCase()}`);
      }
    }
  };

  const handleConfirmAgencySwitch = () => {
    if (pendingAgency) {
      // Clear all existing sessions
      clearAllSessions();
      
      // Proceed with the new agency
      proceedWithAgencySwitch(pendingAgency.agency, pendingAgency.action);
      
      // Close modal
      setShowSessionConflictModal(false);
      setPendingAgency(null);
      setConflictAgency('');
    }
  };

  const handleCancelAgencySwitch = () => {
    setShowSessionConflictModal(false);
    setPendingAgency(null);
    setConflictAgency('');
  };

  const handleStartInventory = () => {
    if (!selectedAgencyId) return;

    const agency = agencies.find(a => a.id === selectedAgencyId);
    if (agency) {
      handleAgencySwitch(agency, 'inventory');
    }
  };

  const handleManageInventories = () => {
    if (!selectedAgencyId) return;

    const agency = agencies.find(a => a.id === selectedAgencyId);
    if (agency) {
      handleAgencySwitch(agency, 'monthly');
    }
  };

  const selectedAgencyFromDropdown = agencies.find(a => a.id === selectedAgencyId);

  return (
    <div className='min-h-screen bg-background relative overflow-hidden flex flex-col'>
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

      <div className='flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Header */}
        <div className='mt-6 sm:mt-8 mb-6 sm:mb-section'>
          <Header
            title='MH Automotriz'
            subtitle='Selecciona tu agencia para comenzar'
            showBackButton={false}
            showUserInfo={true}
          />
        </div>

        {/* Agency Selection */}
        <div className='card mb-6 sm:mb-section'>
          <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-6 sm:mb-8 text-center'>
            Elige Tu Agencia
          </h2>

          <div className='relative mb-8 sm:mb-12'>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className='w-full glass-effect rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-left flex items-center justify-between transition-all duration-300 focus:outline-none'
            >
              <span
                className={
                  selectedAgencyId ? 'text-white' : 'text-secondaryText'
                }
              >
                {selectedAgencyId
                  ? selectedAgencyFromDropdown?.name
                  : 'Selecciona una agencia...'}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-secondaryText transition-transform duration-300 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                className='top-full left-0 right-0 mt-2 glass-effect rounded-2xl border border-white/20 max-h-60 overflow-y-auto z-50'
              >
                {agencies.map(agency => (
                  <button
                    key={agency.id}
                    onClick={() => {
                      setSelectedAgencyId(agency.id);
                      setIsDropdownOpen(false);
                    }}
                    className='w-full px-4 sm:px-6 py-3 sm:py-4 text-left hover:bg-white/10 transition-colors first:rounded-t-2xl last:rounded-b-2xl'
                  >
                    <div className='font-semibold text-white'>{agency.name}</div>
                    <div className='text-sm text-secondaryText'>
                      ID: {agency.id}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className='flex flex-col justify-between gap-6 md:flex-row sm:flex-row'>
            <button
              onClick={handleStartInventory}
              disabled={!selectedAgencyId}
              className={`w-full py-3 sm:py-4 px-6 sm:px-8 rounded-pill font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 ${
                selectedAgencyId
                  ? 'btn-primary'
                  : 'bg-border text-secondaryText cursor-not-allowed'
              }`}
            >
              <Play className='w-5 h-5 sm:w-6 sm:h-6' />
              <span>
                {selectedAgencyId
                  ? 'Iniciar Nueva Sesión de Inventario'
                  : 'Por favor selecciona una agencia'}
              </span>
            </button>

            {selectedAgencyId && (
              <button
                onClick={handleManageInventories}
                className='w-full py-3 sm:py-4 px-6 sm:px-8 rounded-pill font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 btn-secondary'
              >
                <Calendar className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Gestionar Inventarios Mensuales</span>
              </button>
            )}
          </div>

          {selectedAgencyFromDropdown && (
            <div className='mt-6 sm:mt-8 p-4 sm:p-6 glass-effect rounded-2xl border border-white/20'>
              <h3 className='font-bold text-white mb-3 sm:mb-4 flex items-center'>
                <Building2 className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                Detalles de la Agencia Seleccionada
              </h3>
              <div className='text-sm sm:text-base text-secondaryText space-y-2'>
                <p>
                  <strong className='text-white'>Nombre:</strong>{' '}
                  {selectedAgencyFromDropdown.name}
                </p>
                <p>
                  <strong className='text-white'>ID:</strong>{' '}
                  {selectedAgencyFromDropdown.id}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className='card mb-6 sm:mb-section'>
          <h3 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-6 sm:mb-8 text-center'>
            Cómo funciona
          </h3>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8'>
            <div className='text-center'>
              <div className='w-14 h-14 sm:w-16 sm:h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4'>
                <span className='text-white font-bold text-lg sm:text-xl'>1</span>
              </div>
              <p className='text-sm sm:text-base text-secondaryText'>
                Selecciona tu agencia
                <br />
                del menú desplegable arriba
              </p>
            </div>
            <div className='text-center'>
              <div className='w-14 h-14 sm:w-16 sm:h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4'>
                <span className='text-white font-bold text-lg sm:text-xl'>2</span>
              </div>
              <p className='text-sm sm:text-base text-secondaryText'>
                Inicia una sesión de inventario
                <br />
                para comenzar a escanear
              </p>
            </div>
            <div className='text-center'>
              <div className='w-14 h-14 sm:w-16 sm:h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4'>
                <span className='text-white font-bold text-lg sm:text-xl'>3</span>
              </div>
              <p className='text-sm sm:text-base text-secondaryText'>
                Escanea códigos de barras y
                <br />
                confirma cada vehículo
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Inventory Info */}
        <div className='card border-blue-500/20 bg-blue-500/10 mb-6 sm:mb-section'>
          <div className='flex items-start space-x-3 sm:space-x-4'>
            <Calendar className='w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-base sm:text-lg font-semibold text-blue-400 mb-2 sm:mb-3'>
                Sistema de Inventarios Mensuales
              </h3>
              <p className='text-sm sm:text-base text-secondaryText mb-3'>
                Cada agencia puede tener un inventario por mes. Usa el botón "Gestionar
                Inventarios Mensuales" para ver inventarios existentes,
                continuar los incompletos, o iniciar nuevas sesiones mensuales.
              </p>
              <div className='p-3 glass-effect border border-blue-500/20 rounded-xl'>
                <p className='text-xs sm:text-sm text-blue-300'>
                  <strong>Nota:</strong> Después de completar un inventario, busca manualmente
                  cada código de barras en el
                  <a
                    href='https://www2.repuve.gob.mx:8443/ciudadania/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-400 hover:text-blue-300 underline mx-1'
                  >
                    REPUVE website
                  </a>
                  para extraer la información completa del vehículo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Session Conflict Modal */}
      {showSessionConflictModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-effect rounded-3xl w-full max-w-md overflow-hidden border border-white/30 shadow-2xl">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-orange-600/20 to-red-600/20 border-b border-white/30 p-6">
              <div className="flex items-center space-x-3">
                <div className="glass-effect rounded-full flex items-center justify-center glow border-2 border-orange-400/20 w-12 h-12">
                  <AlertTriangle className="w-6 h-6 text-orange-300" />
                </div>
                <div>
                  <h2 className="font-bold uppercase tracking-hero leading-heading text-shadow text-xl text-white">
                    Conflicto de Sesión
                  </h2>
                  <p className="text-white/70 text-sm">
                    Sesión activa detectada
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-4">
                  <p className="text-white text-sm">
                    <strong>Tienes una sesión activa en:</strong> <span className="text-orange-300">{conflictAgency}</span>
                  </p>
                </div>
                
                <div className="space-y-3">
                  <p className="text-white/80 text-sm">
                    {pendingAgency?.action === 'clear' 
                      ? 'Al deseleccionar la agencia, se perderá el progreso de la sesión actual.'
                      : `Al cambiar a <strong className="text-white">${pendingAgency?.agency.name}</strong>, se perderá el progreso de la sesión actual.`
                    }
                  </p>
                  
                  <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4">
                    <p className="text-red-200 text-xs">
                      <strong>⚠️ Advertencia:</strong> Los códigos escaneados en la sesión actual se perderán si no han sido guardados en el servidor.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/30 bg-white/5 px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCancelAgencySwitch}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 text-white rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-semibold"
                >
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={handleConfirmAgencySwitch}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-semibold"
                >
                  <span>Continuar de Todos Modos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencySelector;
