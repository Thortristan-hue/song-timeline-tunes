
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, Home, Crown, Star } from 'lucide-react';
import { Player } from '@/types/game';

interface HostGameOverScreenProps {
  winner: Player;
  players: Player[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  roomCode: string;
}

export function HostGameOverScreen({ 
  winner, 
  players, 
  onPlayAgain, 
  onBackToMenu,
  roomCode 
}: HostGameOverScreenProps) {
  const sortedPlayers = [...players].sort((a, b) => b.timeline.length - a.timeline.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* Enhanced background elements with more animation */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/3 rounded-full blur-2xl animate-pulse-slow" style={{animationDelay: '2s'}} />
        
        {/* Confetti particles */}
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute victory-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-50px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <div 
              className="w-3 h-3 rotate-45"
              style={{
                backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f39c12'][Math.floor(Math.random() * 5)]
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-10">
        {/* Enhanced Trophy Icon */}
        <div className="relative mb-8 animate-bounce-in">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-2xl scale-150 animate-pulse" />
          <div className="relative w-20 h-20 overflow-hidden mx-auto">
            <img 
              src="/Vinyl_rythm.png" 
              alt="Rythmy Logo" 
              className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Winner Announcement with staggered animations */}
        <div className="text-center mb-12">
          <div className="text-6xl font-bold text-white mb-4 tracking-tight animate-scale-in">
            Game Over!
          </div>
          <div className="text-2xl text-white/80 mb-6 animate-fade-in-up stagger-1">
            <span className="text-yellow-400 animate-shimmer">{winner.name}</span> completed their timeline!
          </div>
          <div className="text-lg text-white/60 animate-fade-in-up stagger-2">
            What a great game everyone! 🎉
          </div>
        </div>

        {/* Winner Spotlight with enhanced animations */}
        <div className="bg-white/15 backdrop-blur-2xl rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl max-w-md w-full hover-lift animate-scale-in stagger-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Crown className="h-8 w-8 text-yellow-400 animate-bounce" />
              <div 
                className="w-8 h-8 rounded-full shadow-lg animate-pulse" 
                style={{ backgroundColor: winner.color }}
              />
              <div className="text-3xl font-bold text-white animate-fade-in-up">
                {winner.name}
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-6 py-3 rounded-2xl text-2xl font-black inline-block hover:scale-105 transition-transform duration-300">
              {winner.timeline.length} Cards
            </div>
          </div>
        </div>

        {/* All Players Leaderboard with staggered animations */}
        <div className="bg-white/12 backdrop-blur-2xl rounded-3xl p-6 mb-8 border border-white/20 shadow-xl w-full max-w-2xl animate-slide-in-left stagger-4">
          <div className="text-white text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
            <Star className="h-6 w-6 text-yellow-400 animate-spin-slow" />
            Final Leaderboard
          </div>
          
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all hover-lift stagger-fade-in ${
                  player.id === winner.id
                    ? 'bg-yellow-400/20 border border-yellow-400/30 glow-pulse'
                    : 'bg-white/5'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-white/60 w-8">
                    #{index + 1}
                  </div>
                  <div 
                    className={`w-6 h-6 rounded-full shadow-sm ${player.id === winner.id ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: player.color }}
                  />
                  <div className="text-xl font-semibold text-white">
                    {player.name}
                  </div>
                  {player.id === winner.id && (
                    <Crown className="h-5 w-5 text-yellow-400 animate-bounce" />
                  )}
                </div>
                <div className="text-2xl font-bold text-white">
                  {player.timeline.length} cards
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons with enhanced interactions */}
        <div className="flex gap-6 flex-wrap justify-center animate-fade-in-up stagger-5">
          <Button
            onClick={onPlayAgain}
            className="bg-white/15 hover:bg-white/20 backdrop-blur-xl rounded-2xl px-8 py-4 text-white font-semibold text-lg border border-white/20 shadow-lg transition-all hover:scale-105 interactive-button hover-glow"
          >
            <RefreshCw className="h-6 w-6 mr-3 group-hover:animate-spin" />
            Play Again
          </Button>
          
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="bg-white/10 hover:bg-white/15 backdrop-blur-xl rounded-2xl px-8 py-4 text-white font-semibold text-lg border border-white/30 shadow-lg transition-all hover:scale-105 interactive-button"
          >
            <Home className="h-6 w-6 mr-3 group-hover:animate-wiggle" />
            Main Menu
          </Button>
        </div>

        {/* Room Code Display */}
        <div className="mt-8 text-center animate-fade-in-up stagger-6">
          <div className="text-white/50 text-lg">
            Room Code: <span className="font-mono font-semibold text-white/80">{roomCode}</span>
          </div>
          <div className="text-white/30 text-sm mt-2">
            Thanks for playing Rythmy!
          </div>
        </div>
      </div>
    </div>
  );
}
