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
          <div className='animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-white mx-auto mb-4 sm:mb-6'></div>
          <h2 className='text-lg sm:text-xl text-gray-300'>Cargando...</h2>
        </div>
      </div>
    );
  }

  // Display any Auth0 errors
  if (error) {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center relative overflow-hidden p-4'>
        <div className='z-10 relative max-w-2xl mx-auto text-center'>
          <div className='bg-red-900/20 border border-red-500/50 rounded-lg p-4 sm:p-6 mb-6'>
            <h2 className='text-xl sm:text-2xl font-bold text-red-400 mb-3 sm:mb-4'>
              Error de Autenticación
            </h2>
            <p className='text-sm sm:text-base text-red-300 mb-3 sm:mb-4'>{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className='bg-red-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm sm:text-base'
            >
              Intentar de Nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black flex flex-col relative overflow-hidden'>
      <div className='flex-1 flex flex-col items-center justify-center p-4'>
        <div className='z-10 relative max-w-2xl mx-auto text-center'>
          <div className='mb-8 sm:mb-12'>
            <div className='mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 sm:mb-8 border border-white/20'>
              <Car className='w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white' />
            </div>
            <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold uppercase mb-4 sm:mb-6 text-white'>
              <span className='block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent'>
                MH Automotriz
              </span>
            </h1>
            <p className='text-base sm:text-lg lg:text-xl text-gray-300 max-w-lg mx-auto px-4'>
              Automatiza tu inventario de autos con escaneo avanzado de códigos de barras
            </p>
          </div>

          <div className='mb-8 sm:mb-12'>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8'>
              <div className='flex flex-col items-center text-center'>
                <div className='bg-white/10 backdrop-blur-md rounded-full p-4 sm:p-5 border border-white/20 mb-3 sm:mb-4'>
                  <Shield className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                </div>
                <span className='text-sm sm:text-base text-gray-300'>Autenticación segura con Auth0</span>
              </div>
              <div className='flex flex-col items-center text-center'>
                <div className='bg-white/10 backdrop-blur-md rounded-full p-4 sm:p-5 border border-white/20 mb-3 sm:mb-4'>
                  <Users className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                </div>
                <span className='text-sm sm:text-base text-gray-300'>Soporte multi-agencia</span>
              </div>
              <div className='flex flex-col items-center text-center'>
                <div className='bg-white/10 backdrop-blur-md rounded-full p-4 sm:p-5 border border-white/20 mb-3 sm:mb-4'>
                  <Zap className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                </div>
                <span className='text-sm sm:text-base text-gray-300'>Escaneo de códigos de barras en tiempo real</span>
              </div>
            </div>
          </div>

          <div className='text-center'>
            <button
              onClick={() => void handleMainLogin()}
              className='bg-white text-black font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-full border border-white hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105 text-sm sm:text-base'
            >
              Iniciar Sesión para Continuar
            </button>
          </div>

          <p className='text-xs text-gray-400 text-center mt-6 sm:mt-8 opacity-70 px-4'>
            Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;
