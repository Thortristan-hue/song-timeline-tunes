
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Users, Smartphone, Play, Headphones } from 'lucide-react';

interface MainMenuProps {
  onHostGame: () => void;
  onJoinGame: () => void;
}

export function MainMenu({ onHostGame, onJoinGame }: MainMenuProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 via-indigo-900 to-violet-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            <Music className="h-4 w-4 text-purple-300 transform rotate-12" />
          </div>
        ))}
      </div>

      <div className="text-center space-y-12 max-w-4xl mx-auto relative z-10">
        {/* Game Title with Logo */}
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl rounded-full animate-pulse"></div>
            <Music className="h-24 w-24 text-purple-400 mx-auto animate-bounce relative z-10" />
          </div>
          <div className="space-y-3">
            <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-fade-in">
              Timeline Tunes
            </h1>
            <p className="text-2xl md:text-3xl text-purple-200/90 font-medium animate-fade-in">
              Arrange songs in chronological order
            </p>
            <p className="text-lg text-purple-300/70 max-w-2xl mx-auto animate-fade-in">
              Listen to music snippets and place them on your timeline. First to 10 wins!
            </p>
          </div>
        </div>

        {/* Game Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Host Game Card */}
          <Card className="group bg-gradient-to-br from-emerald-600/20 to-green-600/20 border-emerald-400/30 p-8 hover:from-emerald-500/30 hover:to-green-500/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 backdrop-blur-sm">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-emerald-400/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-500"></div>
                <Users className="h-16 w-16 text-emerald-400 mx-auto relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Host Game
                </h2>
                <p className="text-emerald-200/80 text-lg leading-relaxed">
                  Create a lobby and invite friends to join your musical timeline challenge
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center gap-2 text-emerald-300/70 text-sm">
                  <Play className="h-4 w-4" />
                  <span>Share room code with friends</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-300/70 text-sm">
                  <Headphones className="h-4 w-4" />
                  <span>Load your favorite playlists</span>
                </div>
              </div>

              <Button 
                onClick={onHostGame}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 group-hover:scale-105"
              >
                <Users className="h-5 w-5 mr-3" />
                Create Lobby
              </Button>
            </div>
          </Card>

          {/* Join Game Card */}
          <Card className="group bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-400/30 p-8 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 backdrop-blur-sm">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-blue-400/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-500"></div>
                <Smartphone className="h-16 w-16 text-blue-400 mx-auto relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors">
                  Join Game
                </h2>
                <p className="text-blue-200/80 text-lg leading-relaxed">
                  Enter a room code to join an existing musical timeline battle
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center gap-2 text-blue-300/70 text-sm">
                  <Smartphone className="h-4 w-4" />
                  <span>Perfect for mobile play</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-blue-300/70 text-sm">
                  <Music className="h-4 w-4" />
                  <span>Compete with friends</span>
                </div>
              </div>

              <Button 
                onClick={onJoinGame}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105"
              >
                <Smartphone className="h-5 w-5 mr-3" />
                Enter Room Code
              </Button>
            </div>
          </Card>
        </div>

        {/* Footer info */}
        <div className="text-center pt-8">
          <p className="text-purple-400/60 text-sm">
            Inspired by Jackbox Games • Built for mobile and desktop
          </p>
        </div>
      </div>
    </div>
  );
}
