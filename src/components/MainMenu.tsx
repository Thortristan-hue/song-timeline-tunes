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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 relative overflow-hidden">
      {/* Hand-drawn background elements */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1200 800">
          {/* Scattered music notes */}
          <g stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round">
            <circle cx="150" cy="100" r="8" />
            <path d="M158 100 L158 70" />
            <path d="M158 70 L180 75" />
            
            <circle cx="900" cy="150" r="8" />
            <path d="M908 150 L908 120" />
            <path d="M908 120 L930 125" />
            
            <circle cx="1050" cy="400" r="8" />
            <path d="M1058 400 L1058 370" />
            <path d="M1058 370 L1080 375" />
            
            <circle cx="80" cy="600" r="8" />
            <path d="M88 600 L88 570" />
            <path d="M88 570 L110 575" />
          </g>
          
          {/* Wavy lines */}
          <g stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M50 300 Q150 280 250 300 T450 300" />
            <path d="M750 500 Q850 480 950 500 T1150 500" />
            <path d="M200 700 Q300 680 400 700 T600 700" />
          </g>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20">
          {/* Hand-drawn cassette icon */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <svg width="120" height="80" viewBox="0 0 120 80" className="drop-shadow-lg">
                {/* Cassette body */}
                <rect x="10" y="20" width="100" height="50" rx="8" 
                      fill="#f97316" stroke="#c2410c" strokeWidth="3" />
                
                {/* Top section */}
                <rect x="15" y="15" width="90" height="20" rx="4" 
                      fill="#fb923c" stroke="#c2410c" strokeWidth="2" />
                
                {/* Reels */}
                <circle cx="30" cy="50" r="8" fill="#fed7aa" stroke="#c2410c" strokeWidth="2" />
                <circle cx="90" cy="50" r="8" fill="#fed7aa" stroke="#c2410c" strokeWidth="2" />
                
                {/* Tape window */}
                <rect x="45" y="45" width="30" height="10" rx="2" 
                      fill="#92400e" stroke="#c2410c" strokeWidth="2" />
                
                {/* Label area */}
                <rect x="20" y="55" width="80" height="10" rx="2" 
                      fill="#fed7aa" stroke="#c2410c" strokeWidth="2" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-amber-900 mb-6 tracking-tight" 
              style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
            Timeliner
          </h1>
          
          <p className="text-xl sm:text-2xl text-amber-800 font-medium max-w-2xl mx-auto leading-relaxed mb-4">
            A groovy music game for you and your crew. Can you guess when these bangers dropped?
          </p>
          
          <p className="text-lg text-amber-700 font-medium">
            Just vibes, no profit.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full max-w-md">
          <Button
            onClick={onCreateRoom}
            className="flex-1 bg-orange-500 text-white hover:bg-orange-600 h-14 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl border-4 border-orange-600 hover:border-orange-700 transform hover:scale-105"
            style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}
          >
            <Play className="h-5 w-5 mr-2" />
            Start the Party
          </Button>
          
          <Button
            onClick={onJoinRoom}
            className="flex-1 bg-yellow-400 text-amber-900 hover:bg-yellow-500 h-14 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl border-4 border-yellow-500 hover:border-yellow-600 transform hover:scale-105"
            style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}
          >
            <Smartphone className="h-5 w-5 mr-2" />
            Join the Fun
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-20">
          <Card className="bg-orange-200/70 border-4 border-orange-400 p-6 text-center hover:bg-orange-200/90 transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:rotate-1">
            <Users className="h-8 w-8 text-orange-700 mx-auto mb-3" />
            <div className="text-orange-900 font-bold text-lg mb-1" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Squad Up</div>
            <div className="text-orange-800 text-sm font-medium">2-8 Players</div>
          </Card>
          
          <Card className="bg-yellow-200/70 border-4 border-yellow-400 p-6 text-center hover:bg-yellow-200/90 transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:-rotate-1">
            <Music className="h-8 w-8 text-yellow-700 mx-auto mb-3" />
            <div className="text-yellow-900 font-bold text-lg mb-1" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Any Vibes</div>
            <div className="text-yellow-800 text-sm font-medium">Your Playlists</div>
          </Card>
          
          <Card className="bg-red-200/70 border-4 border-red-400 p-6 text-center hover:bg-red-200/90 transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:rotate-1">
            <Timer className="h-8 w-8 text-red-700 mx-auto mb-3" />
            <div className="text-red-900 font-bold text-lg mb-1" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Lightning Fast</div>
            <div className="text-red-800 text-sm font-medium">30s Rounds</div>
          </Card>
          
          <Card className="bg-green-200/70 border-4 border-green-400 p-6 text-center hover:bg-green-200/90 transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:-rotate-1">
            <Trophy className="h-8 w-8 text-green-700 mx-auto mb-3" />
            <div className="text-green-900 font-bold text-lg mb-1" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Battle Time</div>
            <div className="text-green-800 text-sm font-medium">First to 10</div>
          </Card>
        </div>

        {/* How to Play */}
        <Card className="bg-orange-100/80 border-4 border-orange-300 p-8 w-full max-w-4xl rounded-3xl shadow-lg transform hover:scale-105 transition-all duration-300">
          <h3 className="text-3xl font-bold text-orange-900 mb-8 text-center" 
              style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
            How the magic happens
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 border-3 border-orange-600 shadow-lg">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <div>
                  <h4 className="text-orange-900 font-bold mb-1 text-lg" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Fire up a room</h4>
                  <p className="text-orange-800 text-sm font-medium">Someone hosts and picks a killer playlist from Deezer</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 border-3 border-yellow-600 shadow-lg">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div>
                  <h4 className="text-orange-900 font-bold mb-1 text-lg" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Squad assembles</h4>
                  <p className="text-orange-800 text-sm font-medium">Everyone else jumps in with that sweet room code</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 border-3 border-red-600 shadow-lg">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div>
                  <h4 className="text-orange-900 font-bold mb-1 text-lg" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Vibe and guess</h4>
                  <p className="text-orange-800 text-sm font-medium">Tunes start bumping, you drop them on your timeline</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 border-3 border-green-600 shadow-lg">
                  <span className="text-white font-bold text-lg">4</span>
                </div>
                <div>
                  <h4 className="text-orange-900 font-bold mb-1 text-lg" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Crown the music master</h4>
                  <p className="text-orange-800 text-sm font-medium">First to nail 10 wins (and gets all the bragging rights)</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-16 text-center space-y-3">
          <p className="text-orange-700 text-sm font-medium">
            Powered by Deezer • Works on any device
          </p>
          <p className="text-orange-600 text-xs max-w-md mx-auto font-medium">
            This groovy creation is just for friends to jam together. 
            Not affiliated with or endorsed by any music service or company.
          </p>
        </div>
      </div>
    </div>
  );
}
