import { useAuth0 } from '@auth0/auth0-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { checkMonthlyInventory, getAgencyInventories } from '../services/api';
import { MonthlyInventory } from '../types/index';
import Footer from './Footer';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';

import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Database,
  FileText,
  Plus,
  RefreshCw,
  User,
} from 'lucide-react';

const MonthlyInventoryManager: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const { selectedAgency } = useAppContext();
  const { showSuccess, showError, showInfo } = useToast();

  const [inventories, setInventories] = useState<MonthlyInventory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<number>(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Initialize current month and year
  useEffect(() => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    setCurrentMonth(month);
    setCurrentYear(year);
  }, []);

  // Load agency inventories
  useEffect(() => {
    if (selectedAgency) {
      loadInventories();
    }
  }, [selectedAgency]);

  const loadInventories = async () => {
    if (!selectedAgency) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getAgencyInventories(selectedAgency.name);
      if (response.success && response.data) {
        setInventories(response.data.inventories || []);
        setLastRefresh(new Date());
        showSuccess(
          'Data Loaded',
          `Successfully loaded ${
            response.data.inventories?.length || 0
          } inventories from Google Sheets`
        );
      } else {
        throw new Error(response.message || 'Failed to load inventories');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load inventories';
      setError(errorMessage);
      showError('Load Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadInventories();
  };

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
    return monthNames[parseInt(month) - 1];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          `An inventory for ${getMonthName(
            currentMonth
          )} ${currentYear} has already been completed. You cannot start a new one for the same month.`
        );
        return;
      }

      if (response.exists && response.inventory?.status === 'Active') {
        showInfo(
          'Continue Existing',
          `An active inventory for ${getMonthName(
            currentMonth
          )} ${currentYear} already exists. You can continue it or complete it first.`
        );
        // Navigate to inventory page to continue
        navigate('/inventory');
        return;
      }

      // Navigate to inventory page to start new
      navigate('/inventory');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to check inventory status';
      showError('Error', errorMessage);
    }
  };

  const handleContinueInventory = (inventory: MonthlyInventory) => {
    if (inventory.status === 'Completed') {
      showInfo(
        'Inventory Complete',
        'This inventory has already been completed. You can view the data but cannot add new scans.'
      );
      // For completed inventories, we could navigate to a read-only view
      // For now, just show the info message
      return;
    }

    // For active inventories, navigate to inventory page to continue
    showInfo(
      'Continuing Inventory',
      `Continuing inventory session for ${getMonthName(inventory.month)} ${
        inventory.year
      } with ${inventory.totalScans} existing scans.`
    );
    navigate('/inventory');
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

  if (!selectedAgency) {
    navigate('/select-agency');
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
        className='floating-shape w-16 h-16 top-1/2 right-1/3'
        style={{ animationDelay: '4s' }}
      ></div>

      {/* Header */}
      <Header
        title={`${selectedAgency.name} - Monthly Inventories`}
        subtitle='Manage and track monthly inventory sessions'
        showBackButton={true}
        onBackClick={() => navigate('/select-agency')}
        showUserInfo={true}
      />

      <div className='max-w-max mx-auto px-8 py-section relative z-10'>
        {/* Current Month Info */}
        <div className='card mb-8'>
          <div className='flex items-center justify-between mb-8'>
            <h2 className='text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
              <Calendar className='w-6 h-6 mr-3' />
              Current Month: {getMonthName(currentMonth)} {currentYear}
            </h2>
            <div className='flex items-center space-x-4'>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className='btn-secondary text-lg py-4 px-6 flex items-center justify-center space-x-3'
              >
                <RefreshCw
                  className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
                />
                <span>Refresh Data</span>
              </button>
              <button
                onClick={handleStartNewInventory}
                className='btn-primary text-lg py-4 px-8 flex items-center justify-center space-x-3'
              >
                <Plus className='w-5 h-5' />
                <span>Start New Inventory</span>
              </button>
            </div>
          </div>

          <div className='grid md:grid-cols-4 gap-8'>
            <div className='text-center'>
              <div className='w-20 h-20 glass-effect rounded-full flex items-center justify-center mx-auto mb-6'>
                <Calendar className='w-10 h-10 text-white' />
              </div>
              <p className='text-body text-secondaryText mb-3'>Current Month</p>
              <p className='text-2xl font-bold text-white'>
                {getMonthName(currentMonth)} {currentYear}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-20 h-20 glass-effect rounded-full flex items-center justify-center mx-auto mb-6'>
                <User className='w-10 h-10 text-white' />
              </div>
              <p className='text-body text-secondaryText mb-3'>Current User</p>
              <p className='text-lg font-semibold text-white'>
                {user?.name || user?.email || 'Unknown User'}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-20 h-20 glass-effect rounded-full flex items-center justify-center mx-auto mb-6'>
                <BarChart3 className='w-10 h-10 text-white' />
              </div>
              <p className='text-body text-secondaryText mb-3'>
                Total Inventories
              </p>
              <p className='text-2xl font-bold text-white'>
                {inventories.length}
              </p>
            </div>

            <div className='text-center'>
              <div className='w-20 h-20 glass-effect rounded-full flex items-center justify-center mx-auto mb-6'>
                <Database className='w-10 h-10 text-white' />
              </div>
              <p className='text-body text-secondaryText mb-3'>Last Updated</p>
              <p className='text-lg font-semibold text-white'>
                {lastRefresh.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Data Source Info */}
        <div className='card mb-8 border-blue-500/20 bg-blue-500/10'>
          <div className='flex items-start space-x-4'>
            <Database className='w-8 h-8 text-blue-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-blue-400 mb-3'>
                Data Source: Google Sheets
              </h3>
              <p className='text-body text-secondaryText mb-4'>
                All inventory data is automatically synchronized with Google
                Sheets in real-time. Each scan is immediately saved, and session
                data is updated as you work.
              </p>
              <div className='p-4 glass-effect border border-blue-500/20 rounded-xl'>
                <p className='text-sm text-blue-300'>
                  <strong>Note:</strong> The data shown here is pulled directly
                  from your Google Sheets. If you don't see recent data, click
                  the "Refresh Data" button above.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className='card border-red-500/20 bg-red-500/10 mb-8'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <AlertCircle className='w-5 h-5 text-red-400' />
                <span className='text-red-400 font-medium'>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className='text-red-400 hover:text-red-300 transition-colors'
              >
                <AlertCircle className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}

        {/* Existing Inventories */}
        <div className='card'>
          <div className='px-8 py-8 border-b border-white/20'>
            <div className='flex items-center justify-between'>
              <h2 className='text-subheading font-bold uppercase tracking-hero leading-heading flex items-center'>
                <FileText className='w-6 h-6 mr-3' />
                Existing Inventories
              </h2>
              <div className='text-sm text-secondaryText'>
                {inventories.length} inventory
                {inventories.length !== 1 ? 'ies' : 'y'} found
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className='p-16 text-center'>
              <LoadingSpinner />
              <p className='text-secondaryText mt-6 text-lg'>
                Loading inventories from Google Sheets...
              </p>
            </div>
          ) : inventories.length === 0 ? (
            <div className='p-16 text-center'>
              <FileText className='w-24 h-24 text-secondaryText mx-auto mb-8 opacity-50' />
              <h3 className='text-subheading font-bold uppercase tracking-hero leading-heading mb-6'>
                No Inventories Found
              </h3>
              <p className='text-body text-secondaryText mb-10 max-w-md mx-auto'>
                No inventory data found for {selectedAgency.name} in Google
                Sheets. Start your first inventory session for{' '}
                {getMonthName(currentMonth)} {currentYear}
              </p>
              <button
                onClick={handleStartNewInventory}
                className='btn-primary text-lg px-10 py-5'
              >
                Start First Inventory
              </button>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-white/10'>
                  <tr>
                    <th className='px-8 py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Month & Year
                    </th>
                    <th className='px-8 py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-8 py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Created By
                    </th>
                    <th className='px-8 py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Created At
                    </th>
                    <th className='px-8 py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
                      Total Scans
                    </th>
                    <th className='px-8 py-6 text-left text-xs font-bold text-secondaryText uppercase tracking-wider'>
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
                      <td className='px-8 py-8 whitespace-nowrap'>
                        <div className='flex items-center space-x-4'>
                          <Calendar className='w-6 h-6 text-secondaryText' />
                          <span className='font-semibold text-white text-lg'>
                            {getMonthName(inventory.month)} {inventory.year}
                          </span>
                        </div>
                      </td>
                      <td className='px-8 py-8 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-pill text-sm font-semibold border ${getStatusColor(
                            inventory.status
                          )}`}
                        >
                          {getStatusIcon(inventory.status)}
                          <span className='ml-3'>
                            {getStatusText(inventory.status)}
                          </span>
                        </span>
                      </td>
                      <td className='px-8 py-8 whitespace-nowrap text-body text-secondaryText'>
                        {inventory.createdBy}
                      </td>
                      <td className='px-8 py-8 whitespace-nowrap text-body text-secondaryText'>
                        {formatDate(inventory.createdAt)}
                      </td>
                      <td className='px-8 py-8 whitespace-nowrap'>
                        <span className='font-mono text-xl text-white bg-white/10 px-4 py-2 rounded-lg'>
                          {inventory.totalScans}
                        </span>
                      </td>
                      <td className='px-8 py-8 whitespace-nowrap'>
                        <button
                          onClick={() => handleContinueInventory(inventory)}
                          className='btn-secondary text-sm py-3 px-6 flex items-center space-x-3'
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
        </div>

        {/* Info Section */}
        <div className='card border-blue-500/20 bg-blue-500/10 mt-8'>
          <div className='flex items-start space-x-4'>
            <AlertCircle className='w-8 h-8 text-blue-400 mt-1 flex-shrink-0' />
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-blue-400 mb-4'>
                Monthly Inventory Management
              </h3>
              <p className='text-body text-secondaryText mb-4'>
                Each agency can have one inventory per month. Once an inventory
                is completed for a month, you cannot start a new one for the
                same month. This ensures data integrity and prevents duplicates.
              </p>
              <div className='p-4 glass-effect border border-blue-500/20 rounded-xl'>
                <p className='text-sm text-blue-300'>
                  <strong>Note:</strong> After completing an inventory, you'll
                  need to manually search each barcode on the REPUVE website to
                  extract complete vehicle information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MonthlyInventoryManager;
