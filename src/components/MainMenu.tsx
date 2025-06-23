
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
    <div className="min-h-screen timeliner-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements using design system */}
      <div className="timeliner-floating-elements">
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
            <h1 className="timeliner-title timeliner-text-gradient animate-fade-in">
              Timeliner
            </h1>
            <p className="timeliner-subtitle text-purple-200/90 animate-fade-in">
              Arrange songs in chronological order
            </p>
            <p className="timeliner-body text-purple-300/70 max-w-2xl mx-auto animate-fade-in">
              Listen to music snippets and place them on your timeline. First to 10 wins!
            </p>
          </div>
        </div>

        {/* Game Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Host Game Card */}
          <Card className="timeliner-menu-card bg-gradient-to-br from-emerald-600/20 to-green-600/20 border-emerald-400/30">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-emerald-400/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-500"></div>
                <Users className="h-16 w-16 text-emerald-400 mx-auto relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>
              
              <div className="space-y-3">
                <h2 className="timeliner-heading text-white group-hover:text-emerald-300 transition-colors">
                  Host Game
                </h2>
                <p className="text-emerald-200/80 timeliner-body leading-relaxed">
                  Create a lobby and invite friends to join your musical timeline challenge
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center gap-2 text-emerald-300/70 timeliner-caption">
                  <Play className="h-4 w-4" />
                  <span>Share room code with friends</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-300/70 timeliner-caption">
                  <Headphones className="h-4 w-4" />
                  <span>Load your favorite playlists</span>
                </div>
              </div>

              <Button 
                onClick={onHostGame}
                className="timeliner-button w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 py-4 px-8 text-lg"
              >
                <Users className="h-5 w-5 mr-3" />
                Create Lobby
              </Button>
            </div>
          </Card>

          {/* Join Game Card */}
          <Card className="timeliner-menu-card bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-400/30">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-blue-400/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-500"></div>
                <Smartphone className="h-16 w-16 text-blue-400 mx-auto relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>
              
              <div className="space-y-3">
                <h2 className="timeliner-heading text-white group-hover:text-blue-300 transition-colors">
                  Join Game
                </h2>
                <p className="text-blue-200/80 timeliner-body leading-relaxed">
                  Enter a room code to join an existing musical timeline battle
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center gap-2 text-blue-300/70 timeliner-caption">
                  <Smartphone className="h-4 w-4" />
                  <span>Perfect for mobile play</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-blue-300/70 timeliner-caption">
                  <Music className="h-4 w-4" />
                  <span>Compete with friends</span>
                </div>
              </div>

              <Button 
                onClick={onJoinGame}
                className="timeliner-button w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 py-4 px-8 text-lg"
              >
                <Smartphone className="h-5 w-5 mr-3" />
                Enter Room Code
              </Button>
            </div>
          </Card>
        </div>

        {/* Footer info */}
        <div className="text-center pt-8">
          <p className="text-purple-400/60 timeliner-caption">
            Inspired by Jackbox Games • Built for mobile and desktop
          </p>
        </div>
      </div>
    </div>
  );
}
