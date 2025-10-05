// API service for backend communication
import { API_BASE_URL } from '../config/environment';

// Helper to build API URLs correctly (avoiding double /api prefix)
const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If API_BASE_URL already ends with /api, don't add it again
  if (API_BASE_URL.endsWith('/api')) {
    // Remove /api from endpoint if it starts with it
    const finalEndpoint = cleanEndpoint.startsWith('api/') ? cleanEndpoint.slice(4) : cleanEndpoint;
    return `${API_BASE_URL}/${finalEndpoint}`;
  } else {
    // API_BASE_URL doesn't have /api, so we need to include it in the endpoint
    const finalEndpoint = cleanEndpoint.startsWith('api/') ? cleanEndpoint : `api/${cleanEndpoint}`;
    return `${API_BASE_URL}/${finalEndpoint}`;
  }
};

// Generic API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = buildApiUrl(endpoint);

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


      throw new Error(
        `API Error: ${response.status} ${response.statusText}${
          errorDetails ? ` - ${errorDetails}` : ''
        }`
      );
    }

    return await response.json();
  } catch (error) {
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
  carData?: {
    serie: string;
    marca: string;
    color: string;
    ubicaciones: string;
  };
}) => {
  return apiRequest('/api/inventory/save-scan', {
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
  return apiRequest('/api/inventory/finish-session', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Get monthly inventory data from Google Sheets
export const getMonthlyInventory = async (
  agency: string,
  month: string,
  year: number,
  sessionId?: string
) => {
  const encodedAgency = encodeURIComponent(agency);
  return apiRequest(`/api/inventory/monthly-inventory/${encodedAgency}/${month}/${year}`);
};

// Get all monthly inventories for an agency
export const getAgencyInventories = async (agency: string) => {
  const encodedAgency = encodeURIComponent(agency);
  return apiRequest(`/api/inventory/agency-inventories/${encodedAgency}`);
};

// Check if monthly inventory exists
export const checkMonthlyInventory = async (
  agency: string,
  month: string,
  year: number
) => {
  // Properly encode agency name and include all parameters
  const encodedAgency = encodeURIComponent(agency);
  return apiRequest(`/api/inventory/check-monthly-inventory/${encodedAgency}/${month}/${year}`);
};

// Check inventory limits before starting new inventory
export const checkInventoryLimits = async (
  agency: string,
  month: string,
  year: number
) => {
  const encodedAgency = encodeURIComponent(agency);
  return apiRequest(`/api/inventory/check-inventory-limits/${encodedAgency}/${month}/${year}`);
};

// Delete scanned entry from Google Sheets
export const deleteScannedEntry = async (data: {
  agency: string;
  barcode: string;
}) => {
  return apiRequest('/api/inventory/delete-scanned-entry', {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
};

// Delete multiple scanned entries from Google Sheets
export const deleteMultipleScannedEntries = async (data: {
  agency: string;
  barcodes: string[];
}) => {
  return apiRequest('/api/inventory/delete-multiple', {
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
  const encodedAgency = encodeURIComponent(agency);
  return apiRequest(`/api/inventory/inventory-data/${encodedAgency}/${month}/${year}`);
};

// Download inventory as CSV (updated for new Google Drive integration)
export const downloadInventoryCSV = async (
  agency: string,
  month: string,
  year: number,
  sessionId?: string
) => {
  const encodedAgency = encodeURIComponent(agency);
  let url: string;
  
  if (sessionId) {
    // Download specific inventory by session ID
    url = buildApiUrl(`/api/download/inventory/${encodedAgency}/${month}/${year}/csv/${sessionId}`);
  } else {
    // Download most recent inventory
    url = buildApiUrl(`/api/download/inventory/${encodedAgency}/${month}/${year}/csv`);
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Download failed: ${response.status} ${response.statusText} - ${errorText}`);
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
    const encodedAgency = encodeURIComponent(agency);
    return apiRequest(`/api/validation/monthly-summary/${encodedAgency}/${month}/${year}`);
  }
  return apiRequest('/api/validation/monthly-summary');
};

// Cleanup duplicates
export const cleanupDuplicates = async () => {
  return apiRequest('/api/validation/cleanup-duplicates', {
    method: 'POST',
  });
};

// Cleanup specific duplicates
export const cleanupSpecificDuplicates = async (data: {
  agency: string;
  month: string;
  year: number;
}) => {
  return apiRequest('/api/validation/cleanup-specific-duplicates', {
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
  return apiRequest('/api/inventory/check-completion', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Upload CSV file and generate QR codes (combined endpoint as per backend spec)
export const uploadCSVFile = async (file: File, location: string, user: string, userName: string) => {
  const formData = new FormData();
  formData.append('csvFile', file);
  formData.append('location', location);
  formData.append('user', user);
  formData.append('userName', userName);

  const response = await fetch(buildApiUrl('/api/qr/upload-csv'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetails = '';
    try {
      const errorResponse = await response.json();
      errorDetails = errorResponse.message || errorResponse.error || '';
    } catch (e) {
      errorDetails = response.statusText;
    }
    throw new Error(`CSV Upload failed: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`);
  }

  return await response.json();
};

// Get available locations (agencies + bodegas)
export const getLocations = async () => {
  return apiRequest('/api/qr/locations');
};

// Process scanned QR code
export const scanQRCode = async (qrData: string, user: string, userName: string) => {
  return apiRequest('/api/qr/scan', {
    method: 'POST',
    body: JSON.stringify({
      qrData,
      user,
      userName
    }),
  });
};

// Download QR codes as ZIP file
export const downloadQRCodes = async (sessionId: string) => {
  const response = await fetch(buildApiUrl(`/api/qr/download/${sessionId}`));
  
  if (!response.ok) {
    throw new Error(`QR Download failed: ${response.status} ${response.statusText}`);
  }
  
  return response.blob();
};

// Note: Google Drive integration is now handled automatically by the backend
// No manual API calls needed - backup happens automatically on download

// Download inventory as Excel (updated for new Google Drive integration)
export const downloadInventoryExcel = async (
  agency: string,
  month: string,
  year: number,
  sessionId?: string
) => {
  const encodedAgency = encodeURIComponent(agency);
  let url: string;
  
  if (sessionId) {
    // Download specific inventory by session ID
    url = buildApiUrl(`/api/download/inventory/${encodedAgency}/${month}/${year}/excel/${sessionId}`);
  } else {
    // Download most recent inventory
    url = buildApiUrl(`/api/download/inventory/${encodedAgency}/${month}/${year}/excel`);
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Download failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.blob();
};

// Get stored files for an agency (Google Drive files)
export const getStoredFiles = async (agency: string) => {
  try {
    const encodedAgency = encodeURIComponent(agency);
    const response = await apiRequest(`/api/download/stored-files/${encodedAgency}`);
    return response;
  } catch (error) {
    console.error('Error getting stored files:', error);
    throw error;
  }
};

// Download specific file by ID
export const downloadStoredFile = async (fileId: string) => {
  try {
    const url = buildApiUrl(`/api/download/stored-file/${fileId}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Download failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const blob = response.blob();
    return blob;
  } catch (error) {
    console.error('Error downloading stored file:', error);
    throw error;
  }
};

// Check if inventory was completed by another user
export const checkInventoryCompletionByOther = async (
  agency: string,
  month: string,
  year: number,
  currentUserId: string,
  sessionId?: string
) => {
  try {
    const encodedAgency = encodeURIComponent(agency);
    const sessionParam = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    const response = await apiRequest(
      `/api/inventory/check-completion-by-other/${encodedAgency}/${month}/${year}/${currentUserId}${sessionParam}`
    );
    return response;
  } catch (error) {
    console.error('Error checking inventory completion by other:', error);
    throw error;
  }
};

// Download specific inventory by session ID (for multiple inventories per month)
export const downloadInventoryBySessionId = async (
  agency: string,
  month: string,
  year: number,
  sessionId: string,
  type: 'csv' | 'xlsx' = 'csv'
): Promise<Blob> => {
  try {
    const encodedAgency = encodeURIComponent(agency);
    const url = buildApiUrl(`/api/download/inventory/${encodedAgency}/${month}/${year}/${type}/${sessionId}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error downloading inventory: ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error downloading inventory by session ID:', error);
    throw error;
  }
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
  downloadInventoryExcel, // New function for Excel downloads
  getStoredFiles, // New function to get stored files from Google Drive
  downloadStoredFile, // New function to download specific file by ID
  downloadInventoryBySessionId, // New function for specific session downloads
  checkInventoryCompletionByOther, // New function to check if inventory was completed by another user
  validateMonthlySummary,
  cleanupDuplicates,
  cleanupSpecificDuplicates,
  checkInventoryCompletion,
  uploadCSVFile,
  downloadQRCodes,
  getLocations,
  scanQRCode,
};
