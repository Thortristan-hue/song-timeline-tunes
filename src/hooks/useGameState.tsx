
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseGameStateProps {
  timeout?: number;
}

export function useGameState({ timeout = 15000 }: UseGameStateProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingOperation, setLoadingOperation] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingStartTime = useRef<number | null>(null);
  const { toast } = useToast();

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startLoading = useCallback((operation: string = 'Loading') => {
    console.log(`🔄 Starting loading: ${operation}`);
    setIsLoading(true);
    setError(null);
    setLoadingOperation(operation);
    loadingStartTime.current = Date.now();
    
    // Clear any existing timeout
    clearTimeoutRef();
    
    // Set timeout for loading operation
    timeoutRef.current = setTimeout(() => {
      const duration = Date.now() - (loadingStartTime.current || 0);
      console.error(`⏰ Loading timeout after ${duration}ms for: ${operation}`);
      
      setIsLoading(false);
      const errorMessage = `${operation} timed out after ${Math.round(duration / 1000)}s. Please try again.`;
      setError(errorMessage);
      
      toast({
        title: "Connection Timeout",
        description: errorMessage,
        variant: "destructive",
      });
    }, timeout);
  }, [timeout, clearTimeoutRef, toast]);

  const stopLoading = useCallback((success: boolean = true, errorMessage?: string) => {
    const duration = loadingStartTime.current ? Date.now() - loadingStartTime.current : 0;
    console.log(`✅ Stopping loading after ${duration}ms: ${loadingOperation} (success: ${success})`);
    
    clearTimeoutRef();
    setIsLoading(false);
    setLoadingOperation('');
    loadingStartTime.current = null;
    
    if (!success && errorMessage) {
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } else if (success) {
      setError(null);
    }
  }, [clearTimeoutRef, loadingOperation, toast]);

  const clearError = useCallback(() => {
    console.log('🔄 Clearing error state');
    setError(null);
  }, []);

  const forceStopLoading = useCallback(() => {
    console.log('🛑 Force stopping loading state');
    clearTimeoutRef();
    setIsLoading(false);
    setLoadingOperation('');
    loadingStartTime.current = null;
  }, [clearTimeoutRef]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeoutRef();
    };
  }, [clearTimeoutRef]);

  // Auto-recovery for stuck loading states
  useEffect(() => {
    if (isLoading && loadingStartTime.current) {
      const checkInterval = setInterval(() => {
        const duration = Date.now() - (loadingStartTime.current || 0);
        if (duration > timeout + 5000) { // 5 seconds grace period after timeout
          console.error('🚨 Detected stuck loading state, force stopping');
          forceStopLoading();
          setError('Loading took too long. Please refresh or try again.');
        }
      }, 5000);

      return () => clearInterval(checkInterval);
    }
  }, [isLoading, timeout, forceStopLoading]);

  return {
    isLoading,
    error,
    loadingOperation,
    startLoading,
    stopLoading,
    clearError,
    forceStopLoading
  };
}
