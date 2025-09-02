// Production-ready Auth0 configuration
export const auth0Config = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN || 'your-domain.auth0.com',
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID || 'your-client-id',
  authorizationParams: {
    redirect_uri:
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NODE_ENV === 'production' 
          ? 'https://your-production-domain.com'
          : 'http://localhost:3000',
    audience: process.env.REACT_APP_AUTH0_AUDIENCE || 'https://your-api.com',
    scope: 'openid profile email',
  },
  // Production optimizations
  cacheLocation: 'localstorage',
  useRefreshTokens: process.env.NODE_ENV === 'production',
  // Security settings for production
  useCookiesForTransactions: process.env.NODE_ENV === 'production',
  // Error handling
  errorPath: '/error',
  // Advanced settings
  advancedOptions: {
    defaultScope: 'openid profile email',
  },
  // Session management
  sessionCheckExpiryDays: 1,
  // Logout configuration
  logoutParams: {
    returnTo: typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com'
        : 'http://localhost:3000'
  }
};
