import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

const MAX_RETRIES = 3;

export class InitializationErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 INITIALIZATION ERROR BOUNDARY:', error);
    console.error('🚨 ERROR INFO:', errorInfo);
    
    // Check if this is the specific lexical declaration error
    if (error.message.includes("can't access lexical declaration") || 
        error.message.includes("before initialization")) {
      console.error('🚨 DETECTED LEXICAL DECLARATION ERROR - Attempting recovery');
      
      // Log additional debugging information
      console.error('🚨 ERROR STACK:', error.stack);
      console.error('🚨 COMPONENT STACK:', errorInfo.componentStack);
      
      // Attempt automatic recovery for this specific error
      this.attemptRecovery();
    }

    this.setState({
      error,
      errorInfo,
      hasError: true
    });
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private attemptRecovery = () => {
    if (this.state.retryCount >= MAX_RETRIES) {
      console.error('🚨 MAX RETRIES REACHED - Manual intervention required');
      return;
    }

    console.log(`🔄 ATTEMPTING RECOVERY (${this.state.retryCount + 1}/${MAX_RETRIES})`);
    
    // Clear the timeout if it exists
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Attempt recovery after a short delay to allow for initialization
    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }, 1000 + (this.state.retryCount * 500)); // Increasing delay for each retry
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isLexicalError = this.state.error?.message.includes("can't access lexical declaration") || 
                            this.state.error?.message.includes("before initialization");
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-red-900/50 backdrop-blur-xl rounded-2xl border border-red-500/30 p-6 text-center">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isLexicalError ? 'Initialization Error' : 'Something Went Wrong'}
            </h2>
            
            {isLexicalError ? (
              <div className="space-y-4">
                <p className="text-red-200 text-sm leading-relaxed">
                  The game encountered a loading error. This is usually caused by a timing issue during initialization.
                </p>
                
                {this.state.retryCount < MAX_RETRIES ? (
                  <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-200 text-xs mb-2">
                      Auto-recovery in progress... (Attempt {this.state.retryCount + 1}/{MAX_RETRIES})
                    </p>
                    <div className="w-full bg-yellow-900/50 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-red-200 text-xs">
                      Auto-recovery failed. Please try one of the options below:
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={this.handleManualRetry}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={this.handleReload}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Reload Page
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-red-200 text-sm">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={this.handleManualRetry}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            )}
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-red-300 text-xs cursor-pointer">Debug Info</summary>
                <pre className="text-red-200 text-xs mt-2 p-2 bg-red-900/30 rounded overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}