import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { agencies } from '../data/agencies';
import { Agency, InventorySession, ScannedCode } from '../types';

interface AppContextType {
  selectedAgency: Agency | null;
  setSelectedAgency: (agency: Agency | null) => void;
  currentSession: InventorySession | null;
  setCurrentSession: (session: InventorySession | null) => void;
  scannedCodes: ScannedCode[];
  addScannedCode: (code: ScannedCode) => void;
  confirmScannedCode: (id: string) => void;
  clearScannedCodes: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Initialize selectedAgency from localStorage or null
  const [selectedAgency, setSelectedAgencyState] = useState<Agency | null>(() => {
    const savedAgencyId = localStorage.getItem('selectedAgencyId');
    if (savedAgencyId) {
      const agency = agencies.find(a => a.id === savedAgencyId);
      return agency || null;
    }
    return null;
  });

  const [currentSession, setCurrentSession] = useState<InventorySession | null>(
    null
  );
  const [scannedCodes, setScannedCodes] = useState<ScannedCode[]>([]);

  // Persist selectedAgency to localStorage whenever it changes
  const setSelectedAgency = (agency: Agency | null) => {
    setSelectedAgencyState(agency);
    if (agency) {
      localStorage.setItem('selectedAgencyId', agency.id);
    } else {
      localStorage.removeItem('selectedAgencyId');
    }
  };

  // Clear localStorage when component unmounts (optional cleanup)
  useEffect(() => {
    return () => {
      // Keep the agency in localStorage even when component unmounts
    };
  }, []);

  const addScannedCode = (code: ScannedCode) => {
    setScannedCodes(prev => [...prev, code]);
  };

  const confirmScannedCode = (id: string) => {
    setScannedCodes(prev =>
      prev.map(code => (code.id === id ? { ...code, confirmed: true } : code))
    );
  };

  const clearScannedCodes = () => {
    setScannedCodes([]);
  };

  const value: AppContextType = {
    selectedAgency,
    setSelectedAgency,
    currentSession,
    setCurrentSession,
    scannedCodes,
    addScannedCode,
    confirmScannedCode,
    clearScannedCodes,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
