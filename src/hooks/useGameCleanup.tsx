
import { useEffect } from 'react';
import { GameService } from '@/services/gameService';

interface UseGameCleanupProps {
  roomId?: string;
  isHost: boolean;
  timeout?: number; // Allow custom timeout
  onRoomClosed: () => void;
}

export function useGameCleanup({ 
  roomId, 
  isHost, 
  timeout = 15 * 60 * 1000, // Default to 15 minutes
  onRoomClosed 
}: UseGameCleanupProps) {
  useEffect(() => {
    if (!roomId || !isHost) return;

    const cleanupTimer = setTimeout(async () => {
      try {
        await GameService.endGame(roomId);
        onRoomClosed();
      } catch (error) {
        console.error('Failed to cleanup room:', error);
      }
    }, timeout);

    return () => {
      clearTimeout(cleanupTimer);
    };
  }, [roomId, isHost, timeout, onRoomClosed]);
}
