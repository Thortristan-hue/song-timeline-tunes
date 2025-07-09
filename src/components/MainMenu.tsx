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
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Hand-drawn background elements */}
      <div className="absolute inset-0 opacity-30">
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
          
          {/* Boombox */}
          <g stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round">
            <rect x="800" y="500" width="120" height="80" rx="10" transform="rotate(-5 860 540)" />
            <circle cx="830" cy="530" r="15" transform="rotate(-5 860 540)" />
            <circle cx="890" cy="530" r="15" transform="rotate(-5 860 540)" />
            <rect x="845" y="510" width="30" height="8" rx="2" transform="rotate(-5 860 540)" />
            <rect x="810" y="555" width="100" height="6" rx="2" transform="rotate(-5 860 540)" />
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
            
            <path d="M200 450 Q250 430 300 450 T400 450" />
            <path d="M200 470 Q250 450 300 470 T400 470" />
            <path d="M200 490 Q250 470 300 490 T400 490" />
          </g>
          
          {/* Sketchy arrows */}
          <g stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round">
            <path d="M50 250 Q100 240 150 250" />
            <path d="M140 240 L150 250 L140 260" />
            
            <path d="M1000 450 Q1050 440 1100 450" />
            <path d="M1090 440 L1100 450 L1090 460" />
          </g>
          
          {/* Tape reels */}
          <g stroke="#ea580c" strokeWidth="2" fill="none">
            <circle cx="400" cy="600" r="20" />
            <circle cx="400" cy="600" r="4" />
            <path d="M385 585 L415 615 M415 585 L385 615" />
            
            <circle cx="750" cy="100" r="18" />
            <circle cx="750" cy="100" r="4" />
            <path d="M737 87 L763 113 M763 87 L737 113" />
          </g>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
        
        {/* Main Logo Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Hand-drawn cassette */}
          <div className="flex items-center justify-center mb-8">
            <svg width="160" height="100" viewBox="0 0 160 100" className="drop-shadow-lg">
              <rect x="15" y="30" width="130" height="60" rx="12" 
                    fill="#f97316" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" />
              <rect x="20" y="20" width="120" height="25" rx="8" 
                    fill="#fb923c" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
              <circle cx="45" cy="65" r="14" fill="#fed7aa" stroke="#ea580c" strokeWidth="3" />
              <circle cx="115" cy="65" r="14" fill="#fed7aa" stroke="#ea580c" strokeWidth="3" />
              <rect x="62" y="58" width="36" height="14" rx="4" 
                    fill="#9a3412" stroke="#ea580c" strokeWidth="2" />
              <rect x="30" y="75" width="100" height="12" rx="3" 
                    fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
              <circle cx="45" cy="65" r="4" fill="#9a3412" />
              <circle cx="115" cy="65" r="4" fill="#9a3412" />
              <path d="M35 55 Q45 50 55 55" stroke="#ea580c" strokeWidth="2" fill="none" />
              <path d="M105 55 Q115 50 125 55" stroke="#ea580c" strokeWidth="2" fill="none" />
            </svg>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-orange-800 mb-6 tracking-tight transform -rotate-1" 
              style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>
            Timeliner
          </h1>
          
          <p className="text-xl sm:text-2xl text-orange-700 font-semibold max-w-2xl mx-auto leading-relaxed mb-4 transform rotate-1">
            A groovy music game for you and your crew
          </p>
          
          <p className="text-lg text-orange-600 font-medium">
            Can you guess when these bangers dropped?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 mb-20 w-full max-w-lg">
          <Button
            onClick={onCreateRoom}
            className="flex-1 bg-orange-500 text-white hover:bg-orange-600 h-14 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl border-4 border-orange-600 hover:border-orange-700 transform hover:scale-105 hover:-rotate-1"
            style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}
          >
            <Play className="h-5 w-5 mr-2" />
            Start the Party
          </Button>
          
          <Button
            onClick={onJoinRoom}
            className="flex-1 bg-orange-400 text-orange-900 hover:bg-orange-500 hover:text-white h-14 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl border-4 border-orange-500 hover:border-orange-600 transform hover:scale-105 hover:rotate-1"
            style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}
          >
            <Smartphone className="h-5 w-5 mr-2" />
            Join the Crew
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-20">
          <Card className="bg-orange-200/80 border-4 border-orange-400 p-6 text-center hover:bg-orange-200 transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:rotate-1">
            <Users className="h-8 w-8 text-orange-700 mx-auto mb-3" />
            <div className="text-orange-900 font-bold text-lg mb-1" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Squad Up</div>
            <div className="text-orange-800 text-sm font-medium">2-8 Players</div>
          </Card>
          
          <Card className="bg-orange-200/80 border-4 border-orange-400 p-6 text-center hover:bg-orange-200 transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:-rotate-1">
            <Music className="h-8 w-8 text-orange-700 mx-auto mb-3" />
            <div className="text-orange-900 font-bold text-lg mb-1" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Any Vibes</div>
            <div className="text-orange-800 text-sm font-medium">Your Playlists</div>
          </Card>
          
          <Card className="bg-orange-200/80 border-4 border-orange-400 p-6 text-center hover:bg-orange-200 transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:rotate-1">
            <Timer className="h-8 w-8 text-orange-700 mx-auto mb-3" />
            <div className="text-orange-900 font-bold text-lg mb-1" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Lightning Fast</div>
            <div className="text-orange-800 text-sm font-medium">30s Rounds</div>
          </Card>
          
          <Card className="bg-orange-200/80 border-4 border-orange-400 p-6 text-center hover:bg-orange-200 transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:-rotate-1">
            <Trophy className="h-8 w-8 text-orange-700 mx-auto mb-3" />
            <div className="text-orange-900 font-bold text-lg mb-1" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Battle Time</div>
            <div className="text-orange-800 text-sm font-medium">First to 10</div>
          </Card>
        </div>

        {/* How to Play */}
        <Card className="bg-orange-100/90 border-4 border-orange-300 p-8 w-full max-w-4xl rounded-3xl shadow-lg transform hover:scale-105 transition-all duration-300">
          <h3 className="text-3xl font-bold text-orange-900 mb-8 text-center transform -rotate-1" 
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
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 border-3 border-orange-600 shadow-lg">
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
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 border-3 border-orange-600 shadow-lg">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div>
                  <h4 className="text-orange-900 font-bold mb-1 text-lg" style={{ fontFamily: 'Comic Sans MS, cursive, sans-serif' }}>Vibe and guess</h4>
                  <p className="text-orange-800 text-sm font-medium">Tunes start bumping, you drop them on your timeline</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 border-3 border-orange-600 shadow-lg">
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
