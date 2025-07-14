
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Music, Users, Trophy, Timer, Play, Smartphone, 
  Headphones, Star, Radio, Coffee, Zap, Volume2
} from 'lucide-react';

interface MainMenuProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function MainMenu({ onCreateRoom, onJoinRoom }: MainMenuProps) {
  const [showTip, setShowTip] = useState(false);
  
  // Cycle through different music tips
  useEffect(() => {
    const interval = setInterval(() => {
      setShowTip(prev => !prev);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black relative overflow-hidden">
      {/* Enhanced Dark Background Effects */}
      <div className="absolute inset-0">
        {/* Main glow effects */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-green-500/8 rounded-full blur-2xl animate-pulse" />
        
        {/* Additional scattered glows */}
        <div className="absolute top-16 right-16 w-24 h-24 bg-blue-500/5 rounded-full blur-xl" />
        <div className="absolute bottom-32 left-16 w-28 h-28 bg-purple-500/5 rounded-full blur-xl" />
        <div className="absolute top-1/3 left-1/6 w-20 h-20 bg-green-500/4 rounded-full blur-lg" />
        <div className="absolute bottom-1/3 right-1/6 w-32 h-32 bg-blue-500/4 rounded-full blur-lg" />
        
        {/* New ambient lighting */}
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-purple-700/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/6 right-1/3 w-72 h-72 bg-blue-800/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-gray-800/20 rounded-full blur-3xl" />
        
        {/* Geometric shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 800" fill="none">
          {/* Music note shapes */}
          <circle cx="150" cy="150" r="4" fill="#3b82f6" opacity="0.3" />
          <circle cx="1050" cy="200" r="6" fill="#8b5cf6" opacity="0.3" />
          <circle cx="300" cy="600" r="3" fill="#10b981" opacity="0.3" />
          <circle cx="900" cy="650" r="5" fill="#3b82f6" opacity="0.3" />
          <circle cx="250" cy="200" r="4" fill="#8b5cf6" opacity="0.2" />
          <circle cx="750" cy="400" r="6" fill="#3b82f6" opacity="0.2" />
          <circle cx="480" cy="720" r="5" fill="#10b981" opacity="0.2" />
          
          {/* Connecting lines */}
          <path d="M150 150 L300 200 L450 180" stroke="#3b82f6" strokeWidth="1" opacity="0.2" />
          <path d="M1050 200 L900 300 L800 280" stroke="#8b5cf6" strokeWidth="1" opacity="0.2" />
          <path d="M300 600 L500 550 L700 570" stroke="#10b981" strokeWidth="1" opacity="0.2" />
          <path d="M480 720 L600 600 L750 650" stroke="#3b82f6" strokeWidth="1" opacity="0.2" />
          <path d="M250 200 L400 280 L600 240" stroke="#8b5cf6" strokeWidth="1" opacity="0.2" />
          
          {/* Abstract rectangles */}
          <rect x="800" y="100" width="60" height="20" rx="10" fill="#3b82f6" opacity="0.1" transform="rotate(15 830 110)" />
          <rect x="200" y="400" width="80" height="15" rx="8" fill="#8b5cf6" opacity="0.1" transform="rotate(-10 240 408)" />
          <rect x="600" y="700" width="50" height="25" rx="12" fill="#10b981" opacity="0.1" transform="rotate(25 625 713)" />
          <rect x="900" y="300" width="70" height="20" rx="10" fill="#3b82f6" opacity="0.1" transform="rotate(-25 900 300)" />
          <rect x="350" y="600" width="60" height="15" rx="8" fill="#8b5cf6" opacity="0.1" transform="rotate(10 350 600)" />
          
          {/* Dotted patterns */}
          <g opacity="0.15">
            <circle cx="400" cy="120" r="2" fill="#3b82f6" />
            <circle cx="420" cy="125" r="1.5" fill="#3b82f6" />
            <circle cx="440" cy="130" r="2" fill="#3b82f6" />
            <circle cx="460" cy="135" r="1.5" fill="#3b82f6" />
            <circle cx="480" cy="140" r="2" fill="#3b82f6" />
            <circle cx="500" cy="145" r="1.5" fill="#3b82f6" />
          </g>
          
          <g opacity="0.15">
            <circle cx="700" cy="350" r="2" fill="#8b5cf6" />
            <circle cx="720" cy="355" r="1.5" fill="#8b5cf6" />
            <circle cx="740" cy="360" r="2" fill="#8b5cf6" />
            <circle cx="760" cy="365" r="1.5" fill="#8b5cf6" />
            <circle cx="780" cy="370" r="2" fill="#8b5cf6" />
            <circle cx="800" cy="375" r="1.5" fill="#8b5cf6" />
          </g>
          
          <g opacity="0.15">
            <circle cx="200" cy="650" r="2" fill="#10b981" />
            <circle cx="220" cy="645" r="1.5" fill="#10b981" />
            <circle cx="240" cy="640" r="2" fill="#10b981" />
            <circle cx="260" cy="635" r="1.5" fill="#10b981" />
          </g>
          
          {/* Music-themed elements */}
          <path d="M100 250 C150 230, 180 260, 150 300" stroke="#3b82f6" strokeWidth="1" opacity="0.2" />
          <path d="M150 300 L150 380" stroke="#3b82f6" strokeWidth="1" opacity="0.2" />
          <circle cx="140" cy="380" r="10" fill="#3b82f6" opacity="0.1" />
          
          <path d="M850 450 C900 430, 930 460, 900 500" stroke="#8b5cf6" strokeWidth="1" opacity="0.2" />
          <path d="M900 500 L900 580" stroke="#8b5cf6" strokeWidth="1" opacity="0.2" />
          <circle cx="890" cy="580" r="10" fill="#8b5cf6" opacity="0.1" />
          
          {/* Sound waves */}
          <path d="M300 300 Q350 280, 400 300 Q450 320, 500 300" stroke="#10b981" strokeWidth="1" opacity="0.1" />
          <path d="M300 320 Q350 300, 400 320 Q450 340, 500 320" stroke="#10b981" strokeWidth="1" opacity="0.1" />
          <path d="M300 340 Q350 320, 400 340 Q450 360, 500 340" stroke="#10b981" strokeWidth="1" opacity="0.1" />
          
          <path d="M800 200 Q850 180, 900 200 Q950 220, 1000 200" stroke="#3b82f6" strokeWidth="1" opacity="0.1" />
          <path d="M800 220 Q850 200, 900 220 Q950 240, 1000 220" stroke="#3b82f6" strokeWidth="1" opacity="0.1" />
        </svg>
        
        {/* Floating music notes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="absolute animate-float opacity-30"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${10 + Math.random() * 20}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            >
              {i % 3 === 0 ? (
                <Music className="h-3 w-3 text-blue-400" />
              ) : i % 3 === 1 ? (
                <Music className="h-4 w-4 text-purple-400" />
              ) : (
                <Volume2 className="h-3 w-3 text-green-400" />
              )}
            </div>
          ))}
        </div>
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-gradient-to-r from-transparent via-white to-transparent mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3Ccircle cx='17' cy='37' r='1'/%3E%3Ccircle cx='37' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center pt-12 sm:pt-16 mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-800/60 border-2 border-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
              <Music className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight relative inline-block">
            RYTHMY
            <span className="absolute -top-1 -right-2 text-xs text-blue-400 font-mono">BETA</span>
          </h1>
          
          <p className="text-sm sm:text-base text-blue-300 font-medium tracking-wide mb-6">
            Where your music knowledge meets friendly competition
          </p>
          
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-6">
            Dive into the ultimate music timeline challenge! Guess when songs hit the charts, arrange tracks in perfect chronological order, and discover just how well you know your favorite tunes through the decades.
          </p>
          
          <div className="bg-gradient-to-r from-purple-900/40 to-gray-800/40 backdrop-blur-sm p-4 rounded-xl max-w-xl mx-auto border border-purple-800/30">
            <p className="text-sm text-gray-300 italic">
              <span className="text-purple-300 font-semibold mr-2">{showTip ? "♪ Did you know?" : "♪ Pro tip:"}</span>
              {showTip 
                ? "The average person can identify a popular song in just 3 seconds. Think you can beat that while also naming the year?"
                : "Create custom playlists in Spotify for different music eras or genres to challenge your friends with themed rounds!"}
            </p>
          </div>
        </div>

        {/* Main Buttons */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full mb-8">
          <div className="space-y-4">
            <Button
              onClick={onCreateRoom}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white h-16 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg border-0 active:scale-95 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
              <Play className="h-5 w-5 mr-3" />
              Start a Game
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 text-xs">host</div>
            </Button>
            
            <Button
              onClick={onJoinRoom}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white h-16 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg border-0 active:scale-95 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/10 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
              <Smartphone className="h-5 w-5 mr-3" />
              Join a Game
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 text-xs">player</div>
            </Button>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
            How it works
          </h2>
          <p className="text-center text-gray-400 text-sm mb-8">Simple to learn, impossible to master!</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-green-600/20 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-gray-700/40 transition-all duration-300 hover:shadow-md hover:shadow-green-900/10">
              <Users className="h-8 w-8 text-green-300 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">Gather Your Crew</h3>
              <p className="text-gray-400 text-xs sm:text-sm mb-2">Up to 8 players can join the musical showdown</p>
              <p className="text-gray-500 text-xs italic">Perfect for parties or virtual hangouts!</p>
            </Card>
            
            <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-blue-600/20 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-gray-700/40 transition-all duration-300 hover:shadow-md hover:shadow-blue-900/10">
              <Radio className="h-8 w-8 text-blue-300 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">Choose Your Playlist</h3>
              <p className="text-blue-400 text-xs sm:text-sm mb-2">Link any Spotify playlist for endless possibilities</p>
              <p className="text-blue-500 text-xs italic">From 90s grunge to today's top hits!</p>
            </Card>
            
            <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-purple-600/20 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-gray-700/40 transition-all duration-300 hover:shadow-md hover:shadow-purple-900/10">
              <Zap className="h-8 w-8 text-purple-300 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">Quick-Fire Rounds</h3>
              <p className="text-purple-400 text-xs sm:text-sm mb-2">Snappy 30-second rounds keep the energy high</p>
              <p className="text-purple-500 text-xs italic">Think fast—the clock is ticking!</p>
            </Card>

            <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-green-600/20 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-gray-700/40 transition-all duration-300 hover:shadow-md hover:shadow-green-900/10">
              <Trophy className="h-8 w-8 text-green-300 mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">Race to Victory</h3>
              <p className="text-gray-400 text-xs sm:text-sm mb-2">First to 10 points claims the musical crown</p>
              <p className="text-gray-500 text-xs italic">Brag-worthy achievements unlocked!</p>
            </Card>
          </div>
        </div>
        
        {/* Testimonials */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-blue-800/30">
              <div className="flex items-center mb-2">
                <Star className="h-3 w-3 text-blue-400" />
                <Star className="h-3 w-3 text-blue-400" />
                <Star className="h-3 w-3 text-blue-400" />
                <Star className="h-3 w-3 text-blue-400" />
                <Star className="h-3 w-3 text-blue-400" />
              </div>
              <p className="text-xs text-gray-400 italic">
                "Settled a 20-year debate with my dad about when 'Smells Like Teen Spirit' came out. I was right!"
              </p>
              <p className="text-right text-blue-400 text-xs mt-2">— Music know-it-all</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-purple-800/30">
              <div className="flex items-center mb-2">
                <Star className="h-3 w-3 text-purple-400" />
                <Star className="h-3 w-3 text-purple-400" />
                <Star className="h-3 w-3 text-purple-400" />
                <Star className="h-3 w-3 text-purple-400" />
                <Star className="h-3 w-3 text-purple-400" />
              </div>
              <p className="text-xs text-gray-400 italic">
                "Our weekly game night just got a serious upgrade. Even our friend who claims to hate music loves playing!"
              </p>
              <p className="text-right text-purple-400 text-xs mt-2">— Party host</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-green-800/30">
              <div className="flex items-center mb-2">
                <Star className="h-3 w-3 text-green-400" />
                <Star className="h-3 w-3 text-green-400" />
                <Star className="h-3 w-3 text-green-400" />
                <Star className="h-3 w-3 text-green-400" />
                <Star className="h-3 w-3 text-green-400" />
              </div>
              <p className="text-xs text-gray-400 italic">
                "I thought I knew my 80s pop inside out. This game has humbled me. In a fun way though!"
              </p>
              <p className="text-right text-green-400 text-xs mt-2">— Nostalgic millennial</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pb-8 sm:pb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">
              <Coffee className="h-4 w-4" />
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">
              <Headphones className="h-4 w-4" />
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">
              <Music className="h-4 w-4" />
            </a>
          </div>
          
          <p className="text-gray-300 text-sm font-medium mb-2">
            Powered by Spotify • Made with ♥ for music lovers
          </p>
          
          <p className="text-gray-500 text-xs max-w-md mx-auto leading-relaxed">
            No fancy algorithms, just good vibes and friendly competition. 
            Rythmy doesn't judge your questionable music taste (even if your friends do).
          </p>
          
          <p className="text-gray-700 text-xs mt-4">
            v1.2.3 • <span className="text-blue-600">New: Custom game modes!</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
