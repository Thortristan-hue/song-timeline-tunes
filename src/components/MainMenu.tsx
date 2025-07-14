import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Users, Trophy, Timer, Play, Smartphone } from 'lucide-react';

interface MainMenuProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function MainMenu({ onCreateRoom, onJoinRoom }: MainMenuProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rich_black-500 via-rich_black-600 to-charcoal-500 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        {/* Neon glow effects for visual appeal */}
        <div className="absolute top-20 left-20 w-40 h-40 bg-cerulean-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-32 w-60 h-60 bg-fandango-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-honeydew-500/15 rounded-full blur-3xl" />
        
        {/* Abstract shapes inspired by record players and cassette tapes */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none">
          <circle cx="100" cy="700" r="50" stroke="#107793" strokeWidth="3" />
          <circle cx="1100" cy="100" r="40" stroke="#a53b8b" strokeWidth="2" />
          <rect x="400" y="300" width="300" height="200" rx="20" stroke="#d9e8dd" strokeWidth="2" transform="rotate(15 550 400)" />
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
        
        {/* Header Section */}
        <div className="text-center max-w-6xl mx-auto mb-16">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-cerulean-500 rounded-3xl blur-lg opacity-40" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-rich_black-400 to-charcoal-500 border-3 border-cerulean-500 rounded-3xl flex items-center justify-center shadow-2xl">
                <Music className="h-12 w-12 text-cerulean-400" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-honeydew-100 mb-6 tracking-tight" 
              style={{ textShadow: '3px 3px 0px rgba(14,31,47,0.8)' }}>
            RYTHMY
          </h1>
          
          <p className="text-lg sm:text-xl text-honeydew-300 max-w-3xl mx-auto leading-relaxed">
            Challenge your music knowledge in this social multiplayer game. Place songs on the timeline and compete to be the music master!
          </p>
        </div>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 mb-12 w-full max-w-lg">
          {/* Join Room Button */}
          <Button
            onClick={onJoinRoom}
            className="w-full sm:w-auto flex-1 bg-gradient-to-r from-fandango-500 to-fandango-600 hover:from-fandango-400 hover:to-fandango-500 text-white h-14 text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl border-0 active:scale-95"
          >
            <Smartphone className="h-6 w-6 mr-3" />
            Join Room
          </Button>
          
          {/* Create Room Button */}
          <Button
            onClick={onCreateRoom}
            className="w-full sm:w-auto flex-1 bg-gradient-to-r from-cerulean-500 to-cerulean-600 hover:from-cerulean-400 hover:to-cerulean-500 text-white h-14 text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl border-0 active:scale-95"
          >
            <Play className="h-6 w-6 mr-3" />
            Create Room
          </Button>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-16">
          <Card className="bg-rich_black-400/80 border-2 border-honeydew-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <Users className="h-10 w-10 text-honeydew-300 mx-auto mb-3" />
            <h3 className="text-honeydew-200 font-bold text-lg mb-2">Multiplayer Fun</h3>
            <p className="text-honeydew-400 text-sm">Up to 8 players</p>
          </Card>
          
          <Card className="bg-rich_black-400/80 border-2 border-cerulean-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <Music className="h-10 w-10 text-cerulean-300 mx-auto mb-3" />
            <h3 className="text-cerulean-200 font-bold text-lg mb-2">Your Playlist</h3>
            <p className="text-cerulean-400 text-sm">Powered by Deezer</p>
          </Card>
          
          <Card className="bg-rich_black-400/80 border-2 border-fandango-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <Timer className="h-10 w-10 text-fandango-300 mx-auto mb-3" />
            <h3 className="text-fandango-200 font-bold text-lg mb-2">Quick Rounds</h3>
            <p className="text-fandango-400 text-sm">30 seconds</p>
          </Card>

          <Card className="bg-rich_black-400/80 border-2 border-honeydew-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <Trophy className="h-10 w-10 text-honeydew-300 mx-auto mb-3" />
            <h3 className="text-honeydew-200 font-bold text-lg mb-2">Victory</h3>
            <p className="text-honeydew-400 text-sm">First to 10 points</p>
          </Card>
        </div>
        
        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-honeydew-400 text-sm font-medium">
            Powered by Supabase and Deezer
          </p>
          <p className="text-honeydew-500 text-xs max-w-md mx-auto leading-relaxed">
            Rythmy brings people together with music and fun. Connect your playlists and start creating lasting memories today!
          </p>
        </footer>
      </div>
    </div>
  );
}
