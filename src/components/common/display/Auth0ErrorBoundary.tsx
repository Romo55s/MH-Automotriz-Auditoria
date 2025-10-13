import { Component, ErrorInfo, ReactNode } from 'react';
import { auth0Config } from '../../../config/auth0-config';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

interface DeviceInfo {
  userAgent: string;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSecureContext: boolean;
  hasLocalStorage: boolean;
  hasSessionStorage: boolean;
  hasCookies: boolean;
  protocol: string;
  hostname: string;
  port: string;
}

interface Auth0ConfigInfo {
  domain: string;
  clientId: string;
  redirectUri: string;
  audience: string;
  cacheLocation: string;
  useRefreshTokens: boolean;
  useCookiesForTransactions: boolean;
}

class Auth0ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Auth0 Error Boundary Caught Error:', error);
    console.error('🚨 Error Info:', errorInfo);
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isSecureContext = window.isSecureContext;
    
    // Test storage availability
    let hasLocalStorage = false;
    let hasSessionStorage = false;
    let hasCookies = false;
    
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      hasLocalStorage = true;
    } catch (e) {
      hasLocalStorage = false;
    }
    
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      hasSessionStorage = true;
    } catch (e) {
      hasSessionStorage = false;
    }
    
    try {
      document.cookie = 'test=1';
      hasCookies = document.cookie.includes('test=1');
      document.cookie = 'test=1; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } catch (e) {
      hasCookies = false;
    }

    return {
      userAgent,
      isMobile,
      isIOS,
      isAndroid,
      isSecureContext,
      hasLocalStorage,
      hasSessionStorage,
      hasCookies,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
    };
  }

  private getAuth0ConfigInfo(): Auth0ConfigInfo {
    return {
      domain: auth0Config.domain,
      clientId: auth0Config.clientId,
      redirectUri: auth0Config.authorizationParams.redirect_uri,
      audience: auth0Config.authorizationParams.audience,
      cacheLocation: auth0Config.cacheLocation,
      useRefreshTokens: auth0Config.useRefreshTokens,
      useCookiesForTransactions: auth0Config.useCookiesForTransactions,
    };
  }

  private getTroubleshootingTips(error: Error): string[] {
    const tips: string[] = [];
    
    if (error.message.includes('SecurityError') || error.message.includes('insecure')) {
      tips.push('🔒 SecurityError: This usually indicates an HTTPS/secure context issue');
      tips.push('📱 On mobile: Try opening in the default browser instead of in-app browser');
      tips.push('🔐 Ensure you\'re using HTTPS (not HTTP) when accessing the app');
      tips.push('🍪 Check if cookies are enabled in your browser settings');
      tips.push('🗑️ Try clearing browser cache and cookies for this site');
      tips.push('🔄 Try opening the app in an incognito/private browsing window');
    }
    
    if (error.message.includes('CORS')) {
      tips.push('🌐 CORS Error: Check if the Auth0 domain is properly configured');
      tips.push('🔧 Verify Auth0 application settings match your domain');
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      tips.push('📡 Network Error: Check your internet connection');
      tips.push('🔄 Try refreshing the page or restarting the app');
    }
    
    return tips;
  }

  render() {
    if (this.state.hasError) {
      const deviceInfo = this.getDeviceInfo();
      const auth0Config = this.getAuth0ConfigInfo();
      const troubleshootingTips = this.getTroubleshootingTips(this.state.error!);

      return (
        <div className='min-h-screen bg-red-900 text-white flex items-center justify-center p-4 overflow-y-auto'>
          <div className='w-full max-w-4xl'>
            <div className='text-center mb-6'>
              <h1 className='text-2xl font-bold mb-4'>🚨 Error de Auth0</h1>
              <p className='mb-4 text-lg'>
                Algo salió mal con el sistema de autenticación.
              </p>
            </div>

            {/* Error Details */}
            <div className='bg-black/50 p-4 rounded mb-6'>
              <h2 className='text-lg font-bold mb-2'>📋 Detalles del Error:</h2>
              <pre className='text-sm overflow-auto whitespace-pre-wrap'>
                {this.state.error?.toString()}
              </pre>
            </div>

            {/* Device Information */}
            <div className='bg-black/30 p-4 rounded mb-6'>
              <h2 className='text-lg font-bold mb-3'>📱 Información del Dispositivo:</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                <div>
                  <strong>Dispositivo:</strong> {deviceInfo.isMobile ? 'Móvil' : 'Escritorio'}
                  {deviceInfo.isIOS && ' (iOS)'}
                  {deviceInfo.isAndroid && ' (Android)'}
                </div>
                <div>
                  <strong>Contexto Seguro:</strong> 
                  <span className={deviceInfo.isSecureContext ? 'text-green-400' : 'text-red-400'}>
                    {deviceInfo.isSecureContext ? ' ✅ Sí' : ' ❌ No'}
                  </span>
                </div>
                <div>
                  <strong>Protocolo:</strong> {deviceInfo.protocol}
                </div>
                <div>
                  <strong>Host:</strong> {deviceInfo.hostname}
                  {deviceInfo.port && `:${deviceInfo.port}`}
                </div>
                <div>
                  <strong>LocalStorage:</strong>
                  <span className={deviceInfo.hasLocalStorage ? 'text-green-400' : 'text-red-400'}>
                    {deviceInfo.hasLocalStorage ? ' ✅ Disponible' : ' ❌ No disponible'}
                  </span>
                </div>
                <div>
                  <strong>SessionStorage:</strong>
                  <span className={deviceInfo.hasSessionStorage ? 'text-green-400' : 'text-red-400'}>
                    {deviceInfo.hasSessionStorage ? ' ✅ Disponible' : ' ❌ No disponible'}
                  </span>
                </div>
                <div>
                  <strong>Cookies:</strong>
                  <span className={deviceInfo.hasCookies ? 'text-green-400' : 'text-red-400'}>
                    {deviceInfo.hasCookies ? ' ✅ Disponible' : ' ❌ No disponible'}
                  </span>
                </div>
              </div>
            </div>

            {/* Auth0 Configuration */}
            <div className='bg-black/30 p-4 rounded mb-6'>
              <h2 className='text-lg font-bold mb-3'>🔧 Configuración de Auth0:</h2>
              <div className='text-sm space-y-2'>
                <div><strong>Dominio:</strong> {auth0Config.domain}</div>
                <div><strong>Client ID:</strong> {auth0Config.clientId}</div>
                <div><strong>Redirect URI:</strong> {auth0Config.redirectUri}</div>
                <div><strong>Audience:</strong> {auth0Config.audience}</div>
                <div><strong>Cache Location:</strong> {auth0Config.cacheLocation}</div>
                <div><strong>Refresh Tokens:</strong> {auth0Config.useRefreshTokens ? 'Habilitado' : 'Deshabilitado'}</div>
                <div><strong>Cookies para Transacciones:</strong> {auth0Config.useCookiesForTransactions ? 'Habilitado' : 'Deshabilitado'}</div>
              </div>
            </div>

            {/* Troubleshooting Tips */}
            <div className='bg-black/30 p-4 rounded mb-6'>
              <h2 className='text-lg font-bold mb-3'>💡 Soluciones Sugeridas:</h2>
              <ul className='text-sm space-y-2'>
                {troubleshootingTips.map((tip, index) => (
                  <li key={index} className='flex items-start'>
                    <span className='mr-2'>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* User Agent (for debugging) */}
            <div className='bg-black/30 p-4 rounded mb-6'>
              <h2 className='text-lg font-bold mb-2'>🔍 User Agent:</h2>
              <pre className='text-xs overflow-auto whitespace-pre-wrap'>
                {deviceInfo.userAgent}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <button
                onClick={() => window.location.reload()}
                className='bg-white text-red-900 px-6 py-3 rounded hover:bg-gray-100 font-semibold'
              >
                🔄 Recargar Página
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className='bg-yellow-600 text-white px-6 py-3 rounded hover:bg-yellow-700 font-semibold'
              >
                🗑️ Limpiar Cache y Recargar
              </button>
              <button
                onClick={() => {
                  const debugInfo = {
                    error: this.state.error?.toString(),
                    deviceInfo,
                    auth0Config,
                    timestamp: new Date().toISOString()
                  };
                  console.log('🐛 Debug Info:', debugInfo);
                  alert('Información de debug enviada a la consola del navegador');
                }}
                className='bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-semibold'
              >
                🐛 Enviar Debug a Consola
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default Auth0ErrorBoundary;
