
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-red-900 flex items-center justify-center p-8">
          <Card className="bg-red-900/80 backdrop-blur-lg border-red-600/50 p-8 max-w-lg text-center">
            <div className="text-6xl mb-6">💥</div>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <h1 className="text-2xl font-bold text-white">Something went wrong!</h1>
            </div>
            
            <p className="text-red-200 mb-6 leading-relaxed">
              The game encountered an unexpected error. This might be due to a network issue, 
              browser compatibility, or a temporary server problem.
            </p>
            
            {this.state.error && (
              <div className="bg-red-800/50 rounded-lg p-4 mb-6 text-left">
                <p className="text-red-300 text-sm font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="w-full border-red-400 text-red-200 hover:bg-red-800"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full border-red-400 text-red-200 hover:bg-red-800"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Main Menu
              </Button>
            </div>
            
            <div className="mt-6 text-xs text-red-400">
              If this problem persists, try refreshing your browser or clearing your cache.
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
