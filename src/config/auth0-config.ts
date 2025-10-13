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
    audience: process.env.REACT_APP_AUTH0_AUDIENCE || 'http://localhost:5000',
    scope: 'openid profile email',
  },
  // Production optimizations
  cacheLocation: 'localstorage' as const,
  useRefreshTokens: process.env.NODE_ENV === 'production',
  // Security settings for production - disabled for mobile compatibility
  useCookiesForTransactions: false, // Disabled to prevent mobile SecurityError
  // Error handling
  errorPath: '/error',
  // Advanced settings
  advancedOptions: {
    defaultScope: 'openid profile email',
  },
  // Mobile-specific optimizations
  legacySameSiteCookie: false, // Disable legacy cookie handling for mobile
  now: Math.floor(Date.now() / 1000), // Ensure proper timestamp handling
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
