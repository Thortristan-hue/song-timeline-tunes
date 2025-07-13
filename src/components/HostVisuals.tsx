import React, { useEffect, useState } from 'react';
import { Users, Play, Pause, Music, Star, Sparkles } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { Button } from '@/components/ui/button';

// Background component with MTV-style elements
function MTVBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black overflow-hidden">
      {/* Scattered decorative icons */}
      <div className="absolute top-20 left-10 opacity-10">
        <Star className="w-8 h-8 text-white animate-pulse" />
      </div>
      <div className="absolute top-40 right-20 opacity-10">
        <Sparkles className="w-6 h-6 text-white animate-bounce" style={{animationDelay: '0.5s'}} />
      </div>
      <div className="absolute bottom-32 left-20 opacity-10">
        <Music className="w-10 h-10 text-white animate-pulse" style={{animationDelay: '1s'}} />
      </div>
      <div className="absolute bottom-20 right-32 opacity-10">
        <div className="text-2xl animate-bounce" style={{animationDelay: '1.5s'}}>♪</div>
      </div>
      <div className="absolute top-60 left-1/4 opacity-10">
        <div className="text-xl animate-pulse" style={{animationDelay: '0.8s'}}>✨</div>
      </div>
      <div className="absolute top-32 right-1/3 opacity-10">
        <div className="text-lg animate-bounce" style={{animationDelay: '2s'}}>🎵</div>
      </div>
    </div>
  );
}

// Header component
function GameHeader({ roomCode, playersCount }: { roomCode: string; playersCount: number }) {
  return (
    <div className="flex justify-between items-center p-6">
      {/* Logo with rainbow gradient */}
      <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-yellow-300 to-lime-300 bg-clip-text text-transparent" 
           style={{fontFamily: 'Luckiest Guy, cursive'}}>
        Timeliner
      </div>
      
      {/* Right side info */}
      <div className="flex items-center gap-4">
        {/* Player count pill */}
        <div className="bg-cyan-400 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
          <Users className="w-4 h-4" />
          <span className="font-semibold">{playersCount}</span>
        </div>
        
        {/* Room code badge */}
        <div className="bg-lime-300 text-black px-4 py-2 rounded-full font-mono font-bold shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
          {roomCode}
        </div>
      </div>
    </div>
  );
}

// Spinning vinyl disc component
function VinylDisc({ isPlaying, onPlayPause }: { isPlaying: boolean; onPlayPause: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Vinyl record */}
      <div className="relative">
        <div 
          className={`w-32 h-32 bg-gradient-to-br from-gray-800 to-black rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.3)] border-4 border-gray-700 cursor-pointer hover:scale-105 transition-transform ${
            isPlaying ? 'animate-spin-slow' : ''
          }`}
          onClick={onPlayPause}
        >
          {/* Vinyl grooves */}
          <div className="absolute inset-4 border border-gray-600 rounded-full"></div>
          <div className="absolute inset-6 border border-gray-600 rounded-full"></div>
          <div className="absolute inset-8 border border-gray-600 rounded-full"></div>
          
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mystery song text */}
      <div className="text-2xl text-white text-center" style={{fontFamily: 'Luckiest Guy, cursive'}}>
        🎵 Mystery Song Playing! 🎵
      </div>
      
      {/* Optional action button */}
      <Button className="rounded-xl bg-white text-black px-4 py-2 shadow-[0_5px_15px_rgba(0,0,0,0.3)] hover:bg-yellow-200 font-semibold transition-colors">
        Let's do this!
      </Button>
    </div>
  );
}

// Individual song guess card
function SongCard({ song, onSelect, isSelected }: { 
  song: Song; 
  onSelect: () => void; 
  isSelected: boolean;
}) {
  // Get decade and corresponding color
  const decade = Math.floor(song.release_year / 10) * 10;
  const getDecadeInfo = (decade: number) => {
    const info = {
      1970: { color: 'bg-yellow-400', label: '70s' },
      1980: { color: 'bg-pink-400', label: '80s' },
      1990: { color: 'bg-cyan-400', label: '90s' },
      2000: { color: 'bg-orange-400', label: '00s' },
      2010: { color: 'bg-green-400', label: '10s' },
      2020: { color: 'bg-purple-400', label: '20s' },
    };
    return info[decade as keyof typeof info] || { color: 'bg-gray-400', label: `${decade}s` };
  };
  
  const decadeInfo = getDecadeInfo(decade);
  
  return (
    <div 
      className={`relative rounded-2xl bg-neutral-800 text-white p-6 cursor-pointer transition-all duration-200 shadow-[0_5px_15px_rgba(0,0,0,0.3)] hover:scale-105 hover:shadow-[0_8px_25px_rgba(0,0,0,0.4)] group ${
        isSelected ? 'ring-4 ring-cyan-400 bg-neutral-700' : ''
      }`}
      onClick={onSelect}
      title={`${song.deezer_title} by ${song.deezer_artist}`}
    >
      {/* Decade chip in top-right */}
      <div className={`absolute -top-2 -right-2 ${decadeInfo.color} text-black text-xs font-bold px-2 py-1 rounded-full shadow-md`}>
        {decadeInfo.label}
      </div>
      
      {/* Card content */}
      <div className="flex flex-col items-center text-center space-y-3">
        {/* Artist name */}
        <div className="text-sm text-gray-300 font-medium truncate w-full">
          {song.deezer_artist}
        </div>
        
        {/* Year - large and prominent */}
        <div className="text-3xl font-bold text-white">
          {song.release_year}
        </div>
        
        {/* Song title (visible on hover) */}
        <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
          {song.deezer_title}
        </div>
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl bg-cyan-400/20 animate-pulse"></div>
      )}
    </div>
  );
}

// Cartoon cassette character
function CassetteCharacter({ mood = 'neutral' }: { mood?: 'neutral' | 'excited' | 'thinking' }) {
  const [speechText, setSpeechText] = useState("Let's guess some tunes!");
  
  const speechOptions = {
    neutral: ["Let's guess some tunes!", "Pick your best guess!", "You got this!"],
    excited: ["Awesome choice!", "You're on fire!", "Keep it up!"],
    thinking: ["Hmm, tricky one!", "Take your time!", "Think it through!"]
  };
  
  useEffect(() => {
    const phrases = speechOptions[mood];
    setSpeechText(phrases[Math.floor(Math.random() * phrases.length)]);
  }, [mood]);
  
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Speech bubble */}
      <div className="relative bg-white rounded-2xl px-4 py-2 shadow-[0_5px_15px_rgba(0,0,0,0.3)] animate-bounce">
        <div className="text-black font-semibold text-sm whitespace-nowrap">
          {speechText}
        </div>
        {/* Speech bubble tail */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-white"></div>
      </div>
      
      {/* Cassette body */}
      <div className="relative bg-pink-500 rounded-xl p-4 shadow-[0_5px_15px_rgba(0,0,0,0.3)] w-24 h-16">
        {/* Cassette reels */}
        <div className="flex justify-between items-center h-full">
          <div className={`w-4 h-4 bg-gray-800 rounded-full ${mood === 'excited' ? 'animate-spin' : ''}`}></div>
          <div className={`w-4 h-4 bg-gray-800 rounded-full ${mood === 'excited' ? 'animate-spin' : ''}`}></div>
        </div>
        
        {/* Cassette eyes */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 flex gap-1">
          <div className={`w-2 h-2 bg-white rounded-full ${mood === 'excited' ? 'animate-pulse' : ''}`}>
            <div className="w-1 h-1 bg-black rounded-full m-0.5"></div>
          </div>
          <div className={`w-2 h-2 bg-white rounded-full ${mood === 'excited' ? 'animate-pulse' : ''}`}>
            <div className="w-1 h-1 bg-black rounded-full m-0.5"></div>
          </div>
        </div>
        
        {/* Cassette mouth */}
        <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-black rounded-full ${
          mood === 'excited' ? 'bg-yellow-400' : ''
        }`}></div>
      </div>
    </div>
  );
}

// Main game view component
export function GameView({
  currentSong,
  songOptions,
  roomCode,
  playersCount,
  isPlaying,
  onPlayPause,
  onSongSelect,
  selectedSongId,
  gameState
}: {
  currentSong: Song | null;
  songOptions: Song[];
  roomCode: string;
  playersCount: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSongSelect: (songId: string) => void;
  selectedSongId: string | null;
  gameState: 'playing' | 'waiting' | 'results';
}) {
  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <MTVBackground />
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <GameHeader roomCode={roomCode} playersCount={playersCount} />
        
        {/* Center stage */}
        <div className="flex flex-col items-center mt-8 mb-12">
          <VinylDisc isPlaying={isPlaying} onPlayPause={onPlayPause} />
        </div>
        
        {/* Song guess cards */}
        <div className="px-6 mb-8">
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {songOptions.map((song) => (
              <div key={song.id} className="w-48">
                <SongCard 
                  song={song}
                  onSelect={() => onSongSelect(song.id)}
                  isSelected={selectedSongId === song.id}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Cassette character */}
        <div className="flex justify-center pb-8">
          <CassetteCharacter 
            mood={gameState === 'results' ? 'excited' : selectedSongId ? 'thinking' : 'neutral'} 
          />
        </div>
      </div>
      
      {/* Custom animations */}
      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap');
      `}</style>
    </div>
  );
}
