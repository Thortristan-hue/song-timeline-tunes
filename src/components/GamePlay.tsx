
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { useGameLogic } from '@/hooks/useGameLogic';
import { GameService } from '@/services/gameService';
import { useToast } from '@/components/ui/use-toast';
import { ConnectionStatus } from '@/hooks/useRealtimeSubscription';
import { LoadingScreen } from '@/components/LoadingScreen';
import { audioManager } from '@/services/AudioManager';

// Import game mode components with correct syntax
import { HostGameView } from '@/components/HostVisuals';
import MobilePlayerGameView from '@/components/player/MobilePlayerGameView';
import { FiendModePlayerView } from '@/components/fiend/FiendModePlayerView';
import { FiendModeHostView } from '@/components/fiend/FiendModeHostView';
import { SprintModePlayerView } from '@/components/sprint/SprintModePlayerView';
import { SprintModeHostView } from '@/components/sprint/SprintModeHostView';
import { HostGameOverScreen } from '@/components/host/HostGameOverScreen';
import MobileGameOverScreen from '@/components/player/MobileGameOverScreen';

interface GamePlayProps {
  room: GameRoom;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean; error?: string }>;
  onSetCurrentSong: (song: Song) => Promise<void>;
  customSongs?: Song[];
  connectionStatus: ConnectionStatus;
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
  customSongs = [],
  connectionStatus,
  onReconnect,
  onReplayGame
}: GamePlayProps) {
  const { toast } = useToast();
  const [gameInitialized, setGameInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize game logic
  const { gameState, getCurrentPlayer } = useGameLogic(
    room?.id || null,
    players,
    room
  );

  // Initialize universal audio controller
  useEffect(() => {
    if (room?.id) {
      console.log('🎵 GAMEPLAY: Initializing audio manager for room:', room.id, 'isHost:', isHost);
      audioManager.initialize(room.id, isHost);
      
      // Subscribe to audio state changes
      const handleAudioStateChange = (playing: boolean, song?: Song) => {
        console.log('🎵 GAMEPLAY: Audio state changed - playing:', playing, 'song:', song?.deezer_title);
        setIsPlaying(playing);
      };

      audioManager.addPlayStateListener(handleAudioStateChange);

      return () => {
        audioManager.removePlayStateListener(handleAudioStateChange);
      };
    }
  }, [room?.id, isHost]);

  // Universal audio control handler with enhanced debugging
  const handlePlayPause = useCallback(async () => {
    if (!room?.current_song) {
      console.warn('🎵 GAMEPLAY: No current song available for play/pause');
      return;
    }

    console.log('🎵 GAMEPLAY: Play/pause triggered for:', room.current_song.deezer_title);
    console.log('🎵 GAMEPLAY: Current player is host:', isHost);
    
    if (isHost) {
      // Host controls audio directly
      await audioManager.togglePlayPause(room.current_song);
    } else {
      // Mobile player sends universal control command
      console.log('📱 GAMEPLAY: Sending universal control command from mobile player');
      const success = await audioManager.sendUniversalAudioControl('toggle', room.current_song);
      if (!success) {
        console.error('📱 GAMEPLAY: Failed to send universal control command');
        toast({
          title: "Connection Issue",
          description: "Unable to control audio. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [room?.current_song, isHost, toast]);

  // Debug current player timeline
  useEffect(() => {
    if (currentPlayer) {
      console.log('🎮 GAMEPLAY: Current player timeline:', {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        timelineLength: currentPlayer.timeline?.length || 0,
        timeline: currentPlayer.timeline
      });
    }
  }, [currentPlayer]);

  // Check if game has proper data
  const hasGameData = useMemo(() => {
    const hasData = room && 
           room.songs && 
           room.songs.length > 0 && 
           room.current_song;
    
    console.log('🎮 GAMEPLAY: Game data check:', {
      hasRoom: !!room,
      hasSongs: !!(room?.songs && room.songs.length > 0),
      hasCurrentSong: !!room?.current_song,
      hasData
    });
    
    return hasData;
  }, [room]);

  // Handle game initialization check
  useEffect(() => {
    if (hasGameData && !gameInitialized) {
      console.log('✅ GAMEPLAY: Game data ready, marking as initialized');
      setGameInitialized(true);
      setInitializationError(null);
    } else if (!hasGameData && gameInitialized) {
      console.log('⚠️ GAMEPLAY: Game data missing, marking as not initialized');
      setGameInitialized(false);
    }
  }, [hasGameData, gameInitialized]);

  // Handle card placement
  const handlePlaceCard = useCallback(async (song: Song, position: number) => {
    if (!room?.id || !currentPlayer?.id) {
      console.error('❌ PLACE CARD: Missing room or current player');
      return { success: false, error: 'Missing room or player data' };
    }

    try {
      console.log('🃏 PLACE CARD: Attempting placement:', { song: song.deezer_title, position });
      
      const result = await GameService.placeCardAndAdvanceTurn(
        room.id,
        currentPlayer.id,
        song,
        position,
        room.songs || []
      );

      if (result.success) {
        console.log('✅ PLACE CARD: Placement successful');
        if (result.gameEnded && result.winner) {
          console.log('🏆 GAME ENDED: Winner found:', result.winner.name);
        }
      } else {
        console.error('❌ PLACE CARD: Placement failed:', result.error);
        toast({
          title: "Card Placement Failed",
          description: result.error || 'Failed to place card',
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error('❌ PLACE CARD: Error during placement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to place card';
      toast({
        title: "Card Placement Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [room?.id, room?.songs, currentPlayer?.id, toast]);

  // Show loading while game is initializing
  if (!gameInitialized) {
    if (isHost) {
      return (
        <LoadingScreen 
          title="Initializing Game..."
          subtitle="Loading songs and setting up the game. This may take a moment."
          variant="game"
        />
      );
    } else {
      return (
        <LoadingScreen 
          title="Host Setting Up Game..."
          subtitle="Please wait while the host loads songs and prepares the game."
          variant="initialization"
        />
      );
    }
  }

  // Error state
  if (initializationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Game Initialization Failed</h2>
          <p className="text-lg mb-4">{initializationError}</p>
          <button
            onClick={onReconnect}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check for game end condition
  const winner = players.find(player => player.score >= 10);
  if (winner) {
    if (isHost) {
      return (
        <HostGameOverScreen
          winner={winner}
          players={players}
          onPlayAgain={onReplayGame}
          onRestartWithSamePlayers={onReplayGame}
          onBackToMenu={() => window.location.reload()}
          roomCode={room.lobby_code}
        />
      );
    } else {
      return (
        <MobileGameOverScreen
          winningPlayer={winner}
          allPlayers={players}
          onPlayAgain={onReplayGame}
          roomCode={room.lobby_code}
        />
      );
    }
  }

  // Main game view
  if (isHost) {
    // Route to appropriate host view based on game mode
    switch (room.gamemode) {
      case 'fiend':
        return (
          <FiendModeHostView
            players={players}
            currentSong={room.current_song!}
            roundNumber={room.current_turn || 1}
            totalRounds={room.gamemode_settings?.rounds || 5}
            roomCode={room.lobby_code}
            timeLeft={30} // TODO: Implement actual timer logic
            playerGuesses={{}} // TODO: Implement player guesses tracking
          />
        );
        
      case 'sprint':
        return (
          <SprintModeHostView
            players={players}
            currentSong={room.current_song!}
            targetCards={room.gamemode_settings?.targetCards || 10}
            roomCode={room.lobby_code}
            timeLeft={30} // TODO: Implement actual timer logic
            playerTimeouts={{}} // TODO: Implement timeout tracking
            recentPlacements={{}} // TODO: Implement recent placement tracking
          />
        );
        
      case 'classic':
      default:
        return (
          <HostGameView
            currentTurnPlayer={players.find(p => p.id === room.current_player_id) || players[0]}
            currentSong={room.current_song}
            roomCode={room.lobby_code}
            players={players}
            mysteryCardRevealed={false}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            cardPlacementResult={null}
            transitioning={false}
            highlightedGapIndex={null}
            mobileViewport={null}
          />
        );
    }
  } else {
    // Get current turn player
    const currentTurnPlayer = players.find(p => p.id === room.current_player_id) || players[0];
    const isMyTurn = currentPlayer?.id === room.current_player_id;

    // Debug log before rendering mobile view
    console.log('📱 GAMEPLAY: Rendering mobile view with:', {
      currentPlayer: currentPlayer?.name,
      currentTurnPlayer: currentTurnPlayer?.name,
      isMyTurn,
      currentPlayerTimeline: currentPlayer?.timeline,
      gameMode: room.gamemode
    });

    // Route to appropriate game mode component based on room.gamemode
    switch (room.gamemode) {
      case 'fiend':
        return (
          <FiendModePlayerView
            currentPlayer={currentPlayer!}
            currentSong={room.current_song!}
            roomCode={room.lobby_code}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSubmitGuess={async (year: number) => {
              // Implementation for Fiend mode year guessing
              const actualYear = parseInt(room.current_song?.release_year || '2024');
              const yearDifference = Math.abs(year - actualYear);
              const accuracy = Math.max(0, 100 - (yearDifference * 2));
              const points = Math.round(accuracy);
              
              try {
                // Update player score (add points to current score)
                const newScore = (currentPlayer!.score || 0) + points;
                await GameService.updatePlayerScore(room.id, currentPlayer!.id, newScore);
                return { success: true, accuracy, points };
              } catch (error) {
                console.error('Failed to submit Fiend mode guess:', error);
                return { success: false };
              }
            }}
            gameEnded={false}
            roundNumber={room.current_turn || 1}
            totalRounds={room.gamemode_settings?.rounds || 5}
            timeLeft={30} // TODO: Implement actual timer logic
          />
        );
        
      case 'sprint':
        return (
          <SprintModePlayerView
            currentPlayer={currentPlayer!}
            currentSong={room.current_song!}
            roomCode={room.lobby_code}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onPlaceCard={async (song: Song, position: number) => {
              const result = await handlePlaceCard(song, position);
              return { 
                success: result.success, 
                correct: result.success // Simplified for now - actual logic would determine correctness
              };
            }}
            gameEnded={false}
            targetCards={room.gamemode_settings?.targetCards || 10}
            timeLeft={30} // TODO: Implement actual timer logic
            isInTimeout={false} // TODO: Implement timeout logic
            timeoutRemaining={0}
          />
        );
        
      case 'classic':
      default:
        return (
          <MobilePlayerGameView
            currentPlayer={currentPlayer!}
            currentTurnPlayer={currentTurnPlayer}
            currentSong={room.current_song!}
            roomCode={room.lobby_code}
            isMyTurn={isMyTurn}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onPlaceCard={handlePlaceCard}
            mysteryCardRevealed={false}
            cardPlacementResult={null}
            gameEnded={false}
          />
        );
    }
  }
}
