import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { performanceMonitor } from '@/services/PerformanceMonitor';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level: 'app' | 'component' | 'feature';
  name: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  performanceReport: any;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      performanceReport: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 ${this.props.level} Error in ${this.props.name}:`, error, errorInfo);
    
    // Record error in performance monitoring
    performanceMonitor.recordMetric('errorRate', 1);
    
    // Get performance report for debugging
    const performanceReport = performanceMonitor.getPerformanceReport();
    
    this.setState({ 
      error, 
      errorInfo,
      performanceReport 
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log detailed error information
    console.group(`🔍 Error Details - ${this.props.name}`);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Performance at error:', performanceReport);
    console.groupEnd();
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      console.log(`🔄 Retrying ${this.props.name} (attempt ${this.state.retryCount + 1})`);
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReset = () => {
    console.log(`🔄 Resetting ${this.props.name}`);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      performanceReport: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const isComponentLevel = this.props.level === 'component';

      return (
        <div className={`
          ${this.props.level === 'app' ? 'min-h-screen' : 'min-h-[200px]'} 
          bg-gradient-to-br from-red-900/20 via-red-800/10 to-red-900/20 
          flex items-center justify-center p-4
        `}>
          <Card className="max-w-lg p-6 bg-red-900/20 border-red-500/50 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            
            <h2 className="text-xl font-bold text-white mb-2">
              {this.props.level === 'app' ? 'Application Error' : 
               this.props.level === 'feature' ? 'Feature Error' : 'Component Error'}
            </h2>
            
            <p className="text-red-200 mb-4">
              Something went wrong in {this.props.name}.
              {canRetry && ' You can try again.'}
            </p>

            <div className="text-sm text-red-300 mb-4 p-3 bg-red-900/30 rounded-lg font-mono text-left">
              <div className="font-semibold mb-1">Error:</div>
              <div className="break-all">{this.state.error?.message || 'Unknown error'}</div>
              
              {this.state.performanceReport && (
                <div className="mt-2 pt-2 border-t border-red-500/30">
                  <div className="font-semibold mb-1">Performance at error:</div>
                  <div>Memory: {(this.state.performanceReport.memoryUsage / 1024 / 1024).toFixed(2)}MB</div>
                  <div>Avg Render: {this.state.performanceReport.averageRenderTime.toFixed(2)}ms</div>
                  <div>Error Rate: {(this.state.performanceReport.errorRate * 100).toFixed(1)}%</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {canRetry && (
                <Button 
                  onClick={this.handleRetry} 
                  className="bg-red-600 hover:bg-red-700 w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </Button>
              )}

              {!isComponentLevel && (
                <>
                  <Button 
                    onClick={this.handleReset} 
                    variant="outline"
                    className="border-red-500/50 text-red-200 hover:bg-red-500/20 w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset {this.props.name}
                  </Button>

                  {this.props.level === 'feature' && (
                    <Button 
                      onClick={this.handleGoHome} 
                      variant="outline"
                      className="border-red-500/50 text-red-200 hover:bg-red-500/20 w-full"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Go to Main Menu
                    </Button>
                  )}

                  {this.props.level === 'app' && (
                    <Button 
                      onClick={this.handleReload} 
                      variant="outline"
                      className="border-red-500/50 text-red-200 hover:bg-red-500/20 w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reload Application
                    </Button>
                  )}
                </>
              )}

              <Button 
                onClick={() => {
                  console.log('🐛 Full error details:', {
                    error: this.state.error,
                    errorInfo: this.state.errorInfo,
                    performance: this.state.performanceReport
                  });
                }}
                variant="ghost"
                size="sm"
                className="text-red-300 hover:text-red-200 w-full"
              >
                <Bug className="h-4 w-4 mr-2" />
                Show Debug Info in Console
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}