import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [currentSession, setCurrentSession] = useState<InventorySession | null>(null);
  const [scannedCodes, setScannedCodes] = useState<ScannedCode[]>([]);

  const addScannedCode = (code: ScannedCode) => {
    setScannedCodes(prev => [...prev, code]);
  };

  const confirmScannedCode = (id: string) => {
    setScannedCodes(prev => 
      prev.map(code => 
        code.id === id ? { ...code, confirmed: true } : code
      )
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

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 