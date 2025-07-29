
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { Player, GameMode, GameRoom, Song } from '@/types/game';
import { PlayerCharacterDisplay } from '@/components/PlayerCharacterDisplay';
import { Music, Users, Trophy, Clock, Target } from 'lucide-react';

interface HostLobbyProps {
  room: GameRoom | null;
  lobbyCode: string;
  players: Player[];
  onStartGame: () => Promise<void>;
  onBackToMenu: () => void;
  setCustomSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  isLoading: boolean;
  createRoom: () => Promise<boolean>;
  onKickPlayer: (playerId: string) => Promise<boolean>;
  updateRoomGamemode: (gamemode: GameMode, gamemodeSettings: any) => Promise<boolean>;
}

export function HostLobby({ 
  room,
  lobbyCode, 
  players, 
  onStartGame, 
  onBackToMenu,
  setCustomSongs,
  isLoading,
  createRoom,
  onKickPlayer,
  updateRoomGamemode
}: HostLobbyProps) {
  const [isStarting, setIsStarting] = useState(false);
  const joinUrl = `${window.location.origin}?join=${lobbyCode}`;
  
  const gameMode = room?.gamemode || 'classic';
  const gameModeSettings = room?.gamemode_settings || {};

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      await onStartGame();
    } finally {
      setIsStarting(false);
    }
  };

  const handleChangeGameMode = async (mode: GameMode) => {
    if (updateRoomGamemode) {
      await updateRoomGamemode(mode, gameModeSettings);
    }
  };

  const handleUpdateGameModeSettings = async (settings: any) => {
    if (updateRoomGamemode) {
      await updateRoomGamemode(gameMode, settings);
    }
  };

  const getGameModeInfo = (mode: GameMode) => {
    switch (mode) {
      case 'classic':
        return {
          title: 'Classic Mode',
          description: 'Take turns placing cards in chronological order',
          icon: <Music className="w-4 h-4" />,
          color: 'bg-blue-500'
        };
      case 'fiend':
        return {
          title: 'Fiend Mode',
          description: 'Guess the release year of mystery songs',
          icon: <Target className="w-4 h-4" />,
          color: 'bg-red-500'
        };
      case 'sprint':
        return {
          title: 'Sprint Mode',
          description: 'Race to build your timeline first',
          icon: <Trophy className="w-4 h-4" />,
          color: 'bg-green-500'
        };
    }
  };

  const currentModeInfo = getGameModeInfo(gameMode);

  // Auto-create room if we don't have one yet
  useEffect(() => {
    if (!room && !isLoading) {
      console.log('🏠 Auto-creating room...');
      createRoom();
    }
  }, [room, isLoading, createRoom]);

  // Show loading while creating room
  if (!room && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-2xl font-semibold mb-2">Creating room...</div>
          <div className="text-white/60">Setting up your game lobby</div>
        </div>
      </div>
    );
  }

  // Show error if room creation failed
  if (!room && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-2xl font-semibold mb-4">Failed to create room</div>
          <Button onClick={onBackToMenu} variant="outline">
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">RYTHMY</h1>
          <p className="text-white/80">Music Timeline Game</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Mode Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentModeInfo.icon}
                Game Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['classic', 'fiend', 'sprint'] as GameMode[]).map((mode) => {
                const info = getGameModeInfo(mode);
                return (
                  <div
                    key={mode}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      gameMode === mode 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleChangeGameMode(mode)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {info.icon}
                      <span className="font-medium">{info.title}</span>
                    </div>
                    <p className="text-sm text-gray-600">{info.description}</p>
                  </div>
                );
              })}

              {/* Game Mode Settings */}
              {gameMode === 'fiend' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium mb-2">
                    Number of Rounds
                  </label>
                  <select
                    value={gameModeSettings.rounds || 5}
                    onChange={(e) => handleUpdateGameModeSettings({ 
                      ...gameModeSettings, 
                      rounds: parseInt(e.target.value) 
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value={3}>3 Rounds</option>
                    <option value={5}>5 Rounds</option>
                    <option value={7}>7 Rounds</option>
                    <option value={10}>10 Rounds</option>
                  </select>
                </div>
              )}

              {gameMode === 'sprint' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium mb-2">
                    Target Cards to Win
                  </label>
                  <select
                    value={gameModeSettings.targetCards || 8}
                    onChange={(e) => handleUpdateGameModeSettings({ 
                      ...gameModeSettings, 
                      targetCards: parseInt(e.target.value) 
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value={5}>5 Cards</option>
                    <option value={8}>8 Cards</option>
                    <option value={10}>10 Cards</option>
                    <option value={12}>12 Cards</option>
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Players ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {players.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Waiting for players to join...
                  </p>
                ) : (
                  players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <PlayerCharacterDisplay player={player} size="small" showName={true} />
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Ready</Badge>
                        <button
                          onClick={() => onKickPlayer(player.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Join Instructions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Join Game</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {lobbyCode}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Room Code
                </p>
                <QRCodeGenerator value={joinUrl} size={160} />
                <p className="text-xs text-gray-500 mt-2">
                  Scan QR code or visit<br />
                  <span className="font-mono">{joinUrl}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start Game Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={handleStartGame}
            disabled={players.length === 0 || isStarting}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? 'Starting Game...' : `Start Game (${players.length} players)`}
          </Button>
          {players.length === 0 && (
            <p className="text-white/60 text-sm mt-2">
              At least 1 player must join to start the game
            </p>
            )}
          <div className="mt-4">
            <Button onClick={onBackToMenu} variant="outline" className="text-white border-white/30 hover:bg-white/10">
              Back to Menu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
