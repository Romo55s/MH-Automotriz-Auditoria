// API service for backend communication
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

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

      console.error(`🚨 API Error ${response.status}:`, {
        status: response.status,
        statusText: response.statusText,
        details: errorDetails,
        url,
        body: options.body,
      });

      throw new Error(
        `API Error: ${response.status} ${response.statusText}${
          errorDetails ? ` - ${errorDetails}` : ''
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
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

  return apiRequest('/save-scan', {
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
  return apiRequest('/finish-session', {
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
  return apiRequest(`/monthly-inventory/${agency}/${month}/${year}`);
};

// Get all monthly inventories for an agency
export const getAgencyInventories = async (agency: string) => {
  return apiRequest(`/agency-inventories/${agency}`);
};

// Check if monthly inventory exists
export const checkMonthlyInventory = async (
  agency: string,
  month: string,
  year: number
) => {
  return apiRequest(`/check-monthly-inventory/${agency}/${month}/${year}`);
};

export default {
  saveScan,
  finishSession,
  getMonthlyInventory,
  getAgencyInventories,
  checkMonthlyInventory,
};
