
import { useEffect, useRef } from 'react';
import { gameService } from '@/services/gameService';

interface UseGameCleanupProps {
  roomId?: string;
  isHost: boolean;
  onRoomClosed?: () => void;
}

export function useGameCleanup({ roomId, isHost, onRoomClosed }: UseGameCleanupProps) {
  const activityTimerRef = useRef<NodeJS.Timeout>();
  const cleanupTimerRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<Date>(new Date());

  // Update last activity timestamp
  const updateActivity = () => {
    lastActivityRef.current = new Date();
  };

  useEffect(() => {
    if (!roomId || !isHost) return;

    // Set up activity tracking
    const trackActivity = () => {
      updateActivity();
      
      // Clear existing timer
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }

      // Set cleanup timer for 7 minutes of inactivity
      activityTimerRef.current = setTimeout(async () => {
        const timeSinceActivity = Date.now() - lastActivityRef.current.getTime();
        const sevenMinutes = 7 * 60 * 1000;

        if (timeSinceActivity >= sevenMinutes) {
          console.log('Room inactive for 7+ minutes, cleaning up...');
          try {
            await gameService.cleanupRoom(roomId);
            onRoomClosed?.();
          } catch (error) {
            console.error('Error cleaning up room:', error);
          }
        }
      }, 7 * 60 * 1000); // 7 minutes
    };

    // Track various activities
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      window.addEventListener(event, trackActivity, { passive: true });
    });

    // Initial activity tracking
    trackActivity();

    return () => {
      // Cleanup timers
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }

      // Remove event listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, trackActivity);
      });
    };
  }, [roomId, isHost, onRoomClosed]);

  return { updateActivity };
}
