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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-16 w-80 h-80 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-gradient-to-r from-pink-400/10 to-rose-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}} />
        <div className="absolute bottom-1/4 left-16 w-48 h-48 bg-gradient-to-r from-emerald-400/8 to-teal-500/8 rounded-full blur-xl animate-pulse" style={{animationDelay: '6s'}} />
      </div>

      {/* Floating music notes animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <Music className="h-4 w-4 text-violet-300/20" />
          </div>
        ))}
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <Music className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Star className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black bg-gradient-to-r from-white via-violet-200 to-purple-300 bg-clip-text text-transparent">
                Timeliner
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Crown className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">Music Challenge Game</span>
                <Crown className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
          </div>
          <p className="text-lg sm:text-xl text-violet-200 max-w-2xl mx-auto leading-relaxed">
            The ultimate music chronology challenge! Listen to mystery tracks and place them in perfect timeline order. 
            <span className="block mt-2 text-violet-300 font-medium">Think you know your music history?</span>
          </p>
        </div>

        {/* Enhanced Game Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 w-full max-w-5xl">
          <Card className="group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border-white/30 p-4 sm:p-6 text-center hover:from-white/20 hover:to-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:rotate-12 transition-transform duration-300">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="text-white font-bold text-base sm:text-lg mb-1">Multiplayer Magic</div>
            <div className="text-sm sm:text-base text-blue-200">2-8 Players Online</div>
          </Card>
          
          <Card className="group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border-white/30 p-4 sm:p-6 text-center hover:from-white/20 hover:to-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:rotate-12 transition-transform duration-300">
              <Music className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="text-white font-bold text-base sm:text-lg mb-1">Any Genre</div>
            <div className="text-sm sm:text-base text-purple-200">Your Deezer Playlists</div>
          </Card>
          
          <Card className="group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border-white/30 p-4 sm:p-6 text-center hover:from-white/20 hover:to-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:rotate-12 transition-transform duration-300">
              <Timer className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="text-white font-bold text-base sm:text-lg mb-1">Lightning Fast</div>
            <div className="text-sm sm:text-base text-yellow-200">30 Second Rounds</div>
          </Card>
          
          <Card className="group bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border-white/30 p-4 sm:p-6 text-center hover:from-white/20 hover:to-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:rotate-12 transition-transform duration-300">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="text-white font-bold text-base sm:text-lg mb-1">Victory Race</div>
            <div className="text-sm sm:text-base text-green-200">First to 10 Wins</div>
          </Card>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 w-full max-w-2xl mb-12">
          <Button
            onClick={onCreateRoom}
            size="lg"
            className="group flex-1 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-800 text-white shadow-2xl border-0 h-16 sm:h-20 text-xl sm:text-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-violet-500/25 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Play className="h-7 w-7 sm:h-8 sm:w-8 mr-3 group-hover:scale-110 transition-transform duration-300" />
            Host New Game
          </Button>
          
          <Button
            onClick={onJoinRoom}
            size="lg"
            variant="outline"
            className="group flex-1 bg-gradient-to-r from-white/10 to-white/5 border-2 border-violet-400/50 text-white hover:bg-gradient-to-r hover:from-white/20 hover:to-white/15 hover:border-violet-400 shadow-2xl h-16 sm:h-20 text-xl sm:text-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-violet-400/25 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/20 to-violet-500/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Smartphone className="h-7 w-7 sm:h-8 sm:w-8 mr-3 group-hover:scale-110 transition-transform duration-300" />
            Join Game
          </Button>
        </div>

        {/* Enhanced How to Play */}
        <Card className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border-white/30 p-6 sm:p-8 w-full max-w-3xl shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
              How to Play
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[
              { num: "1", text: "Host creates a room and loads a Deezer playlist", color: "from-violet-500 to-purple-600" },
              { num: "2", text: "Players join using the room code on their phones", color: "from-blue-500 to-cyan-600" },
              { num: "3", text: "Listen to mystery songs and place them chronologically", color: "from-pink-500 to-rose-600" },
              { num: "4", text: "First player to get 10 correct placements wins!", color: "from-green-500 to-emerald-600" }
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors duration-300">
                <div className={`w-8 h-8 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold text-sm">{step.num}</span>
                </div>
                <p className="text-violet-100 font-medium leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Enhanced Footer */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <p className="text-sm font-semibold text-violet-200">
              Powered by Deezer API
            </p>
            <Star className="h-4 w-4 text-yellow-400" />
          </div>
          <p className="text-xs text-violet-300">
            Cross-platform • Real-time multiplayer • Thousands of songs
          </p>
        </div>
      </div>
    </div>
  );
}
