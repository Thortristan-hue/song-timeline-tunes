
import { useEffect, useRef } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { Song, Player, GameRoom } from '@/types/game';
import { GameService } from '@/services/gameService';
import { useToast } from '@/components/ui/use-toast';

interface HostMusicControllerProps {
  room: GameRoom;
  players: Player[];
  isHost: boolean;
}

export function HostMusicController({ room, players, isHost }: HostMusicControllerProps) {
  const { setCurrentSong } = useGameRoom();
  const { toast } = useToast();
  const currentSongRef = useRef<Song | null>(null);

  // Only run for host
  useEffect(() => {
    if (!isHost || !room) return;

    console.log('[HostMusicController] Initializing for room:', room.id);
    
    const initializeGame = async () => {
      try {
        // Start the first round
        console.log('[HostMusicController] Starting first round');
        await GameService.startNextRound(room.id);
      } catch (error) {
        console.error('[HostMusicController] Failed to start first round:', error);
        toast({
          title: "Game Start Failed",
          description: "Unable to start the game. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Small delay to ensure all setup is complete
    const timeoutId = setTimeout(initializeGame, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [room, isHost, toast]);

  // Monitor current song changes and sync with room state
  useEffect(() => {
    if (!isHost || !room?.current_song) return;

    const currentSong = room.current_song;
    
    // Only update if the song actually changed
    if (currentSongRef.current?.id !== currentSong.id) {
      console.log('[HostMusicController] Current song changed:', {
        from: currentSongRef.current?.deezer_title || 'none',
        to: currentSong.deezer_title
      });
      
      currentSongRef.current = currentSong;
      setCurrentSong(currentSong);
    }
  }, [room?.current_song, isHost, setCurrentSong]);

  // Handle turn transitions
  useEffect(() => {
    if (!isHost || !room) return;

    const handleTurnTransition = async () => {
      // Check if current turn player has completed their timeline
      const currentPlayer = players.find(p => p.id === room.current_player_id);
      
      if (currentPlayer && currentPlayer.timeline.length >= 5) {
        console.log('[HostMusicController] Player completed timeline:', currentPlayer.name);
        
        try {
          await GameService.checkGameEnd(room.id);
        } catch (error) {
          console.error('[HostMusicController] Error checking game end:', error);
        }
      }
    };

    handleTurnTransition();
  }, [room?.current_player_id, players, isHost, room]);

  // This component doesn't render anything visible
  return null;
}
