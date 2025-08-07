import React, { useState, useEffect } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { GameLogic } from '@/services/gameLogic';
import { useToast } from '@/hooks/use-toast';
import { Feedback } from '@/components/Feedback';
import { VictoryScreen } from '@/components/VictoryScreen';
import { useConfettiStore } from '@/stores/useConfettiStore';
import { HostVisuals } from '@/components/HostVisuals';
import MobilePlayerGameView from '@/components/player/MobilePlayerGameView';
import { unifiedAudioEngine } from '@/utils/unifiedAudioEngine';

interface GamePlayProps {
  room: GameRoom;
  players: Player[];
  currentPlayer: Player;
  isHost: boolean;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player }>;
  onSetCurrentSong: (song: Song) => Promise<void>;
  customSongs: Song[];
  connectionStatus: {
    isConnected: boolean;
    isReconnecting: boolean;
    lastError: string | null;
    retryCount: number;
  };
  onReconnect: () => void;
  onReplayGame: () => void;
}

export function GamePlay({ 
  room, 
  players, 
  currentPlayer, 
  isHost, 
  onPlaceCard, 
  onSetCurrentSong, 
  customSongs, 
  connectionStatus, 
  onReconnect, 
  onReplayGame 
}: GamePlayProps) {
  const { toast } = useToast();
  const [gameLogic, setGameLogic] = useState<GameLogic | null>(null);
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean; song: Song | null }>({ show: false, correct: false, song: null });
  const [winner, setWinner] = useState<Player | null>(null);
  const [showVictoryScreen, setShowVictoryScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mysteryCardRevealed, setMysteryCardRevealed] = useState(false);
  const [cardPlacementResult, setCardPlacementResult] = useState<{ correct: boolean; song: Song } | null>(null);
  const { fire } = useConfettiStore();

  // Enhanced debugging for GamePlay
  useEffect(() => {
    console.log('[GamePlay] State debug:', {
      isHost,
      roomPhase: room?.phase,
      playersCount: players?.length || 0,
      currentPlayerName: currentPlayer?.name,
      mysteryCard: room?.current_song?.deezer_title,
      roomId: room?.id
    });
  }, [room, players, currentPlayer, isHost]);

  // Find current turn player
  const currentTurnPlayer = players.find(p => p.id === room.current_player_id) || players[0];

  useEffect(() => {
    if (room && currentPlayer && players) {
      const newGameLogic = new GameLogic(room, players, currentPlayer);
      setGameLogic(newGameLogic);
    }
  }, [room, players, currentPlayer]);

  useEffect(() => {
    if (winner) {
      fire();
    }
  }, [winner, fire]);

  // Cleanup audio when mystery card changes
  useEffect(() => {
    return () => {
      unifiedAudioEngine.stopPreview();
      setIsPlaying(false);
    };
  }, [room?.current_song?.id]);

  // Reset playing state when mystery card changes
  useEffect(() => {
    setIsPlaying(false);
  }, [room?.current_song?.id]);

  const handleCardPlacement = async (song: Song, position: number): Promise<{ success: boolean; }> => {
    if (!currentPlayer || !room || gameLogic?.isGameOver) {
      return { success: false };
    }

    setIsProcessingMove(true);
    
    try {
      console.log('🃏 Card placement attempted:', { song: song.deezer_title, position });
      
      const result = await onPlaceCard(song, position);
      
      if (result.success) {
        console.log('✅ Card placed successfully');
        
        if (result.correct !== undefined) {
          setFeedback({
            show: true,
            correct: result.correct,
            song: song
          });
          
          setCardPlacementResult({
            correct: result.correct,
            song: song
          });
          
          // Auto-hide feedback after delay
          setTimeout(() => {
            setFeedback({ show: false, correct: false, song: null });
            setCardPlacementResult(null);
          }, 3000);
        }
        
        // Check for game end
        if (result.gameEnded && result.winner) {
          console.log('🎉 Game ended with winner:', result.winner.name);
          setWinner(result.winner);
          setShowVictoryScreen(true);
        }
        
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error('❌ Card placement failed:', error);
      toast({
        title: "Card placement failed",
        description: "Please try again",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsProcessingMove(false);
    }
  };

  const handlePlayPause = async () => {
    const newIsPlaying = !isPlaying;
    
    // Actually control audio playback using audio engine
    if (room?.current_song?.preview_url) {
      if (newIsPlaying) {
        console.log('[GamePlay] Starting audio playback for player:', room.current_song.deezer_title);
        try {
          await unifiedAudioEngine.playPreview(room.current_song.preview_url);
          setIsPlaying(true);
          
          // Auto-stop after 30 seconds
          setTimeout(() => {
            setIsPlaying(false);
          }, 30000);
        } catch (error) {
          console.error('[GamePlay] Failed to start audio playback:', error);
          toast({
            title: "Audio playback failed",
            description: "Unable to play song preview",
            variant: "destructive",
          });
          setIsPlaying(false);
        }
      } else {
        console.log('[GamePlay] Stopping audio playback for player');
        unifiedAudioEngine.stopPreview();
        setIsPlaying(false);
      }
    } else {
      console.warn('[GamePlay] No preview URL available for current song');
      setIsPlaying(false);
      if (newIsPlaying) {
        toast({
          title: "No preview available",
          description: "This song doesn't have a preview",
          variant: "destructive",
        });
      }
    }
  };

  const handleSetMysteryCard = async () => {
    if (!isHost || !gameLogic) return;

    setIsProcessingMove(true);
    try {
      const song = gameLogic.getRandomAvailableSong();
      if (song) {
        console.log('🎵 Setting mystery card:', song.deezer_title);
        await onSetCurrentSong(song);
        setMysteryCardRevealed(true);
      } else {
        console.warn('No available songs to set as mystery card');
        toast({
          title: "No songs available",
          description: "Please add more songs to the playlist",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Failed to set mystery card:', error);
      toast({
        title: "Failed to set mystery card",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessingMove(false);
    }
  };

  const handleBackToMenu = () => {
    setShowVictoryScreen(false);
    window.location.reload();
  };

  const handlePlayAgain = () => {
    setShowVictoryScreen(false);
    setWinner(null);
    onReplayGame();
  };

  if (!gameLogic) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mb-4"></div>
          <div>Loading game...</div>
        </div>
      </div>
    );
  }

  // Show victory screen
  if (showVictoryScreen && winner) {
    return (
      <VictoryScreen 
        winner={winner} 
        players={players || []}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  // Show feedback overlay
  if (feedback.show) {
    return <Feedback correct={feedback.correct} song={feedback.song} />;
  }

  // Host view - use HostVisuals component
  if (isHost) {
    console.log('[GamePlay] Rendering HostVisuals with:', {
      room: room ? { id: room.id, phase: room.phase, lobby_code: room.lobby_code } : null,
      playersCount: players?.length || 0,
      mysteryCard: room?.current_song?.deezer_title || 'None'
    });
    
    return (
      <HostVisuals
        room={room}
        players={players || []}
        mysteryCard={room?.current_song || null}
        isHost={isHost}
      />
    );
  }

  // Player view - use MobilePlayerGameView component
  return (
    <MobilePlayerGameView
      currentPlayer={currentPlayer}
      currentTurnPlayer={currentTurnPlayer}
      currentSong={room.current_song}
      roomCode={room.lobby_code}
      isMyTurn={currentPlayer.id === currentTurnPlayer?.id}
      isPlaying={isPlaying}
      onPlayPause={handlePlayPause}
      onPlaceCard={handleCardPlacement}
      mysteryCardRevealed={mysteryCardRevealed}
      cardPlacementResult={cardPlacementResult}
      gameEnded={room.phase === 'finished'}
    />
  );
}
