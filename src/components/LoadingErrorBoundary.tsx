
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Home, AlertCircle, Clock } from 'lucide-react';

interface LoadingErrorBoundaryProps {
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  onBackToMenu?: () => void;
  loadingMessage?: string;
  children: React.ReactNode;
}

export function LoadingErrorBoundary({
  isLoading,
  error,
  onRetry,
  onBackToMenu,
  loadingMessage = "Loading...",
  children
}: LoadingErrorBoundaryProps) {
  const [loadingDuration, setLoadingDuration] = useState(0);

  // Track loading duration
  useEffect(() => {
    if (isLoading) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        setLoadingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => {
        clearInterval(interval);
        setLoadingDuration(0);
      };
    }
  }, [isLoading]);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black relative overflow-hidden flex items-center justify-center">
        <div className="text-center text-white relative z-10 max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <div className="text-3xl font-bold mb-4">Oops!</div>
          <div className="text-lg mb-6 text-red-200">{error}</div>
          <div className="space-y-4">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            {onBackToMenu && (
              <Button
                onClick={onBackToMenu}
                variant="outline"
                className="w-full border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show loading state with duration and timeout warning
  if (isLoading) {
    const showTimeoutWarning = loadingDuration > 10;
    const showForceRetry = loadingDuration > 20;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>
        <div className="text-center text-white relative z-10 max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 mx-auto border border-white/20">
            <div className="text-3xl animate-spin">🎵</div>
          </div>
          <div className="text-2xl font-semibold mb-2">{loadingMessage}</div>
          <div className="text-white/60 mb-4">This shouldn't take long...</div>
          
          {/* Loading duration and status */}
          <div className="flex items-center justify-center gap-2 mb-4 text-sm text-white/50">
            <Clock className="h-4 w-4" />
            <span>{loadingDuration}s</span>
          </div>

          {/* Timeout warning */}
          {showTimeoutWarning && (
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <div className="text-sm text-yellow-200">
                {showForceRetry 
                  ? "Taking longer than expected. You can try refreshing."
                  : "This is taking a while. Please wait a bit more..."
                }
              </div>
            </div>
          )}

          {/* Force retry button for very long loads */}
          {showForceRetry && onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="w-full border-white/20 text-white/80 hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show normal content
  return <>{children}</>;
}
