import React, { useState, useEffect, useRef } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { GameLogic } from '@/services/gameLogic';
import { useToast } from '@/hooks/use-toast';
import { Feedback } from '@/components/Feedback';
import { KahootStyleFeedback } from '@/components/KahootStyleFeedback';
import { VictoryScreen } from '@/components/VictoryScreen';
import { useConfettiStore } from '@/stores/useConfettiStore';
import { HostGameView } from '@/components/HostVisuals';
import MobilePlayerGameView from '@/components/player/MobilePlayerGameView';
import { HostTurnFeedback } from '@/components/HostTurnFeedback';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Music2 } from 'lucide-react';

interface GamePlayProps {
  room: GameRoom;
  players: Player[];
  currentPlayer: Player | null; // Can be null for hosts
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
  const [showHostFeedback, setShowHostFeedback] = useState(false);
  const [hostFeedbackData, setHostFeedbackData] = useState<{ player: Player; song: Song; isCorrect: boolean } | null>(null);
  const { fire } = useConfettiStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Find current turn player
  const currentTurnPlayer = players.find(p => p.id === room.current_player_id) || players[0];

  useEffect(() => {
    if (room && players) {
      // For hosts, use the first player as a placeholder for GameLogic initialization
      const playerForLogic = currentPlayer || players[0];
      if (playerForLogic) {
        const newGameLogic = new GameLogic(room, players, playerForLogic);
        setGameLogic(newGameLogic);
      }
    }
  }, [room, players, currentPlayer]);

  useEffect(() => {
    if (winner) {
      fire();
    }
  }, [winner, fire]);

  const handleCardPlacement = async (song: Song, position: number): Promise<{ success: boolean; }> => {
    if (!room || gameLogic?.isGameOver) {
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

          // Show host feedback if host
          if (isHost && currentPlayer) {
            setHostFeedbackData({
              player: currentPlayer,
              song: song,
              isCorrect: result.correct
            });
            setShowHostFeedback(true);
          }
          
          // Auto-hide feedback after delay
          setTimeout(() => {
            setFeedback({ show: false, correct: false, song: null });
            setCardPlacementResult(null);
            setShowHostFeedback(false);
            setHostFeedbackData(null);
          }, 4000);
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

  const handlePlayPause = () => {
    console.log('🎵 GamePlay: Play/pause toggle requested, isPlaying:', isPlaying);
    setIsPlaying(!isPlaying);
  };

  const handleSetMysteryCard = async () => {
    if (!isHost || !gameLogic) return;

    setIsProcessingMove(true);
    try {
      // Check if game should end first
      if (gameLogic.shouldEndGame()) {
        console.log('🏁 No more songs available - ending game');
        toast({
          title: "Game Complete",
          description: "All songs have been used! The game will end.",
          variant: "default",
        });
        
        // End the game
        setWinner(gameLogic.checkWinCondition());
        setShowVictoryScreen(true);
        return;
      }
      
      // Use improved song selection
      const availableForMystery = gameLogic.getAvailableForMystery();
      if (availableForMystery.length > 0) {
        // Use Fisher-Yates shuffle for better randomization
        const shuffled = [...availableForMystery];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        const song = shuffled[0];
        console.log('🎵 Setting mystery card:', song.deezer_title);
        await onSetCurrentSong(song);
        setMysteryCardRevealed(true);
      } else {
        console.warn('⚠️ No available songs to set as mystery card');
        toast({
          title: "Game Complete",
          description: "No more songs available! The game will end.",
          variant: "default",
        });
        
        // End the game
        setWinner(gameLogic.checkWinCondition());
        setShowVictoryScreen(true);
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-secondary/20 flex items-center justify-center">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-full animate-spin-slow flex items-center justify-center">
            <Music2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Loading Game...</h2>
          <p className="text-muted-foreground">Setting up your timeline experience</p>
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

  // Show Kahoot-style feedback overlay for hosts, regular feedback for players
  if (feedback.show) {
    if (isHost) {
      return (
        <KahootStyleFeedback 
          correct={feedback.correct} 
          song={feedback.song}
          onComplete={() => setFeedback({ show: false, correct: false, song: null })}
          duration={3000}
        />
      );
    } else {
      return <Feedback correct={feedback.correct} song={feedback.song} />;
    }
  }

  // Hidden audio player for current song
  const currentSongAudio = room.current_song && (
    <AudioPlayer
      ref={audioRef}
      src={room.current_song.preview_url}
      trackId={room.current_song.trackId || room.current_song.deezer_url}
      isPlaying={isPlaying}
      onPlayPause={handlePlayPause}
      className="hidden"
      volume={0.7}
    />
  );

  // Host view - use HostGameView component
  if (isHost) {
    return (
      <>
        {currentSongAudio}
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
        
        {/* Host feedback overlay */}
        {showHostFeedback && hostFeedbackData && (
          <HostTurnFeedback
            isVisible={showHostFeedback}
            player={hostFeedbackData.player}
            song={hostFeedbackData.song}
            isCorrect={hostFeedbackData.isCorrect}
            onComplete={() => {
              setShowHostFeedback(false);
              setHostFeedbackData(null);
            }}
          />
        )}
      </>
    );
  }

  // Player view - use MobilePlayerGameView component (only if currentPlayer exists)
  if (currentPlayer) {
    return (
      <>
        {currentSongAudio}
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
      </>
    );
  }

  // Fallback: if neither host nor player, show loading
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-secondary/20 flex items-center justify-center">
      <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-full animate-spin-slow flex items-center justify-center">
          <Music2 className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Connecting...</h2>
        <p className="text-muted-foreground">Setting up game view</p>
      </div>
    </div>
  );
}
