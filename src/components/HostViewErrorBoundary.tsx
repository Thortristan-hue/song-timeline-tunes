import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Music, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class HostViewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: `error-${Date.now()}`
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('🚨 HostViewErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    console.log('🔄 HostViewErrorBoundary: Attempting retry...');
    // Reset the error state
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: `retry-${Date.now()}`
    });
  }

  handleReload = () => {
    console.log('🔄 HostViewErrorBoundary: Reloading page...');
    window.location.reload();
  }

  handleBackToMenu = () => {
    console.log('🏠 HostViewErrorBoundary: Going back to menu...');
    // Clear any stored game state
    try {
      localStorage.removeItem('gameState');
      sessionStorage.clear();
    } catch (error) {
      console.warn('Could not clear storage:', error);
    }
    
    // Navigate to home
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-purple-900 relative overflow-hidden flex items-center justify-center p-4">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 animate-float opacity-10">
              <AlertTriangle className="w-8 h-8 text-red-400 animate-pulse" />
            </div>
            <div className="absolute top-1/3 right-1/4 animate-float opacity-10">
              <Music className="w-12 h-12 text-gray-400" style={{ animationDelay: '1s' }} />
            </div>
            <div className="absolute bottom-1/3 left-1/3 animate-float opacity-10">
              <RefreshCw className="w-6 h-6 text-blue-400" style={{ animationDelay: '2s' }} />
            </div>
          </div>

          <div className="text-center text-white relative z-10 max-w-lg mx-auto">
            {/* Error Icon */}
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-red-500/20 backdrop-blur-xl rounded-full flex items-center justify-center mb-4 mx-auto border border-red-400/30 shadow-2xl">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
              
              {/* Pulsing Rings */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 border border-red-400/20 rounded-full animate-ping opacity-20" />
                <div className="w-40 h-40 border border-red-400/10 rounded-full animate-ping opacity-10" style={{animationDelay: '0.5s'}} />
              </div>
            </div>

            {/* Error Content */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Host Display Error
              </h2>
              <p className="text-white/70 text-lg">
                Something went wrong with the host display. Don't worry - we can fix this!
              </p>
              
              {/* Error Details for Development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 bg-black/50 p-4 rounded-lg text-left text-sm">
                  <summary className="cursor-pointer font-semibold text-red-400 mb-2">
                    Technical Details (Development)
                  </summary>
                  <div className="space-y-2 text-white/80">
                    <div><strong>Error:</strong> {this.state.error.message}</div>
                    <div><strong>Stack:</strong></div>
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <>
                        <div><strong>Component Stack:</strong></div>
                        <pre className="text-xs whitespace-pre-wrap break-all">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
              <button
                onClick={this.handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 justify-center"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Reload Page
              </button>
              
              <button
                onClick={this.handleBackToMenu}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Back to Menu
              </button>
            </div>

            {/* Helpful Instructions */}
            <div className="mt-8 text-white/60 text-sm space-y-2">
              <p>If this keeps happening:</p>
              <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
                <li>Ensure all players are still connected</li>
                <li>Start a new game if the problem persists</li>
              </ul>
            </div>

            {/* Host-specific guidance */}
            <div className="mt-6 bg-yellow-500/20 border border-yellow-400/40 rounded-lg p-4 text-yellow-300">
              <div className="font-semibold mb-2">🎮 Host Notice</div>
              <div className="text-sm">
                As the host, your display crashed but the game may still be running for players. 
                Try "Try Again" first, then "Reload Page" if needed.
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}