
import { useState, useEffect } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { GameLogic } from '@/services/gameLogic';
import { HostVisuals } from '@/components/HostVisuals';
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
  // Orchestration state passed from Game.tsx
  isProcessingMove: boolean;
  isPlaying: boolean;
  onPlayPause: () => Promise<void>;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  gameEnded: boolean;
}

export function GamePlay({ 
  room, 
  players, 
  currentPlayer, 
  isHost, 
  onPlaceCard,
  // Orchestration state from Game.tsx
  isPlaying,
  onPlayPause,
  mysteryCardRevealed,
  cardPlacementResult,
  gameEnded
}: GamePlayProps) {
  const [gameLogic, setGameLogic] = useState<GameLogic | null>(null);

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

  const handleCardPlacement = async (song: Song, position: number): Promise<{ success: boolean; }> => {
    if (!currentPlayer || !room || gameLogic?.isGameOver) {
      return { success: false };
    }
    
    // Delegate to the parent Game.tsx orchestration
    console.log('🃏 [GamePlay] Delegating card placement to Game.tsx orchestration');
    const result = await onPlaceCard(song, position);
    return { success: result.success };
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

  // Only render player view if we have a current song
  if (!room?.current_song) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-white text-lg mb-2">Waiting for song...</div>
          <div className="text-white/60 text-sm">The host is preparing the next song</div>
        </div>
      </div>
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
      onPlayPause={onPlayPause}
      onPlaceCard={handleCardPlacement}
      mysteryCardRevealed={mysteryCardRevealed}
      cardPlacementResult={cardPlacementResult}
      gameEnded={gameEnded}
    />
  );
}
