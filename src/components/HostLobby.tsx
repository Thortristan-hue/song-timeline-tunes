
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Play, Settings, Users, ArrowLeft } from 'lucide-react';
import { Player } from '@/types/game';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { useToast } from '@/components/ui/use-toast';

interface HostLobbyProps {
  lobbyCode: string;
  players: Player[];
  onStartGame: () => void;
  onBackToMenu: () => void;
  setCustomSongs: (songs: any[]) => void;
}

export function HostLobby({ 
  lobbyCode, 
  players, 
  onStartGame, 
  onBackToMenu,
  setCustomSongs 
}: HostLobbyProps) {
  const { toast } = useToast();
  const [showPlaylistLoader, setShowPlaylistLoader] = useState(false);
  const [playlistLoaded, setPlaylistLoaded] = useState(false);

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
                <p className="text-purple-200/60 text-center py-8">
                  Waiting for players to join...
                </p>
              ) : (
                players.map((player) => (
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
                ))
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
            disabled={players.length === 0 || !playlistLoaded}
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
