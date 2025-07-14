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
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    "Adulting is hard. Vodka helps.",
    "Life is short. Eat the damn burger.",
    "Don't trust a fart after shwarma.",
    "Remember, hangovers are just punishment for getting sober.",
    "You can't buy happiness, but you can buy Jägermeister. Same thing.",
    "Flirting with the bartender may not get you a free drink, but it's worth a shot.",
    "Always check your pockets before doing laundry. Condoms don't survive the spin cycle.",
    "If you can't be good, at least be good at being bad.",
    "Red bull first, bullshit later.",
    "Never argue when you're naked. You'll lose every time.",
    "If at first you don't succeed, pour another shot.",
    "Some days you're the dog, some days you're the hydrant.",
    "Life is all about balance: a salad in one hand and a cocktail in the other.",
    "Never text your ex. Unless it's to remind them how much better you're doing.",
    "Don't let Monday ruin your weekend vibe.",
    "Never trust someone who doesn't swear. They're hiding something.",
    "Save water, drink longero.",
    "You can't fix stupid, but you can laugh at it.",
    "Your bed is calling. Answer it.",
    "Don't be afraid to be a hot mess. At least you're hot."
  ];

  // Cycle through tips every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0b14] via-[#16213e] to-[#1a1b2e] relative overflow-hidden">
      {/* Enhanced Layered Background Effects */}
      <div className="absolute inset-0">
        {/* Main radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/8 via-transparent to-[#ec4899]/6" />
        
        {/* Dynamic glow effects with improved colors */}
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-[#6366f1]/12 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-[#8b5cf6]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-1/4 left-1/2 w-44 h-44 bg-[#ec4899]/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        
        {/* Additional ambient lighting layers */}
        <div className="absolute top-16 right-16 w-32 h-32 bg-[#fbbf24]/6 rounded-full blur-2xl" />
        <div className="absolute bottom-32 left-16 w-36 h-36 bg-[#06b6d4]/8 rounded-full blur-2xl" />
        <div className="absolute top-1/3 left-1/6 w-28 h-28 bg-[#8b5cf6]/6 rounded-full blur-xl" />
        <div className="absolute bottom-1/3 right-1/6 w-40 h-40 bg-[#6366f1]/6 rounded-full blur-xl" />
        
        {/* Large ambient background shapes */}
        <div className="absolute top-3/4 left-1/3 w-80 h-80 bg-[#ec4899]/6 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/6 right-1/3 w-96 h-96 bg-[#16213e]/15 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1.5s'}} />
        <div className="absolute -bottom-32 left-1/2 w-[600px] h-[600px] bg-[#1a1b2e]/25 rounded-full blur-3xl" />
        
        {/* Enhanced geometric musical shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 1200 800" fill="none">
          {/* Music equipment silhouettes */}
          <rect x="100" y="100" width="80" height="50" rx="12" fill="#6366f1" opacity="0.15" transform="rotate(-12 140 125)" />
          <circle cx="130" cy="135" r="6" fill="#6366f1" opacity="0.2" />
          <circle cx="150" cy="135" r="6" fill="#6366f1" opacity="0.2" />
          
          <rect x="1000" y="200" width="80" height="50" rx="12" fill="#8b5cf6" opacity="0.15" transform="rotate(18 1040 225)" />
          <circle cx="1030" cy="235" r="6" fill="#8b5cf6" opacity="0.2" />
          <circle cx="1050" cy="235" r="6" fill="#8b5cf6" opacity="0.2" />
          
          {/* Vinyl records with more detail */}
          <circle cx="220" cy="600" r="35" stroke="#ec4899" strokeWidth="2" fill="none" opacity="0.15" />
          <circle cx="220" cy="600" r="20" stroke="#ec4899" strokeWidth="1" fill="none" opacity="0.1" />
          <circle cx="220" cy="600" r="6" fill="#ec4899" opacity="0.2" />
          
          <circle cx="1050" cy="150" r="30" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.15" />
          <circle cx="1050" cy="150" r="18" stroke="#fbbf24" strokeWidth="1" fill="none" opacity="0.1" />
          <circle cx="1050" cy="150" r="4" fill="#fbbf24" opacity="0.2" />
          
          {/* Enhanced musical notes */}
          <g opacity="0.2">
            <circle cx="320" cy="220" r="6" fill="#06b6d4" />
            <path d="M326 220 L326 180" stroke="#06b6d4" strokeWidth="3" />
            <path d="M326 180 L340 185" stroke="#06b6d4" strokeWidth="3" />
            <circle cx="334" cy="188" r="4" fill="#06b6d4" />
          </g>
          
          <g opacity="0.2">
            <circle cx="880" cy="520" r="6" fill="#6366f1" />
            <path d="M886 520 L886 480" stroke="#6366f1" strokeWidth="3" />
            <path d="M886 480 L900 485" stroke="#6366f1" strokeWidth="3" />
            <circle cx="894" cy="488" r="4" fill="#6366f1" />
          </g>
          
          {/* Enhanced sound waves */}
          <path d="M400 300 Q460 270, 520 300 Q580 330, 640 300" stroke="#8b5cf6" strokeWidth="2" opacity="0.15" />
          <path d="M400 320 Q460 290, 520 320 Q580 350, 640 320" stroke="#8b5cf6" strokeWidth="2" opacity="0.12" />
          <path d="M400 340 Q460 310, 520 340 Q580 370, 640 340" stroke="#8b5cf6" strokeWidth="2" opacity="0.1" />
          
          {/* Connecting energy lines */}
          <path d="M220 200 L420 260 L620 240" stroke="#6366f1" strokeWidth="1.5" opacity="0.15" />
          <path d="M1000 320 L820 420 L720 400" stroke="#ec4899" strokeWidth="1.5" opacity="0.15" />
          <path d="M320 620 L520 580 L720 590" stroke="#06b6d4" strokeWidth="1.5" opacity="0.15" />
        </svg>
        
        {/* Enhanced floating music icons */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(16)].map((_, i) => (
            <div 
              key={i}
              className="absolute animate-float opacity-20"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${12 + Math.random() * 25}s linear infinite`,
                animationDelay: `${Math.random() * 6}s`,
              }}
            >
              {i % 4 === 0 ? (
                <Music className="h-4 w-4 text-[#6366f1]" />
              ) : i % 4 === 1 ? (
                <Volume2 className="h-5 w-5 text-[#8b5cf6]" />
              ) : i % 4 === 2 ? (
                <Radio className="h-4 w-4 text-[#ec4899]" />
              ) : (
                <Headphones className="h-4 w-4 text-[#fbbf24]" />
              )}
            </div>
          ))}
        </div>
        
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-gradient-to-r from-transparent via-white to-transparent mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='9' cy='9' r='1'/%3E%3Ccircle cx='29' cy='29' r='1'/%3E%3Ccircle cx='49' cy='49' r='1'/%3E%3Ccircle cx='69' cy='69' r='1'/%3E%3Ccircle cx='19' cy='39' r='1'/%3E%3Ccircle cx='39' cy='19' r='1'/%3E%3Ccircle cx='59' cy='59' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center pt-12 sm:pt-16 mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 border-2 border-[#6366f1]/30 rounded-3xl flex items-center justify-center shadow-2xl shadow-[#6366f1]/20 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/10 to-[#8b5cf6]/10"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent"></div>
              <Music className="h-10 w-10 sm:h-12 sm:w-12 text-[#6366f1] relative z-10" />
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight relative inline-block">
            <span className="bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">
              RYTHMY
            </span>
            <span className="absolute -top-2 -right-3 text-xs text-[#fbbf24] font-bold bg-[#fbbf24]/10 backdrop-blur-sm rounded-full px-2 py-1 border border-[#fbbf24]/20">BETA</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-[#e2e8f0] max-w-3xl mx-auto leading-relaxed mb-8 font-medium">
            Dive into the ultimate music timeline challenge! Guess when songs hit the charts, arrange tracks in perfect chronological order, and discover just how well you know your favorite tunes through the decades.
          </p>
          
          <div className="bg-gradient-to-r from-[#8b5cf6]/15 via-[#ec4899]/10 to-[#6366f1]/15 backdrop-blur-xl p-6 rounded-2xl max-w-2xl mx-auto border border-white/10 shadow-xl">
            <p className="text-base text-[#e2e8f0] italic">
              <span className="text-[#fbbf24] font-bold mr-3 text-lg">♪ Tip:</span>
              {tips[currentTip]}
            </p>
          </div>
        </div>

        {/* Enhanced Main Buttons */}
        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full mb-8">
          <div className="space-y-6">
            <button
              onClick={onCreateRoom}
              className="w-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#6366f1] text-white h-20 text-xl font-bold rounded-2xl transition-all duration-500 shadow-2xl border-0 active:scale-95 relative overflow-hidden group hover:shadow-[#6366f1]/30 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-center">
                <Play className="h-6 w-6 mr-4" />
                Start a Game
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-70 text-sm font-medium bg-white/10 rounded-full px-3 py-1">host</div>
              </div>
            </button>
            
            <button
              onClick={onJoinRoom}
              className="w-full bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#ec4899] text-white h-20 text-xl font-bold rounded-2xl transition-all duration-500 shadow-2xl border-0 active:scale-95 relative overflow-hidden group hover:shadow-[#ec4899]/30 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-center">
                <Smartphone className="h-6 w-6 mr-4" />
                Join Lobby
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-70 text-sm font-medium bg-white/10 rounded-full px-3 py-1">player</div>
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced How It Works */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-3 bg-gradient-to-r from-[#6366f1] to-[#ec4899] bg-clip-text text-transparent">
            How it works
          </h2>
          <p className="text-center text-[#e2e8f0] text-lg mb-12 font-medium">Simple to learn, impossible to master!</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="bg-gradient-to-br from-[#6366f1]/15 via-[#8b5cf6]/10 to-[#6366f1]/5 border border-[#6366f1]/20 p-6 sm:p-8 text-center rounded-3xl backdrop-blur-xl hover:bg-gradient-to-br hover:from-[#6366f1]/25 hover:via-[#8b5cf6]/15 hover:to-[#6366f1]/10 transition-all duration-500 hover:shadow-2xl hover:shadow-[#6366f1]/20 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#6366f1]/20">
                <Users className="h-8 w-8 text-[#6366f1]" />
              </div>
              <h3 className="text-white font-bold text-lg sm:text-xl mb-3 group-hover:text-[#6366f1] transition-colors duration-300">Gather Your Crew</h3>
              <p className="text-[#e2e8f0] text-sm sm:text-base mb-3 leading-relaxed">Up to 8 players can join the musical showdown</p>
              <p className="text-[#6366f1] text-sm italic font-medium">Perfect for parties or virtual hangouts!</p>
            </div>
        
            <div className="bg-gradient-to-br from-[#06b6d4]/15 via-[#8b5cf6]/10 to-[#06b6d4]/5 border border-[#06b6d4]/20 p-6 sm:p-8 text-center rounded-3xl backdrop-blur-xl hover:bg-gradient-to-br hover:from-[#06b6d4]/25 hover:via-[#8b5cf6]/15 hover:to-[#06b6d4]/10 transition-all duration-500 hover:shadow-2xl hover:shadow-[#06b6d4]/20 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#06b6d4]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#06b6d4]/20">
                <Radio className="h-8 w-8 text-[#06b6d4]" />
              </div>
              <h3 className="text-white font-bold text-lg sm:text-xl mb-3 group-hover:text-[#06b6d4] transition-colors duration-300">Choose Your Playlist</h3>
              <p className="text-[#e2e8f0] text-sm sm:text-base mb-3 leading-relaxed">Link any Spotify playlist for endless possibilities</p>
              <p className="text-[#06b6d4] text-sm italic font-medium">From 90s grunge to today's top hits!</p>
            </div>
        
            <div className="bg-gradient-to-br from-[#ec4899]/15 via-[#8b5cf6]/10 to-[#ec4899]/5 border border-[#ec4899]/20 p-6 sm:p-8 text-center rounded-3xl backdrop-blur-xl hover:bg-gradient-to-br hover:from-[#ec4899]/25 hover:via-[#8b5cf6]/15 hover:to-[#ec4899]/10 transition-all duration-500 hover:shadow-2xl hover:shadow-[#ec4899]/20 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#ec4899]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#ec4899]/20">
                <Zap className="h-8 w-8 text-[#ec4899]" />
              </div>
              <h3 className="text-white font-bold text-lg sm:text-xl mb-3 group-hover:text-[#ec4899] transition-colors duration-300">Quick-Fire Rounds</h3>
              <p className="text-[#e2e8f0] text-sm sm:text-base mb-3 leading-relaxed">Snappy 30-second rounds keep the energy high</p>
              <p className="text-[#ec4899] text-sm italic font-medium">Think fast—the clock is ticking!</p>
            </div>
        
            <div className="bg-gradient-to-br from-[#fbbf24]/15 via-[#8b5cf6]/10 to-[#fbbf24]/5 border border-[#fbbf24]/20 p-6 sm:p-8 text-center rounded-3xl backdrop-blur-xl hover:bg-gradient-to-br hover:from-[#fbbf24]/25 hover:via-[#8b5cf6]/15 hover:to-[#fbbf24]/10 transition-all duration-500 hover:shadow-2xl hover:shadow-[#fbbf24]/20 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#fbbf24]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#fbbf24]/20">
                <Trophy className="h-8 w-8 text-[#fbbf24]" />
              </div>
              <h3 className="text-white font-bold text-lg sm:text-xl mb-3 group-hover:text-[#fbbf24] transition-colors duration-300">Race to Victory</h3>
              <p className="text-[#e2e8f0] text-sm sm:text-base mb-3 leading-relaxed">First to 10 points claims the crown</p>
              <p className="text-[#fbbf24] text-sm italic font-medium">Brag-worthy achievements unlocked!</p>
            </div>
          </div>
        </div>
                
        {/* Enhanced Testimonials */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-[#6366f1]/10 via-[#8b5cf6]/5 to-transparent backdrop-blur-xl p-6 rounded-2xl border border-[#6366f1]/20 hover:border-[#6366f1]/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-[#fbbf24] fill-current" />
                ))}
              </div>
              <p className="text-sm text-[#e2e8f0] italic leading-relaxed">
                "Settled a debate with my dad about when 'Smells Like Teen Spirit' came out. I was right!"
              </p>
              <p className="text-right text-[#6366f1] text-sm mt-3 font-medium">— Music know-it-all</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#ec4899]/10 via-[#8b5cf6]/5 to-transparent backdrop-blur-xl p-6 rounded-2xl border border-[#ec4899]/20 hover:border-[#ec4899]/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-[#fbbf24] fill-current" />
                ))}
              </div>
              <p className="text-sm text-[#e2e8f0] italic leading-relaxed">
                "I was born in the wrong generation"
              </p>
              <p className="text-right text-[#ec4899] text-sm mt-3 font-medium">— Gen Z nostalgic</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#06b6d4]/10 via-[#8b5cf6]/5 to-transparent backdrop-blur-xl p-6 rounded-2xl border border-[#06b6d4]/20 hover:border-[#06b6d4]/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-[#fbbf24] fill-current" />
                ))}
              </div>
              <p className="text-sm text-[#e2e8f0] italic leading-relaxed">
                "I thought I knew my 80s pop inside out. This game has humbled me. In a fun way though!"
              </p>
              <p className="text-right text-[#06b6d4] text-sm mt-3 font-medium">— Nostalgic millennial</p>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="text-center pb-8 sm:pb-12">
          <div className="flex items-center justify-center gap-6 mb-6">
            <a href="#" className="text-[#8b5cf6] hover:text-[#6366f1] transition-colors duration-300 p-3 bg-[#8b5cf6]/10 rounded-full hover:bg-[#6366f1]/15 hover:scale-110 transform">
              <Coffee className="h-5 w-5" />
            </a>
            <a href="#" className="text-[#ec4899] hover:text-[#6366f1] transition-colors duration-300 p-3 bg-[#ec4899]/10 rounded-full hover:bg-[#6366f1]/15 hover:scale-110 transform">
              <Headphones className="h-5 w-5" />
            </a>
            <a href="#" className="text-[#06b6d4] hover:text-[#6366f1] transition-colors duration-300 p-3 bg-[#06b6d4]/10 rounded-full hover:bg-[#6366f1]/15 hover:scale-110 transform">
              <Music className="h-5 w-5" />
            </a>
          </div>
          
          <p className="text-[#e2e8f0] text-lg font-bold mb-3">
            Made with ♥ for music lovers
          </p>
          
          <p className="text-[#94a3b8] text-sm max-w-lg mx-auto leading-relaxed mb-6">
            Rythmy doesn't judge your questionable music taste (even if your friends do).
          </p>
          
          <p className="text-[#94a3b8] text-sm">
            v0.1.1 • <span className="text-[#6366f1] hover:text-[#8b5cf6] transition-colors cursor-pointer">Report bugs to: 97uselobp@mozmail.com!</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
