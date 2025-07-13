import React from 'react';
import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConnectionStatus as ConnectionStatusType } from '@/hooks/useRealtimeSubscription';

interface ConnectionStatusProps {
  connectionStatus: ConnectionStatusType;
  onReconnect?: () => void;
}

export function ConnectionStatus({ connectionStatus, onReconnect }: ConnectionStatusProps) {
  const { isConnected, isReconnecting, lastError, retryCount } = connectionStatus;

  // Don't show anything if connected
  if (isConnected) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <Alert variant={isReconnecting ? "default" : "destructive"} className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <div className="flex items-center gap-2">
          {isReconnecting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription className="flex-1">
            {isReconnecting ? (
              <span>
                Reconnecting... (attempt {retryCount}/5)
              </span>
            ) : (
              <span>
                Connection lost. {lastError && `Error: ${lastError}`}
              </span>
            )}
          </AlertDescription>
          
          {!isReconnecting && onReconnect && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onReconnect}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
}