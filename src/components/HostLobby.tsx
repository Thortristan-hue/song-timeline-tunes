
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { Crown, Users, Play, ArrowLeft, Copy, Check, Music2 } from 'lucide-react';
import { Player, Song } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface HostLobbyProps {
  lobbyCode: string;
  players: Player[];
  onStartGame: () => Promise<void>;
  onBackToMenu: () => void;
  setCustomSongs: (songs: Song[]) => void;
  isLoading: boolean;
  createRoom: () => Promise<boolean>;
}

export function HostLobby({
  lobbyCode,
  players,
  onStartGame,
  onBackToMenu,
  setCustomSongs,
  isLoading,
  createRoom
}: HostLobbyProps) {
  const { toast } = useToast();
  const soundEffects = useSoundEffects();
  const [copied, setCopied] = useState(false);
  const [roomCreated, setRoomCreated] = useState(!!lobbyCode);

  // Debug logging for player updates
  useEffect(() => {
    console.log('🧍 HostLobby: Players updated:', players);
  }, [players]);

  useEffect(() => {
    if (!roomCreated && !isLoading) {
      handleCreateRoom();
    }
  }, [roomCreated, isLoading]);

  const handleCreateRoom = async () => {
    console.log('🏠 Creating room...');
    const success = await createRoom();
    if (success) {
      setRoomCreated(true);
      soundEffects.playGameStart();
      console.log('✅ Room created successfully');
    } else {
      console.error('❌ Failed to create room');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(lobbyCode);
      setCopied(true);
      soundEffects.playButtonClick();
      toast({
        title: "Copied!",
        description: "Lobby code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the code manually",
        variant: "destructive",
      });
    }
  };

  // Play sound when players join
  useEffect(() => {
    if (players.length > 0) {
      soundEffects.playPlayerJoin();
    }
  }, [players.length, soundEffects]);

  if (!roomCreated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🎵</div>
          <div className="text-2xl font-bold mb-2">Creating Room...</div>
          <div className="text-slate-300">Setting up your game lobby</div>
        </div>
      </div>
    );
  }

  const gameUrl = `${window.location.origin}?join=${lobbyCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-purple-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-8">
          <Button
            onClick={() => {
              soundEffects.playButtonClick();
              onBackToMenu();
            }}
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-3xl font-black text-white">Host Lobby</h1>
              <p className="text-slate-300">Setting up Timeline Tunes</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl w-full">
            
            {/* Left Column - Room Info & Controls */}
            <div className="space-y-6">
              
              {/* Lobby Code Card */}
              <Card className="bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-8">
                <div className="text-center space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Room Code</h2>
                    <p className="text-slate-300 mb-6">Share this code with players to join</p>
                  </div>
                  
                  <div className="relative">
                    <Badge 
                      variant="outline" 
                      className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-purple-400 text-4xl px-8 py-4 font-mono tracking-wider"
                    >
                      {lobbyCode}
                    </Badge>
                    
                    <Button
                      onClick={copyToClipboard}
                      size="sm"
                      className="absolute -top-2 -right-2 bg-blue-600 hover:bg-blue-700 rounded-full w-8 h-8 p-0"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <QRCodeGenerator 
                      value={gameUrl}
                      size={140}
                      className="scale-90"
                    />
                  </div>
                </div>
              </Card>

              {/* Playlist Selection */}
              <Card className="bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Music2 className="h-6 w-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Music Playlist</h3>
                </div>
                
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    <div>
                      <div className="text-white font-semibold">Default Playlist Active</div>
                      <div className="text-green-200 text-sm">Curated collection of popular songs</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 opacity-50">
                  <PlaylistLoader
                    onPlaylistLoaded={(success, count) => {
                      if (success) {
                        console.log(`Playlist loaded with ${count} songs`);
                      }
                    }}
                    setCustomSongs={setCustomSongs}
                    isDarkMode={true}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Custom playlists coming soon
                </p>
              </Card>

              {/* Start Game Button */}
              <Button
                onClick={() => {
                  console.log('🎮 Starting game with players:', players);
                  soundEffects.playGameStart();
                  onStartGame();
                }}
                disabled={players.length < 2}
                size="lg"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg border-0 h-16 text-xl font-bold"
              >
                <Play className="h-6 w-6 mr-3" />
                {players.length < 2 ? 'Need 2+ Players to Start' : `Start Game (${players.length} players)`}
              </Button>
            </div>

            {/* Right Column - Players */}
            <div>
              <Card className="bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-6 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-6 w-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">
                    Players ({players.length})
                  </h3>
                  {players.length > 0 && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {players.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4 opacity-50">👥</div>
                      <p className="text-slate-400 text-lg">Waiting for players to join...</p>
                      <p className="text-slate-500 text-sm mt-2">
                        Share the room code above with your friends
                      </p>
                    </div>
                  ) : (
                    players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600/30 transition-all hover:bg-slate-700/70 animate-fade-in"
                      >
                        <div className="text-2xl font-black text-slate-400">
                          #{index + 1}
                        </div>
                        
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: player.color }}
                        />
                        
                        <div className="flex-1">
                          <div className="text-white font-bold text-lg">
                            {player.name}
                          </div>
                          <div className="text-slate-300 text-sm">
                            Ready to play • {player.timeline?.length || 0} cards
                          </div>
                        </div>
                        
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
