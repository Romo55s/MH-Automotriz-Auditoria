import { useAuth0 } from '@auth0/auth0-react';
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
}) => {
  const { isAuthenticated, isLoading, user, error, getAccessTokenSilently } =
    useAuth0();

  // Console log Auth0 data for debugging
  console.log('🔐 ProtectedRoute Auth0 Data:', {
    isAuthenticated,
    isLoading,
    user,
    error,
    requireAuth,
    timestamp: new Date().toISOString(),
  });

  // Log any Auth0 errors in detail
  useEffect(() => {
    if (error) {
      console.error('❌ Auth0 Error Details:', {
        error,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }, [error]);

  // Log URL parameters to see if we have Auth0 callback data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const authError = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    console.log('🔍 URL Parameters Analysis:', {
      currentUrl: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      code: code ? `${code.substring(0, 10)}...` : null,
      state: state ? `${state.substring(0, 10)}...` : null,
      error: authError,
      errorDescription,
      hasCode: !!code,
      hasState: !!state,
      hasError: !!authError,
    });

    if (code || state || authError) {
      console.log('🔄 Auth0 Callback Detected:', {
        code: !!code,
        state: !!state,
        error: authError,
        errorDescription,
      });
    }
  }, []);

  // Try to get access token to see if authentication is working
  useEffect(() => {
    if (isAuthenticated && user) {
      getAccessTokenSilently()
        .then(token => {
          console.log(
            '🎫 Access Token Retrieved:',
            token ? 'SUCCESS' : 'FAILED'
          );
        })
        .catch(err => {
          console.error('❌ Token Retrieval Failed:', err);
        });
    }
  }, [isAuthenticated, user, getAccessTokenSilently]);

  // Remove the problematic auto-authentication logic
  // Auth0 will handle the callback automatically

  if (isLoading) {
    console.log('⏳ Auth0 is loading...');
    return (
      <div className='min-h-screen bg-black flex items-center justify-center relative overflow-hidden'>
        <div className='text-center z-10 relative'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6'></div>
          <h2 className='text-xl text-gray-300'>Cargando...</h2>
        </div>
      </div>
    );
  }

  // For protected routes (requireAuth = true)
  if (requireAuth && !isAuthenticated) {
    console.log('🚫 Access denied - redirecting to login');
    return <Navigate to='/login' replace />;
  }

  // For public routes (requireAuth = false) - redirect if already authenticated
  if (!requireAuth && isAuthenticated) {
    console.log('✅ Already authenticated - redirecting to agency selector');
    return <Navigate to='/select-agency' replace />;
  }

  console.log('✅ Access granted to protected route');
  return <>{children}</>;
};

export default ProtectedRoute;
