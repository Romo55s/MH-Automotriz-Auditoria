// Environment configuration
// This file manages environment variables and API configuration

export const config = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://mh-automotriz-auditoria-back-end.onrender.com',
  
  // WebSocket Configuration
  WS_BASE_URL: process.env.REACT_APP_WS_BASE_URL || 'wss://mh-automotriz-auditoria-back-end.onrender.com',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  
  // Optional configurations
  API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10),
  
  // Auth0 Configuration (if using Auth0)
  AUTH0_DOMAIN: process.env.REACT_APP_AUTH0_DOMAIN,
  AUTH0_CLIENT_ID: process.env.REACT_APP_AUTH0_CLIENT_ID,
  AUTH0_AUDIENCE: process.env.REACT_APP_AUTH0_AUDIENCE,
} as const;

// Export individual values for convenience
export const {
  API_BASE_URL,
  WS_BASE_URL,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  API_TIMEOUT,
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH0_AUDIENCE,
} = config;

export default config;
