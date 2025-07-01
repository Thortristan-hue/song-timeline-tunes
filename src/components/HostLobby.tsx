
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
        description: "Room code copied to clipboard",
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden flex items-center justify-center">
        {/* Animated flowing background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse" 
               style={{
                 background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
                 animation: 'flow 8s ease-in-out infinite'
               }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
        
        <div className="text-center text-white relative z-10">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/20 animate-pulse">
            <Music2 className="h-10 w-10 text-white animate-bounce" />
          </div>
          <div className="text-3xl font-semibold mb-3 animate-fade-in">Setting up your room</div>
          <div className="text-white/70 animate-fade-in" style={{animationDelay: '0.2s'}}>This'll just take a second...</div>
        </div>
        
        <style jsx>{`
          @keyframes flow {
            0%, 100% { 
              background: linear-gradient(45deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3));
              transform: scale(1) rotate(0deg);
            }
            25% { 
              background: linear-gradient(135deg, rgba(147, 51, 234, 0.4), rgba(236, 72, 153, 0.3), rgba(59, 130, 246, 0.2));
              transform: scale(1.05) rotate(1deg);
            }
            50% { 
              background: linear-gradient(225deg, rgba(236, 72, 153, 0.4), rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.2));
              transform: scale(1.02) rotate(-0.5deg);
            }
            75% { 
              background: linear-gradient(315deg, rgba(59, 130, 246, 0.3), rgba(236, 72, 153, 0.4), rgba(147, 51, 234, 0.2));
              transform: scale(1.03) rotate(0.5deg);
            }
          }
          
          @keyframes fade-in {
            from { 
              opacity: 0; 
              transform: translateY(20px);
            }
            to { 
              opacity: 1; 
              transform: translateY(0);
            }
          }
          
          .animate-fade-in {
            animation: fade-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
        `}</style>
      </div>
    );
  }

  const gameUrl = `${window.location.origin}?join=${lobbyCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated flowing background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full"
             style={{
               background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))',
               animation: 'flow 12s ease-in-out infinite'
             }} />
        <div className="absolute top-20 right-20 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 left-16 w-80 h-80 bg-white/[0.02] rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}} />
      </div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 sm:p-8 animate-fade-in">
          <Button
            onClick={() => {
              soundEffects.playButtonClick();
              onBackToMenu();
            }}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Room Setup</h1>
            <p className="text-white/60 text-sm">Get ready to play with friends</p>
          </div>
          
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
            
            {/* Left Column - Room Info & Controls */}
            <div className="space-y-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
              
              {/* Room Code Card */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-2xl hover:bg-white/15 transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl">
                <div className="text-center space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">Room Code</h2>
                    <p className="text-white/60 text-sm">Your friends need this to join</p>
                  </div>
                  
                  <div className="relative group">
                    <div className="bg-white text-black text-3xl sm:text-4xl font-bold font-mono px-6 py-4 rounded-2xl tracking-widest transition-all duration-300 group-hover:scale-105 shadow-lg">
                      {lobbyCode}
                    </div>
                    
                    <Button
                      onClick={copyToClipboard}
                      size="sm"
                      className="absolute -top-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 p-0 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {/* QR Code */}
                  <div className="flex justify-center pt-4">
                    <div className="p-4 bg-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-105">
                      <QRCodeGenerator 
                        value={gameUrl}
                        size={120}
                      />
                    </div>
                  </div>
                  <p className="text-white/50 text-xs">Or scan to join instantly</p>
                </div>
              </Card>

              {/* Playlist Section */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl hover:bg-white/15 transition-all duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <Music2 className="h-5 w-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">Music</h3>
                </div>
                
                <div className="bg-green-500/20 border border-green-400/30 rounded-2xl p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <div>
                      <div className="text-white font-medium">Default playlist ready</div>
                      <div className="text-green-300/80 text-sm">Mix of popular songs from different eras</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 opacity-30 pointer-events-none">
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
                <p className="text-xs text-white/50 mt-2">
                  Custom playlists coming in a future update
                </p>
              </Card>

              {/* Start Game Button */}
              <Button
                onClick={() => {
                  console.log('🎮 Starting game with players:', players);
                  soundEffects.playGameStart();
                  onStartGame();
                }}
                disabled={players.length < 1}
                className="w-full bg-white text-black hover:bg-white/90 h-16 text-lg font-semibold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                <Play className="h-5 w-5 mr-3" />
                {players.length < 1 ? 'Waiting for players to join...' : `Start game with ${players.length} ${players.length === 1 ? 'player' : 'players'}`}
              </Button>
            </div>

            {/* Right Column - Players */}
            <div className="animate-fade-in" style={{animationDelay: '0.4s'}}>
              <Card className="bg-white/10 border-white/20 backdrop-blur-2xl p-6 h-full rounded-3xl shadow-2xl hover:bg-white/15 transition-all duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-5 w-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">
                    Players joined ({players.length})
                  </h3>
                  {players.length > 0 && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {players.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Users className="h-8 w-8 text-white/60" />
                      </div>
                      <p className="text-white/70 text-lg mb-2">Waiting for friends to join</p>
                      <p className="text-white/50 text-sm">
                        Share the room code above
                      </p>
                    </div>
                  ) : (
                    players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl transition-all duration-300 hover:bg-white/20 backdrop-blur-xl transform hover:scale-[1.02] animate-fade-in"
                        style={{animationDelay: `${0.1 * index}s`}}
                      >
                        <div className="text-lg font-semibold text-white/60">
                          {index + 1}
                        </div>
                        
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: player.color }}
                        />
                        
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            {player.name}
                          </div>
                          <div className="text-white/60 text-sm">
                            Ready to play
                          </div>
                        </div>
                        
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="p-6 text-center animate-fade-in" style={{animationDelay: '0.6s'}}>
          <p className="text-white/40 text-xs max-w-md mx-auto">
            Independent project for friends • Not affiliated with any music service
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes flow {
          0%, 100% { 
            background: linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2));
            transform: scale(1) rotate(0deg);
          }
          25% { 
            background: linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.2), rgba(59, 130, 246, 0.15));
            transform: scale(1.02) rotate(0.5deg);
          }
          50% { 
            background: linear-gradient(225deg, rgba(236, 72, 153, 0.3), rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.15));
            transform: scale(1.01) rotate(-0.3deg);
          }
          75% { 
            background: linear-gradient(315deg, rgba(59, 130, 246, 0.25), rgba(236, 72, 153, 0.3), rgba(147, 51, 234, 0.15));
            transform: scale(1.015) rotate(0.2deg);
          }
        }
        
        @keyframes fade-in {
          from { 
            opacity: 0; 
            transform: translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
