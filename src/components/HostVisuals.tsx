import React, { useEffect, useState } from 'react';
import { Users, Play, Pause, Music, Star, Sparkles } from 'lucide-react';

// Mock types (replace with your actual types)
interface Song {
  id: string;
  deezer_title: string;
  deezer_artist: string;
  release_year: number;
}

// Graffiti-style background with urban elements
function GraffitiBackground() {
  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {/* Spray paint splashes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gray-600 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gray-500 rounded-full opacity-15 blur-lg"></div>
      <div className="absolute bottom-32 left-20 w-40 h-40 bg-gray-700 rounded-full opacity-10 blur-2xl"></div>
      <div className="absolute bottom-20 right-32 w-28 h-28 bg-gray-600 rounded-full opacity-25 blur-xl"></div>
      
      {/* Scratched lines */}
      <div className="absolute top-0 left-1/4 w-1 h-full bg-gray-600 opacity-20 transform rotate-12"></div>
      <div className="absolute top-0 right-1/3 w-1 h-full bg-gray-500 opacity-15 transform -rotate-6"></div>
      <div className="absolute top-0 left-2/3 w-1 h-full bg-gray-700 opacity-10 transform rotate-3"></div>
      
      {/* Distressed texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-900/5 to-transparent"></div>
    </div>
  );
}

// Distressed text component
function DistressedText({ 
  children, 
  className = "", 
  size = "text-4xl" 
}: { 
  children: React.ReactNode; 
  className?: string; 
  size?: string; 
}) {
  return (
    <div className={`${size} font-black text-gray-300 ${className}`}
         style={{
           fontFamily: 'Impact, Arial Black, sans-serif',
           textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(255,255,255,0.1)',
           letterSpacing: '0.1em',
           filter: 'contrast(1.2) brightness(0.9)'
         }}>
      {children}
    </div>
  );
}

// Header component with graffiti styling
function GameHeader({ roomCode, playersCount }: { roomCode: string; playersCount: number }) {
  return (
    <div className="flex justify-between items-center p-6">
      {/* Graffiti-style logo */}
      <div className="relative">
        <DistressedText size="text-6xl" className="transform -rotate-1">
          TIMELINER
        </DistressedText>
        {/* Underline scratch */}
        <div className="absolute -bottom-2 left-0 w-full h-1 bg-gray-600 opacity-60 transform rotate-1"></div>
      </div>
      
      {/* Right side info with distressed styling */}
      <div className="flex items-center gap-4">
        {/* Player count with graffiti box */}
        <div className="relative bg-gray-800 border-2 border-gray-600 px-4 py-2 transform rotate-1"
             style={{
               clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
               boxShadow: '3px 3px 6px rgba(0,0,0,0.8)'
             }}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-300" />
            <DistressedText size="text-lg" className="text-gray-300">
              {playersCount}
            </DistressedText>
          </div>
        </div>
        
        {/* Room code with spray paint effect */}
        <div className="relative bg-gray-700 border-2 border-gray-500 px-4 py-2 transform -rotate-1"
             style={{
               clipPath: 'polygon(0% 0%, 95% 0%, 100% 100%, 5% 100%)',
               boxShadow: '3px 3px 6px rgba(0,0,0,0.8)'
             }}>
          <DistressedText size="text-lg" className="text-gray-200 font-mono">
            {roomCode}
          </DistressedText>
        </div>
      </div>
    </div>
  );
}

// Distressed vinyl disc component
function DistressedVinyl({ isPlaying, onPlayPause }: { isPlaying: boolean; onPlayPause: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Distressed vinyl record */}
      <div className="relative">
        <div 
          className={`w-40 h-40 bg-gray-800 rounded-full cursor-pointer hover:scale-105 transition-transform border-4 border-gray-600 ${
            isPlaying ? 'animate-spin-slow' : ''
          }`}
          onClick={onPlayPause}
          style={{
            boxShadow: '0 0 20px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.1)',
            background: 'radial-gradient(circle, #2d2d2d 30%, #1a1a1a 70%)'
          }}
        >
          {/* Scratched grooves */}
          <div className="absolute inset-4 border-2 border-gray-600 rounded-full opacity-80"></div>
          <div className="absolute inset-6 border border-gray-600 rounded-full opacity-60"></div>
          <div className="absolute inset-8 border border-gray-600 rounded-full opacity-40"></div>
          <div className="absolute inset-10 border border-gray-600 rounded-full opacity-20"></div>
          
          {/* Distressed center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-500"
                 style={{
                   boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                 }}>
              {isPlaying ? (
                <Pause className="w-6 h-6 text-gray-300" />
              ) : (
                <Play className="w-6 h-6 text-gray-300 ml-1" />
              )}
            </div>
          </div>
          
          {/* Scratch marks */}
          <div className="absolute top-4 left-8 w-16 h-0.5 bg-gray-600 opacity-60 transform rotate-45"></div>
          <div className="absolute bottom-6 right-10 w-12 h-0.5 bg-gray-600 opacity-40 transform -rotate-12"></div>
        </div>
      </div>
      
      {/* Graffiti-style text */}
      <DistressedText size="text-3xl" className="text-center transform rotate-1">
        MYSTERY TRACK
      </DistressedText>
      
      {/* Distressed action button */}
      <div className="relative">
        <button className="bg-gray-700 border-2 border-gray-500 px-6 py-3 transform -rotate-1 hover:bg-gray-600 transition-colors"
                style={{
                  clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)',
                  boxShadow: '3px 3px 6px rgba(0,0,0,0.8)'
                }}>
          <DistressedText size="text-lg" className="text-gray-200">
            LETS GO!
          </DistressedText>
        </button>
      </div>
    </div>
  );
}

// Graffiti-style song card
function GraffitiSongCard({ song, onSelect, isSelected }: { 
  song: Song; 
  onSelect: () => void; 
  isSelected: boolean;
}) {
  const decade = Math.floor(song.release_year / 10) * 10;
  const getDecadeColor = (decade: number) => {
    const colors = {
      1970: '#666666',
      1980: '#777777',
      1990: '#888888',
      2000: '#999999',
      2010: '#aaaaaa',
      2020: '#bbbbbb',
    };
    return colors[decade as keyof typeof colors] || '#666666';
  };
  
  return (
    <div 
      className={`relative bg-gray-800 border-2 border-gray-600 p-4 cursor-pointer transition-all duration-200 hover:scale-105 transform ${
        isSelected ? 'border-gray-400 bg-gray-700' : ''
      }`}
      onClick={onSelect}
      style={{
        clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
        boxShadow: '3px 3px 6px rgba(0,0,0,0.8)',
        transform: `rotate(${Math.random() * 4 - 2}deg) ${isSelected ? 'scale(1.05)' : ''}`
      }}
    >
      {/* Decade tag */}
      <div className="absolute -top-2 -right-2 bg-gray-600 border border-gray-500 px-2 py-1 text-xs"
           style={{
             clipPath: 'polygon(0% 0%, 90% 0%, 100% 100%, 10% 100%)',
             color: getDecadeColor(decade)
           }}>
        <DistressedText size="text-xs" className="font-black">
          {decade}s
        </DistressedText>
      </div>
      
      {/* Card content */}
      <div className="flex flex-col items-center text-center space-y-2">
        {/* Artist name */}
        <DistressedText size="text-sm" className="text-gray-400 truncate w-full">
          {song.deezer_artist}
        </DistressedText>
        
        {/* Year - distressed and prominent */}
        <DistressedText size="text-4xl" className="text-gray-300">
          {song.release_year}
        </DistressedText>
        
        {/* Song title */}
        <DistressedText size="text-xs" className="text-gray-500 truncate w-full opacity-80">
          {song.deezer_title}
        </DistressedText>
      </div>
      
      {/* Selection glow */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-gray-400 animate-pulse"
             style={{
               clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
               boxShadow: '0 0 15px rgba(156, 163, 175, 0.5)'
             }}>
        </div>
      )}
      
      {/* Distressed scratches */}
      <div className="absolute top-2 left-2 w-8 h-0.5 bg-gray-600 opacity-40 transform rotate-45"></div>
      <div className="absolute bottom-2 right-2 w-6 h-0.5 bg-gray-600 opacity-30 transform -rotate-12"></div>
    </div>
  );
}

// Graffiti-style character
function GraffitiCharacter({ mood = 'neutral' }: { mood?: 'neutral' | 'excited' | 'thinking' }) {
  const [speechText, setSpeechText] = useState("PICK YOUR TRACK!");
  
  const speechOptions = {
    neutral: ["PICK YOUR TRACK!", "MAKE YOUR MOVE!", "WHAT'S IT GONNA BE?"],
    excited: ["NICE CHOICE!", "YOU'RE ON FIRE!", "KEEP IT UP!"],
    thinking: ["TOUGH ONE!", "TAKE YOUR TIME!", "THINK HARD!"]
  };
  
  useEffect(() => {
    const phrases = speechOptions[mood];
    setSpeechText(phrases[Math.floor(Math.random() * phrases.length)]);
  }, [mood]);
  
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Graffiti speech bubble */}
      <div className="relative bg-gray-800 border-2 border-gray-600 px-4 py-2 transform rotate-1"
           style={{
             clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)',
             boxShadow: '3px 3px 6px rgba(0,0,0,0.8)'
           }}>
        <DistressedText size="text-sm" className="text-gray-300 whitespace-nowrap">
          {speechText}
        </DistressedText>
        {/* Speech bubble tail */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-gray-600"></div>
      </div>
      
      {/* Distressed cassette body */}
      <div className="relative bg-gray-700 border-2 border-gray-500 p-4 w-28 h-20 transform -rotate-1"
           style={{
             clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
             boxShadow: '3px 3px 6px rgba(0,0,0,0.8)'
           }}>
        {/* Cassette reels */}
        <div className="flex justify-between items-center h-full">
          <div className={`w-5 h-5 bg-gray-900 rounded-full border border-gray-600 ${mood === 'excited' ? 'animate-spin' : ''}`}></div>
          <div className={`w-5 h-5 bg-gray-900 rounded-full border border-gray-600 ${mood === 'excited' ? 'animate-spin' : ''}`}></div>
        </div>
        
        {/* Cassette eyes */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 flex gap-2">
          <div className={`w-2 h-2 bg-gray-400 rounded-full ${mood === 'excited' ? 'animate-pulse' : ''}`}>
            <div className="w-1 h-1 bg-black rounded-full m-0.5"></div>
          </div>
          <div className={`w-2 h-2 bg-gray-400 rounded-full ${mood === 'excited' ? 'animate-pulse' : ''}`}>
            <div className="w-1 h-1 bg-black rounded-full m-0.5"></div>
          </div>
        </div>
        
        {/* Cassette mouth */}
        <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-gray-900 rounded-full ${
          mood === 'excited' ? 'bg-gray-400' : ''
        }`}></div>
        
        {/* Scratches on cassette */}
        <div className="absolute top-2 left-2 w-6 h-0.5 bg-gray-600 opacity-60 transform rotate-45"></div>
        <div className="absolute bottom-2 right-2 w-4 h-0.5 bg-gray-600 opacity-40 transform -rotate-30"></div>
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
  // Mock song data for demonstration
  const mockSongs = [
    { id: '1', deezer_title: 'Bohemian Rhapsody', deezer_artist: 'Queen', release_year: 1975 },
    { id: '2', deezer_title: 'Billie Jean', deezer_artist: 'Michael Jackson', release_year: 1982 },
    { id: '3', deezer_title: 'Smells Like Teen Spirit', deezer_artist: 'Nirvana', release_year: 1991 },
    { id: '4', deezer_title: 'Hey Ya!', deezer_artist: 'OutKast', release_year: 2003 },
    { id: '5', deezer_title: 'Rolling in the Deep', deezer_artist: 'Adele', release_year: 2010 },
    { id: '6', deezer_title: 'Blinding Lights', deezer_artist: 'The Weeknd', release_year: 2019 }
  ];
  
  const songsToDisplay = songOptions.length > 0 ? songOptions : mockSongs;
  
  return (
    <div className="min-h-screen relative">
      {/* Graffiti background */}
      <GraffitiBackground />
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <GameHeader roomCode={roomCode || "DEMO"} playersCount={playersCount || 4} />
        
        {/* Center stage */}
        <div className="flex flex-col items-center mt-8 mb-12">
          <DistressedVinyl isPlaying={isPlaying} onPlayPause={onPlayPause} />
        </div>
        
        {/* Song guess cards */}
        <div className="px-6 mb-8">
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
            {songsToDisplay.map((song) => (
              <div key={song.id} className="w-52">
                <GraffitiSongCard 
                  song={song}
                  onSelect={() => onSongSelect(song.id)}
                  isSelected={selectedSongId === song.id}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Graffiti character */}
        <div className="flex justify-center pb-8">
          <GraffitiCharacter 
            mood={gameState === 'results' ? 'excited' : selectedSongId ? 'thinking' : 'neutral'} 
          />
        </div>
      </div>
      
      {/* Custom animations and styles */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        /* Distressed text effect */
        .distressed-text {
          position: relative;
        }
        
        .distressed-text::before {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          color: rgba(255, 255, 255, 0.1);
          transform: translate(1px, 1px);
          z-index: -1;
        }
        
        /* Gritty texture overlay */
        body {
          background: radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.05) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.05) 0%, transparent 50%),
                      radial-gradient(circle at 40% 80%, rgba(120, 199, 255, 0.05) 0%, transparent 50%);
        }
      `}</style>
    </div>
  );
}
