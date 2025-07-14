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
    <div className="min-h-screen bg-gradient-to-br from-rich_black-700 via-rich_black-800 to-charcoal-700 relative overflow-hidden">
      {/* Enhanced Dark Background Effects */}
      <div className="absolute inset-0">
        {/* Main glow effects */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cerulean-500/15 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-fandango-500/15 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-honeydew-500/12 rounded-full blur-2xl animate-pulse" />
        
        {/* Additional scattered glows */}
        <div className="absolute top-16 right-16 w-24 h-24 bg-cerulean-500/8 rounded-full blur-xl" />
        <div className="absolute bottom-32 left-16 w-28 h-28 bg-fandango-500/8 rounded-full blur-xl" />
        <div className="absolute top-1/3 left-1/6 w-20 h-20 bg-honeydew-500/6 rounded-full blur-lg" />
        <div className="absolute bottom-1/3 right-1/6 w-32 h-32 bg-cerulean-500/6 rounded-full blur-lg" />
        
        {/* Geometric shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 800" fill="none">
          {/* Music note shapes */}
          <circle cx="150" cy="150" r="4" fill="#107793" opacity="0.3" />
          <circle cx="1050" cy="200" r="6" fill="#a53b8b" opacity="0.3" />
          <circle cx="300" cy="600" r="3" fill="#d9e8dd" opacity="0.3" />
          <circle cx="900" cy="650" r="5" fill="#107793" opacity="0.3" />
          
          {/* Connecting lines */}
          <path d="M150 150 L300 200 L450 180" stroke="#107793" strokeWidth="1" opacity="0.2" />
          <path d="M1050 200 L900 300 L800 280" stroke="#a53b8b" strokeWidth="1" opacity="0.2" />
          <path d="M300 600 L500 550 L700 570" stroke="#d9e8dd" strokeWidth="1" opacity="0.2" />
          
          {/* Abstract rectangles */}
          <rect x="800" y="100" width="60" height="20" rx="10" fill="#107793" opacity="0.1" transform="rotate(15 830 110)" />
          <rect x="200" y="400" width="80" height="15" rx="8" fill="#a53b8b" opacity="0.1" transform="rotate(-10 240 408)" />
          <rect x="600" y="700" width="50" height="25" rx="12" fill="#d9e8dd" opacity="0.1" transform="rotate(25 625 713)" />
          
          {/* Dotted patterns */}
          <g opacity="0.15">
            <circle cx="400" cy="120" r="2" fill="#107793" />
            <circle cx="420" cy="125" r="1.5" fill="#107793" />
            <circle cx="440" cy="130" r="2" fill="#107793" />
            <circle cx="460" cy="135" r="1.5" fill="#107793" />
          </g>
          
          <g opacity="0.15">
            <circle cx="700" cy="350" r="2" fill="#a53b8b" />
            <circle cx="720" cy="355" r="1.5" fill="#a53b8b" />
            <circle cx="740" cy="360" r="2" fill="#a53b8b" />
            <circle cx="760" cy="365" r="1.5" fill="#a53b8b" />
          </g>
        </svg>
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-gradient-to-r from-transparent via-white to-transparent mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3Ccircle cx='17' cy='37' r='1'/%3E%3Ccircle cx='37' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center pt-12 sm:pt-16 mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rich_black-400 border-2 border-cerulean-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Music className="h-8 w-8 sm:h-10 sm:w-10 text-cerulean-400" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
            RYTHMY
          </h1>
          
          <p className="text-base sm:text-lg text-honeydew-300 max-w-2xl mx-auto leading-relaxed">
            Guess when songs came out and build the perfect timeline. Play with friends, test your music knowledge, and see who's got the best ear for music history!
          </p>
        </div>

        {/* Main Buttons */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full mb-8">
          <div className="space-y-4">
            <Button
              onClick={onCreateRoom}
              className="w-full bg-gradient-to-r from-cerulean-500 to-cerulean-600 hover:from-cerulean-400 hover:to-cerulean-500 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg border-0 active:scale-95"
            >
              <Play className="h-5 w-5 mr-3" />
              Start a Game
            </Button>
            
            <Button
              onClick={onJoinRoom}
              className="w-full bg-gradient-to-r from-fandango-500 to-fandango-600 hover:from-fandango-400 hover:to-fandango-500 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg border-0 active:scale-95"
            >
              <Smartphone className="h-5 w-5 mr-3" />
              Join a Game
            </Button>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">
            How it works
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-rich_black-400/70 border border-honeydew-600/30 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-rich_black-400/80 transition-all duration-300">
              <Users className="h-8 w-8 text-honeydew-300 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">Up to 8 players</h3>
              <p className="text-honeydew-400 text-xs sm:text-sm">Grab your friends and family</p>
            </Card>
            
            <Card className="bg-rich_black-400/70 border border-cerulean-600/30 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-rich_black-400/80 transition-all duration-300">
              <Music className="h-8 w-8 text-cerulean-300 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">Any Spotify playlist</h3>
              <p className="text-cerulean-400 text-xs sm:text-sm">Your music, your rules</p>
            </Card>
            
            <Card className="bg-rich_black-400/70 border border-fandango-600/30 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-rich_black-400/80 transition-all duration-300">
              <Timer className="h-8 w-8 text-fandango-300 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">Quick 30s rounds</h3>
              <p className="text-fandango-400 text-xs sm:text-sm">No waiting around</p>
            </Card>

            <Card className="bg-rich_black-400/70 border border-honeydew-600/30 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-rich_black-400/80 transition-all duration-300">
              <Trophy className="h-8 w-8 text-honeydew-300 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">First to 10 wins</h3>
              <p className="text-honeydew-400 text-xs sm:text-sm">Simple and fun</p>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pb-8 sm:pb-12">
          <p className="text-honeydew-300 text-sm font-medium mb-2">
            Powered by Spotify
          </p>
          <p className="text-honeydew-500 text-xs max-w-md mx-auto leading-relaxed">
            Just a fun little game to test your music knowledge with friends. No ads, no nonsense.
          </p>
        </footer>
      </div>
    </div>
  );
}
