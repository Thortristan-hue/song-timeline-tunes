
import React, { useEffect, useState, useCallback } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { HostGameView } from '@/components/HostVisuals';
import ResponsiveMobilePlayerView from '@/components/player/ResponsiveMobilePlayerView';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useEnhancedTurnManager } from '@/hooks/useEnhancedTurnManager';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
import { GameRoom, Player, Song } from '@/types/game';
import { ConnectionStatus } from '@/hooks/useRealtimeSubscription';
import { audioManager } from '@/services/AudioManager';
import { ChatIntegration } from '@/components/ChatIntegration';

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
  
  // Enhanced turn management with animation coordination
  const turnManager = useEnhancedTurnManager({
    roomId: room?.id || '',
    availableSongs: customSongs || [],
    allPlayers: players,
    currentPlayer: gameLogic.getCurrentPlayer()
  });
  
  // Audio state management
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [connectionRetryCount, setConnectionRetryCount] = useState(0);

  // Initialize audio manager with proper room and role and connection retry logic
  useEffect(() => {
    if (room?.id) {
      console.log(`🎵 Initializing audio manager for room ${room.id} as ${isHost ? 'HOST' : 'MOBILE'}`);
      
      // Initialize with retry logic
      const initializeWithRetry = async (attempts = 3) => {
        try {
          await audioManager.initialize(room.id, isHost);
          setConnectionRetryCount(0);
        } catch (error) {
          console.error(`❌ Audio manager initialization failed (attempt ${4 - attempts}):`, error);
          
          if (attempts > 1) {
            console.log(`🔄 Retrying audio manager initialization in 2s...`);
            setTimeout(() => initializeWithRetry(attempts - 1), 2000);
          } else {
            console.error('❌ Audio manager initialization failed after 3 attempts');
            setConnectionRetryCount(prev => prev + 1);
          }
        }
      };

      initializeWithRetry();
      
      // Set up audio state listener
      const handleAudioStateChange = (isPlaying: boolean, song?: Song) => {
        console.log('🎵 Audio state changed:', { isPlaying, song: song?.deezer_title });
        setAudioIsPlaying(isPlaying);
        if (song) {
          onSetCurrentSong(song);
        }
      };
      
      audioManager.addPlayStateListener(handleAudioStateChange);
      // Initialize with current state
      setAudioIsPlaying(audioManager.getIsPlaying());
      
      return () => {
        console.log('🧹 Cleaning up audio manager');
        audioManager.removePlayStateListener(handleAudioStateChange);
        audioManager.cleanup();
      };
    }
  }, [room?.id, isHost, onSetCurrentSong, connectionRetryCount]);

  // Enhanced card placement with turn management
  const handleEnhancedPlaceCard = useCallback(async (song: Song, position: number) => {
    console.log('🎯 GAMEPLAY: Enhanced card placement requested');
    
    if (!room?.id || !currentPlayer) {
      return { success: false, error: 'Missing room or player data' };
    }
    
    try {
      // Use the enhanced turn manager for coordinated placement and turn advancement
      const result = await turnManager.placeCardWithAnimation(song, position);
      
      if (result.success) {
        // Refresh timeline after successful placement
        await refreshCurrentPlayerTimeline?.();
      }
      
      return result;
    } catch (error) {
      console.error('❌ GAMEPLAY: Enhanced card placement failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Card placement failed' 
      };
    }
  }, [room?.id, currentPlayer, turnManager, refreshCurrentPlayerTimeline]);

  // Enhanced universal audio control with better error handling
  const handleAudioToggle = useCallback(async () => {
    console.log('🎵 GAMEPLAY: Audio toggle requested');
    
    if (!room?.current_song) {
      console.warn('🎵 GAMEPLAY: No current song available');
      return;
    }
    
    try {
      const success = await audioManager.togglePlayPause(room.current_song);
      if (!success) {
        console.warn('🎵 GAMEPLAY: Audio toggle failed, attempting reconnection...');
        
        // Attempt to reinitialize audio manager on failure
        if (connectionRetryCount < 3) {
          setTimeout(() => {
            console.log('🔄 Attempting to reinitialize audio manager...');
            audioManager.initialize(room.id, isHost);
            setConnectionRetryCount(prev => prev + 1);
          }, 1000);
        }
        
        // Still provide immediate UI feedback
        setAudioIsPlaying(!audioIsPlaying);
      }
    } catch (error) {
      console.error('❌ GAMEPLAY: Audio toggle error:', error);
      // Provide fallback UI feedback
      setAudioIsPlaying(!audioIsPlaying);
    }
  }, [room?.current_song, audioIsPlaying, connectionRetryCount, room?.id, isHost]);

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
              isPlaying={audioIsPlaying}
              onPlayPause={handleAudioToggle}
              cardPlacementResult={null}
              transitioning={turnManager.isTransitioning}
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
              isPlaying={audioIsPlaying}
              onPlayPause={handleAudioToggle}
              onPlaceCard={handleEnhancedPlaceCard}
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

      {/* Chat Integration */}
      {currentPlayer && (
        <ChatIntegration
          currentPlayerId={currentPlayer.id}
          currentPlayerName={currentPlayer.name}
          currentPlayerCharacter={currentPlayer.character}
          isHost={isHost}
          showButton={true}
          defaultMinimized={true}
        />
      )}
    </div>
  );
}
