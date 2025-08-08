
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
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

  // Only show if there are actual connection issues that affect gameplay
  const hasRealtimeIssue = !isConnected && lastError && retryCount > 1;
  const hasWebSocketIssue = !wsConnected && wsError && (wsState?.reconnectAttempts || 0) > 1;
  
  // Don't show connection status for minor issues or during initial connection
  if (!hasRealtimeIssue && !hasWebSocketIssue) {
    return null;
  }

  // Don't show for technical errors that don't affect user experience
  const ignoredDisplayErrors = [
    'No subscription configs provided',
    'Network offline',
    'Connection timeout',
    'WebSocket error occurred'
  ];

  const primaryError = wsError || lastError;
  if (primaryError && ignoredDisplayErrors.some(ignored => primaryError.includes(ignored))) {
    return null;
  }

  const isAnyReconnecting = isReconnecting || wsReconnecting;

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
                Reconnecting to game... ({Math.max(retryCount, wsState?.reconnectAttempts || 0)}/3)
              </span>
            ) : (
              <span>
                Connection lost - some features may not work properly
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
