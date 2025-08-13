export interface User {
  email: string;
  name: string;
  picture?: string;
}

export interface Agency {
  id: string;
  name: string;
  googleSheetId: string;
}

export interface ScannedCode {
  id: string;
  code: string;
  timestamp: Date;
  photo?: string;
  confirmed: boolean;
}

export interface InventorySession {
  id: string;
  agencyId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  scannedCodes: ScannedCode[];
  status: 'active' | 'completed';
} 