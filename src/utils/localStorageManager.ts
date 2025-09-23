// Local storage management utilities for scanned codes with automatic cleanup

export interface LocalStorageData {
  scannedCodes: Array<{
    id: string;
    code: string;
    timestamp: string;
    confirmed: boolean;
    user: string;
    carData?: {
      serie: string;
      marca: string;
      color: string;
      ubicaciones: string;
    };
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
    carData?: {
      serie: string;
      marca: string;
      color: string;
      ubicaciones: string;
    };
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
    });

    if (keysToRemove.length > 0) {
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
  
  // Set up periodic cleanup every hour for regular scans, daily for downloaded inventories
  setInterval(() => {
    cleanupExpiredLocalStorage();
  }, 60 * 60 * 1000); // 1 hour for regular scans
  
  setInterval(() => {
    cleanupExpiredDownloadedInventories();
  }, 24 * 60 * 60 * 1000); // 24 hours for downloaded inventories
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
    carData?: {
      serie: string;
      marca: string;
      color: string;
      ubicaciones: string;
    };
  }>;
}

export const cleanupExpiredDownloadedInventories = (): void => {
  try {
    const downloadedInventories = JSON.parse(localStorage.getItem('downloadedInventories') || '[]');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const validInventories = downloadedInventories.filter((inventory: DownloadedInventory) => {
      const inventoryDate = new Date(inventory.year, parseInt(inventory.month) - 1); // month is 1-based in inventory
      const inventoryMonth = inventoryDate.getMonth();
      const inventoryYear = inventoryDate.getFullYear();
      
      // Keep only inventories from the current month and year
      // Remove inventories from previous months (cleanup at beginning of each month)
      return inventoryYear === currentYear && inventoryMonth === currentMonth;
    });
    
    if (validInventories.length !== downloadedInventories.length) {
      localStorage.setItem('downloadedInventories', JSON.stringify(validInventories));
    }
  } catch (error) {
    console.error('Error cleaning up expired downloaded inventories:', error);
  }
};

export const saveDownloadedInventory = (
  agencyName: string,
  month: string,
  year: number,
  format: 'csv' | 'excel',
  scannedCodes: Array<{
    id: string;
    code: string;
    timestamp: string;
    confirmed: boolean;
    user: string;
    carData?: {
      serie: string;
      marca: string;
      color: string;
      ubicaciones: string;
    };
  }>
): void => {
  try {
    const downloadedInventories = JSON.parse(localStorage.getItem('downloadedInventories') || '[]');
    const now = new Date();
    // Set expiration to the end of the following month
    // This ensures data is available for the entire next month regardless of month length
    const expiresAt = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59); // Last day of next month
    
    const newInventory: DownloadedInventory = {
      agencyName,
      month,
      year,
      downloadedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      format,
      data: scannedCodes
    };
    
    // Check if this inventory already exists and update it, or add new one
    const existingIndex = downloadedInventories.findIndex((inv: DownloadedInventory) => 
      inv.agencyName === agencyName && inv.month === month && inv.year === year
    );
    
    if (existingIndex !== -1) {
      downloadedInventories[existingIndex] = newInventory;
    } else {
      downloadedInventories.push(newInventory);
    }
    
    localStorage.setItem('downloadedInventories', JSON.stringify(downloadedInventories));
  } catch (error) {
    console.error('Error saving downloaded inventory:', error);
  }
};

export const getDownloadedInventories = (): DownloadedInventory[] => {
  try {
    const downloadedInventories = JSON.parse(localStorage.getItem('downloadedInventories') || '[]');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter out expired inventories (keep only current month and year)
    const validInventories = downloadedInventories.filter((inventory: DownloadedInventory) => {
      const inventoryDate = new Date(inventory.year, parseInt(inventory.month) - 1); // month is 1-based in inventory
      const inventoryMonth = inventoryDate.getMonth();
      const inventoryYear = inventoryDate.getFullYear();
      
      // Keep only inventories from the current month and year
      return inventoryYear === currentYear && inventoryMonth === currentMonth;
    });
    
    return validInventories;
  } catch (error) {
    console.error('Error getting downloaded inventories:', error);
    return [];
  }
};
