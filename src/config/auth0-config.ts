export const auth0Config = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN || 'your-domain.auth0.com',
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID || 'your-client-id',
  authorizationParams: {
    redirect_uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    audience: process.env.REACT_APP_AUTH0_AUDIENCE || 'https://your-api.com',
    scope: 'openid profile email',
  },
  // Use standard Auth0 callback handling
  cacheLocation: 'localstorage',
  useRefreshTokens: false,
}; 