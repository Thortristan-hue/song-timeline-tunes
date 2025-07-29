
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { Player, GameMode } from '@/types/game';
import { PlayerCharacterDisplay } from '@/components/PlayerCharacterDisplay';
import { Music, Users, Trophy, Clock, Target } from 'lucide-react';

interface HostLobbyProps {
  roomCode: string;
  players: Player[];
  onStartGame: () => void;
  gameMode: GameMode;
  onChangeGameMode: (mode: GameMode) => void;
  gameModeSettings: any;
  onUpdateGameModeSettings: (settings: any) => void;
}

export function HostLobby({ 
  roomCode, 
  players, 
  onStartGame, 
  gameMode, 
  onChangeGameMode,
  gameModeSettings,
  onUpdateGameModeSettings 
}: HostLobbyProps) {
  const [isStarting, setIsStarting] = useState(false);
  const joinUrl = `${window.location.origin}?join=${roomCode}`;
  
  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      await onStartGame();
    } finally {
      setIsStarting(false);
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
                    onClick={() => onChangeGameMode(mode)}
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
                    onChange={(e) => onUpdateGameModeSettings({ 
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
                    onChange={(e) => onUpdateGameModeSettings({ 
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
                      <PlayerCharacterDisplay player={player} size="medium" />
                      <Badge variant="secondary">Ready</Badge>
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
                  {roomCode}
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
        </div>
      </div>
    </div>
  );
}
