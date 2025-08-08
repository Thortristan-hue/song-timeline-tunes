import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Play, Settings, Music2, Upload } from 'lucide-react';
import { Player, GameRoom, GameMode } from '@/types/game';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { Song } from '@/types/game';
import { getCharacterById } from '@/constants/characters';

interface HostLobbyProps {
  room: GameRoom | null;
  players: Player[];
  isHost: boolean;
  onStartGame: () => Promise<void>;
  onGameModeChange: (mode: GameMode) => Promise<void>;
  onPlaylistUploaded: (songs: Song[]) => Promise<void>;
  connectionStatus: {
    isConnected: boolean;
    isReconnecting: boolean;
    lastError: string | null;
    retryCount: number;
  };
  onReconnect: () => void;
}

export function HostLobby({ 
  room, 
  players, 
  isHost, 
  onStartGame,
  onGameModeChange,
  onPlaylistUploaded,
  connectionStatus,
  onReconnect
}: HostLobbyProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>(room?.gamemode || 'classic');
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlistUrl, setPlaylistUrl] = useState<string>('');
  const [minSongsRequired, setMinSongsRequired] = useState<number>(5);
  const [isPlaylistValid, setIsPlaylistValid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (room) {
      setSelectedMode(room.gamemode);
    }
  }, [room]);

  useEffect(() => {
    if (songs.length >= minSongsRequired) {
      setIsPlaylistValid(true);
    } else {
      setIsPlaylistValid(false);
    }
  }, [songs, minSongsRequired]);

  const handleModeChange = async (mode: GameMode) => {
    setSelectedMode(mode);
    await onGameModeChange(mode);
  };

  const handleStartGame = async () => {
    await onStartGame();
  };

  const handleSongsUploaded = async (uploadedSongs: Song[]) => {
    setSongs(uploadedSongs);
    await onPlaylistUploaded(uploadedSongs);
  };

  const handleSubmit = async () => {
    console.log('Submitting playlist URL:', playlistUrl);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-purple-900 text-white">
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Host Lobby</h1>
          <p className="text-gray-400">Prepare your game</p>
        </div>
        <div className="flex items-center gap-4">
          <Clock className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-400">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-grow p-6 gap-6 overflow-auto">
        {/* Left Panel: Room Info and Players */}
        <div className="md:w-1/2 flex flex-col gap-4">
          <Card className="bg-gray-800 border border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold">Room Information</h2>
            </div>
            {room ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">Lobby Code</p>
                    <p className="font-bold text-lg">{room.lobby_code}</p>
                  </div>
                  <QRCodeGenerator value={window.location.origin + '/join/' + room.lobby_code} size={80} />
                </div>
                <div className="mt-2">
                  <p className="text-gray-400 text-sm">Game Mode</p>
                  <Badge variant="secondary">{room.gamemode}</Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Loading room info...</p>
            )}
          </Card>

          <Card className="bg-gray-800 border border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold">Players in Lobby</h2>
            </div>
            {players && players.length > 0 ? (
              <ul className="space-y-2">
                {players.map((player) => (
                  <li key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="block w-2 h-2 rounded-full"
                        style={{ backgroundColor: player.color }}
                      ></span>
                      <span>{player.name}</span>
                      <Badge className="ml-2">{player.character}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No players have joined yet.</p>
            )}
          </Card>
        </div>

        {/* Right Panel: Game Settings */}
        <div className="md:w-1/2 flex flex-col gap-4">
          <Card className="bg-gray-800 border border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold">Game Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-semibold">Game Mode</h3>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={selectedMode === 'classic' ? 'default' : 'outline'}
                    onClick={() => handleModeChange('classic')}
                  >
                    Classic
                  </Button>
                  <Button
                    variant={selectedMode === 'sprint' ? 'default' : 'outline'}
                    onClick={() => handleModeChange('sprint')}
                  >
                    Sprint
                  </Button>
                  <Button
                    variant={selectedMode === 'fiend' ? 'default' : 'outline'}
                    onClick={() => handleModeChange('fiend')}
                  >
                    Fiend
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Playlist Loader */}
          <Card className="bg-gray-800 border border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Music2 className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold">Playlist Settings</h2>
            </div>
            <PlaylistLoader 
              songs={songs}
              setSongs={setSongs}
              playlistUrl={playlistUrl}
              setPlaylistUrl={setPlaylistUrl}
              minSongsRequired={minSongsRequired}
              setMinSongsRequired={setMinSongsRequired}
              isPlaylistValid={isPlaylistValid}
              setIsPlaylistValid={setIsPlaylistValid}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              uploadProgress={uploadProgress}
              setUploadProgress={setUploadProgress}
              uploadError={uploadError}
              setUploadError={setUploadError}
              onSongsUploaded={handleSongsUploaded}
            />
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-700 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {connectionStatus.isConnected ? (
            <>
              Connected to server (Retries: {connectionStatus.retryCount})
            </>
          ) : (
            <>
              {connectionStatus.isReconnecting ? (
                <>Reconnecting... (Attempt {connectionStatus.retryCount + 1})</>
              ) : (
                <>
                  Disconnected. <Button variant="link" onClick={onReconnect}>Reconnect</Button>
                  {connectionStatus.lastError && (
                    <div className="text-red-500 mt-1">
                      Last error: {connectionStatus.lastError}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
        <div>
          <Button
            onClick={handleStartGame}
            disabled={!isPlaylistValid}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Game
          </Button>
        </div>
      </div>
    </div>
  );
}
