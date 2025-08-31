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
  AlertTriangle,
  Barcode,
  Calendar,
  Camera,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Info,
  Pause,
  Plus,
  RefreshCw,
  RotateCcw,
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
    reset,
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
      console.log('🔄 Making API call to getAgencyInventories...');
      const response = await getAgencyInventories(selectedAgency.name);
      console.log('📡 API Response (raw):', response);
      console.log('📡 API Response type:', typeof response);
      console.log('📡 API Response keys:', Object.keys(response || {}));
      console.log('📡 API Response stringified:', JSON.stringify(response, null, 2));
      
      // Handle different response formats
      let inventories = [];
      
      if (response && typeof response === 'object') {
        // Check if response is an array itself (getAgencyInventories returns array directly)
        if (Array.isArray(response)) {
          inventories = response;
          console.log('✅ Found inventories as direct array:', inventories);
        }
        // Check if response has a data property
        else if (response.data && Array.isArray(response.data.inventories)) {
          inventories = response.data.inventories;
          console.log('✅ Found inventories in response.data.inventories:', inventories);
        }
        // Check if response has inventories directly
        else if (Array.isArray(response.inventories)) {
          inventories = response.inventories;
          console.log('✅ Found inventories in response.inventories:', inventories);
        }
        // Check if response has a different structure
        else if (response.inventories && Array.isArray(response.inventories)) {
          inventories = response.inventories;
          console.log('✅ Found inventories in response.inventories:', inventories);
        }
        else {
          console.log('❌ No inventories found in response structure:', response);
          console.log('❌ Response structure analysis:', {
            hasData: !!response.data,
            dataType: typeof response.data,
            hasInventories: !!response.inventories,
            inventoriesType: typeof response.inventories,
            isArray: Array.isArray(response),
            keys: Object.keys(response)
          });
        }
      }
      
      // Transform backend data to match frontend interface
      const transformedInventories = inventories.map((inv: any, index: number) => {
        // Convert month name to month number
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthNumber = (monthNames.indexOf(inv.month) + 1).toString().padStart(2, '0');
        
        return {
          id: inv.sessionId || `inv_${index}`,
          agencyId: inv.agency?.toLowerCase() || 'unknown',
          month: monthNumber,
          year: parseInt(inv.year) || new Date().getFullYear(),
          monthName: inv.month,
          status: inv.status,
          createdAt: new Date(inv.createdAt),
          createdBy: inv.createdBy || inv.userName || 'Unknown',
          totalScans: parseInt(inv.totalScans) || 0,
          sessionId: inv.sessionId,
          lastUpdated: new Date()
        };
      });
      
      console.log('📋 Original inventories:', inventories);
      console.log('📋 Transformed inventories:', transformedInventories);
      setInventories(transformedInventories);
      
      if (inventories.length === 0) {
        console.log('⚠️ No inventories found - this might be correct if no data exists yet');
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
      console.log('🔍 Checking monthly inventory for:', {
        agency: selectedAgency.name,
        month: currentMonth,
        year: currentYear
      });
      
      // Check if monthly inventory already exists
      const response = await checkMonthlyInventory(
        selectedAgency.name,
        currentMonth,
        currentYear
      );
      
      console.log('🔍 checkMonthlyInventory response:', response);
      console.log('🔍 Response structure:', {
        type: typeof response,
        keys: Object.keys(response || {}),
        exists: response?.exists,
        inventory: response?.inventory,
        status: response?.inventory?.status
      });

      // The backend returns status directly, not nested in inventory object
      if (response.exists && response.status === 'Completed') {
        showError(
          'Inventory Exists',
          `An inventory for ${monthName} ${currentYear} has already been completed. You cannot start a new one for the same month.`
        );
        return;
      }

      if (response.exists && response.status === 'Active') {
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

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10'>
        {/* Monthly Inventory Info */}
        <div className='card mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3'>
            <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
              <Calendar className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3' />
              Monthly Inventory Details
            </h2>
            {sessionId && (
              <div className='text-xs sm:text-sm text-secondaryText bg-white/10 px-2 sm:px-3 py-1 rounded-lg'>
                Session: {sessionId.slice(-8)}
              </div>
            )}
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
            <div className='text-center'>
              <div className='w-14 h-14 sm:w-16 sm:h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4'>
                <Calendar className='w-7 h-7 sm:w-8 sm:h-8 text-white' />
              </div>
              <p className='text-xs sm:text-sm text-secondaryText mb-2'>Month & Year</p>
              <p className='text-lg sm:text-xl lg:text-2xl font-bold text-white'>
                {monthName} {currentYear}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-14 h-14 sm:w-16 sm:h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4'>
                <User className='w-7 h-7 sm:w-8 sm:h-8 text-white' />
              </div>
              <p className='text-xs sm:text-sm text-secondaryText mb-2'>
                Inventory Creator
              </p>
              <p className='text-sm sm:text-base lg:text-lg font-semibold text-white truncate px-2'>
                {user?.name || user?.email || 'Unknown User'}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-14 h-14 sm:w-16 sm:h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4'>
                <Clock className='w-7 h-7 sm:w-8 sm:h-8 text-white' />
              </div>
              <p className='text-xs sm:text-sm text-secondaryText mb-2'>Session Duration</p>
              <p className='text-lg sm:text-xl lg:text-2xl font-bold text-white'>
                {getSessionDuration()}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Inventory Management */}
        <div className='card mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3'>
            <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
              <FileText className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3' />
              Monthly Inventory Management
            </h2>
            <button
              onClick={handleRefreshInventories}
              disabled={isLoadingInventories}
              className='btn-secondary text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4 flex items-center justify-center space-x-2'
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingInventories ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </button>
          </div>

          {isLoadingInventories ? (
            <div className='p-8 text-center'>
              <LoadingSpinner />
              <p className='text-sm sm:text-base text-secondaryText mt-4'>
                Loading inventories...
              </p>
            </div>
          ) : inventories.length === 0 ? (
            <div className='p-8 text-center'>
              <FileText className='w-16 h-16 text-secondaryText mx-auto mb-4 opacity-50' />
              <p className='text-sm sm:text-base text-secondaryText'>
                No inventories found for {selectedAgency.name}
              </p>
            </div>
          ) : (
            <div className='overflow-hidden'>
              {/* Desktop Table View */}
              <div className='hidden lg:block overflow-x-auto'>
                <table className='w-full'>
                  <thead className='border-b border-white/10'>
                    <tr>
                      <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Month & Year
                      </th>
                      <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Status
                      </th>
                      <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Created By
                      </th>
                      <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                        Total Scans
                      </th>
                      <th className='px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
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
                        <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                          <div className='flex items-center space-x-2 lg:space-x-3'>
                            <Calendar className='w-4 h-4 lg:w-5 lg:h-5 text-secondaryText' />
                            <span className='font-semibold text-white text-sm lg:text-base'>
                              {getMonthName(inventory.month)} {inventory.year}
                            </span>
                          </div>
                        </td>
                        <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex items-center px-2 lg:px-3 py-1 lg:py-2 rounded-pill text-xs font-semibold border ${getStatusColor(
                              inventory.status
                            )}`}
                          >
                            {getStatusIcon(inventory.status)}
                            <span className='ml-2'>
                              {getStatusText(inventory.status)}
                            </span>
                          </span>
                        </td>
                        <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-secondaryText'>
                          {inventory.createdBy}
                        </td>
                        <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                          <span className='font-mono text-sm lg:text-base text-white bg-white/10 px-2 lg:px-3 py-1 lg:py-2 rounded-lg'>
                            {inventory.totalScans}
                          </span>
                        </td>
                        <td className='px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap'>
                          <button
                            onClick={() => handleContinueInventory(inventory)}
                            className='btn-secondary text-xs lg:text-sm py-1 lg:py-2 px-2 lg:px-3 flex items-center space-x-1 lg:space-x-2'
                          >
                            <span>
                              {inventory.status === 'Completed'
                                ? 'View'
                                : 'Continue'}
                            </span>
                            <ChevronRight className='w-3 h-3 lg:w-4 lg:h-4' />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className='lg:hidden space-y-3 p-4'>
                {inventories.map(inventory => (
                  <div
                    key={inventory.id}
                    className='glass-effect rounded-xl p-3 border border-white/20'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center space-x-2'>
                        <Calendar className='w-4 h-4 text-secondaryText' />
                        <span className='font-semibold text-white text-sm'>
                          {getMonthName(inventory.month)} {inventory.year}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-pill text-xs font-semibold border ${getStatusColor(
                          inventory.status
                        )}`}
                      >
                        {getStatusIcon(inventory.status)}
                        <span className='ml-1'>
                          {getStatusText(inventory.status)}
                        </span>
                      </span>
                    </div>
                    
                    <div className='space-y-2 mb-3'>
                      <div className='flex justify-between text-xs'>
                        <span className='text-secondaryText'>Created By:</span>
                        <span className='text-white'>{inventory.createdBy}</span>
                      </div>
                      <div className='flex justify-between text-xs'>
                        <span className='text-secondaryText'>Total Scans:</span>
                        <span className='font-mono text-white bg-white/10 px-2 py-1 rounded'>
                          {inventory.totalScans}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleContinueInventory(inventory)}
                      className='w-full btn-secondary text-xs py-2 px-3 flex items-center justify-center space-x-1'
                    >
                      <span>
                        {inventory.status === 'Completed'
                          ? 'View'
                          : 'Continue'}
                      </span>
                      <ChevronRight className='w-3 h-3' />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Session Management Info */}
        <div className='card mb-6 border-green-500/20 bg-green-500/10'>
          <div className='flex items-start space-x-3 sm:space-x-4'>
            <Info className='w-5 h-5 sm:w-6 sm:h-6 text-green-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-base sm:text-lg font-semibold text-green-400 mb-2 sm:mb-3'>
                Session Management
              </h3>
              <p className='text-sm sm:text-base text-secondaryText mb-3'>
                Your inventory session is automatically saved as you scan. You can
                pause at any time and continue later, or complete the session when
                finished. All data is synchronized with Google Sheets in real-time.
              </p>
              <div className='p-3 sm:p-4 glass-effect border border-green-500/20 rounded-xl'>
                <p className='text-xs sm:text-sm text-green-300'>
                  <strong>Tip:</strong> Use the "Pause Session" button if you need
                  to take a break. Your progress will be saved and you can continue
                  later from exactly where you left off.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Paused Session Notice */}
        {existingInventory?.status === 'Paused' && (
          <div className='card mb-6 border-yellow-500/20 bg-yellow-500/10'>
            <div className='flex items-start space-x-3 sm:space-x-4'>
              <Clock className='w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mt-1 flex-shrink-0' />
              <div className='flex-1'>
                <h3 className='text-base sm:text-lg font-semibold text-yellow-400 mb-2 sm:mb-3'>
                  Paused Session Available
                </h3>
                <p className='text-sm sm:text-base text-secondaryText mb-3'>
                  You have a paused inventory session for {monthName} {currentYear}
                  with {existingInventory.totalScans} scans. You can continue this
                  session or start a new one.
                </p>
                <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
                  <button
                    onClick={() => handleContinueInventory(existingInventory)}
                    className='btn-secondary text-sm py-2 px-4 flex items-center justify-center space-x-2'
                  >
                    <RotateCcw className='w-4 h-4' />
                    <span>Continue Session</span>
                  </button>
                  <button
                    onClick={handleStartNewInventory}
                    className='btn-primary text-sm py-2 px-4 flex items-center justify-center space-x-2'
                  >
                    <Plus className='w-4 h-4' />
                    <span>Start New</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPUVE Manual Search Reminder */}
        <div className='card mb-6 border-orange-500/20 bg-orange-500/10'>
          <div className='flex items-start space-x-3 sm:space-x-4'>
            <AlertTriangle className='w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-base sm:text-lg font-semibold text-orange-400 mb-2 sm:mb-3'>
                Important: Manual REPUVE Search Required
              </h3>
              <p className='text-sm sm:text-base text-secondaryText mb-3'>
                After completing your inventory, you must manually search each
                scanned barcode on the REPUVE website to extract complete vehicle
                information (make, model, year, VIN, etc.).
              </p>
              <div className='p-3 sm:p-4 glass-effect border border-orange-500/20 rounded-xl'>
                <p className='text-xs sm:text-sm text-orange-300 mb-3'>
                  <strong>Step-by-step process:</strong>
                </p>
                <ol className='text-xs sm:text-sm text-orange-300 space-y-1 list-decimal list-inside'>
                  <li>Complete your inventory session</li>
                  <li>Go to the REPUVE website</li>
                  <li>Search each barcode individually</li>
                  <li>Extract and record vehicle details</li>
                  <li>Update your records with complete information</li>
                </ol>
              </div>
              <div className='mt-3 sm:mt-4'>
                <a
                  href='https://www.repuve.gob.mx/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors underline'
                >
                  <ExternalLink className='w-4 h-4' />
                  <span>Open REPUVE Website</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='card mb-6'>
          <div className='text-center mb-6'>
            <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-4'>
              Inventory Session Controls
            </h2>
            <p className='text-sm sm:text-base text-secondaryText'>
              {isSessionActive
                ? 'Your inventory session is currently active. Scan barcodes or manage your session below.'
                : hasExistingInventory && existingInventory?.status === 'Completed'
                ? `Inventory for ${monthName} ${currentYear} has been completed. You cannot start a new one for the same month.`
                : 'Start a new inventory session or continue an existing one.'}
            </p>
          </div>

          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center'>
            {!isSessionActive && !hasExistingInventory && (
              <button
                onClick={handleStartNewInventory}
                className='btn-primary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <Plus className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Start New Inventory Session</span>
              </button>
            )}

            {!isSessionActive && hasExistingInventory && existingInventory?.status === 'Active' && (
              <button
                onClick={() => handleContinueInventory(existingInventory)}
                className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <RotateCcw className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Continue Inventory Session</span>
              </button>
            )}

            {!isSessionActive && hasExistingInventory && existingInventory?.status === 'Paused' && (
              <button
                onClick={() => handleContinueInventory(existingInventory)}
                className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <RotateCcw className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Continue Paused Session</span>
              </button>
            )}

            {hasExistingInventory && existingInventory?.status === 'Completed' && (
              <div className='text-center text-secondaryText py-4'>
                <CheckCircle className='w-8 h-8 text-green-400 mx-auto mb-2' />
                <p>Inventory for {monthName} {currentYear} has been completed.</p>
                <p className='text-sm mt-1'>You can view the data but cannot add new scans.</p>
              </div>
            )}
          </div>
        </div>

        {/* Session Controls */}
        {isSessionActive && (
          <div className='card mb-6'>
            <div className='text-center mb-6'>
              <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading mb-4'>
                Active Session Controls
              </h2>
              <p className='text-sm sm:text-base text-secondaryText'>
                Your inventory session is active. Use the controls below to manage
                your session or scan new barcodes.
              </p>
            </div>

            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center'>
              <button
                onClick={() => setShowScanner(true)}
                className='btn-primary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <Camera className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Scan Barcode</span>
              </button>

              <button
                onClick={() => setShowManualInput(true)}
                className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <FileText className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Manual Input</span>
              </button>

              <button
                onClick={handleStopInventory}
                className='btn-secondary text-sm sm:text-base py-3 sm:py-4 px-6 sm:px-8 flex items-center justify-center space-x-2 sm:space-x-3'
              >
                <Pause className='w-5 h-5 sm:w-6 sm:h-6' />
                <span>Manage Session</span>
              </button>
            </div>
          </div>
        )}

        {/* Scanned Codes Display */}
        {scannedCodes.length > 0 && (
          <div className='card mb-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3'>
              <h2 className='text-lg sm:text-xl lg:text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
                <Barcode className='w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3' />
                Scanned Codes ({scannedCodes.length})
              </h2>
                             <div className='flex items-center space-x-2 sm:space-x-3'>
                 <span className='text-xs sm:text-sm text-secondaryText'>
                   Total scans: {scannedCodes.length}
                 </span>
                 <button
                   onClick={reset}
                   className='btn-secondary text-xs sm:text-sm py-2 px-3 flex items-center space-x-1 sm:space-x-2'
                 >
                   <RotateCcw className='w-4 h-4' />
                   <span>Reset</span>
                 </button>
               </div>
            </div>

            <div className='overflow-hidden'>
              {/* Desktop Grid View */}
              <div className='hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'>
                {scannedCodes.map((code, index) => (
                  <div
                    key={index}
                    className='glass-effect rounded-xl p-3 sm:p-4 border border-white/20'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-xs sm:text-sm text-secondaryText'>
                        #{index + 1}
                      </span>
                      <span className='text-xs text-secondaryText'>
                        {formatTime(code.timestamp)}
                      </span>
                    </div>
                    <div className='font-mono text-sm sm:text-base text-white break-all'>
                      {code.code}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile List View */}
              <div className='sm:hidden space-y-2'>
                {scannedCodes.map((code, index) => (
                  <div
                    key={index}
                    className='glass-effect rounded-xl p-3 border border-white/20'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-xs text-secondaryText'>
                        #{index + 1}
                      </span>
                      <span className='text-xs text-secondaryText'>
                        {formatTime(code.timestamp)}
                      </span>
                    </div>
                    <div className='font-mono text-sm text-white break-all'>
                      {code.code}
                    </div>
                  </div>
                ))}
              </div>
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
