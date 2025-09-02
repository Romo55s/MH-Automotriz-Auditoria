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
  confirmed: boolean;
  user: string;
}

export interface InventorySession {
  id: string;
  agencyId: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime?: Date;
  scannedCodes: ScannedCode[];
  status: 'Active' | 'Completed' | 'Paused';
  month: string; // Format: "MM" (e.g., "01")
  year: number;
  sessionId?: string;
}

export interface MonthlyInventory {
  id: string;
  agencyId: string;
  month: string; // Format: "MM"
  year: number;
  monthName: string; // e.g., "January 2024"
  status: 'Active' | 'Completed' | 'Paused';
  createdAt: Date;
  createdBy: string;
  totalScans: number;
  sessionId?: string;
  lastUpdated?: Date;
}
