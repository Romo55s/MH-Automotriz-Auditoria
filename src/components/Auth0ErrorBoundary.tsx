import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
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

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-900 text-white flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">🚨 Auth0 Error</h1>
            <p className="mb-4">Something went wrong with the authentication system.</p>
            <pre className="bg-black/50 p-4 rounded text-sm overflow-auto max-w-2xl">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-white text-red-900 px-4 py-2 rounded hover:bg-gray-100"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default Auth0ErrorBoundary;
