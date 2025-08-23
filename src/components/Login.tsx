import { useAuth0 } from '@auth0/auth0-react';
import { Car, Shield, Users, Zap } from 'lucide-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth0Config } from '../config/auth0-config';
import Footer from './Footer';

const Login: React.FC = () => {
  const { loginWithRedirect, isLoading, isAuthenticated, user, error } =
    useAuth0();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/select-agency');
    }
  }, [isAuthenticated, user, navigate]);

  const handleMainLogin = async () => {
    try {
      console.log('🔑 Initiating login...');

      const authParams = {
        authorizationParams: {
          redirect_uri: auth0Config.authorizationParams.redirect_uri,
          audience: auth0Config.authorizationParams.audience,
          scope: auth0Config.authorizationParams.scope,
        },
      };

      await loginWithRedirect(authParams);
    } catch (err) {
      console.error('❌ Login failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center relative overflow-hidden'>
        <div className='text-center z-10 relative'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6'></div>
          <h2 className='text-xl text-gray-300'>Loading...</h2>
        </div>
      </div>
    );
  }

  // Display any Auth0 errors
  if (error) {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4'>
        <div className='z-10 relative max-w-2xl mx-auto text-center'>
          <div className='bg-red-900/20 border border-red-500/50 rounded-lg p-6 mb-6'>
            <h2 className='text-2xl font-bold text-red-400 mb-4'>
              Authentication Error
            </h2>
            <p className='text-red-300 mb-4'>{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4'>
      <div className='z-10 relative max-w-2xl mx-auto text-center'>
        <div className='mb-12'>
          <div className='mx-auto w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-8 border border-white/20'>
            <Car className='w-12 h-12 text-white' />
          </div>
          <h1 className='text-5xl font-bold uppercase mb-6 text-white'>
            Car Inventory
            <span className='block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent'>
              App
            </span>
          </h1>
          <p className='text-xl text-gray-300 max-w-lg mx-auto'>
            Automate your car inventory with advanced barcode scanning and
            REPUVE integration
          </p>
        </div>

        <div className='space-y-6 mb-12'>
          <div className='flex items-center justify-center space-x-4 text-gray-300'>
            <div className='bg-white/10 backdrop-blur-md rounded-full p-3 border border-white/20'>
              <Shield className='w-6 h-6 text-white' />
            </div>
            <span>Secure authentication with Auth0</span>
          </div>
          <div className='flex items-center justify-center space-x-4 text-gray-300'>
            <div className='bg-white/10 backdrop-blur-md rounded-full p-3 border border-white/20'>
              <Users className='w-6 h-6 text-white' />
            </div>
            <span>Multi-agency support</span>
          </div>
          <div className='flex items-center justify-center space-x-4 text-gray-300'>
            <div className='bg-white/10 backdrop-blur-md rounded-full p-3 border border-white/20'>
              <Zap className='w-6 h-6 text-white' />
            </div>
            <span>Real-time barcode scanning</span>
          </div>
        </div>

        <div className='text-center'>
          <button
            onClick={() => void handleMainLogin()}
            className='bg-white text-black font-semibold py-4 px-8 rounded-full border border-white hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105'
          >
            Sign In to Continue
          </button>
        </div>

        <p className='text-xs text-gray-400 text-center mt-8 opacity-70'>
          By signing in, you agree to our terms of service and privacy policy
        </p>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;
