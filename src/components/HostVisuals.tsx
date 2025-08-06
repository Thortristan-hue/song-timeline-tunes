
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, AlertTriangle } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { HostCurrentPlayerTimeline } from './host/HostCurrentPlayerTimeline';
import { HostAllPlayersOverview } from './host/HostAllPlayersOverview';
import { audioEngine } from '@/utils/audioEngine';
import { getActualPlayers, findCurrentPlayer } from '@/utils/playerUtils';

interface HostVisualsProps {
  room: any;
  players: Player[];
  mysteryCard: Song | null;
  isHost: boolean;
}

export function HostVisuals({ room, players, mysteryCard, isHost }: HostVisualsProps) {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  
  // Enhanced debugging and player filtering
  const actualPlayers = React.useMemo(() => {
    console.log('[HostVisuals] Input players:', players);
    console.log('[HostVisuals] Room host_id:', room?.host_id);
    
    const filtered = getActualPlayers(players, room?.host_id);
    console.log('[HostVisuals] Filtered actual players:', filtered);
    
    return filtered;
  }, [players, room?.host_id]);
  
  // Find current player using the utility function
  const currentPlayer = React.useMemo(() => {
    const player = findCurrentPlayer(actualPlayers, room?.current_player_id, currentTurnIndex);
    console.log('[HostVisuals] Current player calculation:', {
      actualPlayersCount: actualPlayers.length,
      currentPlayerId: room?.current_player_id,
      currentTurnIndex,
      foundPlayer: player?.name || 'None'
    });
    return player;
  }, [actualPlayers, room?.current_player_id, currentTurnIndex]);

  // Comprehensive debug logging
  useEffect(() => {
    console.log('[HostVisuals] Complete state debug:', {
      isHost,
      roomPhase: room?.phase,
      roomLobbyCode: room?.lobby_code,
      totalInputPlayers: players.length,
      actualPlayersCount: actualPlayers.length,
      currentPlayerId: room?.current_player_id,
      currentTurnIndex,
      currentPlayerFound: !!currentPlayer,
      currentPlayerName: currentPlayer?.name,
      mysteryCard: mysteryCard?.deezer_title,
      roomData: room ? {
        id: room.id,
        phase: room.phase,
        current_player_id: room.current_player_id,
        current_turn: room.current_turn
      } : 'No room data'
    });
  }, [players.length, actualPlayers.length, room, currentTurnIndex, currentPlayer, isHost, mysteryCard]);

  // Update current turn index when room's current_player_id changes
  useEffect(() => {
    if (room?.current_player_id && actualPlayers.length > 0) {
      const playerIndex = actualPlayers.findIndex(p => p.id === room.current_player_id);
      if (playerIndex >= 0) {
        console.log('[HostVisuals] Updating turn index from', currentTurnIndex, 'to', playerIndex);
        setCurrentTurnIndex(playerIndex);
      }
    }
  }, [room?.current_player_id, actualPlayers]);

  const handlePlayPreview = async () => {
    if (!mysteryCard?.preview_url) {
      console.warn('[HostVisuals] No preview URL available for mystery card');
      return;
    }

    try {
      if (isPlayingPreview) {
        audioEngine.stopPreview();
        setIsPlayingPreview(false);
      } else {
        audioEngine.playPreview(mysteryCard.preview_url);
        setIsPlayingPreview(true);
        
        // Auto-stop after 30 seconds
        setTimeout(() => {
          setIsPlayingPreview(false);
        }, 30000);
      }
    } catch (error) {
      console.error('[HostVisuals] Error playing preview:', error);
      setIsPlayingPreview(false);
    }
  };

  // Handle room not loaded
  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 text-white">
        <AlertTriangle className="h-16 w-16 mb-4 text-yellow-400" />
        <h2 className="text-2xl font-bold mb-2">Room Not Found</h2>
        <p className="text-lg opacity-75">Unable to load room data.</p>
      </div>
    );
  }

  // Show loading state if we're in playing phase but have no players
  if (room.phase === 'playing' && actualPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 text-white">
        <Music className="h-16 w-16 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">Loading Players...</h2>
        <p className="text-lg opacity-75">Synchronizing player data...</p>
        <div className="mt-4 text-sm opacity-60">
          <p>Room: {room.lobby_code}</p>
          <p>Phase: {room.phase}</p>
          <p>Total Input Players: {players.length}</p>
        </div>
      </div>
    );
  }

  // Show waiting state if no players joined yet
  if (actualPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 text-white">
        <Music className="h-16 w-16 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">Waiting for Players...</h2>
        <p className="text-lg opacity-75">The game will start once players join the lobby.</p>
        <div className="mt-4 text-sm opacity-60">
          <p>Room: {room.lobby_code}</p>
          <p>Phase: {room.phase}</p>
          <p>Host ID: {room.host_id}</p>
        </div>
      </div>
    );
  }

  // Show game setup state if no current player determined yet
  if (room.phase === 'playing' && !currentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 text-white">
        <Music className="h-16 w-16 mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">Setting Up Game...</h2>
        <p className="text-lg opacity-75">Determining player turns...</p>
        <div className="mt-4 text-sm opacity-60 space-y-1">
          <p>Players Ready: {actualPlayers.length}</p>
          <p>Current Player ID: {room.current_player_id || 'Not set'}</p>
          <p>Current Turn Index: {currentTurnIndex}</p>
          <p>Available Players: {actualPlayers.map(p => p.name).join(', ')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800 text-white relative overflow-hidden">
      {/* Mystery Card Display */}
      {mysteryCard && (
        <div className="absolute top-4 right-4 z-30">
          <Card className="bg-black/20 backdrop-blur-sm border-white/20 p-4 min-w-64">
            <div className="flex flex-col items-center space-y-3">
              <div className="text-center">
                <h3 className="font-bold text-white text-lg">{mysteryCard.deezer_title}</h3>
                <p className="text-white/80">{mysteryCard.deezer_artist}</p>
                <p className="text-white/60 text-sm">{mysteryCard.release_year}</p>
              </div>
              
              {mysteryCard.preview_url && (
                <Button 
                  onClick={handlePlayPreview}
                  disabled={isPlayingPreview}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isPlayingPreview ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play Preview
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Current Player Section */}
      <div className="flex-1 flex flex-col justify-center px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            {currentPlayer ? `${currentPlayer.name}'s Turn` : 'Setting Up Turn...'}
          </h1>
          <p className="text-xl opacity-75">
            {currentPlayer ? 'Place the mystery song in the timeline' : 'Preparing game...'}
          </p>
        </div>

        {/* Current Player Timeline */}
        {currentPlayer && (
          <div className="flex-1 flex items-center justify-center">
            <HostCurrentPlayerTimeline 
              currentTurnPlayer={currentPlayer}
              cardPlacementResult={null}
              highlightedGapIndex={null}
              isTransitioning={false}
            />
          </div>
        )}
      </div>

      {/* All Players Overview */}
      <div className="h-48 border-t border-white/20 bg-black/10">
        <HostAllPlayersOverview 
          players={actualPlayers}
          currentTurnPlayer={currentPlayer}
        />
      </div>
    </div>
  );
}
