
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, Home, Crown, Star, Music, Volume2, Radio, Coffee, Headphones } from 'lucide-react';
import { Player } from '@/types/game';

interface VictoryScreenProps {
  winner: Player;
  players: Player[];
  onPlayAgain: () => void;
  onRestartWithSamePlayers?: () => void;
  onBackToMenu: () => void;
}

export function VictoryScreen({ winner, players, onPlayAgain, onRestartWithSamePlayers, onBackToMenu }: VictoryScreenProps) {
  // Prop validation to fix undefined props bug
  if (!winner || !players || !onPlayAgain || !onBackToMenu) {
    console.error('VictoryScreen: Missing required props', { winner, players, onPlayAgain, onBackToMenu });
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Game Error</h2>
          <p className="text-white/70 mb-4">Unable to display victory screen due to missing data.</p>
          <Button onClick={onBackToMenu || (() => window.location.reload())} className="bg-[#107793] hover:bg-[#0e1f2f]">
            Return to Menu
          </Button>
        </div>
      </div>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
      {/* Enhanced Dark Background Effects - matching MainMenu */}
      <div className="absolute inset-0">
        {/* Main glow effects with smoother animations */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse-ultra-slow" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse-ultra-slow" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-[#4a4f5b]/8 rounded-full blur-2xl animate-pulse-ultra-slow" style={{animationDelay: '4s'}} />
        
        {/* Additional scattered glows with gentle animations */}
        <div className="absolute top-16 right-16 w-24 h-24 bg-[#107793]/5 rounded-full blur-xl animate-glow-gentle" />
        <div className="absolute bottom-32 left-16 w-28 h-28 bg-[#a53b8b]/5 rounded-full blur-xl animate-glow-gentle" style={{animationDelay: '3s'}} />
        <div className="absolute top-1/3 left-1/6 w-20 h-20 bg-[#4a4f5b]/4 rounded-full blur-lg animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/6 w-32 h-32 bg-[#107793]/4 rounded-full blur-lg animate-pulse-slow" style={{animationDelay: '1.5s'}} />
        
        {/* New ambient lighting with slower animations */}
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-[#a53b8b]/10 rounded-full blur-3xl animate-pulse-ultra-slow" style={{animationDelay: '6s'}} />
        <div className="absolute top-1/6 right-1/3 w-72 h-72 bg-[#0e1f2f]/10 rounded-full blur-3xl animate-pulse-ultra-slow" style={{animationDelay: '8s'}} />
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-[#4a4f5b]/20 rounded-full blur-3xl animate-glow-gentle" style={{animationDelay: '5s'}} />
        
        {/* Geometric shapes - matching MainMenu */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 800" fill="none">
          {/* Music note shapes */}
          <circle cx="150" cy="150" r="4" fill="#107793" opacity="0.3" />
          <circle cx="1050" cy="200" r="6" fill="#a53b8b" opacity="0.3" />
          <circle cx="300" cy="600" r="3" fill="#4a4f5b" opacity="0.3" />
          <circle cx="900" cy="650" r="5" fill="#107793" opacity="0.3" />
          <circle cx="250" cy="200" r="4" fill="#a53b8b" opacity="0.2" />
          <circle cx="750" cy="400" r="6" fill="#107793" opacity="0.2" />
          <circle cx="480" cy="720" r="5" fill="#4a4f5b" opacity="0.2" />
          
          {/* Connecting lines */}
          <path d="M150 150 L300 200 L450 180" stroke="#107793" strokeWidth="1" opacity="0.2" />
          <path d="M1050 200 L900 300 L800 280" stroke="#a53b8b" strokeWidth="1" opacity="0.2" />
          <path d="M300 600 L500 550 L700 570" stroke="#4a4f5b" strokeWidth="1" opacity="0.2" />
          
          {/* Abstract rectangles */}
          <rect x="800" y="100" width="60" height="20" rx="10" fill="#107793" opacity="0.1" transform="rotate(15 830 110)" />
          <rect x="200" y="400" width="80" height="15" rx="8" fill="#a53b8b" opacity="0.1" transform="rotate(-10 240 408)" />
          <rect x="600" y="700" width="50" height="25" rx="12" fill="#4a4f5b" opacity="0.1" transform="rotate(25 625 713)" />
          
          {/* Dotted patterns */}
          <g opacity="0.15">
            <circle cx="400" cy="120" r="2" fill="#107793" />
            <circle cx="420" cy="125" r="1.5" fill="#107793" />
            <circle cx="440" cy="130" r="2" fill="#107793" />
            <circle cx="460" cy="135" r="1.5" fill="#107793" />
          </g>
          
          {/* Music-themed elements */}
          <path d="M100 250 C150 230, 180 260, 150 300" stroke="#107793" strokeWidth="1" opacity="0.2" />
          <path d="M150 300 L150 380" stroke="#107793" strokeWidth="1" opacity="0.2" />
          <circle cx="140" cy="380" r="10" fill="#107793" opacity="0.1" />
          
          {/* Sound waves */}
          <path d="M300 300 Q350 280, 400 300 Q450 320, 500 300" stroke="#4a4f5b" strokeWidth="1" opacity="0.1" />
          <path d="M300 320 Q350 300, 400 320 Q450 340, 500 320" stroke="#4a4f5b" strokeWidth="1" opacity="0.1" />
        </svg>
        
        {/* Floating music notes with enhanced animations - matching MainMenu */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i}
              className="absolute floating-particle opacity-40"
              style={{
                top: `${Math.random() * 120 - 20}%`,
                left: `${Math.random() * 120 - 20}%`,
                animationDuration: `${35 + Math.random() * 45}s`,
                animationDelay: `${Math.random() * 60}s`,
              }}
            >
              {i % 4 === 0 ? (
                <Music className="h-4 w-4 text-[#107793] animate-spin-slow" />
              ) : i % 4 === 1 ? (
                <Music className="h-3 w-3 text-[#a53b8b] animate-pulse-slow" />
              ) : i % 4 === 2 ? (
                <Volume2 className="h-3 w-3 text-[#4a4f5b] animate-pulse-slow" />
              ) : (
                <Radio className="h-4 w-4 text-[#107793] animate-pulse-slow" />
              )}
            </div>
          ))}
        </div>
        
        {/* Confetti particles for victory celebration */}
        {[...Array(15)].map((_, i) => (
          <div 
            key={`confetti-${i}`}
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
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-gradient-to-r from-transparent via-white to-transparent mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3Ccircle cx='17' cy='37' r='1'/%3E%3Ccircle cx='37' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Disclaimer */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down">
        <div className="timeliner-glass px-4 py-2 rounded-full">
          <p className="text-[#d9e8dd] text-sm font-medium">
            Game complete • Thanks for playing • Hope you had fun!
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 lg:px-8">
        
        {/* Enhanced Trophy Icon - Centered and Animated */}
        <div className="text-center pt-12 sm:pt-16 mb-8">
          <div className="relative mb-8 animate-bounce-in">
            <div className="absolute inset-0 bg-gradient-to-br from-[#107793]/20 to-[#a53b8b]/20 rounded-full blur-2xl scale-150 animate-pulse" />
            <div className="w-32 h-32 sm:w-40 sm:h-40 relative overflow-hidden mx-auto">
              <img 
                src="/Vinyl_rythm.png" 
                alt="Rythmy Logo" 
                className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300 animate-spin-slow"
              />
            </div>
          </div>
        </div>

        {/* Winner Announcement with vibrant text gradients and staggered animations */}
        <div className="text-center mb-12">
          <div className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 tracking-tight animate-scale-in">
            <span className="bg-gradient-to-r from-[#107793] via-[#a53b8b] to-[#4a4f5b] bg-clip-text text-transparent">
              Game Over!
            </span>
          </div>
          <div className="text-2xl mb-6 animate-fade-in-up stagger-1">
            <span className="bg-gradient-to-r from-[#a53b8b] to-[#107793] bg-clip-text text-transparent animate-shimmer font-bold">
              {winner.name}
            </span>
            <span className="text-[#d9e8dd] ml-2">takes the crown</span>
          </div>
          <div className="text-lg text-[#d9e8dd] animate-fade-in-up stagger-2">
            What a great game everyone! 🎉
          </div>
        </div>

        {/* Winner Spotlight with enhanced animations using design system */}
        <div className="timeliner-menu-card max-w-md w-full mx-auto mb-8 animate-scale-in stagger-3 hover-lift">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Crown className="h-8 w-8 text-[#a53b8b] animate-bounce" />
              <div 
                className="w-8 h-8 rounded-full shadow-lg animate-pulse" 
                style={{ backgroundColor: winner.color }}
              />
              <div className="text-3xl font-bold text-white animate-fade-in-up">
                {winner.name}
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#107793] to-[#a53b8b] text-white px-6 py-3 rounded-2xl text-2xl font-black inline-block hover:scale-105 transition-transform duration-300 interactive-button">
              {winner.score || 0}/10 Points
            </div>
          </div>
        </div>

        {/* All Players Leaderboard styled like main menu cards */}
        <div className="timeliner-menu-card w-full max-w-2xl mx-auto mb-8 animate-slide-in-left stagger-4">
          <div className="text-white text-xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
            <Star className="h-6 w-6 text-[#a53b8b] animate-spin-slow" />
            <span className="bg-gradient-to-r from-[#107793] to-[#a53b8b] bg-clip-text text-transparent">
              Final Scores
            </span>
          </div>
          
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all hover-lift stagger-fade-in timeliner-card ${
                  player.id === winner.id
                    ? 'bg-gradient-to-r from-[#a53b8b]/20 to-[#107793]/20 border border-[#a53b8b]/30 glow-pulse'
                    : 'timeliner-glass'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-[#d9e8dd] w-8">
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
                    <Crown className="h-5 w-5 text-[#a53b8b] animate-bounce" />
                  )}
                </div>
                <div className="text-2xl font-bold text-white">
                  {player.score || 0}/10
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Action Buttons with gradients and interactive effects */}
        <div className="flex gap-4 flex-wrap justify-center animate-fade-in-up stagger-5 mb-8">
          {onRestartWithSamePlayers && (
            <Button
              onClick={onRestartWithSamePlayers}
              className="bg-gradient-to-r from-[#107793] to-[#0e1f2f] text-white h-16 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg border-0 relative overflow-hidden group interactive-button hover-glow px-8 py-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#107793]/0 via-[#107793]/10 to-[#107793]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
              <RefreshCw className="h-6 w-6 mr-3 group-hover:animate-spin" />
              Restart with Same Players
            </Button>
          )}
          
          <Button
            onClick={onPlayAgain}
            className="bg-gradient-to-r from-[#a53b8b] to-[#4a4f5b] text-white h-16 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg border-0 relative overflow-hidden group interactive-button hover-glow px-8 py-4"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#a53b8b]/0 via-[#a53b8b]/10 to-[#a53b8b]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
            <RefreshCw className="h-6 w-6 mr-3 group-hover:animate-spin" />
            {onRestartWithSamePlayers ? 'New Game' : 'Play Again'}
          </Button>
          
          <Button
            onClick={onBackToMenu}
            className="timeliner-glass rounded-xl px-8 py-4 text-white font-semibold text-lg border border-[#d9e8dd]/30 shadow-lg transition-all hover:scale-105 interactive-button h-16"
          >
            <Home className="h-6 w-6 mr-3 group-hover:animate-wiggle" />
            Main Menu
          </Button>
        </div>

        {/* Thank You Message */}
        <div className="text-center animate-fade-in-up stagger-6 mb-8">
          <div className="text-[#d9e8dd] text-lg">
            Thanks for playing Rythmy!
          </div>
          <div className="text-[#4a4f5b] text-sm mt-2">
            Hope you discovered some great music along the way
          </div>
        </div>

        {/* Footer styled to match main menu */}
        <footer className="text-center pb-8 sm:pb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <a href="#" className="text-[#4a4f5b] hover:text-[#d9e8dd] transition-colors">
              <Coffee className="h-4 w-4" />
            </a>
            <a href="#" className="text-[#4a4f5b] hover:text-[#d9e8dd] transition-colors">
              <Headphones className="h-4 w-4" />
            </a>
            <a href="#" className="text-[#4a4f5b] hover:text-[#d9e8dd] transition-colors">
              <Music className="h-4 w-4" />
            </a>
          </div>
          
          <p className="text-[#d9e8dd] text-sm font-medium mb-2">
            Made with ♥ for music lovers
          </p>
          
          <p className="text-[#4a4f5b] text-xs max-w-md mx-auto leading-relaxed">
            Rythmy doesn't judge your questionable music taste (even if your friends do).
          </p>
          
          <p className="text-[#4a4f5b] text-xs mt-4">
            v0.1.1 • <span className="text-[#107793]">Report bugs to: 97uselobp@mozmail.com!</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
