// Local storage management utilities for scanned codes with automatic cleanup

export interface LocalStorageData {
  scannedCodes: Array<{
    id: string;
    code: string;
    timestamp: string;
    confirmed: boolean;
    user: string;
  }>;
  agency: string;
  month: string;
  year: number;
  createdAt: string;
  expiresAt: string;
}

export const LOCAL_STORAGE_PREFIX = 'inventory_scans';
export const EXPIRY_HOURS = 36; // 1.5 days

export const createLocalStorageKey = (
  agency: string,
  month: string,
  year: number
): string => {
  return `${LOCAL_STORAGE_PREFIX}_${agency}_${month}_${year}`;
};

export const saveScansToLocalStorage = (
  scannedCodes: Array<{
    id: string;
    code: string;
    timestamp: string;
    confirmed: boolean;
    user: string;
  }>,
  agency: string,
  month: string,
  year: number
): void => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);
    
    const data: LocalStorageData = {
      scannedCodes,
      agency,
      month,
      year,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const key = createLocalStorageKey(agency, month, year);
    localStorage.setItem(key, JSON.stringify(data));
    
    console.log(`Scans saved to local storage. Expires at: ${expiresAt.toLocaleString()}`);
  } catch (error) {
    console.error('Failed to save scans to local storage:', error);
  }
};

export const loadScansFromLocalStorage = (
  agency: string,
  month: string,
  year: number
): LocalStorageData | null => {
  try {
    const key = createLocalStorageKey(agency, month, year);
    const savedData = localStorage.getItem(key);

    if (savedData) {
      const data: LocalStorageData = JSON.parse(savedData);
      
      // Check if data has expired
      if (isDataExpired(data)) {
        console.log(`Local storage data expired for ${agency} ${month}/${year}`);
        clearScansFromLocalStorage(agency, month, year);
        return null;
      }
      
      return data;
    }
  } catch (error) {
    console.error('Failed to load scans from local storage:', error);
    // Clear corrupted data
    clearScansFromLocalStorage(agency, month, year);
  }

  return null;
};

export const clearScansFromLocalStorage = (
  agency: string,
  month: string,
  year: number
): void => {
  try {
    const key = createLocalStorageKey(agency, month, year);
    localStorage.removeItem(key);
    console.log(`Cleared local storage data for ${agency} ${month}/${year}`);
  } catch (error) {
    console.error('Failed to clear scans from local storage:', error);
  }
};

export const isDataExpired = (data: LocalStorageData): boolean => {
  try {
    const now = new Date();
    const expiresAt = new Date(data.expiresAt);
    return now > expiresAt;
  } catch (error) {
    console.error('Failed to check data expiration:', error);
    return true; // Consider expired if we can't check
  }
};

export const cleanupExpiredLocalStorage = (): void => {
  try {
    const keysToRemove: string[] = [];
    const now = new Date();

    // Find all local storage keys with our prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsedData: LocalStorageData = JSON.parse(data);
            if (isDataExpired(parsedData)) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // If we can't parse the data, consider it corrupted and remove it
          keysToRemove.push(key);
        }
      }
    }

    // Remove expired data
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Cleaned up expired local storage data: ${key}`);
    });

    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} expired local storage entries`);
    }
  } catch (error) {
    console.error('Failed to cleanup expired local storage:', error);
  }
};

export const getAllLocalStorageData = (): LocalStorageData[] => {
  const allData: LocalStorageData[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsedData: LocalStorageData = JSON.parse(data);
            if (!isDataExpired(parsedData)) {
              allData.push(parsedData);
            }
          }
        } catch (error) {
          console.error(`Failed to parse local storage data for key ${key}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to get all local storage data:', error);
  }

  return allData;
};

export const getLocalStorageInfo = (): Array<{
  key: string;
  data: LocalStorageData;
  isExpired: boolean;
  timeUntilExpiry: string;
}> => {
  const info: Array<{
    key: string;
    data: LocalStorageData;
    isExpired: boolean;
    timeUntilExpiry: string;
  }> = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsedData: LocalStorageData = JSON.parse(data);
            const isExpired = isDataExpired(parsedData);
            
            let timeUntilExpiry = 'Expired';
            if (!isExpired) {
              const now = new Date();
              const expiresAt = new Date(parsedData.expiresAt);
              const diffMs = expiresAt.getTime() - now.getTime();
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              timeUntilExpiry = `${diffHours}h ${diffMinutes}m`;
            }

            info.push({
              key: key!,
              data: parsedData,
              isExpired,
              timeUntilExpiry,
            });
          }
        } catch (error) {
          console.error(`Failed to parse local storage data for key ${key}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to get local storage info:', error);
  }

  return info;
};

// Auto-cleanup on module load
if (typeof window !== 'undefined') {
  // Run cleanup when the module is loaded
  cleanupExpiredLocalStorage();
  
  // Set up periodic cleanup every hour
  setInterval(() => {
    cleanupExpiredLocalStorage();
    cleanupExpiredDownloadedInventories();
  }, 60 * 60 * 1000); // 1 hour
}

// Downloaded inventories management
export interface DownloadedInventory {
  agencyName: string;
  month: string;
  year: number;
  downloadedAt: string;
  expiresAt: string;
  format: 'csv' | 'excel';
  data: Array<{
    id: string;
    code: string;
    timestamp: string;
    confirmed: boolean;
    user: string;
  }>;
}

export const cleanupExpiredDownloadedInventories = (): void => {
  try {
    const downloadedInventories = JSON.parse(localStorage.getItem('downloadedInventories') || '[]');
    const now = new Date();
    
    const validInventories = downloadedInventories.filter((inventory: DownloadedInventory) => {
      const expiresAt = new Date(inventory.expiresAt);
      return expiresAt > now;
    });
    
    if (validInventories.length !== downloadedInventories.length) {
      localStorage.setItem('downloadedInventories', JSON.stringify(validInventories));
      console.log(`Cleaned up ${downloadedInventories.length - validInventories.length} expired downloaded inventories`);
    }
  } catch (error) {
    console.error('Error cleaning up expired downloaded inventories:', error);
  }
};

export const getDownloadedInventories = (): DownloadedInventory[] => {
  try {
    const downloadedInventories = JSON.parse(localStorage.getItem('downloadedInventories') || '[]');
    const now = new Date();
    
    // Filter out expired inventories
    const validInventories = downloadedInventories.filter((inventory: DownloadedInventory) => {
      const expiresAt = new Date(inventory.expiresAt);
      return expiresAt > now;
    });
    
    return validInventories;
  } catch (error) {
    console.error('Error getting downloaded inventories:', error);
    return [];
  }
};
