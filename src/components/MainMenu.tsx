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
    <div className="min-h-screen bg-gradient-to-br from-rich_black-500 via-rich_black-400 to-charcoal-500 relative overflow-hidden">
      {/* Artistic background elements */}
      <div className="absolute inset-0 opacity-30">
        {/* Geometric patterns */}
        <div className="absolute top-20 left-20 w-40 h-40 bg-cerulean-500/20 rounded-full blur-2xl" />
        <div className="absolute top-40 right-32 w-60 h-60 bg-fandango-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-cerulean-400/10 rounded-full blur-3xl" />
        
        {/* Abstract lines and shapes */}
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 1200 800">
          {/* Flowing lines */}
          <g stroke="#107793" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6">
            <path d="M100 200 Q300 150 500 200 Q700 250 900 200" />
            <path d="M150 300 Q350 250 550 300 Q750 350 950 300" />
            <path d="M50 400 Q250 350 450 400 Q650 450 850 400" />
          </g>
          
          {/* Geometric shapes */}
          <g stroke="#a53b8b" strokeWidth="3" fill="none" opacity="0.4">
            <circle cx="200" cy="150" r="40" />
            <circle cx="200" cy="150" r="25" />
            <circle cx="200" cy="150" r="8" fill="#a53b8b" />
            
            <rect x="900" y="300" width="80" height="80" rx="15" transform="rotate(15 940 340)" />
            <circle cx="940" cy="340" r="15" fill="#a53b8b" transform="rotate(15 940 340)" />
          </g>
          
          {/* Sound visualization */}
          <g stroke="#107793" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5">
            <rect x="50" y="600" width="8" height="40" rx="4" />
            <rect x="65" y="580" width="8" height="60" rx="4" />
            <rect x="80" y="590" width="8" height="50" rx="4" />
            <rect x="95" y="570" width="8" height="70" rx="4" />
            <rect x="110" y="585" width="8" height="55" rx="4" />
            
            <rect x="1050" y="500" width="8" height="35" rx="4" />
            <rect x="1065" y="485" width="8" height="50" rx="4" />
            <rect x="1080" y="495" width="8" height="40" rx="4" />
            <rect x="1095" y="480" width="8" height="55" rx="4" />
          </g>
          
          {/* Musical elements */}
          <g stroke="#a53b8b" strokeWidth="2" fill="none" opacity="0.3">
            <circle cx="800" cy="150" r="30" />
            <path d="M785 135 Q800 125 815 135" />
            <circle cx="800" cy="150" r="6" fill="#a53b8b" />
            
            <circle cx="400" cy="600" r="25" />
            <circle cx="400" cy="600" r="15" />
            <circle cx="400" cy="600" r="4" fill="#a53b8b" />
          </g>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
        
        {/* Header Section */}
        <div className="text-center max-w-6xl mx-auto mb-20">
          {/* Logo */}
          <div className="flex items-center justify-center mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-cerulean-500 rounded-3xl blur-xl opacity-40" />
              <div className="relative w-32 h-32 bg-gradient-to-br from-rich_black-300 to-charcoal-500 border-3 border-cerulean-500 rounded-3xl flex items-center justify-center shadow-2xl">
                <Music className="h-16 w-16 text-cerulean-400" />
              </div>
            </div>
          </div>
          
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black mb-8 tracking-tight" 
              style={{ 
                fontFamily: 'Impact, Arial Black, sans-serif',
                background: 'linear-gradient(135deg, #107793 0%, #a53b8b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '4px 4px 0px rgba(14,31,47,0.8)'
              }}>
            RYTHMY
          </h1>
          
          <div className="space-y-6 mb-12">
            <p className="text-2xl sm:text-3xl font-bold text-honeydew-100 max-w-3xl mx-auto leading-relaxed"
               style={{ 
                 fontFamily: 'system-ui, -apple-system, sans-serif',
                 textShadow: '2px 2px 0px rgba(14,31,47,0.8)'
               }}>
              Master the Timeline of Sound
            </p>
            <p className="text-lg text-honeydew-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Challenge your crew to place tracks on the timeline. 
              Connect your Spotify and see who truly knows their music history.
            </p>
          </div>
        </div>

        {/* Main Action Section */}
        <div className="w-full max-w-6xl mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Create Room Card */}
            <Card className="relative bg-gradient-to-br from-rich_black-400/90 to-charcoal-400/90 border-2 border-cerulean-400 p-10 rounded-3xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
                  style={{ boxShadow: '0 0 30px rgba(16,119,147,0.3)' }}>
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-cerulean-400 to-cerulean-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Play className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-cerulean-300" 
                    style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                  START THE SESSION
                </h3>
                <p className="text-honeydew-400 text-lg leading-relaxed">
                  Host the game with your Spotify playlist. Set the vibe and challenge your friends to guess when these tracks first hit the scene.
                </p>
                <Button
                  onClick={onCreateRoom}
                  className="w-full bg-gradient-to-r from-cerulean-500 to-cerulean-600 hover:from-cerulean-400 hover:to-cerulean-500 text-white h-16 text-xl font-black rounded-2xl transition-all duration-300 shadow-xl border-0"
                  style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}
                >
                  CREATE ROOM
                </Button>
              </div>
            </Card>

            {/* Join Room Card */}
            <Card className="relative bg-gradient-to-br from-rich_black-400/90 to-charcoal-400/90 border-2 border-fandango-400 p-10 rounded-3xl backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
                  style={{ boxShadow: '0 0 30px rgba(165,59,139,0.3)' }}>
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-fandango-400 to-fandango-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Smartphone className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-fandango-300" 
                    style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}>
                  JOIN THE CREW
                </h3>
                <p className="text-honeydew-400 text-lg leading-relaxed">
                  Got a room code? Jump into an existing session and prove your music knowledge against friends and strangers alike.
                </p>
                <Button
                  onClick={onJoinRoom}
                  className="w-full bg-gradient-to-r from-fandango-500 to-fandango-600 hover:from-fandango-400 hover:to-fandango-500 text-white h-16 text-xl font-black rounded-2xl transition-all duration-300 shadow-xl border-0"
                  style={{ fontFamily: 'Impact, Arial Black, sans-serif' }}
                >
                  JOIN ROOM
                </Button>
              </div>
            </Card>
          </div>

          {/* Game Features */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-rich_black-300/80 to-charcoal-400/80 border border-honeydew-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:border-honeydew-400 transition-all duration-300">
              <Users className="h-12 w-12 text-honeydew-300 mx-auto mb-4" />
              <div className="text-honeydew-200 font-bold text-lg mb-2" 
                   style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Multiplayer
              </div>
              <div className="text-honeydew-400 text-sm font-medium">2-8 Players</div>
            </Card>
            
            <Card className="bg-gradient-to-br from-rich_black-300/80 to-charcoal-400/80 border border-cerulean-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:border-cerulean-400 transition-all duration-300">
              <Music className="h-12 w-12 text-cerulean-300 mx-auto mb-4" />
              <div className="text-cerulean-200 font-bold text-lg mb-2" 
                   style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Your Music
              </div>
              <div className="text-cerulean-400 text-sm font-medium">Spotify Integration</div>
            </Card>
            
            <Card className="bg-gradient-to-br from-rich_black-300/80 to-charcoal-400/80 border border-fandango-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:border-fandango-400 transition-all duration-300">
              <Timer className="h-12 w-12 text-fandango-300 mx-auto mb-4" />
              <div className="text-fandango-200 font-bold text-lg mb-2" 
                   style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Quick Rounds
              </div>
              <div className="text-fandango-400 text-sm font-medium">30 Second Rounds</div>
            </Card>
            
            <Card className="bg-gradient-to-br from-rich_black-300/80 to-charcoal-400/80 border border-honeydew-600 p-6 text-center rounded-2xl backdrop-blur-sm hover:border-honeydew-400 transition-all duration-300">
              <Trophy className="h-12 w-12 text-honeydew-300 mx-auto mb-4" />
              <div className="text-honeydew-200 font-bold text-lg mb-2" 
                   style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Victory
              </div>
              <div className="text-honeydew-400 text-sm font-medium">First to 10 Points</div>
            </Card>
          </div>
        </div>

        {/* How to Play Section */}
        <Card className="w-full max-w-6xl bg-gradient-to-br from-rich_black-400/95 to-charcoal-500/95 border-2 border-honeydew-600 p-12 rounded-3xl backdrop-blur-sm mb-16"
              style={{ boxShadow: '0 0 40px rgba(217,232,221,0.2)' }}>
          <h2 className="text-4xl font-black text-center mb-12" 
              style={{ 
                fontFamily: 'Impact, Arial Black, sans-serif',
                background: 'linear-gradient(135deg, #107793 0%, #a53b8b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
            HOW TO PLAY
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cerulean-400 to-cerulean-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-black text-2xl">1</span>
                </div>
                <div>
                  <h4 className="text-cerulean-300 font-bold mb-3 text-xl" 
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    Connect Your Spotify
                  </h4>
                  <p className="text-honeydew-400 text-base leading-relaxed">
                    Host connects their Spotify account and selects a playlist to set the musical challenge for the session.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-fandango-400 to-fandango-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-black text-2xl">2</span>
                </div>
                <div>
                  <h4 className="text-fandango-300 font-bold mb-3 text-xl" 
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    Gather Your Crew
                  </h4>
                  <p className="text-honeydew-400 text-base leading-relaxed">
                    Share the unique room code with friends. Up to 8 players can join and compete in the same session.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-honeydew-400 to-honeydew-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-rich_black-500 font-black text-2xl">3</span>
                </div>
                <div>
                  <h4 className="text-honeydew-300 font-bold mb-3 text-xl" 
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    Listen & Place
                  </h4>
                  <p className="text-honeydew-400 text-base leading-relaxed">
                    Hear a 30-second snippet and place the track on the timeline based on when you think it was released.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-charcoal-400 to-charcoal-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-honeydew-100 font-black text-2xl">4</span>
                </div>
                <div>
                  <h4 className="text-charcoal-300 font-bold mb-3 text-xl" 
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    Score & Win
                  </h4>
                  <p className="text-honeydew-400 text-base leading-relaxed">
                    Earn points based on accuracy. The closer your guess, the more points you get. First to 10 points wins!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4 max-w-2xl">
          <p className="text-cerulean-300 text-base font-bold tracking-wide"
             style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Powered by Spotify
          </p>
          <p className="text-honeydew-500 text-sm leading-relaxed">
            Test your music knowledge with friends in this engaging timeline guessing game. 
            Connect your favorite playlists and discover who really knows their music history.
          </p>
        </div>
      </div>
    </div>
  );
}
