import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Music, Users, Play, ArrowLeft, Upload, Copy, CheckCircle } from 'lucide-react';
import { Player, Song } from '@/types/game';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { useToast } from '@/components/ui/use-toast';

interface HostLobbyProps {
  lobbyCode: string;
  players: Player[];
  onStartGame: () => void;
  onBackToMenu: () => void;
  setCustomSongs: (songs: Song[]) => void;
  isLoading: boolean;
  createRoom: (hostName: string) => Promise<boolean>;
  currentHostName: string;
}

export function HostLobby({ 
  lobbyCode, 
  players, 
  onStartGame, 
  onBackToMenu, 
  setCustomSongs, 
  isLoading,
  createRoom,
  currentHostName
}: HostLobbyProps) {
  const { toast } = useToast();
  const [hostName, setHostName] = useState(currentHostName);
  const [roomCreated, setRoomCreated] = useState(!!lobbyCode);
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = async () => {
    if (!hostName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to create a room.",
        variant: "destructive",
      });
      return;
    }

    const success = await createRoom(hostName.trim());
    if (success) {
      setRoomCreated(true);
      toast({
        title: "Room created!",
        description: "Share the room code with your friends.",
      });
    }
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(lobbyCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the room code manually",
        variant: "destructive",
      });
    }
  };

  if (!roomCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 via-indigo-900 to-violet-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-black/20 border-purple-400/30 backdrop-blur-sm">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl rounded-full animate-pulse"></div>
              <Users className="h-16 w-16 text-purple-400 mx-auto relative z-10" />
            </div>
            
            <h2 className="text-3xl font-bold text-white">Create Your Room</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="hostName" className="text-purple-200">Your Name</Label>
                <Input
                  id="hostName"
                  type="text"
                  placeholder="Enter your name"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="bg-white/10 border-purple-400/30 text-white placeholder:text-white/50"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                />
              </div>
              
              <Button 
                onClick={handleCreateRoom}
                disabled={isLoading || !hostName.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl text-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                {isLoading ? "Creating..." : "Create Room"}
              </Button>
              
              <Button 
                onClick={onBackToMenu}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 via-indigo-900 to-violet-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            <Music className="h-6 w-6 text-purple-300 transform rotate-12" />
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Host Lobby
          </h1>
          
          {/* Room Code Display */}
          <Card className="inline-block bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-400/30 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-green-300/80 text-sm font-medium mb-1">Room Code</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-white font-mono tracking-wider">
                    {lobbyCode}
                  </span>
                  <Button
                    onClick={copyRoomCode}
                    size="sm"
                    variant="outline"
                    className="border-green-400/30 text-green-300 hover:bg-green-500/20"
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Players Section */}
        <Card className="bg-black/20 border-purple-400/30 p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-400" />
              Players ({players.length})
            </h2>
            <Badge 
              variant="outline" 
              className={`${
                players.length >= 2 ? 'bg-green-500/20 text-green-300 border-green-400' : 'bg-yellow-500/20 text-yellow-300 border-yellow-400'
              }`}
            >
              {players.length >= 2 ? 'Ready to Start' : 'Need More Players'}
            </Badge>
          </div>
          
          {players.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-purple-300/50 mx-auto mb-4" />
              <p className="text-purple-300/70 text-lg">Waiting for players to join...</p>
              <p className="text-purple-400/50 text-sm mt-2">Share the room code above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player, index) => (
                <Card 
                  key={player.id}
                  className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{player.name}</p>
                      <p className="text-sm text-purple-300/70">
                        Player {index + 1}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Playlist Section */}
        <Card className="bg-black/20 border-purple-400/30 p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Music className="h-6 w-6 text-purple-400" />
            Music Playlist
          </h2>
          
          <PlaylistLoader 
            onPlaylistLoaded={(success: boolean) => {
              // Handle playlist load success/failure if needed
            }}
            setCustomSongs={setCustomSongs}
            isDarkMode={true}
            className="mb-6"
          />
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={onStartGame}
            disabled={players.length < 1 || isLoading}
            className="px-12 py-6 text-xl rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105"
          >
            <Play className="h-6 w-6 mr-3" />
            Start Game
          </Button>
          
          <Button 
            onClick={onBackToMenu}
            variant="outline"
            className="px-12 py-6 text-xl rounded-2xl bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5 mr-3" />
            Back to Menu
          </Button>
        </div>

        {/* Instructions */}
        <Card className="bg-black/10 border-white/10 p-6 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-3">How to Play</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-200/80">
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                <span>Players join using the room code</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                <span>Listen to song previews and place them chronologically</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                <span>First to 10 correct placements wins!</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
