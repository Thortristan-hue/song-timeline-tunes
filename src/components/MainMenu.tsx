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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1200 800">
          {/* Turntables */}
          <g stroke="#4b5563" strokeWidth="2" fill="none">
            <circle cx="900" cy="250" r="60" transform="rotate(12 900 250)" />
            <circle cx="900" cy="250" r="35" />
            <circle cx="900" cy="250" r="6" fill="#6b7280" />
            <rect x="880" y="200" width="40" height="15" rx="4" transform="rotate(12 900 250)" />
            
            <circle cx="1050" cy="400" r="50" transform="rotate(-15 1050 400)" />
            <circle cx="1050" cy="400" r="30" />
            <circle cx="1050" cy="400" r="5" fill="#6b7280" />
            <rect x="1035" y="360" width="30" height="12" rx="3" transform="rotate(-15 1050 400)" />
          </g>
          
          {/* Sound waves */}
          <g stroke="#374151" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M400 300 Q450 280 500 300 Q550 320 600 300" />
            <path d="M400 320 Q450 300 500 320 Q550 340 600 320" />
            <path d="M400 340 Q450 320 500 340 Q550 360 600 340" />
          </g>
          
          {/* Vinyl records */}
          <g stroke="#374151" strokeWidth="2" fill="none">
            <circle cx="200" cy="600" r="40" />
            <circle cx="200" cy="600" r="25" />
            <circle cx="200" cy="600" r="4" fill="#4b5563" />
            
            <circle cx="800" cy="150" r="35" />
            <circle cx="800" cy="150" r="20" />
            <circle cx="800" cy="150" r="3" fill="#4b5563" />
          </g>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
        
        {/* Main Logo Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Refined music icon */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center border border-gray-600 shadow-2xl">
              <Music className="h-12 w-12 text-gray-300" />
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight" 
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>
            Song Timeline
          </h1>
          
          <div className="space-y-4 mb-8">
            <p className="text-xl sm:text-2xl text-gray-300 font-medium max-w-2xl mx-auto leading-relaxed">
              Test your music knowledge against friends
            </p>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Guess when your favorite tracks were released and see who really knows their music history
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full max-w-lg">
          <Button
            onClick={onCreateRoom}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-600"
          >
            <Play className="h-5 w-5 mr-3" />
            Create Room
          </Button>
          
          <Button
            onClick={onJoinRoom}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-500"
          >
            <Smartphone className="h-5 w-5 mr-3" />
            Join Room
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl mb-16">
          <Card className="bg-gray-800/80 border border-gray-600 p-6 text-center hover:bg-gray-700/80 transition-all duration-200 rounded-xl backdrop-blur-sm">
            <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <div className="text-white font-semibold text-base mb-1">
              Multiplayer
            </div>
            <div className="text-gray-400 text-sm">2-8 players</div>
          </Card>
          
          <Card className="bg-gray-800/80 border border-gray-600 p-6 text-center hover:bg-gray-700/80 transition-all duration-200 rounded-xl backdrop-blur-sm">
            <Music className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <div className="text-white font-semibold text-base mb-1">
              Your Music
            </div>
            <div className="text-gray-400 text-sm">Deezer playlists</div>
          </Card>
          
          <Card className="bg-gray-800/80 border border-gray-600 p-6 text-center hover:bg-gray-700/80 transition-all duration-200 rounded-xl backdrop-blur-sm">
            <Timer className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <div className="text-white font-semibold text-base mb-1">
              Quick Rounds
            </div>
            <div className="text-gray-400 text-sm">30 seconds</div>
          </Card>
          
          <Card className="bg-gray-800/80 border border-gray-600 p-6 text-center hover:bg-gray-700/80 transition-all duration-200 rounded-xl backdrop-blur-sm">
            <Trophy className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <div className="text-white font-semibold text-base mb-1">
              First to Win
            </div>
            <div className="text-gray-400 text-sm">10 points</div>
          </Card>
        </div>

        {/* How to Play */}
        <Card className="bg-gray-800/90 border border-gray-600 p-8 w-full max-w-4xl rounded-xl backdrop-blur-sm">
          <h3 className="text-2xl font-semibold text-white mb-8 text-center">
            How to Play
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-600">
                  <span className="text-white font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="text-gray-200 font-semibold mb-1 text-base">
                    Connect Your Music
                  </h4>
                  <p className="text-gray-400 text-sm">Host connects a Deezer playlist to get started</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-600">
                  <span className="text-white font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="text-gray-200 font-semibold mb-1 text-base">
                    Friends Join In
                  </h4>
                  <p className="text-gray-400 text-sm">Share the room code and wait for players to join</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-600">
                  <span className="text-white font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="text-gray-200 font-semibold mb-1 text-base">
                    Listen & Guess
                  </h4>
                  <p className="text-gray-400 text-sm">Hear a song snippet and place it on the timeline</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-600">
                  <span className="text-white font-semibold text-sm">4</span>
                </div>
                <div>
                  <h4 className="text-gray-200 font-semibold mb-1 text-base">
                    Score Points
                  </h4>
                  <p className="text-gray-400 text-sm">Closer guesses earn more points. First to 10 wins!</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-gray-400 text-sm font-medium">
            Powered by Deezer
          </p>
          <p className="text-gray-500 text-xs max-w-md mx-auto">
            A fun way to test your music knowledge with friends. 
            Connect your playlist and see who knows their release dates best.
          </p>
        </div>
      </div>
    </div>
  );
}
