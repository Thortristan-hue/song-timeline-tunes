
import React from 'react';
import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConnectionStatus as ConnectionStatusType } from '@/hooks/useRealtimeSubscription';
import { ConnectionState } from '@/services/connectionManager';

interface ConnectionStatusProps {
  connectionStatus: ConnectionStatusType;
  wsState?: ConnectionState;
  onReconnect?: () => void;
  onWSReconnect?: () => void;
}

export function ConnectionStatus({ 
  connectionStatus, 
  wsState,
  onReconnect,
  onWSReconnect 
}: ConnectionStatusProps) {
  const { isConnected, isReconnecting, lastError, retryCount } = connectionStatus;
  
  // Check WebSocket state
  const wsConnected = wsState?.isConnected ?? true;
  const wsReconnecting = wsState?.isConnecting ?? false;
  const wsError = wsState?.lastError;

  // Only show if there are actual connection issues
  const hasRealtimeIssue = !isConnected && (lastError || isReconnecting);
  const hasWebSocketIssue = !wsConnected && (wsError || wsReconnecting);
  
  if (!hasRealtimeIssue && !hasWebSocketIssue) {
    return null;
  }

  // Don't show for minor issues
  if (lastError === 'No subscription configs provided' || wsError === 'Network offline') {
    return null;
  }

  const isAnyReconnecting = isReconnecting || wsReconnecting;
  
  // Safely handle primary error to prevent cyclic reference issues
  const rawPrimaryError = wsError || lastError;
  const primaryError = rawPrimaryError ? 
    (typeof rawPrimaryError === 'string' ? rawPrimaryError : 
     (rawPrimaryError && typeof rawPrimaryError === 'object' && 'message' in rawPrimaryError ? 
      (rawPrimaryError as any).message : 'Connection error')) : null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <Alert variant={isAnyReconnecting ? "default" : "destructive"} className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <div className="flex items-center gap-2">
          {isAnyReconnecting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription className="flex-1">
            {isAnyReconnecting ? (
              <span>
                Reconnecting... ({Math.max(retryCount, wsState?.reconnectAttempts || 0)}/3)
              </span>
            ) : (
              <span>
                Connection lost.{primaryError && ` ${primaryError}`}
              </span>
            )}
          </AlertDescription>
          
          {!isAnyReconnecting && (onReconnect || onWSReconnect) && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                onWSReconnect?.();
                onReconnect?.();
              }}
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
