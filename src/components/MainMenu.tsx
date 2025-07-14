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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 relative overflow-hidden">
      {/* Cozy background elements */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" viewBox="0 0 1200 800">
          {/* Warm geometric patterns */}
          <g stroke="#d97706" strokeWidth="2" fill="none">
            <circle cx="900" cy="250" r="60" transform="rotate(12 900 250)" />
            <circle cx="900" cy="250" r="35" />
            <circle cx="900" cy="250" r="6" fill="#f59e0b" />
            <rect x="880" y="200" width="40" height="15" rx="4" transform="rotate(12 900 250)" />
            
            <circle cx="1050" cy="400" r="50" transform="rotate(-15 1050 400)" />
            <circle cx="1050" cy="400" r="30" />
            <circle cx="1050" cy="400" r="5" fill="#f59e0b" />
            <rect x="1035" y="360" width="30" height="12" rx="3" transform="rotate(-15 1050 400)" />
          </g>
          
          {/* Gentle sound waves */}
          <g stroke="#ea580c" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M400 300 Q450 280 500 300 Q550 320 600 300" />
            <path d="M400 320 Q450 300 500 320 Q550 340 600 320" />
            <path d="M400 340 Q450 320 500 340 Q550 360 600 340" />
          </g>
          
          {/* Vinyl records with warm tones */}
          <g stroke="#dc2626" strokeWidth="2" fill="none">
            <circle cx="200" cy="600" r="40" />
            <circle cx="200" cy="600" r="25" />
            <circle cx="200" cy="600" r="4" fill="#dc2626" />
            
            <circle cx="800" cy="150" r="35" />
            <circle cx="800" cy="150" r="20" />
            <circle cx="800" cy="150" r="3" fill="#dc2626" />
          </g>
          
          {/* Musical notes floating */}
          <g fill="#f59e0b" opacity="0.6">
            <circle cx="150" cy="200" r="3" />
            <circle cx="1000" cy="300" r="3" />
            <circle cx="300" cy="500" r="3" />
            <circle cx="700" cy="100" r="3" />
          </g>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
        
        {/* Main Logo Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Warm music icon */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-28 h-28 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl flex items-center justify-center border-2 border-orange-200 shadow-lg">
              <Music className="h-14 w-14 text-orange-600" />
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-orange-900 mb-6 tracking-tight" 
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
            Rythmy
          </h1>
          
          <div className="space-y-4 mb-8">
            <p className="text-xl sm:text-2xl text-orange-700 font-medium max-w-2xl mx-auto leading-relaxed">
              Test your music knowledge with friends
            </p>
            <p className="text-lg text-orange-600 max-w-xl mx-auto">
              Guess when your favorite tracks were released in this cozy music timeline game
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full max-w-lg">
          <Button
            onClick={onCreateRoom}
            className="flex-1 bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white h-14 text-lg font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl border-0"
          >
            <Play className="h-5 w-5 mr-3" />
            Start a Room
          </Button>
          
          <Button
            onClick={onJoinRoom}
            className="flex-1 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white h-14 text-lg font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl border-0"
          >
            <Smartphone className="h-5 w-5 mr-3" />
            Join Friends
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl mb-16">
          <Card className="bg-white/70 backdrop-blur-sm border border-orange-200 p-6 text-center hover:bg-white/80 transition-all duration-200 rounded-2xl shadow-md hover:shadow-lg">
            <Users className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <div className="text-orange-800 font-semibold text-base mb-1">
              Play Together
            </div>
            <div className="text-orange-600 text-sm">2-8 players</div>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border border-orange-200 p-6 text-center hover:bg-white/80 transition-all duration-200 rounded-2xl shadow-md hover:shadow-lg">
            <Music className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <div className="text-orange-800 font-semibold text-base mb-1">
              Your Music
            </div>
            <div className="text-orange-600 text-sm">Spotify playlists</div>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border border-orange-200 p-6 text-center hover:bg-white/80 transition-all duration-200 rounded-2xl shadow-md hover:shadow-lg">
            <Timer className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <div className="text-orange-800 font-semibold text-base mb-1">
              Quick Rounds
            </div>
            <div className="text-orange-600 text-sm">30 seconds</div>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border border-orange-200 p-6 text-center hover:bg-white/80 transition-all duration-200 rounded-2xl shadow-md hover:shadow-lg">
            <Trophy className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <div className="text-orange-800 font-semibold text-base mb-1">
              First to Win
            </div>
            <div className="text-orange-600 text-sm">10 points</div>
          </Card>
        </div>

        {/* How to Play */}
        <Card className="bg-white/80 backdrop-blur-sm border border-orange-200 p-8 w-full max-w-4xl rounded-2xl shadow-lg">
          <h3 className="text-2xl font-semibold text-orange-800 mb-8 text-center">
            How to Play
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-300 to-red-300 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="text-orange-800 font-semibold mb-1 text-base">
                    Connect Your Playlist
                  </h4>
                  <p className="text-orange-600 text-sm">Host connects a Spotify playlist to start the fun</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-300 to-red-300 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="text-orange-800 font-semibold mb-1 text-base">
                    Invite Your Friends
                  </h4>
                  <p className="text-orange-600 text-sm">Share the cozy room code and gather your music crew</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-300 to-red-300 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="text-orange-800 font-semibold mb-1 text-base">
                    Listen & Place
                  </h4>
                  <p className="text-orange-600 text-sm">Hear a song snippet and place it on the timeline by year</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-300 to-red-300 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-semibold text-sm">4</span>
                </div>
                <div>
                  <h4 className="text-orange-800 font-semibold mb-1 text-base">
                    Earn Your Victory
                  </h4>
                  <p className="text-orange-600 text-sm">Closer guesses earn more points. First to 10 wins the round!</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center space-y-3">
          <p className="text-orange-600 text-sm font-medium">
            Powered by Spotify
          </p>
          <p className="text-orange-500 text-xs max-w-md mx-auto leading-relaxed">
            A warm, friendly way to test your music knowledge with friends. 
            Connect your favorite playlist and discover who really knows their music history.
          </p>
        </div>
      </div>
    </div>
  );
}
