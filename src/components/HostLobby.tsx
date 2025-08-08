
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Users, Music2, ChevronRight } from 'lucide-react';
import { Song, Player, GameRoom } from '@/types/game';
import { PlaylistLoader } from './PlaylistLoader';
import { QRCodeGenerator } from './QRCodeGenerator';

interface HostLobbyProps {
  room: GameRoom;
  players: Player[];
  customSongs: Song[];
  onStartGame: () => void;
  onSongsLoaded: (songs: Song[]) => void;
}

export function HostLobby({ 
  room, 
  players,
  customSongs,
  onStartGame,
  onSongsLoaded
}: HostLobbyProps) {
  const [songs, setSongs] = useState<Song[]>(customSongs || []);
  const [isStartingGame, setIsStartingGame] = useState(false);

  // Enhanced debugging for HostLobby
  useEffect(() => {
    console.log('[HostLobby] State debug:', {
      roomId: room?.id,
      lobbyCode: room?.lobby_code,
      playersCount: players?.length || 0,
      songsCount: songs?.length || 0,
      customSongsCount: customSongs?.length || 0
    });
  }, [room, players, songs, customSongs]);

  // Sync songs when customSongs prop changes
  useEffect(() => {
    if (customSongs && customSongs.length > 0) {
      setSongs(customSongs);
    }
  }, [customSongs]);

  const minPlayersRequired = 2;
  const minSongsRequired = 20;
  const canStartGame = players.length >= minPlayersRequired && songs.length >= minSongsRequired;

  const handleStartGame = async () => {
    if (!canStartGame || isStartingGame) return;
    
    setIsStartingGame(true);
    console.log('[HostLobby] Starting game...');
    await onStartGame();
    setIsStartingGame(false);
  };

  const handleSongsLoaded = (loadedSongs: Song[]) => {
    console.log('[HostLobby] Songs loaded:', loadedSongs.length);
    setSongs(loadedSongs);
    onSongsLoaded(loadedSongs);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">TimeLiner Host</h1>
          <p className="text-white/70">Room Code: <span className="font-mono text-xl">{room?.lobby_code}</span></p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Game Setup */}
          <div className="space-y-6">
            {/* Players Section */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({players.length})
                  <Badge variant="outline" className="ml-auto border-white/20 text-white">
                    Min: {minPlayersRequired}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.length === 0 ? (
                    <p className="text-white/60 text-center py-4">
                      Waiting for players to join...
                    </p>
                  ) : (
                    players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: player.color }}
                          />
                          <span className="text-white font-medium">{player.name}</span>
                        </div>
                        <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                          Player {index + 1}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Music Section */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Music2 className="h-5 w-5" />
                  Playlist ({songs.length} songs)
                  <Badge variant="outline" className="ml-auto border-white/20 text-white">
                    Min: {minSongsRequired}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlaylistLoader
                  onSongsLoaded={handleSongsLoaded}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - QR Code & Controls */}
          <div className="space-y-6">
            {/* QR Code */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">Join Game</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <QRCodeGenerator value={room?.lobby_code || ''} />
                <p className="text-white/70 text-center">
                  Players can scan this QR code or visit the website and enter code:
                </p>
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <span className="text-white font-mono text-xl">{room?.lobby_code}</span>
                </div>
              </CardContent>
            </Card>

            {/* Start Game Button */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="pt-6">
                <Button
                  onClick={handleStartGame}
                  disabled={!canStartGame || isStartingGame}
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {isStartingGame ? 'Starting Game...' : 'Start Game'}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                
                {!canStartGame && (
                  <div className="mt-4 space-y-2">
                    {players.length < minPlayersRequired && (
                      <p className="text-yellow-400 text-sm text-center">
                        Need {minPlayersRequired - players.length} more players
                      </p>
                    )}
                    {songs.length < minSongsRequired && (
                      <p className="text-yellow-400 text-sm text-center">
                        Need {minSongsRequired - songs.length} more songs
                      </p>
                    )}
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
