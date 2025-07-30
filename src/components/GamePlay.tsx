import React, { useState, useEffect } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { GameLogic } from '@/services/gameLogic';
import { useToast } from '@/hooks/use-toast';
import { Feedback } from '@/components/Feedback';
import { VictoryScreen } from '@/components/VictoryScreen';
import { useConfettiStore } from '@/stores/useConfettiStore';
import { HostGameView } from '@/components/HostVisuals';
import MobilePlayerGameView from '@/components/player/MobilePlayerGameView';

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

  const handleCardPlacement = async (song: Song, position: number) => {
    if (!currentPlayer || !room || gameLogic?.isGameOver) return;

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
      }
    } catch (error) {
      console.error('❌ Card placement failed:', error);
      toast({
        title: "Card placement failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessingMove(false);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
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
    return <div>Loading game...</div>;
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

  // Host view - use HostGameView component
  if (isHost) {
    return (
      <HostGameView
        currentTurnPlayer={currentTurnPlayer}
        currentSong={room.current_song}
        roomCode={room.lobby_code}
        players={players}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        cardPlacementResult={cardPlacementResult}
        transitioning={isProcessingMove}
        highlightedGapIndex={null}
        mobileViewport={null}
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
