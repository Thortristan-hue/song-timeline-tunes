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
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-yellow-50 relative overflow-hidden flex items-center justify-center">
        {/* Hand-drawn background elements */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1200 800">
            {/* Floating music notes */}
            <g stroke="#f97316" strokeWidth="3" fill="#f97316" strokeLinecap="round">
              <circle cx="200" cy="150" r="6" />
              <path d="M206 150 L206 120" stroke="#f97316" strokeWidth="3" />
              <path d="M206 120 L220 125" stroke="#f97316" strokeWidth="3" />
              
              <circle cx="950" cy="400" r="6" />
              <path d="M956 400 L956 370" stroke="#f97316" strokeWidth="3" />
              <path d="M956 370 L970 375" stroke="#f97316" strokeWidth="3" />
              
              <circle cx="100" cy="350" r="6" />
              <path d="M106 350 L106 320" stroke="#f97316" strokeWidth="3" />
              <path d="M106 320 L120 325" stroke="#f97316" strokeWidth="3" />
            </g>
            
            {/* Wavy sound lines */}
            <g stroke="#fb923c" strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M300 250 Q350 230 400 250 T500 250" />
              <path d="M300 270 Q350 250 400 270 T500 270" />
              <path d="M300 290 Q350 270 400 290 T500 290" />
              
              <path d="M700 350 Q750 330 800 350 T900 350" />
              <path d="M700 370 Q750 350 800 370 T900 370" />
            </g>
          </svg>
        </div>
        
        <div className="text-center text-orange-800 relative z-10">
          <div className="w-20 h-20 bg-orange-300/50 rounded-3xl flex items-center justify-center mx-auto mb-8 border-4 border-orange-400">
            <Music2 className="h-10 w-10 text-orange-700 animate-bounce" />
          </div>
          <div className="text-3xl font-bold mb-3" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
            Setting up your room
          </div>
          <div className="text-orange-600 font-medium">This'll just take a second...</div>
        </div>
      </div>
    );
  }

  const gameUrl = `${window.location.origin}?join=${lobbyCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Hand-drawn background elements */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1200 800">
          {/* Cassette tapes scattered */}
          <g stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round">
            <rect x="50" y="80" width="80" height="50" rx="8" transform="rotate(-15 90 105)" />
            <circle cx="70" cy="110" r="6" transform="rotate(-15 90 105)" />
            <circle cx="110" cy="110" r="6" transform="rotate(-15 90 105)" />
            <rect x="75" y="100" width="30" height="6" rx="2" transform="rotate(-15 90 105)" />
            
            <rect x="1000" y="200" width="80" height="50" rx="8" transform="rotate(20 1040 225)" />
            <circle cx="1020" cy="230" r="6" transform="rotate(20 1040 225)" />
            <circle cx="1060" cy="230" r="6" transform="rotate(20 1040 225)" />
            <rect x="1025" y="220" width="30" height="6" rx="2" transform="rotate(20 1040 225)" />
          </g>
          
          {/* Vinyl records */}
          <g stroke="#ea580c" strokeWidth="3" fill="none">
            <circle cx="150" cy="600" r="35" transform="rotate(-10 150 600)" />
            <circle cx="150" cy="600" r="6" />
            <path d="M130 580 Q150 570 170 580" stroke="#ea580c" strokeWidth="2" />
            
            <circle cx="1050" cy="150" r="30" transform="rotate(15 1050 150)" />
            <circle cx="1050" cy="150" r="5" />
            <path d="M1035 135 Q1050 125 1065 135" stroke="#ea580c" strokeWidth="2" />
          </g>
          
          {/* Music notes floating */}
          <g stroke="#f97316" strokeWidth="3" fill="#f97316" strokeLinecap="round">
            <circle cx="200" cy="150" r="6" />
            <path d="M206 150 L206 120" stroke="#f97316" strokeWidth="3" />
            <path d="M206 120 L220 125" stroke="#f97316" strokeWidth="3" />
            
            <circle cx="950" cy="400" r="6" />
            <path d="M956 400 L956 370" stroke="#f97316" strokeWidth="3" />
            <path d="M956 370 L970 375" stroke="#f97316" strokeWidth="3" />
            
            <circle cx="100" cy="350" r="6" />
            <path d="M106 350 L106 320" stroke="#f97316" strokeWidth="3" />
            <path d="M106 320 L120 325" stroke="#f97316" strokeWidth="3" />
          </g>
          
          {/* Wavy sound lines */}
          <g stroke="#fb923c" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M300 250 Q350 230 400 250 T500 250" />
            <path d="M300 270 Q350 250 400 270 T500 270" />
            <path d="M300 290 Q350 270 400 290 T500 290" />
            
            <path d="M700 350 Q750 330 800 350 T900 350" />
            <path d="M700 370 Q750 350 800 370 T900 370" />
          </g>
        </svg>
      </div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 sm:p-8">
          <Button
            onClick={() => {
              soundEffects.playButtonClick();
              onBackToMenu();
            }}
            className="bg-orange-400 text-orange-900 hover:bg-orange-500 hover:text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl border-4 border-orange-500 hover:border-orange-600 transform hover:scale-105 hover:rotate-1"
            style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-orange-800 transform -rotate-1" 
                style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
              Party Setup
            </h1>
            <p className="text-orange-600 font-medium transform rotate-1">Get ready to jam with friends</p>
          </div>
          
          <div className="w-32" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
            
            {/* Left Column - Room Info & Controls */}
            <div className="space-y-6">
              
              {/* Room Code Card */}
              <Card className="bg-orange-200/80 border-4 border-orange-400 p-6 sm:p-8 rounded-3xl shadow-xl hover:bg-orange-200 transition-all duration-500 hover:scale-[1.02] hover:rotate-1">
                <div className="text-center space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-orange-900 mb-2 transform -rotate-1" 
                        style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
                      Room Code
                    </h2>
                    <p className="text-orange-700 font-medium">Your crew needs this magic code</p>
                  </div>
                  
                  <div className="relative group">
                    <div className="bg-white text-orange-800 text-3xl sm:text-4xl font-bold font-mono px-6 py-4 rounded-2xl tracking-widest transition-all duration-300 group-hover:scale-105 shadow-lg border-4 border-orange-300">
                      {lobbyCode}
                    </div>
                    
                    <Button
                      onClick={copyToClipboard}
                      size="sm"
                      className="absolute -top-2 -right-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full w-12 h-12 p-0 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 border-3 border-orange-600"
                    >
                      {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                  
                  {/* QR Code */}
                  <div className="flex justify-center pt-4">
                    <div className="p-4 bg-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 border-4 border-orange-300">
                      <QRCodeGenerator 
                        value={gameUrl}
                        size={120}
                      />
                    </div>
                  </div>
                  <p className="text-orange-600 font-medium text-sm transform rotate-1">
                    Or scan this groovy code
                  </p>
                </div>
              </Card>

              {/* Playlist Section */}
              <Card className="bg-orange-200/80 border-4 border-orange-400 p-6 rounded-3xl shadow-xl hover:bg-orange-200 transition-all duration-500 hover:rotate-1">
                <div className="flex items-center gap-3 mb-4">
                  <Music2 className="h-6 w-6 text-orange-700" />
                  <h3 className="text-xl font-bold text-orange-900" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
                    The Playlist
                  </h3>
                </div>
                
                <div className="bg-green-100 border-4 border-green-400 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <div>
                      <div className="text-green-900 font-bold" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
                        Default bangers loaded
                      </div>
                      <div className="text-green-700 font-medium text-sm">
                        Mix of hits from every era
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 opacity-40 pointer-events-none">
                  <PlaylistLoader
                    onPlaylistLoaded={(success, count) => {
                      if (success) {
                        console.log(`Playlist loaded with ${count} songs`);
                      }
                    }}
                    setCustomSongs={setCustomSongs}
                    isDarkMode={false}
                  />
                </div>
                <p className="text-xs text-orange-600 mt-2 font-medium">
                  Custom playlists dropping soon ✨
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
                className="w-full bg-orange-500 text-white hover:bg-orange-600 h-16 text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 border-4 border-orange-600 hover:border-orange-700 transform hover:-rotate-1"
                style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}
              >
                <Play className="h-6 w-6 mr-3" />
                {players.length < 1 ? 'Waiting for the squad...' : `Start the party! (${players.length} ${players.length === 1 ? 'player' : 'players'})`}
              </Button>
            </div>

            {/* Right Column - Players */}
            <div>
              <Card className="bg-orange-200/80 border-4 border-orange-400 p-6 h-full rounded-3xl shadow-xl hover:bg-orange-200 transition-all duration-500 hover:-rotate-1">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-6 w-6 text-orange-700" />
                  <h3 className="text-xl font-bold text-orange-900" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
                    The Squad ({players.length})
                  </h3>
                  {players.length > 0 && (
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {players.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-orange-300/50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-orange-400">
                        <Users className="h-8 w-8 text-orange-600" />
                      </div>
                      <p className="text-orange-800 text-lg font-bold mb-2" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
                        Waiting for friends
                      </p>
                      <p className="text-orange-600 font-medium">
                        Share that room code above!
                      </p>
                    </div>
                  ) : (
                    players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-4 bg-orange-100/80 border-3 border-orange-300 rounded-2xl transition-all duration-300 hover:bg-orange-100 transform hover:scale-[1.02] hover:rotate-1 shadow-md"
                      >
                        <div className="text-lg font-bold text-orange-600" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
                          {index + 1}
                        </div>
                        
                        <div 
                          className="w-5 h-5 rounded-full shadow-md border-2 border-white"
                          style={{ backgroundColor: player.color }}
                        />
                        
                        <div className="flex-1">
                          <div className="text-orange-900 font-bold" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
                            {player.name}
                          </div>
                          <div className="text-orange-700 text-sm font-medium">
                            Ready to jam
                          </div>
                        </div>
                        
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
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
          <p className="text-orange-600 text-sm font-medium max-w-md mx-auto">
            This groovy creation is just for friends to jam together • Not affiliated with any music service
          </p>
        </div>
      </div>
    </div>
  );
}
