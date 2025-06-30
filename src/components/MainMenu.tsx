import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Users, Trophy, Zap, Play, Smartphone, Star, Crown, Timer } from 'lucide-react';

interface MainMenuProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function MainMenu({ onCreateRoom, onJoinRoom }: MainMenuProps) {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black" />
      
      {/* Minimal floating elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-16 w-80 h-80 bg-white/[0.01] rounded-full blur-3xl" />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 lg:px-12">
        {/* Hero Section - Apple style */}
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
              <Music className="h-10 w-10 text-black" />
            </div>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
            Timeliner
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed mb-4">
            A fun music game for you and your friends. Can you guess when songs came out?
          </p>
          
          <p className="text-lg text-gray-500 font-light">
            Just for fun, not for profit.
          </p>
        </div>

        {/* Action Buttons - Apple style */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full max-w-md">
          <Button
            onClick={onCreateRoom}
            className="flex-1 bg-white text-black hover:bg-gray-100 h-14 text-lg font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Play className="h-5 w-5 mr-2" />
            Host Game
          </Button>
          
          <Button
            onClick={onJoinRoom}
            variant="outline"
            className="flex-1 border-gray-600 text-white hover:bg-white/5 h-14 text-lg font-semibold rounded-full transition-all duration-200"
          >
            <Smartphone className="h-5 w-5 mr-2" />
            Join Game
          </Button>
        </div>

        {/* Features Grid - Clean Apple layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-20">
          <Card className="bg-gray-900/50 border-gray-800 p-6 text-center hover:bg-gray-900/70 transition-colors duration-300">
            <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <div className="text-white font-semibold text-lg mb-1">Multiplayer</div>
            <div className="text-gray-400 text-sm">2-8 Players</div>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800 p-6 text-center hover:bg-gray-900/70 transition-colors duration-300">
            <Music className="h-8 w-8 text-purple-400 mx-auto mb-3" />
            <div className="text-white font-semibold text-lg mb-1">Any Genre</div>
            <div className="text-gray-400 text-sm">Your Playlists</div>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800 p-6 text-center hover:bg-gray-900/70 transition-colors duration-300">
            <Timer className="h-8 w-8 text-orange-400 mx-auto mb-3" />
            <div className="text-white font-semibold text-lg mb-1">Fast Paced</div>
            <div className="text-gray-400 text-sm">30s Rounds</div>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800 p-6 text-center hover:bg-gray-900/70 transition-colors duration-300">
            <Trophy className="h-8 w-8 text-green-400 mx-auto mb-3" />
            <div className="text-white font-semibold text-lg mb-1">Compete</div>
            <div className="text-gray-400 text-sm">First to 10</div>
          </Card>
        </div>

        {/* How to Play - Apple style */}
        <Card className="bg-gray-900/30 border-gray-800 p-8 w-full max-w-4xl">
          <h3 className="text-2xl font-semibold text-white mb-8 text-center">
            How it works
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Start a room</h4>
                  <p className="text-gray-400 text-sm">Someone hosts and picks a playlist from Deezer</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Friends join in</h4>
                  <p className="text-gray-400 text-sm">Everyone else joins with the room code</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Listen and guess</h4>
                  <p className="text-gray-400 text-sm">Songs start playing, you place them on your timeline</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-semibold text-sm">4</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">See who knows best</h4>
                  <p className="text-gray-400 text-sm">First to get 10 right wins (and gets bragging rights)</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer - Minimal Apple style */}
        <div className="mt-16 text-center space-y-3">
          <p className="text-gray-500 text-sm">
            Uses Deezer for music • Works on any device
          </p>
          <p className="text-gray-600 text-xs max-w-md mx-auto">
            This is an independent project created for friends to enjoy together. 
            Not affiliated with or endorsed by any music service or company.
          </p>
        </div>
      </div>
    </div>
  );
}
