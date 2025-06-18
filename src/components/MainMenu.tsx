
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Users, Smartphone } from 'lucide-react';

interface MainMenuProps {
  onHostGame: () => void;
  onJoinGame: () => void;
}

export function MainMenu({ onHostGame, onJoinGame }: MainMenuProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <Music className="h-20 w-20 text-purple-400 mx-auto animate-pulse" />
          <h1 className="text-6xl font-bold text-white mb-2">
            Timeline Tunes
          </h1>
          <p className="text-xl text-purple-200/80">
            Arrange songs in chronological order
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card className="bg-white/10 border-white/20 p-8 hover:bg-white/15 transition-all duration-300">
            <div className="text-center space-y-4">
              <Users className="h-12 w-12 text-green-400 mx-auto" />
              <h2 className="text-2xl font-bold text-white">Host Game</h2>
              <p className="text-purple-200/80">
                Create a lobby and invite players to join
              </p>
              <Button 
                onClick={onHostGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-xl"
              >
                Host Game
              </Button>
            </div>
          </Card>

          <Card className="bg-white/10 border-white/20 p-8 hover:bg-white/15 transition-all duration-300">
            <div className="text-center space-y-4">
              <Smartphone className="h-12 w-12 text-blue-400 mx-auto" />
              <h2 className="text-2xl font-bold text-white">Join Game</h2>
              <p className="text-purple-200/80">
                Enter a lobby code to join an existing game
              </p>
              <Button 
                onClick={onJoinGame}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-xl"
              >
                Join Game
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
