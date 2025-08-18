
import { useEffect, useState } from 'react';
import { supabaseRealtimeService, RealtimeConfig } from '@/services/supabaseRealtimeService';
import { connectionManager, ConnectionState } from '@/services/connectionManager';
import { useToast } from '@/components/ui/use-toast';

export interface SubscriptionConfig {
  channelName: string;
  table: string;
  filter?: string;
  onUpdate: (payload: any) => void;
  onError?: (error: Error) => void;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  lastError?: string;
  retryCount: number;
}

export function useRealtimeSubscription(configs: SubscriptionConfig[]) {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isReconnecting: false,
    retryCount: 0
  });

  // Subscribe to connection manager state
  useEffect(() => {
    const unsubscribe = connectionManager.subscribe((state: ConnectionState) => {
      setConnectionStatus({
        isConnected: state.isConnected,
        isReconnecting: state.isConnecting,
        lastError: state.lastError || undefined,
        retryCount: state.reconnectAttempts
      });

      // Show toast only for first few errors
      if (state.lastError && state.reconnectAttempts === 1 && state.lastError !== 'Network offline') {
        toast({
          title: "Database Connection Issue",
          description: "Reconnecting to sync game state...",
          variant: "destructive",
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [toast]);

  // Set up realtime subscriptions
  useEffect(() => {
    const connectToRealtime = async () => {
      await supabaseRealtimeService.connectWithConfigs(configs);
    };
    
    connectToRealtime();

    return () => {
      supabaseRealtimeService.disconnect();
    };
  }, [configs.length]); // Only reconnect when number of configs changes

  const forceReconnect = () => {
    console.log('🔄 Force reconnecting realtime subscriptions...');
    supabaseRealtimeService.forceReconnect();
  };

  return {
    connectionStatus,
    forceReconnect
  };
}
