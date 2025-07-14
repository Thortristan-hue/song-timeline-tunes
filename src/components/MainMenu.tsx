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
        {/* Neon glow effects */}
        <div className="absolute top-20 left-20 w-40 h-40 bg-cerulean-500/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-32 w-60 h-60 bg-fandango-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-honeydew-500/15 rounded-full blur-3xl" />
        
        {/* Artistic Elements */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" fill="none">
          <circle cx="200" cy="600" r="80" stroke="#107793" strokeWidth="2" />
          <circle cx="1000" cy="200" r="60" stroke="#a53b8b" strokeWidth="2" />
          <rect x="400" y="300" width="300" height="150" rx="20" stroke="#d9e8dd" strokeWidth="2" transform="rotate(10 550 375)" />
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
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight">
            RYTHMY
          </h1>
          
          <p className="text-lg sm:text-xl text-honeydew-300 max-w-3xl mx-auto leading-relaxed">
            Dive into the world of music history! Challenge your friends, guess song release years, and build the ultimate timeline. This game is all about fun, not profits—just good vibes and great music!
          </p>
        </div>

        {/* Main Action Buttons with Revamped Layout */}
        <div className="w-full max-w-lg mb-20">
          <div className="flex flex-col sm:flex-row gap-6">
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
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-20">
          <Card className="bg-rich_black-400/80 border-2 border-honeydew-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <Users className="h-10 w-10 text-honeydew-300 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Multiplayer Fun</h3>
            <p className="text-honeydew-400 text-sm">Challenge up to 8 friends</p>
          </Card>
          
          <Card className="bg-rich_black-400/80 border-2 border-cerulean-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <Music className="h-10 w-10 text-cerulean-300 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Spotify Playlists</h3>
            <p className="text-cerulean-400 text-sm">Create unique challenges</p>
          </Card>
          
          <Card className="bg-rich_black-400/80 border-2 border-fandango-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <Timer className="h-10 w-10 text-fandango-300 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Quick Rounds</h3>
            <p className="text-fandango-400 text-sm">30-second previews</p>
          </Card>

          <Card className="bg-rich_black-400/80 border-2 border-honeydew-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <Trophy className="h-10 w-10 text-honeydew-300 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Win the Game</h3>
            <p className="text-honeydew-400 text-sm">First to 10 wins</p>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-honeydew-300 text-sm font-medium">
            Powered by Spotify • Built for fun
          </p>
          <p className="text-honeydew-500 text-xs max-w-md mx-auto leading-relaxed">
            Rythmy is a community-driven game designed to bring people together through music. No ads, no profits—just pure entertainment.
          </p>
        </footer>
      </div>
    </div>
  );
}
