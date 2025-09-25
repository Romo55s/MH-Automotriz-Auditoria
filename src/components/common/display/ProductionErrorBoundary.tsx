import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ProductionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default production error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="card text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">
                  Algo salió mal
                </h1>
                <p className="text-secondaryText">
                  Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Recargar Página</span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Ir al Inicio</span>
                </button>
              </div>

              {/* Show error details only in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-secondaryText hover:text-white">
                    Detalles del Error (Solo Desarrollo)
                  </summary>
                  <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <pre className="text-xs text-red-300 whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProductionErrorBoundary;
