
export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isReady: boolean;
  reconnectAttempts: number;
  lastError: string | null;
}

export class ConnectionManager {
  private state: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    isReady: false,
    reconnectAttempts: 0,
    lastError: null
  };

  private listeners: Set<(state: ConnectionState) => void> = new Set();
  private maxRetries = 3; // Reduced from 5 to prevent spam
  private baseDelay = 2000; // Increased base delay

  getState(): ConnectionState {
    return { ...this.state };
  }

  updateState(updates: Partial<ConnectionState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  subscribe(listener: (state: ConnectionState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in connection state listener:', error);
      }
    });
  }

  shouldRetry(): boolean {
    return this.state.reconnectAttempts < this.maxRetries;
  }

  getRetryDelay(): number {
    return Math.min(this.baseDelay * Math.pow(1.5, this.state.reconnectAttempts), 10000);
  }

  incrementRetries() {
    this.updateState({
      reconnectAttempts: this.state.reconnectAttempts + 1
    });
  }

  resetRetries() {
    this.updateState({
      reconnectAttempts: 0,
      lastError: null
    });
  }

  setError(error: string) {
    // Expanded list of errors to ignore for better UX
    const ignoredErrors = [
      'WebSocket error occurred',
      'Connection timeout', 
      'Network offline',
      'Connection failed',
      'Failed to send message',
      'Subscription timeout',
      'Realtime connection failed',
      'No subscription configs provided',
      'Max reconnection attempts reached'
    ];
    
    // Don't show connection errors that are just technical noise
    if (!ignoredErrors.some(ignored => error.includes(ignored))) {
      this.updateState({
        lastError: error,
        isConnected: false,
        isReady: false
      });
    } else {
      // Still update connection state but don't show error to user
      this.updateState({
        isConnected: false,
        isReady: false
      });
    }
  }
}

export const connectionManager = new ConnectionManager();
