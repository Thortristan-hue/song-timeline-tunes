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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black relative overflow-hidden">
      {/* Graffiti-style background elements */}
      <div className="absolute inset-0 opacity-40">
        <svg className="w-full h-full" viewBox="0 0 1200 800">
          {/* Boombox */}
          <g stroke="#fbbf24" strokeWidth="4" fill="none" strokeLinecap="round">
            <rect x="100" y="200" width="180" height="120" rx="15" transform="rotate(-8 190 260)" />
            <circle cx="140" cy="240" r="25" transform="rotate(-8 190 260)" />
            <circle cx="240" cy="240" r="25" transform="rotate(-8 190 260)" />
            <rect x="170" y="210" width="40" height="12" rx="3" transform="rotate(-8 190 260)" />
            <rect x="120" y="280" width="140" height="8" rx="2" transform="rotate(-8 190 260)" />
            <circle cx="190" cy="300" r="6" transform="rotate(-8 190 260)" />
            <circle cx="210" cy="300" r="6" transform="rotate(-8 190 260)" />
            <rect x="160" y="250" width="60" height="20" rx="4" transform="rotate(-8 190 260)" />
          </g>
          
          {/* Turntables */}
          <g stroke="#10b981" strokeWidth="3" fill="none">
            <circle cx="900" cy="250" r="60" transform="rotate(12 900 250)" />
            <circle cx="900" cy="250" r="8" />
            <circle cx="900" cy="250" r="35" />
            <rect x="880" y="200" width="40" height="15" rx="4" transform="rotate(12 900 250)" />
            <path d="M865 235 Q900 225 935 235" stroke="#10b981" strokeWidth="2" />
            
            <circle cx="1050" cy="400" r="50" transform="rotate(-15 1050 400)" />
            <circle cx="1050" cy="400" r="6" />
            <circle cx="1050" cy="400" r="30" />
            <rect x="1035" y="360" width="30" height="12" rx="3" transform="rotate(-15 1050 400)" />
          </g>
          
          {/* Microphone */}
          <g stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round">
            <circle cx="200" cy="500" r="20" transform="rotate(-20 200 500)" />
            <rect x="195" y="520" width="10" height="80" rx="2" transform="rotate(-20 200 500)" />
            <circle cx="200" cy="500" r="12" fill="#f59e0b" transform="rotate(-20 200 500)" />
            <path d="M185 485 Q200 475 215 485" stroke="#f59e0b" strokeWidth="2" />
          </g>
          
          {/* Graffiti tags */}
          <g stroke="#ec4899" strokeWidth="3" fill="none" strokeLinecap="round">
            <path d="M50 100 Q80 80 110 100 Q140 120 170 100" />
            <path d="M60 110 Q90 90 120 110 Q150 130 180 110" />
            <circle cx="75" cy="95" r="3" fill="#ec4899" />
            <circle cx="155" cy="95" r="3" fill="#ec4899" />
          </g>
          
          {/* Spray paint cans */}
          <g stroke="#8b5cf6" strokeWidth="3" fill="none" strokeLinecap="round">
            <rect x="800" y="600" width="20" height="60" rx="8" transform="rotate(15 810 630)" />
            <rect x="805" y="590" width="10" height="15" rx="2" transform="rotate(15 810 630)" />
            <circle cx="810" cy="585" r="3" fill="#8b5cf6" transform="rotate(15 810 630)" />
            <path d="M815 575 Q820 570 825 575" stroke="#8b5cf6" strokeWidth="2" />
            
            <rect x="1000" y="150" width="18" height="55" rx="7" transform="rotate(-10 1009 177)" />
            <rect x="1004" y="142" width="10" height="12" rx="2" transform="rotate(-10 1009 177)" />
            <circle cx="1009" cy="140" r="3" fill="#8b5cf6" transform="rotate(-10 1009 177)" />
          </g>
          
          {/* Sound waves */}
          <g stroke="#06d6a0" strokeWidth="3" fill="none" strokeLinecap="round">
            <path d="M400 300 Q450 280 500 300 Q550 320 600 300" />
            <path d="M400 320 Q450 300 500 320 Q550 340 600 320" />
            <path d="M400 340 Q450 320 500 340 Q550 360 600 340" />
            
            <path d="M300 150 Q350 130 400 150 Q450 170 500 150" />
            <path d="M300 170 Q350 150 400 170 Q450 190 500 170" />
          </g>
          
          {/* Cassette tapes */}
          <g stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round">
            <rect x="50" y="650" width="100" height="60" rx="10" transform="rotate(-12 100 680)" />
            <circle cx="80" cy="675" r="8" transform="rotate(-12 100 680)" />
            <circle cx="120" cy="675" r="8" transform="rotate(-12 100 680)" />
            <rect x="90" y="670" width="20" height="10" rx="2" transform="rotate(-12 100 680)" />
            <rect x="60" y="695" width="80" height="8" rx="2" transform="rotate(-12 100 680)" />
            
            <rect x="900" y="550" width="80" height="50" rx="8" transform="rotate(18 940 575)" />
            <circle cx="920" cy="570" r="6" transform="rotate(18 940 575)" />
            <circle cx="960" cy="570" r="6" transform="rotate(18 940 575)" />
            <rect x="930" y="565" width="20" height="8" rx="2" transform="rotate(18 940 575)" />
          </g>
          
          {/* Graffiti arrows and tags */}
          <g stroke="#ef4444" strokeWidth="4" fill="none" strokeLinecap="round">
            <path d="M600 500 Q650 480 700 500" />
            <path d="M690 490 L700 500 L690 510" />
            
            <path d="M100 400 Q150 380 200 400" />
            <path d="M190 390 L200 400 L190 410" />
          </g>
          
          {/* Headphones */}
          <g stroke="#a855f7" strokeWidth="3" fill="none" strokeLinecap="round">
            <path d="M700 100 Q750 80 800 100" />
            <circle cx="710" cy="110" r="15" />
            <circle cx="790" cy="110" r="15" />
            <rect x="705" y="105" width="10" height="10" rx="2" />
            <rect x="785" y="105" width="10" height="10" rx="2" />
          </g>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
        
        {/* Main Logo Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Hand-drawn boombox */}
          <div className="flex items-center justify-center mb-8">
            <svg width="200" height="130" viewBox="0 0 200 130" className="drop-shadow-2xl">
              <defs>
                <linearGradient id="boomboxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>
              <rect x="20" y="40" width="160" height="80" rx="15" 
                    fill="url(#boomboxGradient)" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
              <rect x="25" y="25" width="150" height="25" rx="8" 
                    fill="#1e293b" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
              <circle cx="60" cy="85" r="20" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
              <circle cx="140" cy="85" r="20" fill="#0f172a" stroke="#fbbf24" strokeWidth="3" />
              <rect x="85" y="75" width="30" height="20" rx="4" 
                    fill="#dc2626" stroke="#fbbf24" strokeWidth="2" />
              <rect x="40" y="105" width="120" height="10" rx="3" 
                    fill="#374151" stroke="#fbbf24" strokeWidth="2" />
              <circle cx="60" cy="85" r="6" fill="#fbbf24" />
              <circle cx="140" cy="85" r="6" fill="#fbbf24" />
              <path d="M45 65 Q60 55 75 65" stroke="#10b981" strokeWidth="2" fill="none" />
              <path d="M125 65 Q140 55 155 65" stroke="#10b981" strokeWidth="2" fill="none" />
              <circle cx="100" cy="110" r="4" fill="#ef4444" />
              <rect x="90" y="30" width="20" height="8" rx="2" fill="#a855f7" />
              <rect x="30" y="30" width="15" height="8" rx="2" fill="#06d6a0" />
              <rect x="155" y="30" width="15" height="8" rx="2" fill="#ec4899" />
            </svg>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text mb-6 tracking-tight transform -rotate-2" 
              style={{ 
                fontFamily: 'Impact, Arial Black, sans-serif',
                textShadow: '4px 4px 0px #000, 8px 8px 0px rgba(0,0,0,0.3)',
                WebkitTextStroke: '2px #000'
              }}>
            TIMELINER
          </h1>
          
          <div className="relative">
            <p className="text-xl sm:text-2xl text-yellow-400 font-black max-w-2xl mx-auto leading-relaxed mb-4 transform rotate-1 bg-black/60 px-6 py-2 rounded-xl border-2 border-yellow-400" 
               style={{ 
                 fontFamily: 'Impact, Arial Black, sans-serif',
                 textShadow: '2px 2px 0px #000'
               }}>
              YO! GUESS WHEN THESE BEATS DROPPED
            </p>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse" />
          </div>
          
          <p className="text-lg text-green-400 font-bold uppercase tracking-wide"
             style={{ 
               fontFamily: 'Impact, Arial Black, sans-serif',
               textShadow: '2px 2px 0px #000'
             }}>
            REAL HEADS ONLY
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 mb-20 w-full max-w-lg">
          <Button
            onClick={onCreateRoom}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 h-16 text-xl font-black rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-pink-500/25 border-4 border-yellow-400 transform hover:scale-105 hover:-rotate-1 active:scale-95"
            style={{ 
              fontFamily: 'Impact, Arial Black, sans-serif',
              textShadow: '2px 2px 0px #000'
            }}
          >
            <Play className="h-6 w-6 mr-3" />
            START THE CYPHER
          </Button>
          
          <Button
            onClick={onJoinRoom}
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 h-16 text-xl font-black rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-green-500/25 border-4 border-yellow-400 transform hover:scale-105 hover:rotate-1 active:scale-95"
            style={{ 
              fontFamily: 'Impact, Arial Black, sans-serif',
              textShadow: '2px 2px 0px #000'
            }}
          >
            <Smartphone className="h-6 w-6 mr-3" />
            JOIN THE CREW
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-20">
          <Card className="bg-gradient-to-br from-red-600/90 to-orange-600/90 border-4 border-yellow-400 p-6 text-center hover:from-red-500/90 hover:to-orange-500/90 transition-all duration-300 rounded-3xl shadow-2xl hover:shadow-red-500/25 transform hover:scale-105 hover:rotate-2">
            <Users className="h-10 w-10 text-yellow-400 mx-auto mb-3 drop-shadow-lg" />
            <div className="text-white font-black text-lg mb-1" 
                 style={{ 
                   fontFamily: 'Impact, Arial Black, sans-serif',
                   textShadow: '2px 2px 0px #000'
                 }}>
              SQUAD UP
            </div>
            <div className="text-yellow-300 text-sm font-bold">2-8 PLAYERS</div>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-600/90 to-pink-600/90 border-4 border-yellow-400 p-6 text-center hover:from-purple-500/90 hover:to-pink-500/90 transition-all duration-300 rounded-3xl shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 hover:-rotate-2">
            <Music className="h-10 w-10 text-yellow-400 mx-auto mb-3 drop-shadow-lg" />
            <div className="text-white font-black text-lg mb-1" 
                 style={{ 
                   fontFamily: 'Impact, Arial Black, sans-serif',
                   textShadow: '2px 2px 0px #000'
                 }}>
              FRESH BEATS
            </div>
            <div className="text-yellow-300 text-sm font-bold">YOUR PLAYLIST</div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-600/90 to-blue-600/90 border-4 border-yellow-400 p-6 text-center hover:from-green-500/90 hover:to-blue-500/90 transition-all duration-300 rounded-3xl shadow-2xl hover:shadow-green-500/25 transform hover:scale-105 hover:rotate-2">
            <Timer className="h-10 w-10 text-yellow-400 mx-auto mb-3 drop-shadow-lg" />
            <div className="text-white font-black text-lg mb-1" 
                 style={{ 
                   fontFamily: 'Impact, Arial Black, sans-serif',
                   textShadow: '2px 2px 0px #000'
                 }}>
              LIGHTNING
            </div>
            <div className="text-yellow-300 text-sm font-bold">30S ROUNDS</div>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-600/90 to-red-600/90 border-4 border-yellow-400 p-6 text-center hover:from-yellow-500/90 hover:to-red-500/90 transition-all duration-300 rounded-3xl shadow-2xl hover:shadow-yellow-500/25 transform hover:scale-105 hover:-rotate-2">
            <Trophy className="h-10 w-10 text-yellow-400 mx-auto mb-3 drop-shadow-lg" />
            <div className="text-white font-black text-lg mb-1" 
                 style={{ 
                   fontFamily: 'Impact, Arial Black, sans-serif',
                   textShadow: '2px 2px 0px #000'
                 }}>
              BATTLE
            </div>
            <div className="text-yellow-300 text-sm font-bold">FIRST TO 10</div>
          </Card>
        </div>

        {/* How to Play */}
        <Card className="bg-gradient-to-br from-gray-900/95 to-black/95 border-4 border-yellow-400 p-8 w-full max-w-4xl rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
          <h3 className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text mb-8 text-center transform -rotate-1" 
              style={{ 
                fontFamily: 'Impact, Arial Black, sans-serif',
                textShadow: '2px 2px 0px #000',
                WebkitTextStroke: '1px #000'
              }}>
            HOW WE DO THIS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 border-3 border-yellow-400 shadow-lg">
                  <span className="text-white font-black text-xl" style={{ textShadow: '1px 1px 0px #000' }}>1</span>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-black mb-1 text-lg" 
                      style={{ 
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textShadow: '2px 2px 0px #000'
                      }}>
                    SET UP THE SPOT
                  </h4>
                  <p className="text-gray-300 text-sm font-bold">Host brings that fire playlist from Deezer</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 border-3 border-yellow-400 shadow-lg">
                  <span className="text-white font-black text-xl" style={{ textShadow: '1px 1px 0px #000' }}>2</span>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-black mb-1 text-lg" 
                      style={{ 
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textShadow: '2px 2px 0px #000'
                      }}>
                    CREW ROLLS UP
                  </h4>
                  <p className="text-gray-300 text-sm font-bold">Everyone else slides in with that room code</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 border-3 border-yellow-400 shadow-lg">
                  <span className="text-white font-black text-xl" style={{ textShadow: '1px 1px 0px #000' }}>3</span>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-black mb-1 text-lg" 
                      style={{ 
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textShadow: '2px 2px 0px #000'
                      }}>
                    VIBE & GUESS
                  </h4>
                  <p className="text-gray-300 text-sm font-bold">Beats drop, you place 'em on the timeline</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 border-3 border-yellow-400 shadow-lg">
                  <span className="text-white font-black text-xl" style={{ textShadow: '1px 1px 0px #000' }}>4</span>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-black mb-1 text-lg" 
                      style={{ 
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textShadow: '2px 2px 0px #000'
                      }}>
                    CROWN THE KING
                  </h4>
                  <p className="text-gray-300 text-sm font-bold">First to 10 wins (and gets mad respect)</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-16 text-center space-y-3">
          <p className="text-yellow-400 text-sm font-black uppercase tracking-wide"
             style={{ 
               fontFamily: 'Impact, Arial Black, sans-serif',
               textShadow: '2px 2px 0px #000'
             }}>
            POWERED BY DEEZER • WORKS ANYWHERE
          </p>
          <p className="text-gray-400 text-xs max-w-md mx-auto font-bold">
            This underground joint is for the culture only. 
            No corporate ties, just pure vibes for the real ones.
          </p>
        </div>
      </div>
    </div>
  );
}
