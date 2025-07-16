import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';

export interface SubscriptionConfig {
  channelName: string;
  table: string;
  filter?: string;
  onUpdate: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const baseDelay = 1000; // 1 second base delay
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isReconnecting: false,
    retryCount: 0
  });

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('🔄 Cleaning up realtime subscription');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const handleConnectionError = useCallback((error: Error, context: string) => {
    console.warn(`📡 Subscription error in ${context}:`, error);
    
    setConnectionStatus(prev => ({
      ...prev,
      isConnected: false,
      lastError: error.message || 'Connection failed'
    }));

    // Only show toast for the first few errors to avoid spam
    if (retryCountRef.current < 3) {
      toast({
        title: "Connection Issue",
        description: "Trying to reconnect...",
        variant: "destructive",
      });
    }

    configs.forEach(config => {
      config.onError?.(error);
    });
  }, [toast, configs]);

  const connect = useCallback(async () => {
    try {
      cleanup();
      
      if (configs.length === 0) {
        console.warn('📡 No subscription configs provided');
        return;
      }

      const channelName = configs[0].channelName;
      console.log('📡 Setting up realtime subscription:', channelName);
      
      const channel = supabase.channel(channelName);
      
      // Add all subscriptions to the same channel
      configs.forEach(config => {
        channel.on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter })
        }, config.onUpdate);
      });

      // Handle subscription status
      const subscription = channel.subscribe((status, err) => {
        console.log('📡 Subscription status:', status, err);
        
        switch (status) {
          case 'SUBSCRIBED':
            console.log('✅ Successfully subscribed to realtime updates');
            setConnectionStatus({
              isConnected: true,
              isReconnecting: false,
              retryCount: retryCountRef.current
            });
            retryCountRef.current = 0;
            break;
            
          case 'TIMED_OUT':
            console.warn('⏰ Subscription timed out');
            handleConnectionError({ message: 'Connection timed out' }, 'timeout');
            break;
            
          case 'CLOSED':
            console.warn('🔌 Subscription closed');
            setConnectionStatus(prev => ({ ...prev, isConnected: false }));
            break;
            
          case 'CHANNEL_ERROR':
            console.error('❌ Channel error:', err);
            handleConnectionError(err || { message: 'Channel error' }, 'channel_error');
            break;
        }
      });

      channelRef.current = channel;

      // Monitor connection health
      const healthCheck = setInterval(() => {
        if (channelRef.current) {
          const state = channelRef.current.state;
          if (state === 'closed' || state === 'errored') {
            console.warn('📡 Connection unhealthy, attempting reconnect');
            clearInterval(healthCheck);
            scheduleReconnect();
          }
        }
      }, 10000); // Check every 10 seconds

      // Cleanup health check when subscription changes
      return () => clearInterval(healthCheck);
      
    } catch (error) {
      console.error('❌ Failed to setup subscription:', error);
      handleConnectionError(error, 'setup');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs, cleanup, handleConnectionError]);

  const scheduleReconnect = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      console.error('❌ Max reconnection attempts reached');
      setConnectionStatus(prev => ({
        ...prev,
        isReconnecting: false,
        lastError: 'Max reconnection attempts reached'
      }));
      
      toast({
        title: "Connection Failed",
        description: "Unable to maintain real-time connection. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    retryCountRef.current++;
    const delay = baseDelay * Math.pow(2, Math.min(retryCountRef.current - 1, 5)); // Exponential backoff with cap
    
    console.log(`📡 Scheduling reconnect attempt ${retryCountRef.current}/${maxRetries} in ${delay}ms`);
    
    setConnectionStatus(prev => ({
      ...prev,
      isReconnecting: true,
      retryCount: retryCountRef.current
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, toast]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network came back online, reconnecting...');
      if (!connectionStatus.isConnected) {
        retryCountRef.current = 0; // Reset retry count on network recovery
        connect();
      }
    };

    const handleOffline = () => {
      console.log('🌐 Network went offline');
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
        lastError: 'Network offline'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connect, connectionStatus.isConnected]);

  // Initial connection and reconnection on config changes
  useEffect(() => {
    if (configs.length > 0) {
      connect();
    }

    return cleanup;
  }, [connect, cleanup, configs.length]);

  // Handle page visibility changes (reconnect when page becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !connectionStatus.isConnected) {
        console.log('📱 Page became visible, checking connection...');
        retryCountRef.current = 0;
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connect, connectionStatus.isConnected]);

  const forceReconnect = useCallback(() => {
    console.log('🔄 Force reconnecting...');
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  return {
    connectionStatus,
    forceReconnect
  };
}