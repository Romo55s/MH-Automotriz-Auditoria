// API service for backend communication
import { API_BASE_URL } from '../config/environment';

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
  year: number
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

// Download inventory as CSV
export const downloadInventoryCSV = async (
  agency: string,
  month: string,
  year: number
) => {
  const encodedAgency = encodeURIComponent(agency);
  const url = `${API_BASE_URL}/api/download/inventory/${encodedAgency}/${month}/${year}/csv`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Download failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.blob();
};

// Download inventory as Excel
export const downloadInventoryExcel = async (
  agency: string,
  month: string,
  year: number
) => {
  const encodedAgency = encodeURIComponent(agency);
  const url = `${API_BASE_URL}/api/download/inventory/${encodedAgency}/${month}/${year}/excel`;
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

  const response = await fetch(`${API_BASE_URL}/api/qr/upload-csv`, {
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
  const response = await fetch(`${API_BASE_URL}/api/qr/download/${sessionId}`);
  
  if (!response.ok) {
    throw new Error(`QR Download failed: ${response.status} ${response.statusText}`);
  }
  
  return response.blob();
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
  uploadCSVFile,
  downloadQRCodes,
  getLocations,
  scanQRCode,
};
