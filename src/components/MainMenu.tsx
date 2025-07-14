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
    <div className="min-h-screen bg-gradient-to-br from-rich_black-500 via-rich_black-600 to-charcoal-600 relative overflow-hidden">
      {/* Dark theme background elements */}
      <div className="absolute inset-0 opacity-20">
        {/* Subtle glow effects */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-cerulean-500/10 rounded-full blur-2xl" />
        <div className="absolute top-40 right-32 w-48 h-48 bg-fandango-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-1/3 w-64 h-64 bg-cerulean-400/6 rounded-full blur-3xl" />
        
        {/* Minimalist geometric elements */}
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 1200 800">
          <g stroke="#107793" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3">
            <path d="M100 200 Q300 150 500 200 Q700 250 900 200" />
            <path d="M150 300 Q350 250 550 300 Q750 350 950 300" />
          </g>
          
          <g stroke="#a53b8b" strokeWidth="1" fill="none" opacity="0.2">
            <circle cx="200" cy="150" r="30" />
            <circle cx="200" cy="150" r="6" fill="#a53b8b" />
            
            <circle cx="1000" cy="500" r="25" />
            <circle cx="1000" cy="500" r="4" fill="#a53b8b" />
          </g>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8 sm:mb-10">
            <div className="relative">
              <div className="absolute inset-0 bg-cerulean-500/20 rounded-2xl blur-lg" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-rich_black-400 to-charcoal-500 border-2 border-cerulean-500/50 rounded-2xl flex items-center justify-center shadow-xl">
                <Music className="h-10 w-10 sm:h-12 sm:w-12 text-cerulean-400" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 tracking-tight text-honeydew-100" 
              style={{ 
                fontFamily: 'Impact, Arial Black, sans-serif',
                textShadow: '3px 3px 0px rgba(14,31,47,0.8)'
              }}>
            RYTHMY
          </h1>
          
          <div className="space-y-4 mb-8 sm:mb-10">
            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-honeydew-300 max-w-2xl mx-auto leading-relaxed">
              Master the Timeline of Sound
            </p>
            <p className="text-sm sm:text-base text-honeydew-500 max-w-xl mx-auto leading-relaxed">
              Challenge your crew to place tracks on the timeline. 
              Connect your Spotify and see who truly knows their music history.
            </p>
          </div>
        </div>

        {/* Mobile-First Action Buttons */}
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mb-12 sm:mb-16 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
          {/* Join Room Button - Prominent on mobile */}
          <Button
            onClick={onJoinRoom}
            className="w-full sm:flex-1 bg-gradient-to-r from-fandango-500 to-fandango-600 hover:from-fandango-400 hover:to-fandango-500 text-white h-16 sm:h-14 text-lg sm:text-base font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border-0 active:scale-95"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              minHeight: '64px' // Ensures good touch target on mobile
            }}
          >
            <Smartphone className="h-5 w-5 mr-3" />
            Join Room
          </Button>
          
          {/* Create Room Button */}
          <Button
            onClick={onCreateRoom}
            className="w-full sm:flex-1 bg-gradient-to-r from-cerulean-500 to-cerulean-600 hover:from-cerulean-400 hover:to-cerulean-500 text-white h-16 sm:h-14 text-lg sm:text-base font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border-0 active:scale-95"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              minHeight: '64px' // Ensures good touch target on mobile
            }}
          >
            <Play className="h-5 w-5 mr-3" />
            Create Room
          </Button>
        </div>

        {/* Game Features - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full max-w-4xl mb-12 sm:mb-16">
          <Card className="bg-rich_black-400/80 border border-honeydew-700/30 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:border-honeydew-600/50 transition-all duration-300">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-honeydew-400 mx-auto mb-2 sm:mb-3" />
            <div className="text-honeydew-200 font-semibold text-sm sm:text-base mb-1">
              Multiplayer
            </div>
            <div className="text-honeydew-500 text-xs sm:text-sm">2-8 Players</div>
          </Card>
          
          <Card className="bg-rich_black-400/80 border border-cerulean-700/30 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:border-cerulean-600/50 transition-all duration-300">
            <Music className="h-8 w-8 sm:h-10 sm:w-10 text-cerulean-400 mx-auto mb-2 sm:mb-3" />
            <div className="text-cerulean-300 font-semibold text-sm sm:text-base mb-1">
              Your Music
            </div>
            <div className="text-cerulean-500 text-xs sm:text-sm">Spotify</div>
          </Card>
          
          <Card className="bg-rich_black-400/80 border border-fandango-700/30 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:border-fandango-600/50 transition-all duration-300">
            <Timer className="h-8 w-8 sm:h-10 sm:w-10 text-fandango-400 mx-auto mb-2 sm:mb-3" />
            <div className="text-fandango-300 font-semibold text-sm sm:text-base mb-1">
              Quick
            </div>
            <div className="text-fandango-500 text-xs sm:text-sm">30s Rounds</div>
          </Card>
          
          <Card className="bg-rich_black-400/80 border border-honeydew-700/30 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:border-honeydew-600/50 transition-all duration-300">
            <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-honeydew-400 mx-auto mb-2 sm:mb-3" />
            <div className="text-honeydew-300 font-semibold text-sm sm:text-base mb-1">
              Victory
            </div>
            <div className="text-honeydew-500 text-xs sm:text-sm">10 Points</div>
          </Card>
        </div>

        {/* How to Play Section - Collapsible on mobile */}
        <Card className="w-full max-w-4xl bg-rich_black-400/90 border border-charcoal-400/50 p-6 sm:p-8 lg:p-10 rounded-2xl backdrop-blur-sm mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-6 sm:mb-8 text-honeydew-200" 
              style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
            HOW TO PLAY
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cerulean-500 to-cerulean-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">1</span>
                </div>
                <div>
                  <h4 className="text-cerulean-300 font-bold mb-1 sm:mb-2 text-base sm:text-lg">
                    Connect Spotify
                  </h4>
                  <p className="text-honeydew-500 text-sm sm:text-base leading-relaxed">
                    Host connects Spotify and selects a playlist for the game.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-fandango-500 to-fandango-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">2</span>
                </div>
                <div>
                  <h4 className="text-fandango-300 font-bold mb-1 sm:mb-2 text-base sm:text-lg">
                    Share Code
                  </h4>
                  <p className="text-honeydew-500 text-sm sm:text-base leading-relaxed">
                    Friends join using the room code. Up to 8 players can compete.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-honeydew-500 to-honeydew-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-rich_black-500 font-bold text-lg sm:text-xl">3</span>
                </div>
                <div>
                  <h4 className="text-honeydew-300 font-bold mb-1 sm:mb-2 text-base sm:text-lg">
                    Listen & Guess
                  </h4>
                  <p className="text-honeydew-500 text-sm sm:text-base leading-relaxed">
                    Hear tracks and place them on the timeline by release year.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-charcoal-500 to-charcoal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-honeydew-100 font-bold text-lg sm:text-xl">4</span>
                </div>
                <div>
                  <h4 className="text-charcoal-300 font-bold mb-1 sm:mb-2 text-base sm:text-lg">
                    Score Points
                  </h4>
                  <p className="text-honeydew-500 text-sm sm:text-base leading-relaxed">
                    Closer guesses earn more points. First to 10 wins!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2 sm:space-y-3 max-w-md sm:max-w-lg px-4">
          <p className="text-cerulean-400 text-sm sm:text-base font-semibold">
            Powered by Spotify
          </p>
          <p className="text-honeydew-600 text-xs sm:text-sm leading-relaxed">
            Test your music knowledge with friends. Connect playlists and discover who knows their music history.
          </p>
        </div>
      </div>
    </div>
  );
}
