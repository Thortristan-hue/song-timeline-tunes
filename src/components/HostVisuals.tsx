import React, { useEffect, useState } from 'react';
import { Crown, Users, Play, Pause, Music, Check, X, Zap, Radio } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';
import { Button } from '@/components/ui/button';

export function HostGameBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#0D0D1D] via-[#1A1A2E] to-[#16213E] overflow-hidden">
      {/* Animated MTV-style background elements */}
      <div className="absolute top-10 left-10 w-20 h-20 animate-bounce delay-1000">
        <div className="w-full h-full bg-[#FF2A7F] rounded-full flex items-center justify-center text-2xl">🎵</div>
      </div>
      <div className="absolute top-32 right-20 w-16 h-16 animate-pulse delay-500">
        <div className="w-full h-full bg-[#C0FF00] transform rotate-45 flex items-center justify-center text-xl">⚡</div>
      </div>
      <div className="absolute bottom-40 left-32 w-24 h-24 animate-spin delay-2000" style={{animationDuration: '8s'}}>
        <div className="w-full h-full bg-[#00F0FF] rounded-full flex items-center justify-center text-3xl">📻</div>
      </div>
      <div className="absolute bottom-20 right-40 w-18 h-18 animate-bounce delay-700">
        <div className="w-full h-full bg-[#FF2A7F] transform rotate-12 flex items-center justify-center text-xl">🎤</div>
      </div>
      
      {/* Neon glow circles */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#00F0FF]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-1/4 w-80 h-80 bg-[#FF2A7F]/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C0FF00]/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      
      {/* Retro pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full"
             style={{
               backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(0,240,255,0.1) 20px, rgba(0,240,255,0.1) 22px)`
             }} />
      </div>
    </div>
  );
}

function HostHeader({ roomCode, playersCount }: { roomCode: string; playersCount: number }) {
  return (
    <div className="absolute top-4 left-4 right-4 z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF2A7F] to-[#FF6B9D] rounded-3xl flex items-center justify-center border-4 border-white/80 shadow-2xl transform hover:scale-110 transition-all duration-300">
              <Crown className="h-8 w-8 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#C0FF00] rounded-full animate-bounce"></div>
          </div>
          <div>
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#FF2A7F] to-[#C0FF00] font-black text-4xl tracking-tight drop-shadow-lg" 
                 style={{fontFamily: 'Fredoka One, cursive'}}>
              TIMELINER
            </div>
            <div className="text-white font-bold text-lg bg-gradient-to-r from-[#FF2A7F] to-[#FF6B9D] rounded-full px-4 py-1 border-2 border-white/60 shadow-xl transform -rotate-1">
              🎬 HOST VIEW
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-gradient-to-br from-[#00F0FF] to-[#0099CC] px-6 py-4 rounded-3xl border-4 border-white/70 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-white animate-pulse" />
              <div className="text-white font-black text-2xl">{playersCount}</div>
              <div className="text-white font-bold">PLAYERS</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#C0FF00] to-[#A0D000] px-6 py-4 rounded-3xl border-4 border-white/70 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="text-[#0D0D1D] font-black text-2xl tracking-wider font-mono">
              {roomCode}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordPlayerSection({
  currentSong,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: {
  currentSong: Song | null;
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}) {
  return (
    <div className="absolute top-28 left-1/2 transform -translate-x-1/2 z-30">
      <div className="relative">
        {/* EQ Waves Animation */}
        {isPlaying && (
          <div className="absolute -left-32 top-1/2 transform -translate-y-1/2 flex items-end gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-[#00F0FF] rounded-full animate-pulse"
                style={{
                  width: '8px',
                  height: `${20 + Math.random() * 40}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`
                }}
              />
            ))}
          </div>
        )}
        
        {/* Right side EQ waves */}
        {isPlaying && (
          <div className="absolute -right-32 top-1/2 transform -translate-y-1/2 flex items-end gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-[#FF2A7F] rounded-full animate-pulse"
                style={{
                  width: '8px',
                  height: `${20 + Math.random() * 40}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`
                }}
              />
            ))}
          </div>
        )}

        <div className="text-center space-y-6 max-w-md">
          <div className="relative">
            {/* Vinyl Record */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF2A7F]/30 to-[#00F0FF]/30 rounded-full blur-2xl animate-pulse scale-150"></div>
            <div className={`relative w-48 h-48 mx-auto transition-all duration-500 ${
              isPlaying ? 'animate-spin' : 'hover:scale-110'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#C0FF00]/40 to-[#FF2A7F]/40 rounded-full blur-xl"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-6 border-white/60">
                {/* Vinyl center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#FF2A7F] to-[#FF6B9D] rounded-full border-4 border-white/70 shadow-xl"></div>
                </div>
                
                {/* Vinyl grooves with neon colors */}
                <div className="absolute inset-6 border-2 border-[#00F0FF]/30 rounded-full"></div>
                <div className="absolute inset-12 border-2 border-[#FF2A7F]/30 rounded-full"></div>
                <div className="absolute inset-16 border-2 border-[#C0FF00]/30 rounded-full"></div>
              </div>
              
              <Button
                onClick={onPlayPause}
                className="absolute inset-0 w-full h-full bg-black/20 hover:bg-black/40 border-0 rounded-full transition-all duration-300 group"
                disabled={!currentSong?.preview_url}
              >
                <div className="text-white text-5xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">
                  {isPlaying ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12 ml-2" />}
                </div>
              </Button>
            </div>
          </div>
          
          {/* MTV Style Label */}
          <div className="relative">
            <div className="bg-gradient-to-r from-[#FF2A7F] via-[#00F0FF] to-[#C0FF00] p-1 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="bg-[#0D0D1D] rounded-3xl px-8 py-4">
                <div className="text-white font-black text-2xl tracking-wide transform hover:scale-105 transition-all duration-300"
                     style={{fontFamily: 'Fredoka One, cursive'}}>
                  🎵 MYSTERY SONG PLAYING! 🎵
                </div>
              </div>
            </div>
            {/* Sticker-style decorations */}
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#C0FF00] rounded-full flex items-center justify-center text-lg animate-bounce">⭐</div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-[#FF2A7F] rounded-full flex items-center justify-center text-sm animate-pulse">🎤</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HostTimelineCard({ song, isActive }: { song: Song; isActive?: boolean }) {
  const decade = Math.floor(song.release_year / 10) * 10;
  const getDecadeColor = (decade: number) => {
    const colors = {
      1960: 'from-purple-500 to-pink-500',
      1970: 'from-orange-500 to-red-500', 
      1980: 'from-blue-500 to-cyan-500',
      1990: 'from-green-500 to-lime-500',
      2000: 'from-pink-500 to-purple-500',
      2010: 'from-indigo-500 to-blue-500',
    };
    return colors[decade as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const [isDropping, setIsDropping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    if (isActive) {
      setIsDropping(true);
      const timer = setTimeout(() => setIsDropping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <div 
      className={`w-40 h-40 rounded-3xl flex flex-col items-center justify-between p-4 text-white transition-all duration-700 cursor-pointer relative shadow-2xl border-4 border-white/60 hover:border-white/90 transform hover:scale-110 hover:-rotate-2
        ${isActive ? 'ring-8 ring-[#C0FF00] ring-opacity-80 shadow-[#C0FF00]/50 animate-bounce' : ''}
        ${isDropping ? 'animate-epic-card-slam' : ''}
        ${isHovered ? 'animate-wiggle' : ''}`}
      style={{ 
        background: `linear-gradient(135deg, ${getDecadeColor(decade)})`,
        filter: isHovered ? 'brightness(1.2) saturate(1.3)' : 'brightness(1)',
        transform: isHovered ? 'scale(1.1) rotate(-3deg)' : 'scale(1)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Comic-style speech bubble for artist */}
      <div className="relative bg-white/90 rounded-2xl px-3 py-1 border-2 border-black/20 shadow-lg">
        <div className="text-black font-bold text-sm text-center truncate max-w-24">
          {song.deezer_artist}
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/90"></div>
      </div>
      
      {/* Giant year with neon glow */}
      <div className="relative">
        <div className="absolute inset-0 text-6xl font-black text-white/20 blur-sm scale-110">
          {song.release_year}
        </div>
        <div className="relative text-5xl font-black text-white drop-shadow-lg" style={{fontFamily: 'Fredoka One, cursive'}}>
          {song.release_year}
        </div>
      </div>
      
      {/* Song title with retro styling */}
      <div className="bg-black/30 rounded-xl px-2 py-1 border border-white/30">
        <div className="text-xs font-bold w-full text-center truncate opacity-90">
          {song.deezer_title}
        </div>
      </div>
      
      {/* Decade badge */}
      <div className="absolute -top-2 -right-2 bg-[#C0FF00] text-black font-black text-xs px-2 py-1 rounded-full border-2 border-white shadow-lg">
        {decade}s
      </div>
      
      {/* Animated stickers */}
      {isActive && (
        <>
          <div className="absolute -top-4 -left-4 text-2xl animate-bounce">🎯</div>
          <div className="absolute -bottom-4 -right-4 text-2xl animate-spin" style={{animationDuration: '2s'}}>✨</div>
        </>
      )}
      
      <style jsx global>{`
        @keyframes epic-card-slam {
          0% {
            transform: translateY(-200px) scale(0.3) rotateZ(-45deg) rotateX(90deg);
            opacity: 0;
            filter: blur(15px);
          }
          30% {
            transform: translateY(30px) scale(1.3) rotateZ(15deg) rotateX(20deg);
            opacity: 0.8;
            filter: blur(5px);
          }
          60% {
            transform: translateY(-15px) scale(1.1) rotateZ(-8deg) rotateX(-5deg);
            opacity: 1;
            filter: blur(1px);
          }
          100% {
            transform: translateY(0) scale(1) rotateZ(0deg) rotateX(0deg);
            opacity: 1;
            filter: blur(0px);
          }
        }
        
        @keyframes wiggle {
          0%, 100% { transform: scale(1.1) rotate(-3deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(-1deg); }
        }
        
        .animate-epic-card-slam {
          animation: epic-card-slam 1.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

function MTVCassette({ currentPlayer, isActive }: { currentPlayer: Player; isActive: boolean }) {
  const [mood, setMood] = useState<'neutral' | 'excited' | 'thinking'>('neutral');
  const [speechBubble, setSpeechBubble] = useState('');
  
  const phrases = {
    neutral: ['♪ Vibing to the beat! ♪', '🎵 Ready when you are! 🎵', '✨ Let\'s do this! ✨'],
    excited: ['🔥 BOOM! Nice choice! 🔥', '⭐ You\'re on fire! ⭐', '🎯 Perfect match! 🎯'],
    thinking: ['🤔 Hmm, interesting...', '💭 Think harder!', '🎲 Take another shot!']
  };

  useEffect(() => {
    if (isActive) {
      setMood('excited');
      setSpeechBubble(phrases.excited[Math.floor(Math.random() * phrases.excited.length)]);
      const timer = setTimeout(() => {
        setMood('neutral');
        setSpeechBubble(phrases.neutral[Math.floor(Math.random() * phrases.neutral.length)]);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setMood('neutral');
      setSpeechBubble(phrases.neutral[Math.floor(Math.random() * phrases.neutral.length)]);
    }
  }, [isActive]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Speech bubble */}
      {speechBubble && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl px-4 py-2 border-4 border-black shadow-xl animate-bounce">
          <div className="text-black font-bold text-sm whitespace-nowrap">{speechBubble}</div>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white"></div>
        </div>
      )}
      
      {/* Cassette body */}
      <div className={`w-64 h-40 bg-gradient-to-br from-[#FF2A7F] to-[#FF6B9D] rounded-3xl border-6 border-white/80 shadow-2xl transition-all duration-500 ${
        isActive ? 'animate-pulse scale-110' : 'hover:scale-105'
      }`}>
        {/* Cassette reels */}
        <div className="flex justify-between items-center h-full px-8">
          <div className={`w-16 h-16 bg-black rounded-full border-4 border-white/70 ${isActive ? 'animate-spin' : ''}`}>
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-black rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          
          {/* Cassette face with cartoon eyes */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex space-x-4">
              <div className={`w-6 h-6 bg-white rounded-full border-2 border-black flex items-center justify-center transition-all duration-300 ${
                mood === 'excited' ? 'animate-ping' : mood === 'thinking' ? 'animate-bounce' : ''
              }`}>
                <div className="w-3 h-3 bg-black rounded-full"></div>
              </div>
              <div className={`w-6 h-6 bg-white rounded-full border-2 border-black flex items-center justify-center transition-all duration-300 ${
                mood === 'excited' ? 'animate-ping' : mood === 'thinking' ? 'animate-bounce' : ''
              }`}>
                <div className="w-3 h-3 bg-black rounded-full"></div>
              </div>
            </div>
            
            {/* Mouth */}
            <div className={`w-8 h-4 bg-black rounded-full transition-all duration-300 ${
              mood === 'excited' ? 'bg-[#C0FF00] animate-pulse' : mood === 'thinking' ? 'w-6 h-2' : ''
            }`}></div>
          </div>
          
          <div className={`w-16 h-16 bg-black rounded-full border-4 border-white/70 ${isActive ? 'animate-spin' : ''}`}>
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-black rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Cassette label */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white rounded-xl px-4 py-1 border-2 border-black">
          <div className="text-black font-bold text-sm">{currentPlayer.name}'s Timeline</div>
        </div>
      </div>
    </div>
  );
}

function HostTimelineDisplay({ 
  currentPlayer, 
  isActive, 
  placementResult 
}: { 
  currentPlayer: Player; 
  isActive: boolean;
  placementResult?: { correct: boolean; song: Song };
}) {
  const [visibleCards, setVisibleCards] = useState(0);
  const [newCardIndex, setNewCardIndex] = useState<number | null>(null);
  const cardCount = currentPlayer.timeline.length;
  const gapSize = Math.max(16, 60 - cardCount * 3);

  useEffect(() => {
    if (isActive) {
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setVisibleCards(count);
        if (count >= cardCount) clearInterval(interval);
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setVisibleCards(0);
    }
  }, [isActive, cardCount]);

  useEffect(() => {
    if (currentPlayer.timeline.length > 0 && placementResult) {
      const newIndex = currentPlayer.timeline.findIndex(
        song => song.id === placementResult.song.id
      );
      if (newIndex >= 0) {
        setNewCardIndex(newIndex);
        setTimeout(() => setNewCardIndex(null), 3000);
      }
    }
  }, [currentPlayer.timeline, placementResult]);

  return (
    <div className="space-y-8">
      {/* MTV Cassette */}
      <MTVCassette currentPlayer={currentPlayer} isActive={!!placementResult} />
      
      {/* Timeline cards */}
      <div 
        className={`flex justify-center items-center transition-all duration-1000 ${
          isActive ? 'animate-slide-in-up' : 'animate-slide-out-down'
        }`}
        style={{ gap: `${gapSize}px` }}
      >
        {currentPlayer.timeline.length === 0 ? (
          <div className={`relative transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-gradient-to-r from-[#FF2A7F] to-[#00F0FF] p-1 rounded-3xl">
              <div className="bg-[#0D0D1D] rounded-3xl px-8 py-6">
                <div className="text-white/80 font-bold text-xl text-center" style={{fontFamily: 'Fredoka One, cursive'}}>
                  🎯 {currentPlayer.name} is ready to rock! 🎯
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 text-3xl animate-bounce">🎸</div>
            <div className="absolute -bottom-4 -left-4 text-3xl animate-spin" style={{animationDuration: '3s'}}>🎵</div>
          </div>
        ) : (
          currentPlayer.timeline.map((song, index) => (
            <div 
              key={song.id}
              className={`transition-all duration-900 ${
                index < visibleCards ? 'opacity-100 scale-100 animate-bounce-in' : 'opacity-0 scale-60'
              } ${newCardIndex === index ? 'animate-epic-card-slam' : ''}`}
              style={{
                transitionDelay: `${index * 150}ms`,
                transformOrigin: 'bottom center'
              }}
            >
              <HostTimelineCard 
                song={song} 
                isActive={placementResult?.song.id === song.id}
              />
            </div>
          ))
        )}
      </div>
      
      {/* Result feedback */}
      {placementResult && (
        <div className="text-center animate-result-explosion">
          <div className={`text-6xl font-black mb-4 ${
            placementResult.correct ? 'text-[#C0FF00] animate-victory-dance' : 'text-[#FF2A7F] animate-gentle-shake'
          }`} style={{fontFamily: 'Fredoka One, cursive'}}>
            {placementResult.correct ? (
              <div className="flex items-center justify-center gap-4">
                <span className="text-8xl">🎯</span>
                <span>BOOM!</span>
                <span className="text-8xl">🔥</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <span className="text-8xl">💫</span>
                <span>SO CLOSE!</span>
                <span className="text-8xl">🎵</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes slide-in-up {
          0% {
            transform: translateY(100px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-out-down {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(100px);
            opacity: 0;
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0.3) translateY(-50px);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) translateY(-10px);
          }
          70% {
            transform: scale(0.9) translateY(0);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes result-explosion {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes victory-dance {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }
        
        @keyframes gentle-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-slide-in-up {
          animation: slide-in-up 1s ease-out forwards;
        }
        
        .animate-slide-out-down {
          animation: slide-out-down 1s ease-in forwards;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-result-explosion {
          animation: result-explosion 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .animate-victory-dance {
          animation: victory-dance 1s ease-in-out infinite;
        }
        
        .animate-gentle-shake {
          animation: gentle-shake 0.5s ease-in-out 3;
        }
      `}</style>
    </div>
  );
}

export function HostGameView({
  currentTurnPlayer,
  previousPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult,
  transitioning
}: {
  currentTurnPlayer: Player;
  previousPlayer?: Player;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  transitioning: boolean;
}) {
  const [displayedPlayer, setDisplayedPlayer] = useState(currentTurnPlayer);
  const [showResultModal, setShowResultModal] = useState(false);
  
  useEffect(() => {
    if (cardPlacementResult) {
      setShowResultModal(true);
      const timer = setTimeout(() => {
        setShowResultModal(false);
        setDisplayedPlayer(currentTurnPlayer);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setDisplayedPlayer(currentTurnPlayer);
    }
  }, [currentTurnPlayer, cardPlacementResult]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <HostGameBackground />
      <HostHeader roomCode={roomCode} playersCount={players.length} />
      <RecordPlayerSection 
        currentSong={currentSong}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        cardPlacementResult={cardPlacementResult}
      />
      
      <div className="absolute top-1/2 left-0 right-0 z-30 mt-20">
        <div className="flex justify-center">
          <HostTimelineDisplay 
            currentPlayer={displayedPlayer} 
            isActive={true}
            placementResult={cardPlacementResult}
          />
        </div>
      </div>

      {/* MTV-style result modal */}
      {showResultModal && cardPlacementResult && (
        <div className="fixed inset-0 bg-gradient-to-br from-[#0D0D1D]/95 via-[#1A1A2E]/95 to-[#16213E]/95 backdrop-blur-3xl flex items-center justify-center z-50 animate-modal-slam">
          <div className="text-center space-y-8 p-12 animate-content-bounce">
            {/* Giant emoji with effects */}
            <div className="relative">
              <div className={`text-[200px] ${
                cardPlacementResult.correct ? 'animate-mega-bounce' : 'animate-gentle-float'
              }`}>
                {cardPlacementResult.correct ? '🎯' : '💫'}
              </div>
              {cardPlacementResult.correct && (
                <>
                  <div className="absolute top-0 left-0 text-6xl animate-confetti-1">🎉</div>
                  <div className="absolute top-0 right-0 text-6xl animate-confetti-2">✨</div>
                  <div className="absolute bottom-0 left-0 text-6xl animate-confetti-3">🔥</div>
                  <div className="absolute bottom-0 right-0 text-6xl animate-confetti-4">⭐</div>
                </>
              )}
            </div>
            
            {/* MTV-style title */}
            <div className="relative">
              <div className={`text-8xl font-black tracking-tight ${
                cardPlacementResult.correct ? 
                'text-transparent bg-clip-text bg-gradient-to-r from-[#C0FF00] via-[#00F0FF] to-[#FF2A7F] animate-neon-pulse' : 
                'text-transparent bg-clip-text bg-gradient-to-r from-[#FF2A7F] via-[#00F0FF] to-[#C0FF00] animate-gentle-glow'
              }`} style={{fontFamily: 'Fredoka One, cursive'}}>
                {cardPlacementResult.correct ? 'PERFECT!' : 'SO CLOSE!'}
              </div>
              {cardPlacementResult.correct && (
                <div className="absolute -top-4 -right-4 text-4xl animate-bounce">🏆</div>
              )}
            </div>
            
            {/* Song info card */}
            <div className="bg-gradient-to-r from-[#FF2A7F] to-[#00F0FF] p-2 rounded-3xl shadow-2xl animate-card-float">
              <div className="bg-[#0D0D1D] rounded-3xl p-8 border-4 border-white/20">
                <div className="text-4xl font-bold text-white mb-4">
                  {cardPlacementResult.song.deezer_title}
                </div>
                <div className="text-3xl text-white/90 mb-6 font-medium">
                  by {cardPlacementResult.song.deezer_artist}
                </div>
                <div className="inline-block bg-gradient-to-r from-[#C0FF00] to-[#00F0FF] text-[#0D0D1D] px-8 py-4 rounded-full font-black text-4xl shadow-2xl">
                  {cardPlacementResult.song.release_year}
                </div>
              </div>
            </div>
            
            {/* Player feedback */}
            <div className="text-white/80 text-3xl font-bold animate-text-slide-up" style={{fontFamily: 'Fredoka One, cursive'}}>
              {cardPlacementResult.correct ? 
                `🔥 ${currentTurnPlayer.name} is ON FIRE! 🔥` : 
                `💪 Keep rockin', ${currentTurnPlayer.name}! 💪`
              }
            </div>
          </div>
          
          <style jsx global>{`
            @keyframes modal-slam {
              0% {
                opacity: 0;
                transform: scale(0.3) rotate(-10deg);
                filter: blur(20px);
              }
              100% {
                opacity: 1;
                transform: scale(1) rotate(0deg);
                filter: blur(0px);
              }
            }
            
            @keyframes content-bounce {
              0% {
                transform: scale(0.5) translateY(100px);
                opacity: 0;
              }
              60% {
                transform: scale(1.1) translateY(-20px);
                opacity: 1;
              }
              100% {
                transform: scale(1) translateY(0);
                opacity: 1;
              }
            }
            
            @keyframes mega-bounce {
              0%, 20%, 50%, 80%, 100% {
                transform: translateY(0) scale(1) rotate(0deg);
              }
              40% {
                transform: translateY(-40px) scale(1.2) rotate(-10deg);
              }
              60% {
                transform: translateY(-20px) scale(1.1) rotate(5deg);
              }
            }
            
            @keyframes neon-pulse {
              0%, 100% {
                filter: brightness(1) drop-shadow(0 0 20px currentColor);
              }
              50% {
                filter: brightness(1.5) drop-shadow(0 0 40px currentColor);
              }
            }
            
            @keyframes card-float {
              0%, 100% {
                transform: translateY(0) rotate(0deg);
              }
              50% {
                transform: translateY(-10px) rotate(1deg);
              }
            }
            
            @keyframes confetti-1 {
              0% { transform: translateY(0) rotate(0deg); }
              100% { transform: translateY(-100px) rotate(360deg); }
            }
            
            @keyframes confetti-2 {
              0% { transform: translateY(0) rotate(0deg); }
              100% { transform: translateY(-80px) rotate(-360deg); }
            }
            
            @keyframes confetti-3 {
              0% { transform: translateY(0) rotate(0deg); }
              100% { transform: translateY(-60px) rotate(180deg); }
            }
            
            @keyframes confetti-4 {
              0% { transform: translateY(0) rotate(0deg); }
              100% { transform: translateY(-90px) rotate(-180deg); }
            }
            
            .animate-modal-slam {
              animation: modal-slam 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            
            .animate-content-bounce {
              animation: content-bounce 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            
            .animate-mega-bounce {
              animation: mega-bounce 2s ease-in-out infinite;
            }
            
            .animate-neon-pulse {
              animation: neon-pulse 2s ease-in-out infinite;
            }
            
            .animate-card-float {
              animation: card-float 3s ease-in-out infinite;
            }
            
            .animate-confetti-1 {
              animation: confetti-1 1.5s ease-out infinite;
            }
            
            .animate-confetti-2 {
              animation: confetti-2 1.8s ease-out infinite;
            }
            
            .animate-confetti-3 {
              animation: confetti-3 2s ease-out infinite;
            }
            
            .animate-confetti-4 {
              animation: confetti-4 1.3s ease-out infinite;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
