
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Play, Settings, Users, ArrowLeft, FastForward } from 'lucide-react';
import { Player } from '@/types/game';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { useToast } from '@/components/ui/use-toast';

interface HostLobbyProps {
  lobbyCode: string;
  players: Player[];
  onStartGame: () => void;
  onBackToMenu: () => void;
  setCustomSongs: (songs: any[]) => void;
  createRoom: (hostName: string) => Promise<string | null>;
  isLoading: boolean;
}

export function HostLobby({ 
  lobbyCode, 
  players, 
  onStartGame, 
  onBackToMenu,
  setCustomSongs,
  createRoom,
  isLoading
}: HostLobbyProps) {
  const { toast } = useToast();
  const [showPlaylistLoader, setShowPlaylistLoader] = useState(false);
  const [playlistLoaded, setPlaylistLoaded] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(!lobbyCode);
  const [hostName, setHostName] = useState('');

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    toast({
      title: "Lobby code copied!",
      description: "Share this code with players to join your game.",
    });
  };

  const handlePlaylistLoaded = (success: boolean) => {
    setPlaylistLoaded(success);
    setShowPlaylistLoader(false);
    if (success) {
      toast({
        title: "Playlist loaded!",
        description: "You can now start the game.",
      });
    }
  };

  const handleCreateRoom = async () => {
    if (!hostName.trim()) return;
    
    const code = await createRoom(hostName.trim());
    if (code) {
      setShowNamePrompt(false);
    }
  };

  const handleSkipWaiting = () => {
    // Load default songs for testing
    const defaultSongs = [
      {
        id: '1',
        deezer_title: 'Bohemian Rhapsody',
        deezer_artist: 'Queen',
        deezer_album: 'A Night at the Opera',
        release_year: '1975',
        genre: 'Rock',
        cardColor: '#FF6B6B'
      },
      {
        id: '2',
        deezer_title: 'Billie Jean',
        deezer_artist: 'Michael Jackson',
        deezer_album: 'Thriller',
        release_year: '1982',
        genre: 'Pop',
        cardColor: '#4ECDC4'
      },
      {
        id: '3',
        deezer_title: 'Smells Like Teen Spirit',
        deezer_artist: 'Nirvana',
        deezer_album: 'Nevermind',
        release_year: '1991',
        genre: 'Grunge',
        cardColor: '#45B7D1'
      }
    ];
    
    setCustomSongs(defaultSongs);
    setPlaylistLoaded(true);
    
    toast({
      title: "Test mode activated!",
      description: "Default songs loaded. You can now start the game for testing.",
    });
  };

  // Show name prompt if no room exists yet
  if (showNamePrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 border-white/20 p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Create Game Room</h1>
            <p className="text-purple-200/80">Enter your name to create a lobby</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="hostName" className="block text-white font-medium mb-2">
                Your Name
              </label>
              <Input
                id="hostName"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={onBackToMenu}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateRoom}
                disabled={!hostName.trim() || isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          
          <Card className="bg-white/10 border-white/20 p-4">
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">Lobby Code:</span>
              <Badge variant="outline" className="text-2xl font-bold px-4 py-2 bg-purple-500 text-white border-purple-400">
                {lobbyCode}
              </Badge>
              <Button
                onClick={copyLobbyCode}
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Players List */}
          <Card className="bg-white/10 border-white/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Players ({players.length})</h2>
            </div>
            
            <div className="space-y-3">
              {players.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-purple-200/60">
                    Waiting for players to join...
                  </p>
                  <Button
                    onClick={handleSkipWaiting}
                    variant="outline"
                    className="bg-orange-500/20 border-orange-400 text-orange-300 hover:bg-orange-500/30"
                  >
                    <FastForward className="h-4 w-4 mr-2" />
                    Skip Waiting (Test Mode)
                  </Button>
                </div>
              ) : (
                <>
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="text-white font-medium">{player.name}</span>
                      <Badge variant="outline" className="ml-auto bg-green-500/20 text-green-300 border-green-400">
                        Ready
                      </Badge>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button
                      onClick={handleSkipWaiting}
                      variant="outline"
                      size="sm"
                      className="w-full bg-orange-500/20 border-orange-400 text-orange-300 hover:bg-orange-500/30"
                    >
                      <FastForward className="h-4 w-4 mr-2" />
                      Load Test Songs
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Game Settings */}
          <Card className="bg-white/10 border-white/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Game Settings</h2>
            </div>

            {showPlaylistLoader ? (
              <PlaylistLoader
                onPlaylistLoaded={handlePlaylistLoaded}
                setCustomSongs={setCustomSongs}
                isDarkMode={true}
              />
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="text-white font-medium mb-2">Playlist</h3>
                  {playlistLoaded ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-400">
                        ✓ Playlist Loaded
                      </Badge>
                      <Button
                        onClick={() => setShowPlaylistLoader(true)}
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Change Playlist
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowPlaylistLoader(true)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Load Deezer Playlist
                    </Button>
                  )}
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="text-white font-medium mb-2">Game Rules</h3>
                  <ul className="text-purple-200/80 text-sm space-y-1">
                    <li>• First player to place 10 cards wins</li>
                    <li>• Place cards in chronological order</li>
                    <li>• Take turns placing one card at a time</li>
                  </ul>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Start Game Button */}
        <div className="text-center">
          <Button
            onClick={onStartGame}
            disabled={!playlistLoaded}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-5 w-5 mr-2" />
            Start Game ({players.length} players)
          </Button>
        </div>
      </div>
    </div>
  );
}
