// Session management utilities for inventory sessions

export interface SessionData {
  scannedCodes: Array<{
    id: string;
    code: string;
    timestamp: string;
    confirmed: boolean;
    user: string;
  }>;
  isSessionActive: boolean;
  sessionId: string;
  lastUpdated: string;
  agency: string;
  month: string;
  year: number;
}

export const SESSION_PREFIX = 'inventory';

export const createSessionKey = (
  agency: string,
  month: string,
  year: number
): string => {
  return `${SESSION_PREFIX}_${agency}_${month}_${year}`;
};

export const saveSession = (sessionData: SessionData): void => {
  try {
    const sessionKey = createSessionKey(
      sessionData.agency,
      sessionData.month,
      sessionData.year
    );
    sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to save session to storage:', error);
  }
};

export const loadSession = (
  agency: string,
  month: string,
  year: number
): SessionData | null => {
  try {
    const sessionKey = createSessionKey(agency, month, year);
    const savedSession = sessionStorage.getItem(sessionKey);

    if (savedSession) {
      return JSON.parse(savedSession);
    }
  } catch (error) {
    console.error('Failed to load session from storage:', error);
    // Clear corrupted session data
    clearSession(agency, month, year);
  }

  return null;
};

export const clearSession = (
  agency: string,
  month: string,
  year: number
): void => {
  try {
    const sessionKey = createSessionKey(agency, month, year);
    sessionStorage.removeItem(sessionKey);
  } catch (error) {
    console.error('Failed to clear session from storage:', error);
  }
};

export const clearAllSessions = (): void => {
  try {
    const keysToRemove: string[] = [];

    // Find all inventory session keys
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(SESSION_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    // Remove all found keys
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear all sessions:', error);
  }
};

export const getSessionInfo = (): Array<{ key: string; data: SessionData }> => {
  const sessions: Array<{ key: string; data: SessionData }> = [];

  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(SESSION_PREFIX)) {
        const data = sessionStorage.getItem(key);
        if (data) {
          sessions.push({ key, data: JSON.parse(data) });
        }
      }
    }
  } catch (error) {
    console.error('Failed to get session info:', error);
  }

  return sessions;
};

export const isSessionExpired = (
  sessionData: SessionData,
  maxAgeHours: number = 24
): boolean => {
  try {
    const lastUpdated = new Date(sessionData.lastUpdated);
    const now = new Date();
    const diffHours =
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    return diffHours > maxAgeHours;
  } catch (error) {
    console.error('Failed to check session expiration:', error);
    return true; // Consider expired if we can't check
  }
};

export const cleanupExpiredSessions = (maxAgeHours: number = 24): void => {
  try {
    const sessions = getSessionInfo();

    sessions.forEach(({ key, data }) => {
      if (isSessionExpired(data, maxAgeHours)) {
        sessionStorage.removeItem(key);
        console.log(`Cleaned up expired session: ${key}`);
      }
    });
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
};
