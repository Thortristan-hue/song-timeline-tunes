
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Users, Smartphone, Play, Headphones, Trophy, Clock, Star } from 'lucide-react';

interface MainMenuProps {
  onHostGame: () => void;
  onJoinGame: () => void;
}

export function MainMenu({ onHostGame, onJoinGame }: MainMenuProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            <Music className={`h-${2 + Math.floor(Math.random() * 4)} w-${2 + Math.floor(Math.random() * 4)} text-purple-300 transform rotate-${Math.floor(Math.random() * 12) * 30}`} />
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <div className="text-center space-y-8 max-w-6xl mx-auto">
          {/* Game Logo & Title */}
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-3xl rounded-full animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-purple-500 to-indigo-600 p-8 rounded-full shadow-2xl">
                <Music className="h-20 w-20 text-white mx-auto" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-pulse">
                TIMELINER
              </h1>
              <div className="text-2xl md:text-3xl text-purple-200 font-semibold">
                The Ultimate Music Timeline Battle
              </div>
              <p className="text-lg text-purple-300/80 max-w-3xl mx-auto leading-relaxed">
                Test your music knowledge! Listen to mystery songs and place them chronologically on your timeline. 
                First player to reach 10 songs wins the ultimate bragging rights.
              </p>
            </div>
          </div>

          {/* Game Features */}
          <div className="grid md:grid-cols-3 gap-6 my-12">
            <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 backdrop-blur-md rounded-2xl p-6 border border-purple-400/20">
              <Clock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Quick Rounds</h3>
              <p className="text-purple-200/80">30-second song previews keep the game fast-paced and exciting</p>
            </div>
            
            <div className="bg-gradient-to-br from-pink-600/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-6 border border-pink-400/20">
              <Users className="h-12 w-12 text-pink-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Multiplayer Fun</h3>
              <p className="text-purple-200/80">Compete with friends using any device - perfect for parties!</p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 backdrop-blur-md rounded-2xl p-6 border border-indigo-400/20">
              <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Music Master</h3>
              <p className="text-purple-200/80">Prove your music knowledge across decades and genres</p>
            </div>
          </div>

          {/* Main Action Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Host Game Card */}
            <Card className="relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 to-green-600/30 group-hover:from-emerald-500/40 group-hover:to-green-500/40 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-black/20 backdrop-blur-md"></div>
              
              <div className="relative z-10 p-8 text-center space-y-6">
                <div className="relative">
                  <div className="absolute -inset-4 bg-emerald-400/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-full">
                    <Users className="h-16 w-16 text-white mx-auto" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-white">Host a Game</h2>
                  <p className="text-emerald-200/90 text-lg leading-relaxed">
                    Create a room, load your favorite playlists, and invite friends to join the musical showdown
                  </p>
                </div>

                <div className="space-y-3 text-emerald-300/80">
                  <div className="flex items-center justify-center gap-3">
                    <Play className="h-5 w-5" />
                    <span>Upload Spotify or Deezer playlists</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Headphones className="h-5 w-5" />
                    <span>Control the game flow</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Star className="h-5 w-5" />
                    <span>Watch the competition unfold</span>
                  </div>
                </div>

                <Button 
                  onClick={onHostGame}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-4 px-8 text-xl rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/30"
                >
                  <Users className="h-6 w-6 mr-3" />
                  Start Hosting
                </Button>
              </div>
            </Card>

            {/* Join Game Card */}
            <Card className="relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-indigo-600/30 group-hover:from-blue-500/40 group-hover:to-indigo-500/40 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-black/20 backdrop-blur-md"></div>
              
              <div className="relative z-10 p-8 text-center space-y-6">
                <div className="relative">
                  <div className="absolute -inset-4 bg-blue-400/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-full">
                    <Smartphone className="h-16 w-16 text-white mx-auto" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-white">Join a Game</h2>
                  <p className="text-blue-200/90 text-lg leading-relaxed">
                    Enter a room code and jump into an existing musical battle using your mobile device
                  </p>
                </div>

                <div className="space-y-3 text-blue-300/80">
                  <div className="flex items-center justify-center gap-3">
                    <Smartphone className="h-5 w-5" />
                    <span>Mobile-optimized gameplay</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Music className="h-5 w-5" />
                    <span>Listen and compete instantly</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Trophy className="h-5 w-5" />
                    <span>Climb the leaderboard</span>
                  </div>
                </div>

                <Button 
                  onClick={onJoinGame}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-4 px-8 text-xl rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/30"
                >
                  <Smartphone className="h-6 w-6 mr-3" />
                  Join Battle
                </Button>
              </div>
            </Card>
          </div>

          {/* How to Play */}
          <div className="mt-16 bg-gradient-to-br from-slate-800/40 to-purple-800/40 backdrop-blur-md rounded-3xl p-8 border border-purple-400/20">
            <h3 className="text-3xl font-bold text-white mb-6">How to Play</h3>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="space-y-3">
                <div className="bg-purple-500/20 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-300">1</span>
                </div>
                <h4 className="font-semibold text-white">Listen</h4>
                <p className="text-purple-200/80 text-sm">Hear a 30-second mystery song preview</p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-purple-500/20 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-300">2</span>
                </div>
                <h4 className="font-semibold text-white">Think</h4>
                <p className="text-purple-200/80 text-sm">Guess when the song was released</p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-purple-500/20 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-300">3</span>
                </div>
                <h4 className="font-semibold text-white">Place</h4>
                <p className="text-purple-200/80 text-sm">Add it to your chronological timeline</p>
              </div>
              
              <div className="space-y-3">
                <div className="bg-purple-500/20 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-300">4</span>
                </div>
                <h4 className="font-semibold text-white">Win</h4>
                <p className="text-purple-200/80 text-sm">First to 10 correct placements wins!</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-8">
            <p className="text-purple-400/60 text-sm">
              Powered by Deezer & Spotify • Perfect for game nights, parties, and music lovers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
