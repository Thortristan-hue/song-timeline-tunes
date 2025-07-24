
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { useGameLogic } from '@/hooks/useGameLogic';
import { GameService } from '@/services/gameService';
import { useToast } from '@/components/ui/use-toast';
import { ConnectionStatus } from '@/hooks/useRealtimeSubscription';
import { LoadingScreen } from '@/components/LoadingScreen';

// Import game mode components
import { HostVisuals } from '@/components/HostVisuals';
import { MobilePlayerGameView } from '@/components/player/MobilePlayerGameView';
import { HostGameOverScreen } from '@/components/host/HostGameOverScreen';
import { MobileGameOverScreen } from '@/components/player/MobileGameOverScreen';

interface GamePlayProps {
  room: GameRoom;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  onPlaceCard: (song: Song, position: number) => Promise<any>;
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

  // Initialize game logic
  const { gameState, getCurrentPlayer } = useGameLogic(
    room?.id || null,
    players,
    room
  );

  // Check if game has proper data
  const hasGameData = useMemo(() => {
    return room && 
           room.songs && 
           room.songs.length > 0 && 
           room.current_song;
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
          onReplayGame={onReplayGame}
        />
      );
    } else {
      return (
        <MobileGameOverScreen
          winner={winner}
          currentPlayer={currentPlayer}
          isWinner={currentPlayer?.id === winner.id}
        />
      );
    }
  }

  // Main game view
  if (isHost) {
    return (
      <HostVisuals
        room={room}
        players={players}
        currentSong={room.current_song}
        availableSongs={room.songs || []}
        onSetCurrentSong={onSetCurrentSong}
        connectionStatus={connectionStatus}
        onReconnect={onReconnect}
      />
    );
  } else {
    return (
      <MobilePlayerGameView
        room={room}
        currentPlayer={currentPlayer}
        players={players}
        onPlaceCard={handlePlaceCard}
        connectionStatus={connectionStatus}
        onReconnect={onReconnect}
      />
    );
  }
}
