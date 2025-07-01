
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
    console.log('🧍 HostLobby: Player count:', players.length);
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
      <div className="min-h-screen bg-gray-900 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gray-800"></div>
        
        <div className="text-center text-white relative z-10">
          <div className="w-20 h-20 bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-gray-600">
            <Music2 className="h-10 w-10 text-white animate-bounce" />
          </div>
          <div className="text-3xl font-semibold mb-3">Setting up your room</div>
          <div className="text-gray-400">This'll just take a second...</div>
        </div>
      </div>
    );
  }

  const gameUrl = `${window.location.origin}?join=${lobbyCode}`;

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gray-800"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 sm:p-8">
          <Button
            onClick={() => {
              soundEffects.playButtonClick();
              onBackToMenu();
            }}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-700 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Room Setup</h1>
            <p className="text-gray-400 text-sm">Get ready to play with friends</p>
          </div>
          
          <div className="w-20" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
            
            {/* Left Column - Room Info & Controls */}
            <div className="space-y-6">
              
              {/* Room Code Card */}
              <Card className="bg-gray-800 border-gray-700 p-6 sm:p-8 rounded-3xl shadow-2xl hover:bg-gray-750 transition-all duration-500 hover:scale-[1.02]">
                <div className="text-center space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">Room Code</h2>
                    <p className="text-gray-400 text-sm">Your friends need this to join</p>
                  </div>
                  
                  <div className="relative group">
                    <div className="bg-white text-black text-3xl sm:text-4xl font-bold font-mono px-6 py-4 rounded-2xl tracking-widest transition-all duration-300 group-hover:scale-105 shadow-lg">
                      {lobbyCode}
                    </div>
                    
                    <Button
                      onClick={copyToClipboard}
                      size="sm"
                      className="absolute -top-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 p-0 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
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
                  <p className="text-gray-500 text-xs">Or scan to join instantly</p>
                </div>
              </Card>

              {/* Playlist Section */}
              <Card className="bg-gray-800 border-gray-700 p-6 rounded-3xl shadow-2xl hover:bg-gray-750 transition-all duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <Music2 className="h-5 w-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">Music</h3>
                </div>
                
                <div className="bg-green-900/30 border border-green-700/50 rounded-2xl p-4">
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
                disabled={players.length < 1}
                className="w-full bg-white text-black hover:bg-gray-200 h-16 text-lg font-semibold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                <Play className="h-5 w-5 mr-3" />
                {players.length < 1 ? 'Waiting for players to join...' : `Start game with ${players.length} ${players.length === 1 ? 'player' : 'players'}`}
              </Button>
            </div>

            {/* Right Column - Players */}
            <div>
              <Card className="bg-gray-800 border-gray-700 p-6 h-full rounded-3xl shadow-2xl hover:bg-gray-750 transition-all duration-500">
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
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-500" />
                      </div>
                      <p className="text-gray-300 text-lg mb-2">Waiting for friends to join</p>
                      <p className="text-gray-500 text-sm">
                        Share the room code above
                      </p>
                    </div>
                  ) : (
                    players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-4 bg-gray-700 rounded-2xl transition-all duration-300 hover:bg-gray-600 transform hover:scale-[1.02]"
                      >
                        <div className="text-lg font-semibold text-gray-400">
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
                          <div className="text-gray-400 text-sm">
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
        <div className="p-6 text-center">
          <p className="text-gray-500 text-xs max-w-md mx-auto">
            Independent project for friends • Not affiliated with any music service
          </p>
        </div>
      </div>
    </div>
  );
}
