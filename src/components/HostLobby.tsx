
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Play, Settings, Users, ArrowLeft, FastForward, Music, Crown, Clock } from 'lucide-react';
import { Player } from '@/types/game';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { useToast } from '@/components/ui/use-toast';

interface HostLobbyProps {
  lobbyCode: string;
  players: Player[];
  onStartGame: () => void;
  onBackToMenu: () => void;
  setCustomSongs: (songs: any[]) => void;
  isLoading: boolean;
}

export function HostLobby({ 
  lobbyCode, 
  players, 
  onStartGame, 
  onBackToMenu,
  setCustomSongs,
  isLoading
}: HostLobbyProps) {
  const { toast } = useToast();
  const [showPlaylistLoader, setShowPlaylistLoader] = useState(false);
  const [playlistLoaded, setPlaylistLoaded] = useState(false);

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    toast({
      title: "Room code copied! 📋",
      description: "Share this code with your friends to join the game.",
    });
  };

  const handlePlaylistLoaded = (success: boolean) => {
    setPlaylistLoaded(success);
    setShowPlaylistLoader(false);
    if (success) {
      toast({
        title: "🎵 Playlist loaded!",
        description: "Ready to start the musical timeline challenge!",
      });
    }
  };

  const handleSkipWaiting = () => {
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
      title: "🧪 Test mode activated!",
      description: "Default songs loaded for testing purposes.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {[...Array(15)].map((_, i) => (
          <Music 
            key={i}
            className="absolute text-purple-300 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${20 + Math.random() * 30}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          
          {/* Room Code Display */}
          <Card className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-400/40 p-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-center sm:text-left">
                <p className="text-purple-200 text-sm font-medium">Room Code</p>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-3xl font-bold px-6 py-3 bg-purple-500 text-white border-purple-400 tracking-wider font-mono">
                    {lobbyCode}
                  </Badge>
                  <Button
                    onClick={copyLobbyCode}
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Players Section */}
          <Card className="bg-white/10 border-white/20 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">
                Players ({players.length})
              </h2>
              {players.length >= 2 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-400">
                  Ready to start!
                </Badge>
              )}
            </div>
            
            <div className="space-y-4">
              {players.length === 0 ? (
                <div className="text-center py-12 space-y-6">
                  <div className="animate-pulse">
                    <Clock className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xl text-white font-medium">
                      Waiting for players to join...
                    </p>
                    <p className="text-purple-200/60">
                      Share the room code above with your friends
                    </p>
                  </div>
                  <Button
                    onClick={handleSkipWaiting}
                    variant="outline"
                    className="bg-orange-500/20 border-orange-400 text-orange-300 hover:bg-orange-500/30"
                  >
                    <FastForward className="h-4 w-4 mr-2" />
                    Load Test Songs
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {players.map((player, index) => (
                      <Card
                        key={player.id}
                        className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg"
                              style={{ backgroundColor: player.color }}
                            >
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                            {index === 0 && (
                              <Crown className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-lg">{player.name}</p>
                            <p className="text-purple-200/60 text-sm">
                              {index === 0 ? 'Host' : 'Player'}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="bg-green-500/20 text-green-300 border-green-400"
                          >
                            Connected
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      onClick={handleSkipWaiting}
                      variant="outline"
                      size="sm"
                      className="w-full bg-orange-500/20 border-orange-400 text-orange-300 hover:bg-orange-500/30"
                    >
                      <FastForward className="h-4 w-4 mr-2" />
                      Load Test Songs (Demo)
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Game Settings */}
          <Card className="bg-white/10 border-white/20 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Game Settings</h2>
            </div>

            {showPlaylistLoader ? (
              <PlaylistLoader
                onPlaylistLoaded={handlePlaylistLoaded}
                setCustomSongs={setCustomSongs}
                isDarkMode={true}
              />
            ) : (
              <div className="space-y-6">
                {/* Playlist Section */}
                <Card className="bg-white/5 border-white/10 p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Music Playlist
                  </h3>
                  {playlistLoaded ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-500/20 text-green-300 border-green-400">
                          ✓ Playlist Ready
                        </Badge>
                      </div>
                      <Button
                        onClick={() => setShowPlaylistLoader(true)}
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Change Songs
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowPlaylistLoader(true)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Music className="h-4 w-4 mr-2" />
                      Load Deezer Playlist
                    </Button>
                  )}
                </Card>

                {/* Game Rules */}
                <Card className="bg-white/5 border-white/10 p-4">
                  <h3 className="text-white font-semibold mb-3">Game Rules</h3>
                  <ul className="text-purple-200/80 space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      First player to place 10 songs correctly wins
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Place songs in chronological order by release year
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Take turns placing one song at a time
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Listen to 30-second previews to help guess
                    </li>
                  </ul>
                </Card>
              </div>
            )}
          </Card>
        </div>

        {/* Start Game Button */}
        <div className="text-center">
          <Button
            onClick={onStartGame}
            disabled={!playlistLoaded || players.length < 1}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-6 px-12 rounded-2xl text-xl shadow-2xl hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          >
            <Play className="h-6 w-6 mr-3" />
            Start Timeline Challenge ({players.length} players)
          </Button>
          {!playlistLoaded && (
            <p className="text-purple-300/60 text-sm mt-3">
              Load a playlist to enable the start button
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
