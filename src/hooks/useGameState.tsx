
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UseGameStateProps {
  timeout?: number;
}

export function useGameState({ timeout = 15000 }: UseGameStateProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startLoading = useCallback((operation: string = 'Loading') => {
    setIsLoading(true);
    setError(null);
    
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set timeout for loading operation
    const newTimeoutId = setTimeout(() => {
      setIsLoading(false);
      const errorMessage = `${operation} timed out. Please try again.`;
      setError(errorMessage);
      toast({
        title: "Connection Timeout",
        description: errorMessage,
        variant: "destructive",
      });
    }, timeout);
    
    setTimeoutId(newTimeoutId);
  }, [timeout, timeoutId, toast]);

  const stopLoading = useCallback((success: boolean = true, errorMessage?: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    setIsLoading(false);
    
    if (!success && errorMessage) {
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      setError(null);
    }
  }, [timeoutId, toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    clearError
  };
}
