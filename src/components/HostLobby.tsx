import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlaylistLoader } from '@/components/PlaylistLoader';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { Crown, Users, Play, ArrowLeft, Copy, Check, Music2, Volume2, Radio, Headphones } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-[#0a0b14] via-[#16213e] to-[#1a1b2e] relative overflow-hidden">
        {/* Enhanced Loading Background Effects */}
        <div className="absolute inset-0">
          {/* Main radial gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/8 via-transparent to-[#ec4899]/6" />
          
          {/* Dynamic glow effects */}
          <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-[#6366f1]/12 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-[#8b5cf6]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/2 w-44 h-44 bg-[#ec4899]/8 rounded-full blur-3xl animate-pulse" />
          
          {/* Additional scattered glows */}
          <div className="absolute top-16 right-16 w-32 h-32 bg-[#fbbf24]/6 rounded-full blur-2xl" />
          <div className="absolute bottom-32 left-16 w-36 h-36 bg-[#06b6d4]/8 rounded-full blur-2xl" />
          
          {/* Floating music notes */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className="absolute animate-float opacity-20"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float ${8 + Math.random() * 12}s linear infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              >
                {i % 2 === 0 ? (
                  <Music2 className="h-5 w-5 text-[#6366f1]" />
                ) : (
                  <Volume2 className="h-4 w-4 text-[#8b5cf6]" />
                )}
              </div>
            ))}
          </div>

          {/* Enhanced geometric shapes */}
          <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 1200 800" fill="none">
            {/* Music note shapes */}
            <circle cx="200" cy="200" r="6" fill="#6366f1" opacity="0.4" />
            <circle cx="1000" cy="300" r="8" fill="#8b5cf6" opacity="0.4" />
            <circle cx="400" cy="600" r="5" fill="#ec4899" opacity="0.4" />
            
            {/* Connecting lines */}
            <path d="M200 200 L400 250 L600 230" stroke="#6366f1" strokeWidth="2" opacity="0.3" />
            <path d="M1000 300 L800 400 L700 380" stroke="#8b5cf6" strokeWidth="2" opacity="0.3" />
            
            {/* Sound waves */}
            <path d="M300 400 Q350 380, 400 400 Q450 420, 500 400" stroke="#ec4899" strokeWidth="2" opacity="0.2" />
            <path d="M300 420 Q350 400, 400 420 Q450 440, 500 420" stroke="#ec4899" strokeWidth="2" opacity="0.2" />
          </svg>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 border-2 border-[#6366f1]/30 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-[#6366f1]/20 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/10 to-transparent"></div>
              <Music2 className="h-12 w-12 text-[#6366f1] animate-bounce" />
            </div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
              Setting up your room
            </h1>
            <p className="text-[#e2e8f0] font-bold text-lg">This'll just take a second...</p>
          </div>
        </div>
      </div>
    );
  }

  const gameUrl = `${window.location.origin}?join=${lobbyCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0b14] via-[#16213e] to-[#1a1b2e] relative overflow-hidden">
      {/* Enhanced Layered Background Effects */}
      <div className="absolute inset-0">
        {/* Main radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/8 via-transparent to-[#ec4899]/6" />
        
        {/* Dynamic glow effects with improved colors */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-[#6366f1]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-56 h-56 bg-[#8b5cf6]/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-1/4 left-1/2 w-52 h-52 bg-[#ec4899]/6 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        
        {/* Additional ambient lighting layers */}
        <div className="absolute top-16 right-16 w-40 h-40 bg-[#fbbf24]/8 rounded-full blur-2xl" />
        <div className="absolute bottom-32 left-16 w-44 h-44 bg-[#06b6d4]/6 rounded-full blur-2xl" />
        <div className="absolute top-1/3 left-1/6 w-36 h-36 bg-[#8b5cf6]/5 rounded-full blur-xl" />
        <div className="absolute bottom-1/3 right-1/6 w-48 h-48 bg-[#6366f1]/5 rounded-full blur-xl" />
        
        {/* Large ambient background shapes */}
        <div className="absolute top-3/4 left-1/3 w-96 h-96 bg-[#ec4899]/4 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/6 right-1/3 w-[500px] h-[500px] bg-[#16213e]/12 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1.5s'}} />
        <div className="absolute -bottom-40 left-1/2 w-[700px] h-[700px] bg-[#1a1b2e]/20 rounded-full blur-3xl" />
        
        {/* Enhanced geometric musical shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 800" fill="none">
          {/* Music equipment silhouettes */}
          <rect x="120" y="120" width="100" height="60" rx="15" fill="#6366f1" opacity="0.12" transform="rotate(-15 170 150)" />
          <circle cx="150" cy="160" r="8" fill="#6366f1" opacity="0.15" />
          <circle cx="180" cy="160" r="8" fill="#6366f1" opacity="0.15" />
          
          <rect x="1000" y="200" width="100" height="60" rx="15" fill="#8b5cf6" opacity="0.12" transform="rotate(20 1050 230)" />
          <circle cx="1030" cy="240" r="8" fill="#8b5cf6" opacity="0.15" />
          <circle cx="1060" cy="240" r="8" fill="#8b5cf6" opacity="0.15" />
          
          {/* Enhanced vinyl records */}
          <circle cx="240" cy="600" r="45" stroke="#ec4899" strokeWidth="3" fill="none" opacity="0.12" />
          <circle cx="240" cy="600" r="25" stroke="#ec4899" strokeWidth="2" fill="none" opacity="0.08" />
          <circle cx="240" cy="600" r="8" fill="#ec4899" opacity="0.15" />
          
          <circle cx="1050" cy="150" r="40" stroke="#fbbf24" strokeWidth="3" fill="none" opacity="0.12" />
          <circle cx="1050" cy="150" r="22" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.08" />
          <circle cx="1050" cy="150" r="6" fill="#fbbf24" opacity="0.15" />
          
          {/* Enhanced musical notes with more detail */}
          <g opacity="0.15">
            <circle cx="350" cy="250" r="8" fill="#06b6d4" />
            <path d="M358 250 L358 200" stroke="#06b6d4" strokeWidth="4" />
            <path d="M358 200 L378 208" stroke="#06b6d4" strokeWidth="4" />
            <circle cx="370" cy="212" r="6" fill="#06b6d4" />
          </g>
          
          <g opacity="0.15">
            <circle cx="900" cy="550" r="8" fill="#6366f1" />
            <path d="M908 550 L908 500" stroke="#6366f1" strokeWidth="4" />
            <path d="M908 500 L928 508" stroke="#6366f1" strokeWidth="4" />
            <circle cx="920" cy="512" r="6" fill="#6366f1" />
          </g>
          
          {/* Enhanced sound waves */}
          <path d="M450 320 Q520 285, 590 320 Q660 355, 730 320" stroke="#8b5cf6" strokeWidth="3" opacity="0.12" />
          <path d="M450 345 Q520 310, 590 345 Q660 380, 730 345" stroke="#8b5cf6" strokeWidth="3" opacity="0.1" />
          <path d="M450 370 Q520 335, 590 370 Q660 405, 730 370" stroke="#8b5cf6" strokeWidth="3" opacity="0.08" />
          
          {/* Connecting energy lines */}
          <path d="M240 220 L450 290 L660 270" stroke="#6366f1" strokeWidth="2" opacity="0.12" />
          <path d="M1000 340 L840 440 L740 420" stroke="#ec4899" strokeWidth="2" opacity="0.12" />
          <path d="M350 640 L550 600 L750 610" stroke="#06b6d4" strokeWidth="2" opacity="0.12" />
        </svg>
        
        {/* Enhanced floating music icons */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(18)].map((_, i) => (
            <div 
              key={i}
              className="absolute animate-float opacity-15"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${15 + Math.random() * 30}s linear infinite`,
                animationDelay: `${Math.random() * 8}s`,
              }}
            >
              {i % 5 === 0 ? (
                <Music2 className="h-5 w-5 text-[#6366f1]" />
              ) : i % 5 === 1 ? (
                <Volume2 className="h-6 w-6 text-[#8b5cf6]" />
              ) : i % 5 === 2 ? (
                <Radio className="h-5 w-5 text-[#ec4899]" />
              ) : i % 5 === 3 ? (
                <Headphones className="h-5 w-5 text-[#fbbf24]" />
              ) : (
                <Music className="h-4 w-4 text-[#06b6d4]" />
              )}
            </div>
          ))}
        </div>
        
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-gradient-to-r from-transparent via-white to-transparent mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.25'%3E%3Ccircle cx='12' cy='12' r='1'/%3E%3Ccircle cx='34' cy='34' r='1'/%3E%3Ccircle cx='56' cy='56' r='1'/%3E%3Ccircle cx='78' cy='78' r='1'/%3E%3Ccircle cx='23' cy='45' r='1'/%3E%3Ccircle cx='45' cy='23' r='1'/%3E%3Ccircle cx='67' cy='67' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Enhanced Header */}
        <div className="flex justify-between items-center p-6 sm:p-8">
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onBackToMenu();
            }}
            className="bg-gradient-to-r from-[#6366f1]/15 to-[#8b5cf6]/15 hover:from-[#6366f1]/25 hover:to-[#8b5cf6]/25 border border-[#6366f1]/20 text-white h-14 px-8 text-base font-bold rounded-2xl backdrop-blur-xl transition-all duration-500 hover:scale-105 active:scale-95 shadow-xl shadow-[#6366f1]/10 hover:shadow-[#6366f1]/20 group"
          >
            <div className="flex items-center">
              <ArrowLeft className="h-5 w-5 mr-3 group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Menu
            </div>
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#ec4899] bg-clip-text tracking-tight">
              Party Setup
            </h1>
            <p className="text-[#e2e8f0] font-bold text-lg mt-2">Get ready to jam with friends</p>
          </div>
          
          <div className="w-36" />
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
            
            {/* Left Column - Room Info & Controls */}
            <div className="space-y-6">
              
              {/* Enhanced Room Code Card */}
              <div className="bg-gradient-to-br from-[#6366f1]/12 via-[#8b5cf6]/8 to-[#6366f1]/6 backdrop-blur-3xl border border-[#6366f1]/20 p-8 sm:p-10 rounded-3xl shadow-2xl shadow-[#6366f1]/10 hover:shadow-[#6366f1]/20 transition-all duration-500 hover:scale-[1.02] group">
                <div className="text-center space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                      Room Code
                    </h2>
                    <p className="text-[#e2e8f0] font-bold text-lg">Your crew needs this magic code</p>
                  </div>
                  
                  <div className="relative group/code">
                    <div className="bg-gradient-to-r from-[#1a1b2e]/80 to-[#16213e]/80 border border-[#6366f1]/30 text-white text-4xl sm:text-5xl font-black font-mono px-8 py-6 rounded-3xl tracking-widest transition-all duration-300 group-hover/code:scale-105 shadow-2xl backdrop-blur-sm group-hover/code:shadow-[#6366f1]/20">
                      {lobbyCode}
                    </div>
                    
                    <button
                      onClick={copyToClipboard}
                      className="absolute -top-3 -right-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#ec4899] text-white rounded-full w-16 h-16 p-0 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-0 group-hover/code:shadow-[#6366f1]/30"
                    >
                      {copied ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
                    </button>
                  </div>
                  
                  {/* Enhanced QR Code */}
                  <div className="flex justify-center pt-4">
                    <div className="p-6 bg-white rounded-3xl shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-[#6366f1]/20 hover:border-[#6366f1]/40">
                      <QRCodeGenerator 
                        value={gameUrl}
                        size={140}
                      />
                    </div>
                  </div>
                  <p className="text-[#e2e8f0] font-bold text-lg">
                    Or scan this groovy code ✨
                  </p>
                </div>
              </div>

              {/* Enhanced Playlist Section */}
              <div className="bg-gradient-to-br from-[#06b6d4]/12 via-[#8b5cf6]/8 to-[#06b6d4]/6 backdrop-blur-3xl border border-[#06b6d4]/20 p-8 rounded-3xl shadow-2xl shadow-[#06b6d4]/10 hover:shadow-[#06b6d4]/20 transition-all duration-500 group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#06b6d4]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center">
                    <Music2 className="h-6 w-6 text-[#06b6d4]" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    The Playlist
                  </h3>
                </div>
                
                <div className="bg-gradient-to-r from-[#06b6d4]/15 to-[#8b5cf6]/10 border border-[#06b6d4]/25 rounded-2xl p-6 backdrop-blur-sm group-hover:bg-gradient-to-r group-hover:from-[#06b6d4]/20 group-hover:to-[#8b5cf6]/15 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-[#06b6d4] rounded-full animate-pulse" />
                    <div>
                      <div className="text-[#06b6d4] font-black text-lg tracking-tight">
                        Default bangers loaded
                      </div>
                      <div className="text-[#e2e8f0] font-bold text-base">
                        Mix of hits from every era
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 opacity-40 pointer-events-none">
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
                <p className="text-sm text-[#e2e8f0]/60 mt-3 font-bold">
                  Custom playlists dropping soon ✨
                </p>
              </div>

              {/* Enhanced Start Game Button */}
              <button
                onClick={() => {
                  console.log('🎮 Starting game with players:', players);
                  soundEffects.playGameStart();
                  onStartGame();
                }}
                disabled={players.length < 1}
                className="w-full bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#6366f1] text-white h-20 text-xl font-black rounded-3xl transition-all duration-500 shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 border-0 tracking-tight relative overflow-hidden group hover:shadow-[#ec4899]/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
                <div className="relative z-10 flex items-center justify-center">
                  <Play className="h-7 w-7 mr-4" />
                  {players.length < 1 ? 'Waiting for the squad...' : `Start the party! (${players.length} ${players.length === 1 ? 'player' : 'players'})`}
                </div>
              </button>
            </div>

            {/* Enhanced Players Section */}
            <div>
              <div className="bg-gradient-to-br from-[#fbbf24]/12 via-[#8b5cf6]/8 to-[#fbbf24]/6 backdrop-blur-3xl border border-[#fbbf24]/20 p-8 h-full rounded-3xl shadow-2xl shadow-[#fbbf24]/10 hover:shadow-[#fbbf24]/20 transition-all duration-500 group">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#fbbf24]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#fbbf24]" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    The Squad ({players.length})
                  </h3>
                  {players.length > 0 && (
                    <div className="w-4 h-4 bg-[#fbbf24] rounded-full animate-pulse" />
                  )}
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {players.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#fbbf24]/15 to-[#8b5cf6]/15 border-2 border-[#fbbf24]/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#fbbf24]/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#fbbf24]/10 to-transparent"></div>
                        <Users className="h-10 w-10 text-[#fbbf24]" />
                      </div>
                      <p className="text-white text-xl font-black mb-3 tracking-tight">
                        Waiting for friends
                      </p>
                      <p className="text-[#e2e8f0] font-bold">
                        Share that room code above!
                      </p>
                    </div>
                  ) : (
                    players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-5 p-5 bg-gradient-to-r from-[#1a1b2e]/60 to-[#16213e]/60 border border-[#fbbf24]/20 rounded-3xl transition-all duration-300 hover:bg-gradient-to-r hover:from-[#1a1b2e]/80 hover:to-[#16213e]/80 hover:scale-[1.02] shadow-lg backdrop-blur-sm hover:shadow-[#fbbf24]/10"
                      >
                        <div className="text-xl font-black text-[#fbbf24] tracking-tight w-8">
                          {index + 1}
                        </div>
                        
                        <div 
                          className="w-6 h-6 rounded-full shadow-lg border-2 border-white/30"
                          style={{ backgroundColor: player.color }}
                        />
                        
                        <div className="flex-1">
                          <div className="text-white font-black text-lg tracking-tight">
                            {player.name}
                          </div>
                          <div className="text-[#e2e8f0] text-sm font-bold">
                            Ready to jam ✨
                          </div>
                        </div>
                        
                        <div className="w-4 h-4 bg-[#fbbf24] rounded-full animate-pulse" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer disclaimer */}
        <div className="p-6 text-center">
          <p className="text-[#e2e8f0]/70 text-base font-bold max-w-lg mx-auto">
            This groovy creation is just for friends to jam together • Not affiliated with any music service
          </p>
        </div>
      </div>
    </div>
  );
}
