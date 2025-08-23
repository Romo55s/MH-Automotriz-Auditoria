import { useAuth0 } from '@auth0/auth0-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useInventory } from '../hooks/useInventory';
import { checkMonthlyInventory, getAgencyInventories } from '../services/api';
import { MonthlyInventory } from '../types/index';
import BarcodeScanner from './BarcodeScanner';
import ConfirmationModal from './ConfirmationModal';
import Footer from './Footer';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';
import ManualInputModal from './ManualInputModal';

import {
  AlertCircle,
  BarChart3,
  Calendar,
  Camera,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Info,
  Pause,
  Play,
  QrCode,
  RefreshCw,
  RotateCcw,
  StopCircle,
  User,
  X
} from 'lucide-react';

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const { selectedAgency } = useAppContext();
  const {
    scannedCodes,
    isLoading,
    error,
    isSessionActive,
    currentMonth,
    currentYear,
    monthName,
    sessionId,
    addScannedCode,
    finishInventorySession,
    pauseInventorySession,
    startSession,
    continueSession,
    clearError,
  } = useInventory();
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  const [showScanner, setShowScanner] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showStopOptions, setShowStopOptions] = useState(false);
  const [currentScannedCode, setCurrentScannedCode] = useState<string>('');
  const [sessionStartTime] = useState(new Date());

  // Monthly inventory management state
  const [inventories, setInventories] = useState<MonthlyInventory[]>([]);
  const [isLoadingInventories, setIsLoadingInventories] = useState(false);
  const [inventoriesError, setInventoriesError] = useState<string | null>(null);

  // Redirect if no agency is selected
  useEffect(() => {
    if (!selectedAgency) {
      navigate('/select-agency');
    }
  }, [selectedAgency, navigate]);

  // Load agency inventories when component mounts
  useEffect(() => {
    console.log('🔄 useEffect triggered:', {
      selectedAgency: selectedAgency?.name,
      currentMonth,
      currentYear
    });
    
    if (selectedAgency) {
      loadInventories();
    }
  }, [selectedAgency]);

  // Load agency inventories
  const loadInventories = async () => {
    if (!selectedAgency) return;

    console.log('🔄 Loading inventories for agency:', selectedAgency.name);
    setIsLoadingInventories(true);
    setInventoriesError(null);
    
    try {
      const response = await getAgencyInventories(selectedAgency.name);
      console.log('📡 API Response:', response);
      
      if (response.success && response.data) {
        const inventories = response.data.inventories || [];
        console.log('📋 Setting inventories:', inventories);
        setInventories(inventories);
      } else {
        throw new Error(response.message || 'Failed to load inventories');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load inventories';
      console.error('❌ Error loading inventories:', err);
      setInventoriesError(errorMessage);
    } finally {
      setIsLoadingInventories(false);
    }
  };

  const handleRefreshInventories = () => {
    loadInventories();
  };

  const handleStartNewInventory = async () => {
    if (!selectedAgency) return;

    try {
      // Check if monthly inventory already exists
      const response = await checkMonthlyInventory(
        selectedAgency.name,
        currentMonth,
        currentYear
      );

      if (response.exists && response.inventory?.status === 'Completed') {
        showError(
          'Inventory Exists',
          `An inventory for ${monthName} ${currentYear} has already been completed. You cannot start a new one for the same month.`
        );
        return;
      }

      if (response.exists && response.inventory?.status === 'Active') {
        showInfo(
          'Continue Existing',
          `An active inventory for ${monthName} ${currentYear} already exists. You can continue it or complete it first.`
        );
        return;
      }

      // Start new session
      startSession();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to check inventory status';
      showError('Error', errorMessage);
    }
  };

  const handleContinueInventory = (inventory: MonthlyInventory) => {
    console.log('🔄 handleContinueInventory called with:', inventory);
    
    if (inventory.status === 'Completed') {
      console.log('❌ Inventory is completed, cannot continue');
      showInfo(
        'Inventory Complete',
        'This inventory has already been completed. You can view the data but cannot add new scans.'
      );
      return;
    }

    if (inventory.status === 'Paused') {
      console.log('⏸️ Inventory is paused, continuing session');
      showInfo(
        'Continuing Paused Inventory',
        `Continuing paused inventory session for ${monthName} ${currentYear} with ${inventory.totalScans} existing scans.`
      );
      continueSession();
      return;
    }

    // For active inventories, continue the session
    console.log('✅ Continuing active inventory session');
    showInfo(
      'Continuing Inventory',
      `Continuing inventory session for ${monthName} ${currentYear} with ${inventory.totalScans} existing scans.`
    );
    continueSession();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Paused':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Active':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className='w-4 h-4' />;
      case 'Paused':
        return <Clock className='w-4 h-4' />;
      case 'Active':
      default:
        return <Clock className='w-4 h-4' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'Completed';
      case 'Paused':
        return 'Paused';
      case 'Active':
      default:
        return 'Active';
    }
  };

  // Get month name from month number
  const getMonthName = (month: string) => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return monthNames[parseInt(month) - 1] || 'Unknown';
  };

  // Check if there's existing inventory data for current month
  const hasExistingInventory = inventories.some(
    inv => inv.month === currentMonth && inv.year === currentYear
  );

  const existingInventory = inventories.find(
    inv => inv.month === currentMonth && inv.year === currentYear
  );

  // Debug inventory matching
  console.log('🔍 Inventory Matching Debug:', {
    currentMonth,
    currentYear,
    monthName,
    inventories: inventories.map(inv => ({
      month: inv.month,
      year: inv.year,
      status: inv.status,
      totalScans: inv.totalScans,
      monthMatch: inv.month === currentMonth,
      yearMatch: inv.year === currentYear,
      fullMatch: inv.month === currentMonth && inv.year === currentYear
    })),
    hasExistingInventory,
    existingInventory: existingInventory ? {
      month: existingInventory.month,
      year: existingInventory.year,
      status: existingInventory.status,
      totalScans: existingInventory.totalScans
    } : null
  });

  // Add debugging here
  useEffect(() => {
    console.log('🔍 Inventory State:', {
      currentMonth,
      currentYear,
      monthName,
      inventories: inventories.map(inv => ({
        month: inv.month,
        year: inv.year,
        status: inv.status,
        totalScans: inv.totalScans
      })),
      hasExistingInventory,
      existingInventory: existingInventory ? {
        month: existingInventory.month,
        year: existingInventory.year,
        status: existingInventory.status,
        totalScans: existingInventory.totalScans
      } : null
    });
  }, [currentMonth, currentYear, monthName, inventories, hasExistingInventory, existingInventory]);

  // Debug button rendering logic
  useEffect(() => {
    console.log('🎯 Main Button Debug:', {
      isSessionActive,
      hasExistingInventory,
      existingInventory,
      currentMonth,
      currentYear,
      inventories: inventories.length
    });
    
    console.log('📋 Monthly Inventory Management Debug:', {
      isLoadingInventories,
      inventoriesCount: inventories.length,
      hasExistingInventory,
      existingInventory: existingInventory ? {
        status: existingInventory.status,
        totalScans: existingInventory.totalScans
      } : null
    });
  }, [isSessionActive, hasExistingInventory, existingInventory, currentMonth, currentYear, inventories, isLoadingInventories]);

  const handleScan = (code: string) => {
    setCurrentScannedCode(code);
    setShowScanner(false);
    setShowManualInput(false);
    setShowConfirmation(true);
  };

  const handleConfirmScan = async (code: string) => {
    try {
      const success = await addScannedCode(code);
      if (success) {
        showSuccess(
          'Scan Confirmed',
          `Barcode ${code} has been saved successfully`
        );
        setShowConfirmation(false);
        setCurrentScannedCode('');
      } else {
        showError('Scan Failed', 'Failed to save the scanned barcode');
      }
    } catch (error) {
      showError('Scan Error', 'An error occurred while saving the scan');
    }
  };

  const handleCancelScan = () => {
    setShowConfirmation(false);
    setShowScanner(false);
    setShowManualInput(false);
    setCurrentScannedCode('');
  };

  const handleStopInventory = () => {
    if (scannedCodes.length === 0) {
      showWarning(
        'No Scans',
        'Please scan at least one barcode before stopping the session'
      );
      return;
    }
    setShowStopOptions(true);
  };

  const handleCompleteSession = async () => {
    setShowStopOptions(false);

    try {
      showInfo(
        'Processing Session',
        'Finishing inventory session and saving to Google Sheets...'
      );

      const success = await finishInventorySession();
      if (success) {
        showSuccess(
          'Session Complete',
          'Inventory session has been finished successfully'
        );
        // Refresh inventories after completion
        loadInventories();
        navigate('/select-agency');
      } else {
        showError('Session Error', 'Failed to finish the inventory session');
      }
    } catch (error) {
      console.error('Error stopping inventory:', error);
      showError(
        'Session Error',
        'An error occurred while finishing the session'
      );
    }
  };

  const handlePauseSession = async () => {
    setShowStopOptions(false);

    try {
      const success = await pauseInventorySession();
      if (success) {
        showSuccess(
          'Session Paused',
          'Your session has been paused. You can continue later or complete it when ready.'
        );
        // Refresh inventories after pausing
        loadInventories();
        navigate('/select-agency');
      } else {
        showError('Pause Error', 'Failed to pause the session');
      }
    } catch (error) {
      console.error('Error pausing session:', error);
      showError('Pause Error', 'An error occurred while pausing the session');
    }
  };

  const handleContinueSession = () => {
    continueSession();
    setShowStopOptions(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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
    <div className='min-h-screen bg-background relative overflow-hidden'>
      {/* Floating 3D shapes */}
      <div className='floating-shape w-28 h-28 top-16 right-16'></div>
      <div
        className='floating-shape w-20 h-20 bottom-1/3 left-20'
        style={{ animationDelay: '2s' }}
      ></div>
      <div
        className='floating-shape w-16 h-16 top-1/2 right-3'
        style={{ animationDelay: '4s' }}
      ></div>

      {/* Header */}
      <Header
        title={`${selectedAgency.name} - Inventory Session`}
        subtitle={`${monthName} ${currentYear} - Started at ${sessionStartTime.toLocaleTimeString()}`}
        showBackButton={true}
        onBackClick={() => navigate('/select-agency')}
        showUserInfo={true}
      />

      {/* Error Display */}
      {error && (
        <div className='max-w-max mx-auto px-8 py-4 relative z-10'>
          <div className='card border-red-500/20 bg-red-500/10'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <X className='w-5 h-5 text-red-400' />
                <span className='text-red-400 font-medium'>{error}</span>
              </div>
              <button
                onClick={clearError}
                className='text-red-400 hover:text-red-300 transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='max-w-max mx-auto px-8 py-section relative z-10'>
        {/* Monthly Inventory Info */}
        <div className='card mb-section'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
              <Calendar className='w-6 h-6 mr-3' />
              Monthly Inventory Details
            </h2>
            {sessionId && (
              <div className='text-sm text-secondaryText bg-white/10 px-3 py-1 rounded-lg'>
                Session: {sessionId.slice(-8)}
              </div>
            )}
          </div>
          <div className='grid md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <div className='w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4'>
                <Calendar className='w-8 h-8 text-white' />
              </div>
              <p className='text-body text-secondaryText mb-2'>Month & Year</p>
              <p className='text-2xl font-bold text-white'>
                {monthName} {currentYear}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4'>
                <User className='w-8 h-8 text-white' />
              </div>
              <p className='text-body text-secondaryText mb-2'>
                Inventory Creator
              </p>
              <p className='text-lg font-semibold text-white'>
                {user?.name || user?.email || 'Unknown User'}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4'>
                <Clock className='w-8 h-8 text-white' />
              </div>
              <p className='text-body text-secondaryText mb-2'>
                Session Duration
              </p>
              <p className='text-2xl font-bold text-white'>
                {getSessionDuration()}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Inventory Management - Moved below select section */}
        <div className='card mb-section'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
              <FileText className='w-6 h-6 mr-3' />
              Monthly Inventory Management
            </h2>
            <div className='flex items-center space-x-4'>
              <button
                onClick={handleRefreshInventories}
                disabled={isLoadingInventories}
                className='btn-secondary text-lg py-3 px-6 flex items-center justify-center space-x-3'
              >
                <RefreshCw
                  className={`w-5 h-5 ${
                    isLoadingInventories ? 'animate-spin' : ''
                  }`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Current Month Status */}
          <div className='mb-6 p-4 glass-effect border border-white/20 rounded-2xl'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <Calendar className='w-5 h-5 text-blue-400' />
                <span className='text-sm font-semibold text-blue-400'>
                  Current Month Status
                </span>
              </div>
              {existingInventory && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-pill text-sm font-semibold border ${getStatusColor(
                    existingInventory.status
                  )}`}
                >
                  {getStatusIcon(existingInventory.status)}
                  <span className='ml-2'>
                    {getStatusText(existingInventory.status)}
                  </span>
                </span>
              )}
            </div>
            <p className='text-sm text-secondaryText mt-2'>
              {hasExistingInventory
                ? `Inventory for ${monthName} ${currentYear} is ${
                    existingInventory?.status || 'unknown'
                  }`
                : `No inventory started for ${monthName} ${currentYear}`}
            </p>
          </div>

          {/* Existing Inventories Table */}
          {inventories.length > 0 && (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-white/10'>
                  <tr>
                    <th className='px-6 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Month & Year
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Created By
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Total Scans
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-white/10'>
                  {inventories.map(inventory => (
                    <tr
                      key={inventory.id}
                      className='transition-colors hover:bg-white/5'
                    >
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center space-x-3'>
                          <Calendar className='w-5 h-5 text-secondaryText' />
                          <span className='font-semibold text-white'>
                            {getMonthName(inventory.month)} {inventory.year}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-pill text-sm font-semibold border ${getStatusColor(
                            inventory.status
                          )}`}
                        >
                          {getStatusIcon(inventory.status)}
                          <span className='ml-2'>
                            {getStatusText(inventory.status)}
                          </span>
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-body text-secondaryText'>
                        {inventory.createdBy}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className='font-mono text-lg text-white bg-white/10 px-3 py-1 rounded-lg'>
                          {inventory.totalScans}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <button
                          onClick={() => handleContinueInventory(inventory)}
                          className='btn-secondary text-sm py-2 px-4 flex items-center space-x-2'
                        >
                          <span>
                            {inventory.status === 'Completed'
                              ? 'View'
                              : 'Continue'}
                          </span>
                          <ChevronRight className='w-4 h-4' />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No Inventories State */}
          {!isLoadingInventories && inventories.length === 0 && (
            <div className='text-center py-8'>
              <FileText className='w-16 h-16 text-secondaryText mx-auto mb-4 opacity-50' />
              <p className='text-body text-secondaryText mb-4'>
                No inventory data found for {selectedAgency.name} in Google
                Sheets.
              </p>
              {!hasExistingInventory && (
                <button
                  onClick={handleStartNewInventory}
                  className='btn-primary text-lg px-6 py-3'
                >
                  Start First Inventory
                </button>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoadingInventories && (
            <div className='text-center py-8'>
              <LoadingSpinner />
              <p className='text-secondaryText mt-4'>
                Loading inventories from Google Sheets...
              </p>
            </div>
          )}

          {/* Error State */}
          {inventoriesError && (
            <div className='p-4 border border-red-500/20 bg-red-500/10 rounded-xl'>
              <div className='flex items-center space-x-3'>
                <AlertCircle className='w-5 h-5 text-red-400' />
                <span className='text-red-400 text-sm'>{inventoriesError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Session Stats */}
        <div className='grid md:grid-cols-3 gap-6 mb-section'>
          <div className='card text-center'>
            <div className='w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4'>
              <CheckCircle className='w-8 h-8 text-white' />
            </div>
            <p className='text-body text-secondaryText mb-2'>Scanned Codes</p>
            <p className='text-2xl font-bold text-white'>
              {scannedCodes.length}
            </p>
          </div>

          <div className='card text-center'>
            <div className='w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4'>
              <Download className='w-8 h-8 text-white' />
            </div>
            <p className='text-body text-secondaryText mb-2'>Ready to Export</p>
            <p className='text-2xl font-bold text-white'>
              {scannedCodes.filter(code => code.confirmed).length}
            </p>
          </div>

          <div className='card text-center'>
            <div className='w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4'>
              <BarChart3 className='w-8 h-8 text-white' />
            </div>
            <p className='text-body text-secondaryText mb-2'>Total Scans</p>
            <p className='text-2xl font-bold text-white'>
              {scannedCodes.length}
            </p>
          </div>
        </div>

        {/* Session Management Info */}
        <div className='card mb-section border-green-500/20 bg-green-500/10'>
          <div className='flex items-start space-x-4'>
            <Info className='w-8 h-8 text-green-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-green-400 mb-2'>
                Session Management
              </h3>
              <p className='text-body text-secondaryText mb-3'>
                Your session data is automatically saved. You can pause the
                session to continue later, or complete it when you&apos;re done
                scanning. All scanned codes are saved to Google Sheets in
                real-time.
              </p>
              <div className='p-3 glass-effect border border-green-500/20 rounded-xl'>
                <p className='text-sm text-green-300'>
                  <strong>Note:</strong> If you refresh the page, your session
                  will be restored automatically. You can also continue the same
                  monthly inventory across multiple days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Paused Session Notice */}
        {scannedCodes.length > 0 && !isSessionActive && (
          <div className='card mb-section border-yellow-500/20 bg-yellow-500/10'>
            <div className='flex items-start space-x-4'>
              <Clock className='w-8 h-8 text-yellow-400 mt-1 flex-shrink-0' />
              <div className='flex-1'>
                <h3 className='text-lg font-semibold text-yellow-400 mb-2'>
                  Session Paused
                </h3>
                <p className='text-body text-secondaryText mb-3'>
                  Your inventory session has been paused with{' '}
                  {scannedCodes.length} scanned codes. You can continue scanning
                  or complete the session when ready.
                </p>
                <div className='flex space-x-4'>
                  <button
                    onClick={continueSession}
                    className='btn-primary text-lg py-3 px-6 flex items-center space-x-3'
                  >
                    <Play className='w-5 h-5' />
                    <span>Unpause & Continue</span>
                  </button>
                  <button
                    onClick={handleStopInventory}
                    className='btn-secondary text-lg py-3 px-6 flex items-center space-x-3'
                  >
                    <StopCircle className='w-5 h-5' />
                    <span>Manage Session</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPUVE Reminder */}
        <div className='card mb-section border-blue-500/20 bg-blue-500/10'>
          <div className='flex items-start space-x-4'>
            <Info className='w-8 h-8 text-blue-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-blue-400 mb-2'>
                Important: Manual REPUVE Search Required
              </h3>
              <p className='text-body text-secondaryText mb-3'>
                After completing this inventory session, you will need to
                manually search for each scanned barcode on the
                <a
                  href='https://www.repuve.gob.mx/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-400 hover:text-blue-300 underline mx-1'
                >
                  REPUVE website
                </a>
                to extract the complete vehicle information.
              </p>
              <div className='p-3 glass-effect border border-blue-500/20 rounded-xl'>
                <p className='text-sm text-blue-300'>
                  <strong>Note:</strong> The scanned barcodes are saved to
                  Google Sheets with your user information and timestamp. Use
                  the exported data to manually search REPUVE for each
                  vehicle&apos;s details.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='card mb-section'>
          {/* Info Section */}
          <div className='mb-6 p-4 glass-effect border border-white/20 rounded-2xl'>
            <div className='flex items-center space-x-3 mb-2'>
              <AlertCircle className='w-5 h-5 text-blue-400' />
              <span className='text-sm font-semibold text-blue-400'>
                Scanning Options
              </span>
            </div>
            <p className='text-sm text-secondaryText mb-2'>
              Use the camera scanner for clear barcodes, or manual input for
              damaged codes or when scanning isn&apos;t working.
            </p>
            <div className='p-3 glass-effect border border-white/20 rounded-xl'>
              <p className='text-xs text-secondaryText'>
                <strong>Important:</strong> Only 8-digit numeric barcodes are
                supported (e.g., 12345678). QR codes and alphanumeric codes will
                be rejected.
              </p>
            </div>
          </div>

          {!isSessionActive ? (
            <div className='text-center'>
              {!hasExistingInventory ? (
                <button
                  onClick={() => void startSession()}
                  className='btn-primary text-lg py-5 px-8 flex items-center justify-center space-x-4 mx-auto'
                >
                  <Play className='w-6 h-6' />
                  <span>Start New Inventory Session</span>
                </button>
              ) : existingInventory?.status === 'Active' ? (
                <button
                  onClick={() => handleContinueInventory(existingInventory)}
                  className='btn-primary text-lg py-5 px-8 flex items-center justify-center space-x-4 mx-auto'
                >
                  <Play className='w-6 h-6' />
                  <span>Continue Inventory Session</span>
                </button>
              ) : existingInventory?.status === 'Completed' ? (
                <div className='text-center'>
                  <p className='text-body text-secondaryText mb-4'>
                    Inventory for {monthName} {currentYear} has been completed.
                  </p>
                  <p className='text-sm text-green-400 mb-4'>
                    This month&apos;s inventory has been completed. You cannot
                    start a new one.
                  </p>
                </div>
              ) : (
                <div className='text-center'>
                  <p className='text-body text-secondaryText mb-4'>
                    Inventory for {monthName} {currentYear} is{' '}
                    {existingInventory?.status || 'unknown'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className='flex flex-col gap-4'>
              {/* Primary Action Buttons */}
              <div className='flex flex-col sm:flex-row gap-4'>
                <button
                  onClick={() => setShowScanner(true)}
                  className='flex-1 btn-primary text-lg py-5 px-8 flex items-center justify-center space-x-4'
                >
                  <Camera className='w-6 h-6' />
                  <span>Scan Barcode</span>
                </button>

                <button
                  onClick={() => setShowManualInput(true)}
                  className='flex-1 btn-secondary text-lg py-5 px-8 flex items-center justify-center space-x-4'
                >
                  <QrCode className='w-6 h-6' />
                  <span>Manual Input</span>
                </button>
              </div>

              {/* Session Control Buttons */}
              <div className='flex flex-col sm:flex-row gap-4'>
                <button
                  onClick={handleStopInventory}
                  disabled={isLoading || scannedCodes.length === 0}
                  className={`flex-1 text-lg py-5 px-8 rounded-pill font-bold transition-all duration-300 flex items-center justify-center space-x-4 ${
                    isLoading || scannedCodes.length === 0
                      ? 'bg-border text-secondaryText cursor-not-allowed'
                      : 'btn-secondary'
                  }`}
                >
                  <StopCircle className='w-6 h-6' />
                  <span>{isLoading ? 'Processing...' : 'Manage Session'}</span>
                </button>

                <button
                  onClick={() => void handlePauseSession()}
                  disabled={isLoading || scannedCodes.length === 0}
                  className={`flex-1 text-lg py-5 px-8 rounded-pill font-bold transition-all duration-300 flex items-center justify-center space-x-4 ${
                    isLoading || scannedCodes.length === 0
                      ? 'bg-border text-secondaryText cursor-not-allowed'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                >
                  <Pause className='w-6 h-6' />
                  <span>Pause Session</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scanned Codes Table */}
        {scannedCodes.length > 0 && (
          <div className='card overflow-hidden'>
            <div className='px-8 py-6 border-b border-white/20'>
              <h2 className='text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
                <BarChart3 className='w-6 h-6 mr-3' />
                Scanned Codes
              </h2>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-white/10'>
                  <tr>
                    <th className='px-8 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Code
                    </th>
                    <th className='px-8 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Time
                    </th>
                    <th className='px-8 py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-white/10'>
                  {scannedCodes.map(code => (
                    <tr key={code.id} className='transition-colors'>
                      <td className='px-8 py-6 whitespace-nowrap'>
                        <span className='font-mono text-lg text-white bg-white/10 px-3 py-1 rounded-lg'>
                          {code.code}
                        </span>
                      </td>
                      <td className='px-8 py-6 whitespace-nowrap text-body text-secondaryText'>
                        {formatTime(code.timestamp)}
                      </td>
                      <td className='px-8 py-6 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-pill text-sm font-semibold ${
                            code.confirmed
                              ? 'bg-white/20 text-white border border-white/30'
                              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          }`}
                        >
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
        {scannedCodes.length === 0 && !isSessionActive && (
          <div className='card text-center'>
            <Camera className='w-20 h-20 text-secondaryText mx-auto mb-6 opacity-50' />
            <h3 className='text-subheading font-bold uppercase tracking-hero leading-heading mb-4'>
              Ready to Start
            </h3>
            <p className='text-body text-secondaryText mb-8 max-w-md mx-auto'>
              Start an inventory session to begin scanning barcodes for{' '}
              {monthName} {currentYear}
            </p>
            {!hasExistingInventory ? (
              <button
                onClick={() => void startSession()}
                className='btn-primary text-lg px-8 py-4'
              >
                Start Inventory Session
              </button>
            ) : existingInventory?.status === 'Active' ? (
              <button
                onClick={() => handleContinueInventory(existingInventory)}
                className='btn-primary text-lg px-8 py-4'
              >
                Continue Inventory Session
              </button>
            ) : (
              <p className='text-sm text-green-400'>
                This month&apos;s inventory has been completed. You cannot start
                a new one.
              </p>
            )}
          </div>
        )}

        {/* Empty State - Session Active but No Scans */}
        {scannedCodes.length === 0 && isSessionActive && (
          <div className='card text-center'>
            <Camera className='w-20 h-20 text-secondaryText mx-auto mb-6 opacity-50' />
            <h3 className='text-subheading font-bold uppercase tracking-hero leading-heading mb-4'>
              No codes scanned yet
            </h3>
            <p className='text-body text-secondaryText mb-8 max-w-md mx-auto'>
              Start scanning barcodes to build your inventory list for{' '}
              {monthName} {currentYear}
            </p>
            <div className='flex flex-col sm:flex-row gap-4'>
              <button
                onClick={() => setShowScanner(true)}
                className='btn-primary text-lg px-8 py-4'
              >
                Scan First Barcode
              </button>
              <button
                onClick={() => setShowManualInput(true)}
                className='btn-secondary text-lg px-8 py-4'
              >
                Manual Input
              </button>
            </div>
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

      {showManualInput && (
        <ManualInputModal
          onConfirm={handleScan}
          onCancel={() => setShowManualInput(false)}
        />
      )}

      {/* Stop Options Modal */}
      {showStopOptions && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='card max-w-md w-full'>
            <div className='text-center mb-6'>
              <h3 className='text-xl font-bold text-white mb-2'>
                Manage Session
              </h3>
              <p className='text-secondaryText'>
                What would you like to do with your current session?
              </p>
            </div>

            <div className='space-y-4'>
              <button
                onClick={() => void handleCompleteSession()}
                className='w-full btn-primary text-lg py-4 px-6 flex items-center justify-center space-x-3'
              >
                <CheckCircle className='w-6 h-6' />
                <span>Complete & Finish Session</span>
              </button>

              <button
                onClick={() => void handlePauseSession()}
                className='w-full bg-yellow-600 hover:bg-yellow-700 text-white text-lg py-4 px-6 rounded-pill font-bold transition-all duration-300 flex items-center justify-center space-x-3'
              >
                <Pause className='w-6 h-6' />
                <span>Pause Session (Continue Later)</span>
              </button>

              <button
                onClick={handleContinueSession}
                className='w-full btn-secondary text-lg py-4 px-6 flex items-center justify-center space-x-3'
              >
                <RotateCcw className='w-6 h-6' />
                <span>Continue Scanning</span>
              </button>

              <button
                onClick={() => setShowStopOptions(false)}
                className='w-full bg-border hover:bg-white/20 text-white text-lg py-4 px-6 rounded-pill font-bold transition-all duration-300'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className='max-w-max mx-auto px-8'>
        <Footer />
      </div>
    </div>
  );
};

export default InventoryPage;
