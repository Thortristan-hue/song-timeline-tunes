
import React, { useEffect } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { HostGameView } from '@/components/HostVisuals';
import ResponsiveMobilePlayerView from '@/components/player/ResponsiveMobilePlayerView';
import { useGameLogic } from '@/hooks/useGameLogic';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
import { GameRoom, Player, Song } from '@/types/game';
import { ConnectionStatus } from '@/hooks/useRealtimeSubscription';
import { audioManager } from '@/services/AudioManager';

interface GamePlayProps {
  room: GameRoom;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean; error?: string; correct?: boolean }>;
  onSetCurrentSong: (song: Song) => void;
  customSongs: Song[];
  connectionStatus: ConnectionStatus;
  onReconnect: () => void;
  onReplayGame: () => void;
}

export default function GamePlay({
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
  const { refreshCurrentPlayerTimeline } = useGameRoom();
  const gameLogic = useGameLogic(room?.id || null, players, room);

  // Initialize audio manager with proper room and role
  useEffect(() => {
    if (room?.id) {
      console.log(`🎵 Initializing audio manager for room ${room.id} as ${isHost ? 'HOST' : 'MOBILE'}`);
      audioManager.initialize(room.id, isHost);
    }

    return () => {
      console.log('🧹 Cleaning up audio manager');
      audioManager.cleanup();
    };
  }, [room?.id, isHost]);

  const handleRestart = () => {
    console.log('Restarting game...');
  };

  const handleEndGame = () => {
    console.log('Ending game...');
  };

  // For host, we only need room data
  // For players, we need both room and currentPlayer
  if (!room || (!isHost && !currentPlayer)) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl mx-auto">
        <GameErrorBoundary>
          {isHost ? (
            <HostGameView
              currentTurnPlayer={gameLogic.getCurrentPlayer() || currentPlayer}
              previousPlayer={undefined}
              currentSong={room.current_song}
              roomCode={room.lobby_code}
              players={players}
              mysteryCardRevealed={gameLogic.gameState.phase === 'playing'}
              isPlaying={gameLogic.gameState.isPlaying}
              onPlayPause={() => gameLogic.setIsPlaying(!gameLogic.gameState.isPlaying)}
              cardPlacementResult={null}
              transitioning={gameLogic.gameState.transitioningTurn}
              highlightedGapIndex={null}
              mobileViewport={null}
            />
          ) : (
            <ResponsiveMobilePlayerView
              currentPlayer={currentPlayer!}
              currentTurnPlayer={gameLogic.getCurrentPlayer() || currentPlayer!}
              currentSong={room.current_song || { id: '', deezer_title: '', deezer_artist: '', release_year: '', deezer_album: '', genre: '', cardColor: '', preview_url: '', deezer_url: '' }}
              roomCode={room.lobby_code}
              isMyTurn={gameLogic.getCurrentPlayer()?.id === currentPlayer?.id}
              isPlaying={gameLogic.gameState.isPlaying}
              onPlayPause={() => gameLogic.setIsPlaying(!gameLogic.gameState.isPlaying)}
              onPlaceCard={onPlaceCard}
              mysteryCardRevealed={gameLogic.gameState.phase === 'playing'}
              cardPlacementResult={null}
              gameEnded={gameLogic.gameState.phase === 'finished'}
              onHighlightGap={() => {}}
              onViewportChange={() => {}}
              refreshCurrentPlayerTimeline={refreshCurrentPlayerTimeline}
            />
          )}
        </GameErrorBoundary>
      </div>
    </div>
  );
}
