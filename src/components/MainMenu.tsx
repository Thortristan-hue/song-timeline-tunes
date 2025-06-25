import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Users, Trophy, Zap, Play, Smartphone } from 'lucide-react';

interface MainMenuProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function MainMenu({ onCreateRoom, onJoinRoom }: MainMenuProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-400/8 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}} />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Music className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white">
              Timeliner
            </h1>
          </div>
          <p className="text-sm sm:text-base text-purple-300 max-w-md mx-auto">
            Challenge your friends! Listen to mystery songs and place them in chronological order on your timeline.
          </p>
        </div>

        {/* Game Features */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12 w-full max-w-4xl">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-3 sm:p-4 text-center">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-white font-bold text-sm sm:text-base">Multiplayer</div>
            <div className="text-xs sm:text-sm text-blue-200">2-8 Players</div>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-3 sm:p-4 text-center">
            <Music className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-white font-bold text-sm sm:text-base">Any Genre</div>
            <div className="text-xs sm:text-sm text-purple-200">Your Playlists</div>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-3 sm:p-4 text-center">
            <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-white font-bold text-sm sm:text-base">Fast Paced</div>
            <div className="text-xs sm:text-sm text-yellow-200">30s Rounds</div>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-3 sm:p-4 text-center">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 mx-auto mb-2" />
            <div className="text-white font-bold text-sm sm:text-base">Compete</div>
            <div className="text-xs sm:text-sm text-green-200">First to 10</div>
          </Card>
        </div>

        {/* Action Buttons - Made larger */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-lg">
          <Button
            onClick={onCreateRoom}
            size="lg"
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg border-0 h-14 sm:h-16 text-lg sm:text-xl font-bold transition-all transform hover:scale-105"
          >
            <Play className="h-6 w-6 sm:h-7 sm:w-7 mr-2" />
            Host Game
          </Button>
          
          <Button
            onClick={onJoinRoom}
            size="lg"
            variant="outline"
            className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 shadow-lg h-14 sm:h-16 text-lg sm:text-xl font-bold transition-all transform hover:scale-105"
          >
            <Smartphone className="h-6 w-6 sm:h-7 sm:w-7 mr-2" />
            Join Game
          </Button>
        </div>

        {/* How to Play */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4 sm:p-6 mt-8 sm:mt-12 w-full max-w-2xl">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 text-center">How to Play</h3>
          <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-purple-200">
            <div className="flex items-start gap-3">
              <Badge className="bg-purple-500/20 text-purple-200 border-purple-400 min-w-6 h-6 flex items-center justify-center text-xs font-bold">1</Badge>
              <p>Host creates a room and loads a Deezer playlist</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-purple-500/20 text-purple-200 border-purple-400 min-w-6 h-6 flex items-center justify-center text-xs font-bold">2</Badge>
              <p>Players join using the room code on their phones</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-purple-500/20 text-purple-200 border-purple-400 min-w-6 h-6 flex items-center justify-center text-xs font-bold">3</Badge>
              <p>Listen to mystery songs and place them chronologically in your timeline</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-purple-500/20 text-purple-200 border-purple-400 min-w-6 h-6 flex items-center justify-center text-xs font-bold">4</Badge>
              <p>First player to get 10 correct placements wins!</p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-xs sm:text-sm text-purple-300">
            Powered by Deezer • Works on any device
          </p>
        </div>
      </div>
    </div>
  );
}
