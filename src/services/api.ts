// API service for backend communication
const API_BASE_URL = 'http://localhost:5000/api';

// Production environment detection
const isProduction = process.env.NODE_ENV === 'production';

// Generic API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      // Try to get more detailed error information
      let errorDetails = '';
      try {
        const errorResponse = await response.json();
        errorDetails = errorResponse.message || errorResponse.error || '';
      } catch (e) {
        // If we can't parse the error response, just use the status text
        errorDetails = response.statusText;
      }

      // Log detailed errors for debugging (both dev and production)
      console.error(`🚨 API Error ${response.status}:`, {
        status: response.status,
        statusText: response.statusText,
        details: errorDetails,
        url,
        body: options.body,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });

      throw new Error(
        `API Error: ${response.status} ${response.statusText}${
          errorDetails ? ` - ${errorDetails}` : ''
        }`
      );
    }

    return await response.json();
  } catch (error) {
    // Log detailed errors for debugging (both dev and production)
    console.error('API Request failed:', {
      error: error,
      url,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    throw error;
  }
};

// Save scan to Google Sheets with monthly inventory support
export const saveScan = async (data: {
  agency: string;
  code: string;
  timestamp: string;
  user: string;
  userName: string;
  month: string;
  year: number;
}) => {
  // Log the data being sent for debugging
  console.log('🔍 Frontend sending data to saveScan:', data);

  return apiRequest('/inventory/save-scan', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Finish inventory session and save to Google Sheets
export const finishSession = async (data: {
  agency: string;
  user: string;
  userName: string;
  month: string;
  year: number;
  totalScans: number;
}) => {
  return apiRequest('/inventory/finish-session', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Get monthly inventory data from Google Sheets
export const getMonthlyInventory = async (
  agency: string,
  month: string,
  year: number
) => {
  return apiRequest(`/inventory/monthly-inventory/${agency}/${month}/${year}`);
};

// Get all monthly inventories for an agency
export const getAgencyInventories = async (agency: string) => {
  return apiRequest(`/inventory/agency-inventories/${agency}`);
};

// Check if monthly inventory exists
export const checkMonthlyInventory = async (
  agency: string,
  month: string,
  year: number
) => {
  return apiRequest(`/inventory/check-monthly-inventory/${agency}/${month}/${year}`);
};

// Check inventory limits before starting new inventory
export const checkInventoryLimits = async (
  agency: string,
  month: string,
  year: number
) => {
  return apiRequest(`/inventory/check-inventory-limits/${agency}/${month}/${year}`);
};

// Delete scanned entry from Google Sheets
export const deleteScannedEntry = async (data: {
  agency: string;
  barcode: string;
}) => {
  return apiRequest('/inventory/delete-scanned-entry', {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
};

// Delete multiple scanned entries from Google Sheets
export const deleteMultipleScannedEntries = async (data: {
  agency: string;
  barcodes: string[];
}) => {
  return apiRequest('/inventory/delete-multiple', {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
};

// Get inventory data for download
export const getInventoryData = async (
  agency: string,
  month: string,
  year: number
) => {
  return apiRequest(`/inventory/inventory-data/${agency}/${month}/${year}`);
};

// Download inventory as CSV
export const downloadInventoryCSV = async (
  agency: string,
  month: string,
  year: number
) => {
  const url = `${API_BASE_URL}/download/inventory/${agency}/${month}/${year}/csv`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  
  return response.blob();
};

// Download inventory as Excel
export const downloadInventoryExcel = async (
  agency: string,
  month: string,
  year: number
) => {
  const url = `${API_BASE_URL}/download/inventory/${agency}/${month}/${year}/excel`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  
  return response.blob();
};

// Validate monthly summary
export const validateMonthlySummary = async (
  agency?: string,
  month?: string,
  year?: number
) => {
  if (agency && month && year) {
    return apiRequest(`/validation/monthly-summary/${agency}/${month}/${year}`);
  }
  return apiRequest('/validation/monthly-summary');
};

// Cleanup duplicates
export const cleanupDuplicates = async () => {
  return apiRequest('/validation/cleanup-duplicates', {
    method: 'POST',
  });
};

// Cleanup specific duplicates
export const cleanupSpecificDuplicates = async (data: {
  agency: string;
  month: string;
  year: number;
}) => {
  return apiRequest('/validation/cleanup-specific-duplicates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Check if inventory was completed (which would terminate all active sessions)
export const checkInventoryCompletion = async (data: {
  agency: string;
  month: string;
  year: number;
}) => {
  return apiRequest('/inventory/check-completion', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export default {
  saveScan,
  finishSession,
  getMonthlyInventory,
  getAgencyInventories,
  checkMonthlyInventory,
  checkInventoryLimits,
  deleteScannedEntry,
  deleteMultipleScannedEntries,
  getInventoryData,
  downloadInventoryCSV,
  downloadInventoryExcel,
  validateMonthlySummary,
  cleanupDuplicates,
  cleanupSpecificDuplicates,
  checkInventoryCompletion,
};
