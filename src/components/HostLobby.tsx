
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Music, Gamepad2, Play } from 'lucide-react';
import { Song, Player, GameRoom } from '@/types/game';
import { PlaylistLoader } from './PlaylistLoader';
import { QRCodeGenerator } from './QRCodeGenerator';
import { GAME_CHARACTERS, Character } from '@/constants/characters';

interface HostLobbyProps {
  room: GameRoom;
  players: Player[];
  customSongs: Song[];
  onStartGame: () => Promise<void>;
  onSongsLoaded: (songs: Song[]) => void;
}

export function HostLobby({ 
  room, 
  players, 
  customSongs, 
  onStartGame,
  onSongsLoaded 
}: HostLobbyProps) {
  const [isStarting, setIsStarting] = useState(false);

  const handlePlaylistLoad = (songs: Song[]) => {
    onSongsLoaded(songs);
    console.log(`[HostLobby] Playlist loaded successfully with ${songs.length} songs`);
  };

  const handlePlaylistError = (message: string) => {
    console.error('[HostLobby] Playlist error:', message);
  };

  const handleStartClick = async () => {
    setIsStarting(true);
    try {
      await onStartGame();
    } catch (error) {
      console.error('[HostLobby] Error starting game:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const canStartGame = players.length >= 1 && customSongs.length >= 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Host Lobby</h1>
          <div className="flex items-center justify-center gap-2 text-purple-200">
            <Gamepad2 className="h-5 w-5" />
            <span>Room Code: </span>
            <Badge variant="secondary" className="text-lg px-3 py-1 font-mono">
              {room.lobby_code}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Players */}
          <div className="space-y-6">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({players.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player) => {
                    const character = GAME_CHARACTERS.find((c: Character) => c.id === player.character);
                    return (
                      <div key={player.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        {character && (
                          <img 
                            src={character.image} 
                            alt={character.name}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="text-white font-medium">{player.name}</div>
                          <div className="text-purple-200 text-sm">
                            {character?.name || 'Default Character'}
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="border-purple-400 text-purple-200"
                        >
                          Ready
                        </Badge>
                      </div>
                    );
                  })}
                  
                  {players.length === 0 && (
                    <div className="text-center py-8 text-purple-200">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Waiting for players to join...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">Join Game</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <QRCodeGenerator value={room.lobby_code} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Music & Controls */}
          <div className="space-y-6">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Music Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlaylistLoader
                  onPlaylistLoad={handlePlaylistLoad}
                  onError={handlePlaylistError}
                  currentSongs={customSongs}
                />
              </CardContent>
            </Card>

            {/* Game Status */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Game Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-purple-200">
                  <span>Players:</span>
                  <Badge variant={players.length >= 1 ? "default" : "destructive"}>
                    {players.length} / 8
                  </Badge>
                </div>
                <div className="flex justify-between text-purple-200">
                  <span>Songs:</span>
                  <Badge variant={customSongs.length >= 10 ? "default" : "destructive"}>
                    {customSongs.length} loaded
                  </Badge>
                </div>
                
                <Button 
                  onClick={handleStartClick}
                  disabled={!canStartGame || isStarting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {isStarting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting Game...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Game
                    </>
                  )}
                </Button>
                
                {!canStartGame && (
                  <div className="text-yellow-300 text-sm text-center">
                    {players.length < 1 && "Need at least 1 player to start. "}
                    {customSongs.length < 10 && "Need at least 10 songs loaded."}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
