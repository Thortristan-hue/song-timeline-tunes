
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { connectionManager } from './connectionManager';

export interface RealtimeConfig {
  channelName: string;
  table: string;
  filter?: string;
  onUpdate: (payload: any) => void;
  onError?: (error: Error) => void;
}

export class RealtimeManager {
  private channel: RealtimeChannel | null = null;
  private configs: RealtimeConfig[] = [];
  private reconnectTimeout: NodeJS.Timeout | null = null;

  async connect(configs: RealtimeConfig[]) {
    this.configs = configs;
    
    if (configs.length === 0) {
      console.log('📡 No realtime configs provided');
      connectionManager.updateState({ isConnected: true });
      return;
    }

    this.cleanup();

    try {
      console.log('📡 Setting up realtime subscriptions for', configs.length, 'configs');
      
      const channelName = configs[0].channelName;
      this.channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: '' }
        }
      });

      // Add all subscriptions
      configs.forEach(config => {
        this.channel?.on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter })
        }, (payload) => {
          try {
            config.onUpdate(payload);
          } catch (error) {
            console.error('❌ Error in realtime callback:', error);
            config.onError?.(error as Error);
          }
        });
      });

      // Subscribe with timeout handling
      const subscribePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Subscription timeout'));
        }, 15000); // 15 second timeout

        this.channel?.subscribe((status, err) => {
          clearTimeout(timeout);
          
          switch (status) {
            case 'SUBSCRIBED':
              console.log('✅ Realtime subscriptions active');
              connectionManager.updateState({ isConnected: true });
              resolve();
              break;
              
            case 'TIMED_OUT':
              console.warn('⏰ Realtime subscription timed out');
              reject(new Error('Subscription timed out'));
              break;
              
            case 'CLOSED':
              console.warn('🔌 Realtime subscription closed');
              connectionManager.updateState({ isConnected: false });
              break;
              
            case 'CHANNEL_ERROR': {
              console.error('❌ Realtime channel error:', err);
              // Safely handle error object to prevent cyclic reference issues
              const errorMessage = err instanceof Error ? err.message : 
                                   (typeof err === 'string' ? err : 'Channel error');
              reject(new Error(errorMessage));
              break;
            }
          }
        });
      });

      await subscribePromise;
      
    } catch (error) {
      console.error('❌ Failed to setup realtime subscriptions:', error);
      // Safely extract error message to prevent cyclic reference issues
      const errorMessage = error instanceof Error ? error.message : 
                           (typeof error === 'string' ? error : 'Realtime connection failed');
      connectionManager.setError(errorMessage);
      
      // Schedule reconnect
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (!connectionManager.shouldRetry()) {
      console.error('❌ Max realtime reconnection attempts reached');
      return;
    }

    connectionManager.incrementRetries();
    const delay = connectionManager.getRetryDelay();

    console.log(`📡 Scheduling realtime reconnect in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.configs);
    }, delay);
  }

  private cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  disconnect() {
    console.log('📡 Disconnecting realtime subscriptions');
    this.cleanup();
    this.configs = [];
    connectionManager.updateState({
      isConnected: false,
      isReady: false
    });
  }

  forceReconnect() {
    console.log('🔄 Force reconnecting realtime...');
    connectionManager.resetRetries();
    this.connect(this.configs);
  }
}

export const realtimeManager = new RealtimeManager();
