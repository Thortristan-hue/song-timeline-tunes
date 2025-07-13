import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music, Crown, Volume2, Zap, Radio, Headphones } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { MysteryCard } from '@/components/MysteryCard';
import { cn } from '@/lib/utils';

interface HostGameViewProps {
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  transitioning: boolean;
}

export function HostGameView({
  currentTurnPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult,
  transitioning
}: HostGameViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D1D] via-[#1A0B2E] to-[#16213E] relative overflow-hidden">
      {/* MTV-Style Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Neon Orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#00F0FF]/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-[#FF2A7F]/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-[#C0FF00]/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}} />
        
        {/* Floating Music Icons */}
        <div className="absolute top-20 right-20 text-[#00F0FF]/30 animate-bounce" style={{animationDelay: '0.5s'}}>
          <Music className="h-8 w-8" />
        </div>
        <div className="absolute bottom-32 left-20 text-[#FF2A7F]/30 animate-bounce" style={{animationDelay: '1.5s'}}>
          <Zap className="h-6 w-6" />
        </div>
        <div className="absolute top-40 left-1/3 text-[#C0FF00]/30 animate-bounce" style={{animationDelay: '2.5s'}}>
          <Radio className="h-7 w-7" />
        </div>
        <div className="absolute bottom-20 right-1/3 text-[#00F0FF]/30 animate-bounce" style={{animationDelay: '3s'}}>
          <Headphones className="h-8 w-8" />
        </div>
      </div>

      {/* Retro TV-Style Header */}
      <div className="absolute top-4 left-4 right-4 z-40">
        <div className="bg-gradient-to-r from-[#FF2A7F] via-[#00F0FF] to-[#C0FF00] p-1 rounded-3xl shadow-2xl">
          <div className="bg-[#0D0D1D] rounded-3xl p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF2A7F] to-[#00F0FF] rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#C0FF00] font-black text-3xl tracking-tight" 
                       style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>
                    MTV TIMELINER HOST
                  </div>
                  <div className="text-[#FF2A7F] text-lg font-bold">🎵 MEGA MUSIC MAYHEM! 🎵</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="bg-gradient-to-br from-[#C0FF00] to-[#00F0FF] p-1 rounded-2xl shadow-xl">
                  <div className="bg-[#0D0D1D] px-6 py-4 rounded-2xl">
                    <div className="text-[#C0FF00] text-sm font-bold">ROOM CODE</div>
                    <div className="text-white font-mono text-2xl font-black tracking-wider animate-pulse">{roomCode}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Player Spotlight */}
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
        <div className="relative">
          {/* Spotlight Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF2A7F]/30 via-[#00F0FF]/30 to-[#C0FF00]/30 rounded-3xl blur-xl scale-110 animate-pulse" />
          
          <div className="relative bg-gradient-to-br from-[#0D0D1D] to-[#1A0B2E] border-4 border-[#00F0FF] px-8 py-4 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-center gap-4 text-white">
              <div 
                className="w-8 h-8 rounded-full border-4 border-white shadow-xl animate-bounce" 
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <div className="text-center">
                <div className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#FF2A7F] to-[#00F0FF]" 
                     style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>
                  {currentTurnPlayer.name.toUpperCase()}'S TURN!
                </div>
                <div className="text-lg text-[#C0FF00] font-bold">
                  SCORE: {currentTurnPlayer.timeline.length}/10 🎯
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Central Mystery Card with Vinyl Animation */}
      <div className="absolute top-60 left-1/2 transform -translate-x-1/2 z-30">
        <div className="text-center space-y-8">
          {/* Animated Vinyl Background */}
          <div className="relative">
            <div className="absolute inset-0 w-80 h-80 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-full h-full bg-gradient-to-br from-[#FF2A7F] to-[#00F0FF] rounded-full animate-spin opacity-20" style={{animationDuration: '8s'}} />
              <div className="absolute inset-4 bg-[#0D0D1D] rounded-full" />
              <div className="absolute inset-16 bg-gradient-to-br from-[#C0FF00] to-[#00F0FF] rounded-full animate-spin opacity-60" style={{animationDuration: '4s'}} />
              <div className="absolute inset-24 bg-[#0D0D1D] rounded-full" />
            </div>
            
            {currentSong ? (
              <div className="relative transform hover:scale-105 transition-transform duration-300">
                <MysteryCard
                  song={currentSong}
                  isRevealed={mysteryCardRevealed}
                  isInteractive={false}
                  isDestroyed={cardPlacementResult?.correct === false}
                  className="w-72 h-96 border-4 border-[#00F0FF] shadow-2xl"
                />
              </div>
            ) : (
              <Card className="relative w-72 h-96 bg-gradient-to-br from-[#1A0B2E] to-[#16213E] border-4 border-[#FF2A7F] flex flex-col items-center justify-center text-white animate-pulse shadow-2xl">
                <Music className="h-20 w-20 mb-4 text-[#C0FF00] animate-bounce" />
                <div className="text-2xl text-center px-4 text-[#00F0FF] font-bold">LOADING MYSTERY SONG...</div>
              </Card>
            )}
          </div>

          {/* MTV-Style Audio Controls */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF2A7F]/20 to-[#C0FF00]/20 rounded-3xl blur-xl scale-110" />
            
            <div className="relative bg-gradient-to-br from-[#0D0D1D] to-[#1A0B2E] border-4 border-[#C0FF00] rounded-3xl p-8 shadow-2xl">
              {/* Cassette Character */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="relative">
                  {/* Cassette Body */}
                  <div className="w-20 h-14 bg-gradient-to-br from-[#FF2A7F] to-[#00F0FF] rounded-lg relative">
                    {/* Reels */}
                    <div className="absolute top-2 left-2 w-3 h-3 bg-[#0D0D1D] rounded-full animate-spin" style={{animationDuration: '2s'}} />
                    <div className="absolute top-2 right-2 w-3 h-3 bg-[#0D0D1D] rounded-full animate-spin" style={{animationDuration: '1.5s'}} />
                    
                    {/* Eyes */}
                    <div className="absolute top-6 left-3 w-2 h-2 bg-white rounded-full" />
                    <div className="absolute top-6 right-3 w-2 h-2 bg-white rounded-full" />
                    
                    {/* Mouth */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-white rounded-full" />
                  </div>
                  
                  {/* Speech Bubble */}
                  {isPlaying && (
                    <div className="absolute -top-12 -right-8 bg-white rounded-2xl p-2 text-xs font-bold text-[#0D0D1D] animate-bounce">
                      🎵 JAMMIN'! 🎵
                      <div className="absolute bottom-0 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
                    </div>
                  )}
                </div>

                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#C0FF00]" 
                     style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>
                  CENTRAL AUDIO CONTROL
                </div>
              </div>

              <div className="text-lg text-[#FF2A7F] text-center mb-6 font-bold">
                🔥 PLAYERS CONTROL AUDIO THROUGH THIS DEVICE! 🔥
              </div>

              <div className="flex items-center justify-center">
                <Button
                  onClick={onPlayPause}
                  size="lg"
                  className="relative bg-gradient-to-r from-[#FF2A7F] via-[#00F0FF] to-[#C0FF00] hover:from-[#C0FF00] hover:via-[#FF2A7F] hover:to-[#00F0FF] rounded-2xl px-12 py-6 font-black text-white shadow-2xl transform hover:scale-110 transition-all duration-300 border-4 border-white"
                  disabled={!currentSong?.preview_url}
                  style={{fontFamily: 'Impact, Arial Black, sans-serif'}}
                >
                  {/* EQ Waves Animation */}
                  {isPlaying && (
                    <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <div className="w-1 bg-[#00F0FF] animate-pulse rounded-full" style={{height: '20px', animationDelay: '0s'}} />
                      <div className="w-1 bg-[#FF2A7F] animate-pulse rounded-full" style={{height: '30px', animationDelay: '0.2s'}} />
                      <div className="w-1 bg-[#C0FF00] animate-pulse rounded-full" style={{height: '25px', animationDelay: '0.4s'}} />
                      <div className="w-1 bg-[#00F0FF] animate-pulse rounded-full" style={{height: '35px', animationDelay: '0.6s'}} />
                    </div>
                  )}
                  
                  {isPlaying ? (
                    <>
                      <Pause className="h-8 w-8 mr-4" />
                      AUDIO ROCKIN'! 🎸
                    </>
                  ) : (
                    <>
                      <Play className="h-8 w-8 mr-4" />
                      HOST OVERRIDE! ⚡
                    </>
                  )}
                  
                  {/* EQ Waves Animation Right */}
                  {isPlaying && (
                    <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <div className="w-1 bg-[#C0FF00] animate-pulse rounded-full" style={{height: '35px', animationDelay: '0.8s'}} />
                      <div className="w-1 bg-[#FF2A7F] animate-pulse rounded-full" style={{height: '25px', animationDelay: '1s'}} />
                      <div className="w-1 bg-[#00F0FF] animate-pulse rounded-full" style={{height: '30px', animationDelay: '1.2s'}} />
                      <div className="w-1 bg-[#C0FF00] animate-pulse rounded-full" style={{height: '20px', animationDelay: '1.4s'}} />
                    </div>
                  )}
                </Button>
              </div>

              {isPlaying && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#C0FF00] to-[#00F0FF] text-[#0D0D1D] px-6 py-3 rounded-full text-lg font-bold border-2 border-white">
                    <div className="w-3 h-3 bg-[#FF2A7F] rounded-full animate-pulse"></div>
                    🎵 STREAMING TO HOST DEVICE! 🎵
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MTV-Style Players Grid */}
      <div className="absolute bottom-8 left-8 right-8 z-30">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {players.map((player, index) => (
            <Card
              key={player.id}
              className={cn(
                "relative bg-gradient-to-br from-[#1A0B2E] to-[#16213E] border-4 p-6 transition-all duration-300 transform hover:scale-105 hover:rotate-1 shadow-2xl",
                player.id === currentTurnPlayer.id 
                  ? "border-[#00F0FF] shadow-[#00F0FF]/50 animate-pulse" 
                  : "border-[#FF2A7F] hover:border-[#C0FF00]"
              )}
              style={{
                borderRadius: '20px',
                animationDelay: `${index * 0.1}s`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              {/* Sticker-style background */}
              <div className="absolute top-2 right-2">
                {player.id === currentTurnPlayer.id && (
                  <div className="bg-gradient-to-r from-[#00F0FF] to-[#C0FF00] text-[#0D0D1D] px-3 py-1 rounded-full text-xs font-black animate-bounce">
                    🎯 TURN!
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div 
                  className="w-6 h-6 rounded-full shadow-xl border-2 border-white animate-pulse" 
                  style={{ backgroundColor: player.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-black truncate text-lg" 
                       style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>
                    {player.name.toUpperCase()}
                  </div>
                  <div className="text-[#C0FF00] text-sm font-bold">
                    🎵 {player.timeline.length}/10 CARDS
                  </div>
                </div>
              </div>

              {/* Score indicator */}
              <div className="mt-3 w-full bg-[#0D0D1D] rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#FF2A7F] to-[#00F0FF] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(player.timeline.length / 10) * 100}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* MTV-Style Result Display */}
      {cardPlacementResult && (
        <div className="fixed inset-0 bg-[#0D0D1D]/95 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="text-center space-y-8 p-8 relative">
            {/* Confetti Animation for Correct */}
            {cardPlacementResult.correct && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-bounce"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: '2s'
                    }}
                  >
                    {['🎵', '🎶', '⚡', '🎯', '🔥'][Math.floor(Math.random() * 5)]}
                  </div>
                ))}
              </div>
            )}

            <div className={`text-9xl mb-6 ${
              cardPlacementResult.correct ? 'animate-bounce' : 'animate-pulse'
            }`}>
              {cardPlacementResult.correct ? '🎯' : '💥'}
            </div>
            
            <div className={`text-8xl font-black ${
              cardPlacementResult.correct ? 
              'text-transparent bg-clip-text bg-gradient-to-r from-[#C0FF00] to-[#00F0FF] animate-pulse' : 
              'text-transparent bg-clip-text bg-gradient-to-r from-[#FF2A7F] to-[#00F0FF] animate-pulse'
            }`} style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>
              {cardPlacementResult.correct ? 'BOOM! NAILED IT!' : 'SO CLOSE!'}
            </div>
            
            <div className="bg-gradient-to-br from-[#1A0B2E] to-[#16213E] border-4 border-[#00F0FF] rounded-3xl p-8 max-w-lg shadow-2xl">
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF2A7F] to-[#00F0FF] mb-3" 
                   style={{fontFamily: 'Impact, Arial Black, sans-serif'}}>
                {cardPlacementResult.song.deezer_title}
              </div>
              <div className="text-2xl text-[#C0FF00] mb-4 font-bold">
                by {cardPlacementResult.song.deezer_artist}
              </div>
              <div className="inline-block bg-gradient-to-r from-[#FF2A7F] via-[#00F0FF] to-[#C0FF00] text-white px-8 py-4 rounded-full font-black text-2xl border-4 border-white shadow-xl">
                {cardPlacementResult.song.release_year}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
