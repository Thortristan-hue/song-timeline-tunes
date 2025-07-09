import React, { useEffect, useState } from 'react';
import { Crown, Users, Play, Settings, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGameRoom } from '@/hooks/useGameRoom';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { Song } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';

interface HostLobbyProps {
  onGameStart: () => void;
}

export function HostLobby({ onGameStart }: HostLobbyProps) {
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [qrCodeValue, setQrCodeValue] = useState('');

  const {
    room,
    players,
    isLoading,
    updateRoomSongs,
    startGame,
    assignStartingCards,
    removePlayer
  } = useGameRoom();

  useEffect(() => {
    if (room) {
      setQrCodeValue(`${window.location.origin}/join/${room.lobby_code}`);
    }
  }, [room]);

  const handlePlaylistLoad = async (success: boolean, count?: number) => {
    if (success && count) {
      toast({
        title: "Playlist Loaded",
        description: `${count} songs loaded from the playlist.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to load playlist. Please check and try again.",
        variant: "destructive",
      });
    }
  };

  const handleGameStart = async () => {
    if (availableSongs.length < 3) {
      toast({
        title: "Error",
        description: "You need at least 3 songs to start the game.",
        variant: "destructive",
      });
      return;
    }

    const success = await startGame(availableSongs);
    if (success) {
      await assignStartingCards(availableSongs);
      toast({
        title: "Game Started",
        description: "The game has started!",
      });
      onGameStart();
    } else {
      toast({
        title: "Error",
        description: "Failed to start the game. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    const success = await removePlayer(playerId);
    if (success) {
      toast({
        title: "Player Removed",
        description: "Player has been successfully removed from the lobby.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove player. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading lobby...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>
      
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Host Lobby</h1>
              <p className="text-white/60">Room Code: {room.lobby_code}</p>
            </div>
          </div>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Game Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <PlaylistLoader
                  onPlaylistLoaded={(success, count) => {
                    handlePlaylistLoad(success, count);
                    if (success) {
                      updateRoomSongs(availableSongs);
                    }
                  }}
                  setCustomSongs={(songs) => {
                    setAvailableSongs(songs);
                  }}
                  isDarkMode={true}
                  minSongsRequired={3}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <div className="text-center">
              <QrCode className="w-8 h-8 text-blue-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Join the Game</h2>
              <p className="text-white/60 mb-6">Scan this QR code or use room code: <span className="font-mono text-white">{room.lobby_code}</span></p>
              
              {qrCodeValue && (
                <div className="bg-white p-4 rounded-xl inline-block">
                  <QRCodeGenerator value={qrCodeValue} size={200} />
                </div>
              )}
            </div>
          </div>

          {/* Players Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Players ({players.length})</h2>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {players.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-white/40 mb-2">No players yet</div>
                  <div className="text-sm text-white/30">Share the room code to get started!</div>
                </div>
              ) : (
                players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="text-white font-medium">{player.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePlayer(player.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      ✕
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="mt-8 text-center">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 inline-block">
            <div className="mb-6">
              <div className="text-white/60 mb-2">Songs loaded: {availableSongs.length}</div>
              <div className="text-white/60 mb-4">Players: {players.length}</div>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={() => setIsSettingsOpen(true)}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 mr-4"
              >
                Load Playlist
              </Button>
              
              <Button
                onClick={handleGameStart}
                disabled={availableSongs.length < 3 || players.length === 0}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            </div>
            
            {(availableSongs.length < 3 || players.length === 0) && (
              <div className="text-sm text-white/40 mt-4">
                {availableSongs.length < 3 && "Load at least 3 songs to start. "}
                {players.length === 0 && "Need at least 1 player to start."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
