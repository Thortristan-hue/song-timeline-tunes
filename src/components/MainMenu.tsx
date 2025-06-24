
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Users, Gamepad2, Trophy, Sparkles } from 'lucide-react';
import { TestingUtils } from '@/components/TestingUtils';
import { useGameRoom } from '@/hooks/useGameRoom';

interface MainMenuProps {
  onHostGame: () => void;
  onJoinGame: () => void;
}

export function MainMenu({ onHostGame, onJoinGame }: MainMenuProps) {
  const { createRoom, joinRoom } = useGameRoom();

  // Handle test mode URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('testMode');
    const roomCode = urlParams.get('roomCode');
    const playerName = urlParams.get('playerName');

    if (testMode && roomCode && playerName) {
      console.log('Test mode detected, auto-joining room:', roomCode, 'as', playerName);
      // Auto-join the room
      setTimeout(async () => {
        try {
          const success = await joinRoom(roomCode, playerName);
          if (success) {
            console.log('Test player joined successfully');
            // Navigate to the appropriate screen
            window.location.hash = '#mobileLobby';
          }
        } catch (error) {
          console.error('Test auto-join failed:', error);
        }
      }, 500);
    }
  }, [joinRoom]);

  const handleCreateTestRoom = async (): Promise<string | null> => {
    const roomCode = await createRoom('TestHost');
    return roomCode;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 via-indigo-900 to-violet-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            <Music className="h-8 w-8 text-purple-300 transform rotate-12" />
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center space-y-8 max-w-4xl">
          {/* Logo/Title */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-3xl rounded-full animate-pulse"></div>
              <h1 className="relative text-8xl md:text-9xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                Timeliner
              </h1>
            </div>
            <p className="text-2xl md:text-3xl text-purple-200/80 font-light">
              Place songs in chronological order. First to 10 wins!
            </p>
          </div>

          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
            <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-400/30 backdrop-blur-sm overflow-hidden">
              <div className="p-8 text-center space-y-4">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 blur-xl rounded-full group-hover:scale-110 transition-transform duration-300"></div>
                  <Users className="relative h-16 w-16 text-purple-400 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-white">Host Game</h3>
                <p className="text-purple-200/70">Create a room and invite friends to play</p>
                <Button 
                  onClick={onHostGame}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-xl text-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                >
                  Create Room
                </Button>
              </div>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-pink-600/20 to-rose-600/20 border-pink-400/30 backdrop-blur-sm overflow-hidden">
              <div className="p-8 text-center space-y-4">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 to-rose-500/20 blur-xl rounded-full group-hover:scale-110 transition-transform duration-300"></div>
                  <Gamepad2 className="relative h-16 w-16 text-pink-400 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-white">Join Game</h3>
                <p className="text-pink-200/70">Enter a room code to join an existing game</p>
                <Button 
                  onClick={onJoinGame}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 px-6 rounded-xl text-lg shadow-lg hover:shadow-pink-500/50 transition-all duration-300"
                >
                  Join Room
                </Button>
              </div>
            </Card>
          </div>

          {/* Testing Utils - Only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8">
              <TestingUtils onCreateTestRoom={handleCreateTestRoom} />
            </div>
          )}

          {/* How to Play */}
          <Card className="bg-black/20 border-white/10 p-6 backdrop-blur-sm max-w-3xl mx-auto">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">How to Play</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-purple-200/80">
                <div className="flex flex-col items-center gap-2">
                  <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
                  <span>Listen to mystery song previews</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
                  <span>Place them in your timeline chronologically</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</span>
                  <span>First player to 10 correct placements wins!</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-purple-300/70">
              <Music className="h-5 w-5" />
              <span className="text-sm">Real Music Previews</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-purple-300/70">
              <Users className="h-5 w-5" />
              <span className="text-sm">Multiplayer Fun</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-purple-300/70">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm">Custom Playlists</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
