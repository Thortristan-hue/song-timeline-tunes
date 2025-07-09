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
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-900 relative overflow-hidden">
      {/* Hip-hop graffiti background elements */}
      <div className="absolute inset-0 opacity-15">
        <svg className="w-full h-full" viewBox="0 0 1200 800">
          {/* Boombox outline */}
          <g stroke="#fbbf24" strokeWidth="4" fill="none" strokeLinecap="round">
            <rect x="100" y="100" width="200" height="120" rx="15" />
            <circle cx="140" cy="160" r="25" />
            <circle cx="260" cy="160" r="25" />
            <rect x="180" y="120" width="80" height="15" rx="3" />
            <rect x="180" y="140" width="80" height="8" rx="2" />
          </g>
          
          {/* Vinyl records */}
          <g stroke="#f59e0b" strokeWidth="3" fill="none">
            <circle cx="900" cy="200" r="40" />
            <circle cx="900" cy="200" r="8" />
            <circle cx="1000" cy="600" r="35" />
            <circle cx="1000" cy="600" r="6" />
          </g>
          
          {/* Graffiti-style arrows */}
          <g stroke="#fbbf24" strokeWidth="5" fill="none" strokeLinecap="round">
            <path d="M50 400 L120 400 L100 380 M120 400 L100 420" />
            <path d="M1050 300 L1120 300 L1100 280 M1120 300 L1100 320" />
          </g>
          
          {/* Sound waves */}
          <g stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round">
            <path d="M200 500 Q250 480 300 500 T400 500" />
            <path d="M200 520 Q250 500 300 520 T400 520" />
            <path d="M200 540 Q250 520 300 540 T400 540" />
          </g>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
        
        {/* Main Logo Section */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          {/* Cassette with turntables */}
          <div className="flex items-center justify-center mb-8 gap-8">
            {/* Left turntable */}
            <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-lg">
              <circle cx="30" cy="30" r="25" fill="#f59e0b" stroke="#d97706" strokeWidth="3" />
              <circle cx="30" cy="30" r="5" fill="#92400e" />
              <path d="M20 20 L40 40 M40 20 L20 40" stroke="#92400e" strokeWidth="2" />
            </svg>
            
            {/* Main cassette */}
            <svg width="140" height="90" viewBox="0 0 140 90" className="drop-shadow-xl">
              <rect x="10" y="25" width="120" height="55" rx="12" 
                    fill="#f59e0b" stroke="#d97706" strokeWidth="4" />
              <rect x="15" y="15" width="110" height="25" rx="8" 
                    fill="#fbbf24" stroke="#d97706" strokeWidth="3" />
              <circle cx="35" cy="55" r="12" fill="#fed7aa" stroke="#d97706" strokeWidth="3" />
              <circle cx="105" cy="55" r="12" fill="#fed7aa" stroke="#d97706" strokeWidth="3" />
              <rect x="52" y="50" width="36" height="10" rx="3" 
                    fill="#92400e" stroke="#d97706" strokeWidth="2" />
              <rect x="25" y="65" width="90" height="12" rx="3" 
                    fill="#fed7aa" stroke="#d97706" strokeWidth="2" />
              <circle cx="35" cy="55" r="3" fill="#92400e" />
              <circle cx="105" cy="55" r="3" fill="#92400e" />
            </svg>
            
            {/* Right turntable */}
            <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-lg">
              <circle cx="30" cy="30" r="25" fill="#f59e0b" stroke="#d97706" strokeWidth="3" />
              <circle cx="30" cy="30" r="5" fill="#92400e" />
              <path d="M20 20 L40 40 M40 20 L20 40" stroke="#92400e" strokeWidth="2" />
            </svg>
          </div>
          
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black text-yellow-400 mb-6 tracking-tight transform -rotate-1" 
              style={{ fontFamily: 'Impact, Arial Black, sans-serif', textShadow: '4px 4px 0px #92400e' }}>
            TIMELINER
          </h1>
          
          <p className="text-2xl sm:text-3xl text-yellow-300 font-bold max-w-2xl mx-auto leading-relaxed mb-4 transform rotate-1">
            The dopest music game for your crew
          </p>
          
          <p className="text-lg text-yellow-200 font-semibold">
            Can you guess when these bangers dropped?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 mb-16 w-full max-w-lg">
          <Button
            onClick={onCreateRoom}
            className="flex-1 bg-yellow-400 text-black hover:bg-yellow-300 h-16 text-xl font-black rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl border-4 border-yellow-500 hover:border-yellow-400 transform hover:scale-105 hover:-rotate-1"
            style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}
          >
            <Play className="h-6 w-6 mr-3" />
            START THE PARTY
          </Button>
          
          <Button
            onClick={onJoinRoom}
            className="flex-1 bg-orange-500 text-yellow-100 hover:bg-orange-400 h-16 text-xl font-black rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl border-4 border-orange-600 hover:border-orange-500 transform hover:scale-105 hover:rotate-1"
            style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}
          >
            <Smartphone className="h-6 w-6 mr-3" />
            JOIN THE CREW
          </Button>
        </div>

        {/* Features in hip-hop style layout */}
        <div className="w-full max-w-6xl mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side - stacked */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 border-4 border-yellow-400 p-6 text-center transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:rotate-1">
                <Users className="h-10 w-10 text-yellow-100 mx-auto mb-3" />
                <div className="text-yellow-100 font-black text-xl mb-1" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>SQUAD UP</div>
                <div className="text-yellow-200 text-base font-bold">2-8 PLAYERS</div>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-600 to-red-600 border-4 border-orange-400 p-6 text-center transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:-rotate-1">
                <Timer className="h-10 w-10 text-orange-100 mx-auto mb-3" />
                <div className="text-orange-100 font-black text-xl mb-1" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>RAPID FIRE</div>
                <div className="text-orange-200 text-base font-bold">30 SECOND ROUNDS</div>
              </Card>
            </div>
            
            {/* Right side - stacked */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-orange-600 to-yellow-600 border-4 border-orange-400 p-6 text-center transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:-rotate-1">
                <Music className="h-10 w-10 text-orange-100 mx-auto mb-3" />
                <div className="text-orange-100 font-black text-xl mb-1" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>ANY GENRE</div>
                <div className="text-orange-200 text-base font-bold">YOUR PLAYLISTS</div>
              </Card>
              
              <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 border-4 border-yellow-400 p-6 text-center transition-all duration-300 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 hover:rotate-1">
                <Trophy className="h-10 w-10 text-yellow-100 mx-auto mb-3" />
                <div className="text-yellow-100 font-black text-xl mb-1" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>BATTLE MODE</div>
                <div className="text-yellow-200 text-base font-bold">FIRST TO 10 WINS</div>
              </Card>
            </div>
          </div>
        </div>

        {/* How to Play - Street style */}
        <Card className="bg-gradient-to-br from-amber-800 to-orange-800 border-4 border-yellow-500 p-8 w-full max-w-4xl rounded-3xl shadow-xl transform hover:scale-105 transition-all duration-300">
          <h3 className="text-4xl font-black text-yellow-400 mb-8 text-center transform -rotate-1" 
              style={{ fontFamily: 'Impact, Arial Black, sans-serif', textShadow: '2px 2px 0px #92400e' }}>
            HOW WE DO IT
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-yellow-500 shadow-lg">
                  <span className="text-black font-black text-xl">1</span>
                </div>
                <div>
                  <h4 className="text-yellow-300 font-black mb-1 text-lg" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>FIRE UP THE SPOT</h4>
                  <p className="text-yellow-200 text-sm font-semibold">Host picks a killer Deezer playlist</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-orange-600 shadow-lg">
                  <span className="text-yellow-100 font-black text-xl">2</span>
                </div>
                <div>
                  <h4 className="text-yellow-300 font-black mb-1 text-lg" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>CREW ROLLS UP</h4>
                  <p className="text-yellow-200 text-sm font-semibold">Everyone joins with the room code</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-red-600 shadow-lg">
                  <span className="text-red-100 font-black text-xl">3</span>
                </div>
                <div>
                  <h4 className="text-yellow-300 font-black mb-1 text-lg" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>VIBE & GUESS</h4>
                  <p className="text-yellow-200 text-sm font-semibold">Drop tracks on your timeline</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-green-600 shadow-lg">
                  <span className="text-green-100 font-black text-xl">4</span>
                </div>
                <div>
                  <h4 className="text-yellow-300 font-black mb-1 text-lg" style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>CLAIM THE CROWN</h4>
                  <p className="text-yellow-200 text-sm font-semibold">First to 10 gets all the respect</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-yellow-300 text-sm font-bold">
            Powered by Deezer • Cross-platform
          </p>
          <p className="text-yellow-400 text-xs max-w-md mx-auto font-semibold">
            Made for the culture, not the cash. Just vibes, no profit.
          </p>
        </div>
      </div>
    </div>
  );
}
