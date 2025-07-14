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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Urban alleyway background */}
      <div className="absolute inset-0">
        {/* Brick wall texture overlay */}
        <div className="absolute inset-0 opacity-20" 
             style={{
               backgroundImage: `repeating-linear-gradient(
                 0deg,
                 transparent,
                 transparent 10px,
                 rgba(75, 85, 99, 0.3) 10px,
                 rgba(75, 85, 99, 0.3) 11px
               ),
               repeating-linear-gradient(
                 90deg,
                 transparent,
                 transparent 30px,
                 rgba(75, 85, 99, 0.2) 30px,
                 rgba(75, 85, 99, 0.2) 31px
               )`
             }}
        />
        
        {/* Neon glow effects */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-32 right-20 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
        
        {/* Street art graffiti */}
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 1200 800">
          {/* Large graffiti tag */}
          <g stroke="#00ff88" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6">
            <path d="M80 150 Q120 130 160 150 Q200 170 240 150 Q280 130 320 150" />
            <path d="M85 160 Q125 140 165 160 Q205 180 245 160 Q285 140 325 160" />
            <circle cx="100" cy="145" r="4" fill="#00ff88" />
            <circle cx="180" cy="145" r="4" fill="#00ff88" />
            <circle cx="260" cy="145" r="4" fill="#00ff88" />
            <circle cx="320" cy="145" r="4" fill="#00ff88" />
          </g>
          
          {/* Boom box street art */}
          <g stroke="#ff0080" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4">
            <rect x="900" y="200" width="120" height="80" rx="8" />
            <circle cx="930" cy="240" r="18" />
            <circle cx="990" cy="240" r="18" />
            <rect x="950" y="220" width="20" height="12" rx="2" />
            <rect x="910" y="260" width="100" height="8" rx="2" />
            <circle cx="960" cy="275" r="3" fill="#ff0080" />
            <path d="M920 200 Q960 185 1000 200" stroke="#ff0080" strokeWidth="2" />
          </g>
          
          {/* Turntables */}
          <g stroke="#00ccff" strokeWidth="3" fill="none" opacity="0.5">
            <circle cx="150" cy="600" r="40" />
            <circle cx="150" cy="600" r="25" />
            <circle cx="150" cy="600" r="6" fill="#00ccff" />
            <rect x="135" y="580" width="30" height="8" rx="2" />
            <path d="M125 585 Q150 575 175 585" stroke="#00ccff" strokeWidth="2" />
            
            <circle cx="1050" cy="500" r="35" />
            <circle cx="1050" cy="500" r="20" />
            <circle cx="1050" cy="500" r="4" fill="#00ccff" />
          </g>
          
          {/* Spray paint cans */}
          <g stroke="#ffff00" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.3">
            <rect x="50" y="400" width="15" height="45" rx="6" />
            <rect x="52" y="395" width="11" height="10" rx="2" />
            <circle cx="57" cy="392" r="2" fill="#ffff00" />
            <path d="M60 388 Q65 383 70 388" stroke="#ffff00" strokeWidth="2" />
            
            <rect x="1100" y="350" width="12" height="40" rx="5" />
            <rect x="1102" y="346" width="8" height="8" rx="1" />
            <circle cx="1106" cy="344" r="2" fill="#ffff00" />
          </g>
          
          {/* Sound waves with neon effect */}
          <g stroke="#ff6600" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4">
            <path d="M400 300 Q450 280 500 300 Q550 320 600 300" />
            <path d="M400 320 Q450 300 500 320 Q550 340 600 320" />
            <path d="M400 340 Q450 320 500 340 Q550 360 600 340" />
            
            <path d="M700 400 Q750 380 800 400 Q850 420 900 400" />
            <path d="M700 420 Q750 400 800 420 Q850 440 900 420" />
          </g>
          
          {/* Microphone with cord */}
          <g stroke="#ff3366" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5">
            <circle cx="300" cy="500" r="12" />
            <rect x="295" y="512" width="10" height="60" rx="2" />
            <circle cx="300" cy="500" r="8" fill="#ff3366" />
            <path d="M285 485 Q300 475 315 485" stroke="#ff3366" strokeWidth="3" />
            <path d="M300 572 Q320 580 340 572 Q360 580 380 572" stroke="#ff3366" strokeWidth="2" />
          </g>
          
          {/* Graffiti arrows and tags */}
          <g stroke="#cc00ff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.4">
            <path d="M600 600 Q650 580 700 600" />
            <path d="M690 590 L700 600 L690 610" />
            <circle cx="620" cy="595" r="3" fill="#cc00ff" />
            <circle cx="680" cy="595" r="3" fill="#cc00ff" />
          </g>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
        
        {/* Main Logo Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Neon-style music icon */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400 rounded-2xl blur-lg opacity-50" />
              <div className="relative w-24 h-24 bg-black border-2 border-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl">
                <Music className="h-12 w-12 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight relative" 
              style={{ 
                fontFamily: 'Impact, Arial Black, sans-serif',
                textShadow: `
                  0 0 10px #00ff88,
                  0 0 20px #00ff88,
                  0 0 30px #00ff88,
                  3px 3px 0px #000,
                  6px 6px 0px rgba(0,0,0,0.5)
                `,
                WebkitTextStroke: '2px #00ff88'
              }}>
            RYTHMY
          </h1>
          
          <div className="space-y-4 mb-8">
            <p className="text-xl sm:text-2xl text-cyan-300 font-bold max-w-2xl mx-auto leading-relaxed"
               style={{ 
                 fontFamily: 'Impact, Arial Black, sans-serif',
                 textShadow: '0 0 10px rgba(34,211,238,0.5), 2px 2px 0px #000'
               }}>
              TEST YOUR BEATS KNOWLEDGE
            </p>
            <p className="text-lg text-purple-300 max-w-xl mx-auto font-semibold"
               style={{ textShadow: '1px 1px 0px #000' }}>
              Drop into the cypher and see who knows when these tracks really hit the streets
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 mb-16 w-full max-w-lg">
          <Button
            onClick={onCreateRoom}
            className="relative flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white h-16 text-xl font-black rounded-2xl transition-all duration-300 shadow-2xl border-2 border-pink-400 transform hover:scale-105 active:scale-95 overflow-hidden"
            style={{ 
              fontFamily: 'Impact, Arial Black, sans-serif',
              textShadow: '2px 2px 0px #000',
              boxShadow: '0 0 20px rgba(236,72,153,0.5), 0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse" />
            <Play className="h-6 w-6 mr-3 drop-shadow-lg" />
            START THE SESSION
          </Button>
          
          <Button
            onClick={onJoinRoom}
            className="relative flex-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white h-16 text-xl font-black rounded-2xl transition-all duration-300 shadow-2xl border-2 border-cyan-400 transform hover:scale-105 active:scale-95 overflow-hidden"
            style={{ 
              fontFamily: 'Impact, Arial Black, sans-serif',
              textShadow: '2px 2px 0px #000',
              boxShadow: '0 0 20px rgba(34,211,238,0.5), 0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse" />
            <Smartphone className="h-6 w-6 mr-3 drop-shadow-lg" />
            JOIN THE CREW
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-16">
          <Card className="relative bg-black/80 border-2 border-green-400 p-6 text-center hover:border-green-300 transition-all duration-300 rounded-2xl backdrop-blur-sm transform hover:scale-105"
                style={{ boxShadow: '0 0 15px rgba(34,197,94,0.3)' }}>
            <Users className="h-10 w-10 text-green-400 mx-auto mb-3 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            <div className="text-green-400 font-black text-lg mb-1" 
                 style={{ 
                   fontFamily: 'Impact, Arial Black, sans-serif',
                   textShadow: '0 0 10px rgba(34,197,94,0.5), 2px 2px 0px #000'
                 }}>
              SQUAD UP
            </div>
            <div className="text-green-300 text-sm font-bold">2-8 HEADS</div>
          </Card>
          
          <Card className="relative bg-black/80 border-2 border-purple-400 p-6 text-center hover:border-purple-300 transition-all duration-300 rounded-2xl backdrop-blur-sm transform hover:scale-105"
                style={{ boxShadow: '0 0 15px rgba(168,85,247,0.3)' }}>
            <Music className="h-10 w-10 text-purple-400 mx-auto mb-3 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            <div className="text-purple-400 font-black text-lg mb-1" 
                 style={{ 
                   fontFamily: 'Impact, Arial Black, sans-serif',
                   textShadow: '0 0 10px rgba(168,85,247,0.5), 2px 2px 0px #000'
                 }}>
              YOUR BEATS
            </div>
            <div className="text-purple-300 text-sm font-bold">SPOTIFY FLOW</div>
          </Card>
          
          <Card className="relative bg-black/80 border-2 border-cyan-400 p-6 text-center hover:border-cyan-300 transition-all duration-300 rounded-2xl backdrop-blur-sm transform hover:scale-105"
                style={{ boxShadow: '0 0 15px rgba(34,211,238,0.3)' }}>
            <Timer className="h-10 w-10 text-cyan-400 mx-auto mb-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            <div className="text-cyan-400 font-black text-lg mb-1" 
                 style={{ 
                   fontFamily: 'Impact, Arial Black, sans-serif',
                   textShadow: '0 0 10px rgba(34,211,238,0.5), 2px 2px 0px #000'
                 }}>
              RAPID FIRE
            </div>
            <div className="text-cyan-300 text-sm font-bold">30 SECONDS</div>
          </Card>
          
          <Card className="relative bg-black/80 border-2 border-yellow-400 p-6 text-center hover:border-yellow-300 transition-all duration-300 rounded-2xl backdrop-blur-sm transform hover:scale-105"
                style={{ boxShadow: '0 0 15px rgba(250,204,21,0.3)' }}>
            <Trophy className="h-10 w-10 text-yellow-400 mx-auto mb-3 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
            <div className="text-yellow-400 font-black text-lg mb-1" 
                 style={{ 
                   fontFamily: 'Impact, Arial Black, sans-serif',
                   textShadow: '0 0 10px rgba(250,204,21,0.5), 2px 2px 0px #000'
                 }}>
              CHAMPION
            </div>
            <div className="text-yellow-300 text-sm font-bold">FIRST TO 10</div>
          </Card>
        </div>

        {/* How to Play */}
        <Card className="relative bg-black/90 border-2 border-white/30 p-8 w-full max-w-4xl rounded-2xl backdrop-blur-sm"
              style={{ boxShadow: '0 0 30px rgba(255,255,255,0.1)' }}>
          <h3 className="text-3xl font-black text-white mb-8 text-center" 
              style={{ 
                fontFamily: 'Impact, Arial Black, sans-serif',
                textShadow: '0 0 15px #fff, 3px 3px 0px #000'
              }}>
            HOW WE DO THIS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-red-400 shadow-lg"
                     style={{ boxShadow: '0 0 15px rgba(239,68,68,0.5)' }}>
                  <span className="text-white font-black text-xl" style={{ textShadow: '1px 1px 0px #000' }}>1</span>
                </div>
                <div>
                  <h4 className="text-red-400 font-black mb-1 text-lg" 
                      style={{ 
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textShadow: '0 0 10px rgba(248,113,113,0.5), 2px 2px 0px #000'
                      }}>
                    CONNECT THE BEATS
                  </h4>
                  <p className="text-gray-300 text-sm font-bold">Hook up your Spotify playlist to set the vibe</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-purple-400 shadow-lg"
                     style={{ boxShadow: '0 0 15px rgba(168,85,247,0.5)' }}>
                  <span className="text-white font-black text-xl" style={{ textShadow: '1px 1px 0px #000' }}>2</span>
                </div>
                <div>
                  <h4 className="text-purple-400 font-black mb-1 text-lg" 
                      style={{ 
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textShadow: '0 0 10px rgba(168,85,247,0.5), 2px 2px 0px #000'
                      }}>
                    GATHER THE SQUAD
                  </h4>
                  <p className="text-gray-300 text-sm font-bold">Share that code and wait for your crew to roll up</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-green-400 shadow-lg"
                     style={{ boxShadow: '0 0 15px rgba(34,197,94,0.5)' }}>
                  <span className="text-white font-black text-xl" style={{ textShadow: '1px 1px 0px #000' }}>3</span>
                </div>
                <div>
                  <h4 className="text-green-400 font-black mb-1 text-lg" 
                      style={{ 
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textShadow: '0 0 10px rgba(34,197,94,0.5), 2px 2px 0px #000'
                      }}>
                    FEEL THE RHYTHM
                  </h4>
                  <p className="text-gray-300 text-sm font-bold">Listen to the track and drop it on the timeline</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-yellow-400 shadow-lg"
                     style={{ boxShadow: '0 0 15px rgba(250,204,21,0.5)' }}>
                  <span className="text-white font-black text-xl" style={{ textShadow: '1px 1px 0px #000' }}>4</span>
                </div>
                <div>
                  <h4 className="text-yellow-400 font-black mb-1 text-lg" 
                      style={{ 
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textShadow: '0 0 10px rgba(250,204,21,0.5), 2px 2px 0px #000'
                      }}>
                    CLAIM THE CROWN
                  </h4>
                  <p className="text-gray-300 text-sm font-bold">Closest guess gets points. First to 10 runs the block!</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-16 text-center space-y-3">
          <p className="text-green-400 text-sm font-black uppercase tracking-wide"
             style={{ 
               fontFamily: 'Impact, Arial Black, sans-serif',
               textShadow: '0 0 10px rgba(34,197,94,0.5), 2px 2px 0px #000'
             }}>
            POWERED BY SPOTIFY • STRAIGHT FROM THE STREETS
          </p>
          <p className="text-gray-400 text-xs max-w-md mx-auto font-bold leading-relaxed">
            This is for the real ones who know their music history. 
            Connect your playlist and prove you know when these classics first dropped.
          </p>
        </div>
      </div>
    </div>
  );
}
