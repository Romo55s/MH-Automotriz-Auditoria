import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { AppProvider } from './context/AppContext.tsx';
import Login from './components/Login.tsx';
import AgencySelector from './components/AgencySelector.tsx';
import InventoryPage from './components/InventoryPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Auth0ErrorBoundary from './components/Auth0ErrorBoundary.tsx';
import { auth0Config } from './config/auth0-config.ts';
import './index.css';

// Component to handle Auth0 callback at root level
const Auth0CallbackHandler: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have Auth0 callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      console.log('🔄 Processing Auth0 callback...');
      // The Auth0 provider will automatically process this callback
      // We just need to wait for it to complete
    } else if (!isLoading && !isAuthenticated) {
      // No callback, redirect to login
      navigate('/login');
    } else if (!isLoading && isAuthenticated && user) {
      // Already authenticated, redirect to next step
      navigate('/select-agency');
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
          <h2 className="text-xl text-gray-300">Processing authentication...</h2>
        </div>
      </div>
    );
  }

  return null;
};

const App: React.FC = () => {
  return (
    <Auth0ErrorBoundary>
      <Auth0Provider 
        domain={auth0Config.domain}
        clientId={auth0Config.clientId}
        authorizationParams={{
          redirect_uri: auth0Config.authorizationParams.redirect_uri,
          audience: auth0Config.authorizationParams.audience,
          scope: auth0Config.authorizationParams.scope,
        }}
        cacheLocation="localstorage"
        useRefreshTokens={false}
      >
        <AppProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<Auth0CallbackHandler />} />
                <Route 
                  path="/login" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Login />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/select-agency" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <AgencySelector />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/inventory" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <InventoryPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </div>
          </Router>
        </AppProvider>
      </Auth0Provider>
    </Auth0ErrorBoundary>
  );
};

export default App;
