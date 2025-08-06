
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, AlertTriangle } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { HostCurrentPlayerTimeline } from './host/HostCurrentPlayerTimeline';
import { HostAllPlayersOverview } from './host/HostAllPlayersOverview';
import { audioEngine } from '@/utils/audioEngine';
import { getActualPlayers, findCurrentPlayer } from '@/utils/playerUtils';
import { getCharacterById } from '@/constants/characters';

// Import required assets
import logoImage from '@/assets/ass_rythmy.png';
import playImage from '@/assets/ass_play.png';
import pauseImage from '@/assets/ass_pause.png';
import cassetteImage from '@/assets/cassette-purple.png';

interface HostVisualsProps {
  room: {
    id: string;
    phase: string;
    lobby_code: string;
    current_player_id?: string;
    host_id?: string;
  };
  players: Player[];
  mysteryCard: Song | null;
  isHost: boolean;
}

export function HostVisuals({ room, players, mysteryCard, isHost }: HostVisualsProps) {
  console.log("Rendering Host Screen 0.2.2");
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
  }, [room?.current_player_id, actualPlayers, currentTurnIndex]);

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

  // Handle room not loaded - use new layout structure
  if (!room) {
    return (
      <div 
        className="text-white relative overflow-hidden"
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#f0f0f0',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gridTemplateAreas: '"header" "main" "footer"'
        }}
      >
        {/* Top Bar */}
        <div 
          style={{ gridArea: 'header' }}
          className="flex items-center justify-between px-8 py-4 bg-white/10 backdrop-blur-sm"
        >
          {/* Top-Left: Logo */}
          <div className="flex items-center">
            <img src={logoImage} alt="Rhythmi Logo" className="h-12 w-auto" />
          </div>

          {/* Top-Center: Loading indicator */}
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-16 w-16 text-yellow-600" />
          </div>

          {/* Top-Right: Empty space for consistency */}
          <div className="w-24"></div>
        </div>

        {/* Middle Section: Error message */}
        <div 
          style={{ gridArea: 'main' }}
          className="flex flex-col items-center justify-center p-8"
        >
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Room Not Found</h2>
          <p className="text-lg text-gray-600">Unable to load room data.</p>
        </div>

        {/* Bottom Bar: Empty for consistency */}
        <div 
          style={{ gridArea: 'footer' }}
          className="bg-white/10 backdrop-blur-sm border-t border-gray-300 p-4"
        >
        </div>
      </div>
    );
  }

  // Show loading state if we're in playing phase but have no players - use new layout structure
  if (room.phase === 'playing' && actualPlayers.length === 0) {
    return (
      <div 
        className="text-white relative overflow-hidden"
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#f0f0f0',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gridTemplateAreas: '"header" "main" "footer"'
        }}
      >
        {/* Top Bar */}
        <div 
          style={{ gridArea: 'header' }}
          className="flex items-center justify-between px-8 py-4 bg-white/10 backdrop-blur-sm"
        >
          {/* Top-Left: Logo */}
          <div className="flex items-center">
            <img src={logoImage} alt="Rhythmi Logo" className="h-12 w-auto" />
          </div>

          {/* Top-Center: Loading indicator */}
          <div className="flex flex-col items-center gap-4">
            <Music className="h-16 w-16 animate-pulse" />
          </div>

          {/* Top-Right: Room Code */}
          <div className="bg-purple-600/20 backdrop-blur-sm border border-purple-400 px-6 py-2 rounded-lg">
            <div className="text-purple-800 font-mono text-lg font-bold">
              {room.lobby_code}
            </div>
          </div>
        </div>

        {/* Middle Section: Loading message */}
        <div 
          style={{ gridArea: 'main' }}
          className="flex flex-col items-center justify-center p-8"
        >
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Loading Players...</h2>
          <p className="text-lg text-gray-600">Synchronizing player data...</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Room: {room.lobby_code}</p>
            <p>Phase: {room.phase}</p>
            <p>Total Input Players: {players.length}</p>
          </div>
        </div>

        {/* Bottom Bar: Empty for consistency */}
        <div 
          style={{ gridArea: 'footer' }}
          className="bg-white/10 backdrop-blur-sm border-t border-gray-300 p-4"
        >
        </div>
      </div>
    );
  }

  // Show waiting state if no players joined yet - use new layout structure
  if (actualPlayers.length === 0) {
    return (
      <div 
        className="text-white relative overflow-hidden"
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#f0f0f0',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gridTemplateAreas: '"header" "main" "footer"'
        }}
      >
        {/* Top Bar */}
        <div 
          style={{ gridArea: 'header' }}
          className="flex items-center justify-between px-8 py-4 bg-white/10 backdrop-blur-sm"
        >
          {/* Top-Left: Logo */}
          <div className="flex items-center">
            <img src={logoImage} alt="Rhythmi Logo" className="h-12 w-auto" />
          </div>

          {/* Top-Center: Waiting indicator */}
          <div className="flex flex-col items-center gap-4">
            <Music className="h-16 w-16 animate-pulse" />
          </div>

          {/* Top-Right: Room Code */}
          <div className="bg-purple-600/20 backdrop-blur-sm border border-purple-400 px-6 py-2 rounded-lg">
            <div className="text-purple-800 font-mono text-lg font-bold">
              {room.lobby_code}
            </div>
          </div>
        </div>

        {/* Middle Section: Waiting message */}
        <div 
          style={{ gridArea: 'main' }}
          className="flex flex-col items-center justify-center p-8"
        >
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Waiting for Players...</h2>
          <p className="text-lg text-gray-600">The game will start once players join the lobby.</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Room: {room.lobby_code}</p>
            <p>Phase: {room.phase}</p>
            <p>Host ID: {room.host_id}</p>
          </div>
        </div>

        {/* Bottom Bar: Empty for consistency */}
        <div 
          style={{ gridArea: 'footer' }}
          className="bg-white/10 backdrop-blur-sm border-t border-gray-300 p-4"
        >
        </div>
      </div>
    );
  }

  // Show game setup state if no current player determined yet - use new layout structure
  if (room.phase === 'playing' && !currentPlayer) {
    return (
      <div 
        className="text-white relative overflow-hidden"
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#f0f0f0',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gridTemplateAreas: '"header" "main" "footer"'
        }}
      >
        {/* Top Bar */}
        <div 
          style={{ gridArea: 'header' }}
          className="flex items-center justify-between px-8 py-4 bg-white/10 backdrop-blur-sm"
        >
          {/* Top-Left: Logo */}
          <div className="flex items-center">
            <img src={logoImage} alt="Rhythmi Logo" className="h-12 w-auto" />
          </div>

          {/* Top-Center: Setup indicator */}
          <div className="flex flex-col items-center gap-4">
            <Music className="h-16 w-16 animate-spin" />
          </div>

          {/* Top-Right: Room Code */}
          <div className="bg-purple-600/20 backdrop-blur-sm border border-purple-400 px-6 py-2 rounded-lg">
            <div className="text-purple-800 font-mono text-lg font-bold">
              {room.lobby_code}
            </div>
          </div>
        </div>

        {/* Middle Section: Setup message */}
        <div 
          style={{ gridArea: 'main' }}
          className="flex flex-col items-center justify-center p-8"
        >
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Setting Up Game...</h2>
          <p className="text-lg text-gray-600">Determining player turns...</p>
          <div className="mt-4 text-sm text-gray-500 space-y-1">
            <p>Players Ready: {actualPlayers.length}</p>
            <p>Current Player ID: {room.current_player_id || 'Not set'}</p>
            <p>Current Turn Index: {currentTurnIndex}</p>
            <p>Available Players: {actualPlayers.map(p => p.name).join(', ')}</p>
          </div>
        </div>

        {/* Bottom Bar: Show available players if any */}
        <div 
          style={{ gridArea: 'footer' }}
          className="bg-white/10 backdrop-blur-sm border-t border-gray-300"
        >
          {actualPlayers.length > 0 && (
            <div className="p-4">
              <div className="flex justify-center items-center gap-6">
                {actualPlayers.map(player => {
                  const character = getCharacterById(player.character || 'char_dave');
                  return (
                    <div 
                      key={player.id} 
                      className="flex flex-col items-center p-3 rounded-lg bg-white/20"
                    >
                      {character ? (
                        <img 
                          src={character.image} 
                          alt={character.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-gray-800 text-sm font-medium mt-2">{player.name}</span>
                      <span className="text-gray-600 text-xs">Setting up...</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="text-white relative overflow-hidden"
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f0f0f0',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        gridTemplateAreas: '"header" "main" "footer"'
      }}
    >
      {/* Top Bar */}
      <div 
        style={{ gridArea: 'header' }}
        className="flex items-center justify-between px-8 py-4 bg-white/10 backdrop-blur-sm"
      >
        {/* Top-Left: Logo */}
        <div className="flex items-center">
          <img src={logoImage} alt="Rhythmi Logo" className="h-12 w-auto" />
        </div>

        {/* Top-Center: Mystery Card Cassette and Play/Pause Controls */}
        <div className="flex flex-col items-center gap-4">
          {/* Mystery Card Cassette */}
          {mysteryCard && (
            <div className="flex flex-col items-center">
              <img src={cassetteImage} alt="Mystery Cassette" className="h-16 w-auto" />
              <div className="text-center mt-2">
                <div className="text-sm font-medium text-gray-800">{mysteryCard.deezer_title}</div>
                <div className="text-xs text-gray-600">{mysteryCard.deezer_artist}</div>
              </div>
            </div>
          )}
          
          {/* Play/Pause Controls */}
          <div className="flex items-center gap-4">
            {mysteryCard?.preview_url && (
              <button
                onClick={handlePlayPreview}
                className="transition-transform hover:scale-110"
              >
                <img 
                  src={isPlayingPreview ? pauseImage : playImage} 
                  alt={isPlayingPreview ? "Pause" : "Play"} 
                  className="h-12 w-auto" 
                />
              </button>
            )}
          </div>
        </div>

        {/* Top-Right: Room Code */}
        <div className="bg-purple-600/20 backdrop-blur-sm border border-purple-400 px-6 py-2 rounded-lg">
          <div className="text-purple-800 font-mono text-lg font-bold">
            {room.lobby_code}
          </div>
        </div>
      </div>

      {/* Middle Section: Song Timeline */}
      <div 
        style={{ gridArea: 'main' }}
        className="flex flex-col items-center justify-center p-8"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">
            {currentPlayer ? `${currentPlayer.name}'s Turn` : 'Setting Up Turn...'}
          </h1>
          <p className="text-xl text-gray-600">
            {currentPlayer ? 'Place the mystery song in the timeline' : 'Preparing game...'}
          </p>
        </div>

        {/* Current Player Timeline - Centered */}
        {currentPlayer && (
          <div className="flex-1 flex items-center justify-center w-full">
            <HostCurrentPlayerTimeline 
              currentTurnPlayer={currentPlayer}
              cardPlacementResult={null}
              highlightedGapIndex={null}
              isTransitioning={false}
            />
          </div>
        )}
      </div>

      {/* Bottom Bar: Player Characters */}
      <div 
        style={{ gridArea: 'footer' }}
        className="bg-white/10 backdrop-blur-sm border-t border-gray-300"
      >
        <div className="p-4">
          <div className="flex justify-center items-center gap-6">
            {actualPlayers.map(player => {
              const character = getCharacterById(player.character || 'char_dave');
              return (
                <div 
                  key={player.id} 
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                    currentPlayer?.id === player.id 
                      ? 'bg-yellow-300/30 ring-2 ring-yellow-500' 
                      : 'bg-white/20'
                  }`}
                >
                  {character ? (
                    <img 
                      src={character.image} 
                      alt={character.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-gray-800 text-sm font-medium mt-2">{player.name}</span>
                  <span className="text-gray-600 text-xs">Score: {player.score || 0}</span>
                  {currentPlayer?.id === player.id && (
                    <div className="text-yellow-600 text-xs mt-1 font-bold">Current Turn</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
