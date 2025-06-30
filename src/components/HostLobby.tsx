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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Music2 className="h-8 w-8 text-black" />
          </div>
          <div className="text-2xl font-semibold mb-2">Setting up your room</div>
          <div className="text-gray-400">This'll just take a second...</div>
        </div>
      </div>
    );
  }

  const gameUrl = `${window.location.origin}?join=${lobbyCode}`;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Minimal background elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-16 w-80 h-80 bg-white/[0.01] rounded-full blur-3xl" />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 sm:p-8">
          <Button
            onClick={() => {
              soundEffects.playButtonClick();
              onBackToMenu();
            }}
            variant="outline"
            className="border-gray-600 text-white hover:bg-white/5 rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Room Setup</h1>
            <p className="text-gray-400 text-sm">Get ready to play with friends</p>
          </div>
          
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
            
            {/* Left Column - Room Info & Controls */}
            <div className="space-y-6">
              
              {/* Room Code Card */}
              <Card className="bg-gray-900/50 border-gray-800 p-6 sm:p-8">
                <div className="text-center space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">Room Code</h2>
                    <p className="text-gray-400 text-sm">Your friends need this to join</p>
                  </div>
                  
                  <div className="relative">
                    <div className="bg-white text-black text-3xl sm:text-4xl font-bold font-mono px-6 py-4 rounded-2xl tracking-widest">
                      {lobbyCode}
                    </div>
                    
                    <Button
                      onClick={copyToClipboard}
                      size="sm"
                      className="absolute -top-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 p-0"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  {/* QR Code */}
                  <div className="flex justify-center pt-4">
                    <div className="p-4 bg-white rounded-2xl">
                      <QRCodeGenerator 
                        value={gameUrl}
                        size={120}
                      />
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">Or scan to join instantly</p>
                </div>
              </Card>

              {/* Playlist Section */}
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Music2 className="h-5 w-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">Music</h3>
                </div>
                
                <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <div>
                      <div className="text-white font-medium">Default playlist ready</div>
                      <div className="text-green-300 text-sm">Mix of popular songs from different eras</div>
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
                <p className="text-xs text-gray-500 mt-2">
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
                disabled={players.length < 2}
                className="w-full bg-white text-black hover:bg-gray-100 h-14 text-lg font-semibold rounded-full transition-all duration-200"
              >
                <Play className="h-5 w-5 mr-2" />
                {players.length < 2 ? 'Need at least 2 players' : `Start game with ${players.length} ${players.length === 1 ? 'player' : 'players'}`}
              </Button>
            </div>

            {/* Right Column - Players */}
            <div>
              <Card className="bg-gray-900/50 border-gray-800 p-6 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-5 w-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">
                    Who's playing ({players.length})
                  </h3>
                  {players.length > 0 && (
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                  )}
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {players.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-600" />
                      </div>
                      <p className="text-gray-400 text-lg mb-2">Waiting for friends to join</p>
                      <p className="text-gray-500 text-sm">
                        Share the room code above
                      </p>
                    </div>
                  ) : (
                    players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl transition-colors hover:bg-gray-800/70"
                      >
                        <div className="text-lg font-semibold text-gray-400">
                          {index + 1}
                        </div>
                        
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            {player.name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            Ready to go
                          </div>
                        </div>
                        
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="p-6 text-center">
          <p className="text-gray-600 text-xs max-w-md mx-auto">
            Independent project for friends • Not affiliated with any music service
          </p>
        </div>
      </div>
    </div>
  );
}
