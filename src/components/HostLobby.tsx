
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Settings, Music, Play } from "lucide-react";
import { Player, GameRoom, Song } from '@/types/game';
import { QRCodeGenerator } from './QRCodeGenerator';
import { PlaylistLoader } from './PlaylistLoader';
import { useGameInitializer } from '@/hooks/useGameInitializer';

interface HostLobbyProps {
  room: GameRoom;
  players: Player[];
  onLoadPlaylist: (songs: Song[]) => void;
  customSongs: Song[];
}

export function HostLobby({ room, players, onLoadPlaylist, customSongs }: HostLobbyProps) {
  const [canStartGame, setCanStartGame] = useState(false);
  const { startGame, isInitializing } = useGameInitializer();

  // Check if game can be started
  useEffect(() => {
    const hasPlayers = players.length >= 1; // At least 1 non-host player
    const hasSongs = customSongs.length >= 2; // At least 2 songs
    setCanStartGame(hasPlayers && hasSongs);
    
    console.log('HostLobby: Game start readiness check:', {
      players: players.length,
      songs: customSongs.length,
      canStart: hasPlayers && hasSongs
    });
  }, [players.length, customSongs.length]);

  const handleStartGame = async () => {
    if (!canStartGame || !room?.id) {
      console.warn('HostLobby: Cannot start game - requirements not met');
      return;
    }

    console.log('🎮 HostLobby: Starting game with:', {
      roomId: room.id,
      playersCount: players.length,
      songsCount: customSongs.length
    });

    const success = await startGame(room.id, customSongs);
    
    if (success) {
      console.log('✅ HostLobby: Game initialization completed successfully');
    } else {
      console.error('❌ HostLobby: Game initialization failed');
    }
  };

  // Enhanced debugging for room state
  useEffect(() => {
    console.log('HostLobby: Current state:', {
      roomPhase: room?.phase,
      roomId: room?.id,
      lobbyCode: room?.lobby_code,
      playersCount: players.length,
      songsCount: customSongs.length
    });
  }, [room, players.length, customSongs.length]);

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mb-4"></div>
          <div>Loading lobby...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Lobby Info & Players */}
        <div className="space-y-6">
          {/* Room Info Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">Host Lobby</h1>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {room.lobby_code}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{players.length} Players</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                <span>{customSongs.length} Songs</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Mode: {room.gamemode || 'Classic'}</span>
              </div>
            </div>
          </Card>

          {/* Players List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Players ({players.length})</h2>
            {players.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Waiting for players to join...
              </p>
            ) : (
              <div className="space-y-3">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-gray-500">Ready to play</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - QR Code & Game Controls */}
        <div className="space-y-6">
          {/* QR Code */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Join Game</h2>
            <QRCodeGenerator value={room.lobby_code} />
          </Card>

          {/* Playlist Loader */}
          <Card className="p-6">
            <PlaylistLoader onPlaylistLoaded={onLoadPlaylist} />
          </Card>

          {/* Game Start */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Start Game</h2>
            
            <div className="space-y-4">
              {/* Requirements Check */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${players.length >= 1 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>At least 1 player ({players.length}/1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${customSongs.length >= 2 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>At least 2 songs ({customSongs.length}/2)</span>
                </div>
              </div>

              <Button 
                onClick={handleStartGame}
                disabled={!canStartGame || isInitializing}
                className="w-full"
                size="lg"
              >
                {isInitializing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Starting Game...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </>
                )}
              </Button>

              {!canStartGame && (
                <p className="text-sm text-gray-500 text-center">
                  {players.length < 1 && "Wait for players to join. "}
                  {customSongs.length < 2 && "Load a playlist with at least 2 songs."}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
