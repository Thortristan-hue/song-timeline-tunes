import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Building, Users, Trophy, Timer, Play, Smartphone, 
  Headphones, Star, Zap, Coffee, Lightbulb, Volume2
} from 'lucide-react';

interface MainMenuProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function MainMenu({ onCreateRoom, onJoinRoom }: MainMenuProps) {
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    "The city never sleeps, and neither should your playlist.",
    "In the concrete jungle, music is the rhythm of life.",
    "Street smart beats book smart every time.",
    "Every street corner has a story; every song has a timeline.",
    "Urban legends are made in the underground scene.",
    "The best beats come from the streets, not the charts.",
    "Neon lights and late nights make the best memories.",
    "City life is loud; make sure your music is louder.",
    "Concrete and steel can't contain good music.",
    "The skyline changes, but the beats remain timeless.",
    "Street art and street beats go hand in hand.",
    "In the city, everyone's a critic and everyone's an artist.",
    "Urban jungle rules: survival of the illest.",
    "Graffiti fades, but the music lives forever.",
    "Every subway ride is a chance to discover new sounds.",
    "The city's heartbeat is hip-hop, but its soul is diverse.",
    "Rooftop parties and basement shows - the urban music scene.",
    "Traffic jams are just more time to vibe to your playlist.",
    "City nights and neon lights - the perfect music mood.",
    "From the streets to the penthouse, music connects us all."
  ];

  // Cycle through tips every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] relative overflow-hidden">
      {/* Urban Background Effects */}
      <div className="absolute inset-0">
        {/* Neon glow effects */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#00d4ff]/15 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-[#ff0080]/15 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-[#39ff14]/10 rounded-full blur-2xl animate-pulse" />
        
        {/* Additional neon glows */}
        <div className="absolute top-16 right-16 w-24 h-24 bg-[#00d4ff]/8 rounded-full blur-xl" />
        <div className="absolute bottom-32 left-16 w-28 h-28 bg-[#ff0080]/8 rounded-full blur-xl" />
        <div className="absolute top-1/3 left-1/6 w-20 h-20 bg-[#39ff14]/6 rounded-full blur-lg" />
        <div className="absolute bottom-1/3 right-1/6 w-32 h-32 bg-[#00d4ff]/6 rounded-full blur-lg" />
        
        {/* Ambient city lighting */}
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-[#ff0080]/12 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/6 right-1/3 w-72 h-72 bg-[#1a1a1a]/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-[#2a2a2a]/25 rounded-full blur-3xl" />
        
        {/* Urban geometric shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 800" fill="none">
          {/* Building silhouettes */}
          <rect x="100" y="400" width="40" height="400" fill="#00d4ff" opacity="0.1" />
          <rect x="150" y="350" width="35" height="450" fill="#ff0080" opacity="0.1" />
          <rect x="190" y="380" width="45" height="420" fill="#39ff14" opacity="0.1" />
          <rect x="240" y="320" width="30" height="480" fill="#00d4ff" opacity="0.1" />
          <rect x="280" y="360" width="50" height="440" fill="#ff0080" opacity="0.1" />
          
          <rect x="900" y="300" width="60" height="500" fill="#00d4ff" opacity="0.1" />
          <rect x="970" y="250" width="45" height="550" fill="#ff0080" opacity="0.1" />
          <rect x="1020" y="280" width="55" height="520" fill="#39ff14" opacity="0.1" />
          <rect x="1080" y="200" width="40" height="600" fill="#00d4ff" opacity="0.1" />
          
          {/* City lights - windows */}
          <rect x="110" y="420" width="4" height="6" fill="#00d4ff" opacity="0.6" />
          <rect x="120" y="440" width="4" height="6" fill="#ff0080" opacity="0.6" />
          <rect x="130" y="460" width="4" height="6" fill="#39ff14" opacity="0.6" />
          <rect x="110" y="480" width="4" height="6" fill="#00d4ff" opacity="0.6" />
          <rect x="125" y="500" width="4" height="6" fill="#ff0080" opacity="0.6" />
          
          <rect x="160" y="370" width="4" height="6" fill="#39ff14" opacity="0.6" />
          <rect x="170" y="390" width="4" height="6" fill="#00d4ff" opacity="0.6" />
          <rect x="165" y="410" width="4" height="6" fill="#ff0080" opacity="0.6" />
          
          <rect x="920" y="320" width="6" height="8" fill="#00d4ff" opacity="0.6" />
          <rect x="935" y="340" width="6" height="8" fill="#ff0080" opacity="0.6" />
          <rect x="950" y="360" width="6" height="8" fill="#39ff14" opacity="0.6" />
          <rect x="920" y="380" width="6" height="8" fill="#00d4ff" opacity="0.6" />
          
          {/* Street lights */}
          <circle cx="300" cy="750" r="8" fill="#ffff00" opacity="0.3" />
          <circle cx="500" cy="750" r="8" fill="#ffff00" opacity="0.3" />
          <circle cx="700" cy="750" r="8" fill="#ffff00" opacity="0.3" />
          <circle cx="900" cy="750" r="8" fill="#ffff00" opacity="0.3" />
          
          {/* Connecting lines - like power lines */}
          <path d="M100 400 L300 420 L500 410" stroke="#00d4ff" strokeWidth="1" opacity="0.2" />
          <path d="M600 430 L800 420 L1000 440" stroke="#ff0080" strokeWidth="1" opacity="0.2" />
          <path d="M200 600 L400 590 L600 600" stroke="#39ff14" strokeWidth="1" opacity="0.2" />
          
          {/* Grid pattern - like city blocks */}
          <defs>
            <pattern id="cityGrid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="1200" height="800" fill="url(#cityGrid)" />
        </svg>
        
        {/* Floating urban elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="absolute animate-float opacity-20"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${10 + Math.random() * 20}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            >
              {i % 4 === 0 ? (
                <Building className="h-3 w-3 text-[#00d4ff]" />
              ) : i % 4 === 1 ? (
                <Lightbulb className="h-4 w-4 text-[#ff0080]" />
              ) : i % 4 === 2 ? (
                <Zap className="h-3 w-3 text-[#39ff14]" />
              ) : (
                <Building className="h-2 w-2 text-[#ffff00]" />
              )}
            </div>
          ))}
        </div>
        
        {/* Noise texture overlay - urban grain */}
        <div className="absolute inset-0 opacity-[0.02] bg-gradient-to-r from-transparent via-white to-transparent mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.6'%3E%3Crect x='7' y='7' width='2' height='2'/%3E%3Crect x='27' y='27' width='2' height='2'/%3E%3Crect x='47' y='47' width='2' height='2'/%3E%3Crect x='17' y='37' width='1' height='1'/%3E%3Crect x='37' y='17' width='1' height='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center pt-12 sm:pt-16 mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1a1a1a]/80 border-2 border-[#00d4ff] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00d4ff]/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/20 to-transparent"></div>
              <Building className="h-8 w-8 sm:h-10 sm:w-10 text-[#00d4ff]" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight relative inline-block">
            URBAN BEATS
            <span className="absolute -top-1 -right-2 text-xs text-[#00d4ff] font-mono">BETA</span>
          </h1>
          
          <p className="text-base sm:text-lg text-[#d1d5db] max-w-2xl mx-auto leading-relaxed mb-6">
            Navigate the urban music landscape! Test your knowledge of when tracks dropped in the concrete jungle, arrange beats in perfect chronological order, and prove you know the pulse of the city's soundtrack.
          </p>
          
          <div className="bg-gradient-to-r from-[#ff0080]/30 to-[#39ff14]/30 backdrop-blur-sm p-4 rounded-xl max-w-xl mx-auto border border-[#ff0080]/40">
            <p className="text-sm text-[#d1d5db] italic">
              <span className="text-[#ff0080] font-semibold mr-2">🏙️ Street Wisdom:</span>
              {tips[currentTip]}
            </p>
          </div>
        </div>

        {/* Main Buttons */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full mb-8">
          <div className="space-y-4">
            <Button
              onClick={onCreateRoom}
              className="w-full bg-gradient-to-r from-[#00d4ff] to-[#1a1a1a] text-white h-16 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg border-0 active:scale-95 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff]/0 via-[#00d4ff]/20 to-[#00d4ff]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
              <Play className="h-5 w-5 mr-3" />
              Start a Game
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 text-xs">host</div>
            </Button>
            
            <Button
              onClick={onJoinRoom}
              className="w-full bg-gradient-to-r from-[#ff0080] to-[#2a2a2a] text-white h-16 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg border-0 active:scale-95 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff0080]/0 via-[#ff0080]/20 to-[#ff0080]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
              <Smartphone className="h-5 w-5 mr-3" />
              Join Lobby
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 text-xs">player</div>
            </Button>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
            How it works
          </h2>
          <p className="text-center text-[#d1d5db] text-sm mb-8">Navigate the urban music scene like a pro!</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-[#1a1a1a] border border-[#00d4ff]/20 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-gradient-to-br hover:from-[#00d4ff]/10 hover:to-[#00d4ff]/10 transition-all duration-300 hover:shadow-md hover:shadow-[#00d4ff]/20">
              <Users className="h-8 w-8 text-[#00d4ff] mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">Build Your Crew</h3>
              <p className="text-[#d1d5db] text-xs sm:text-sm mb-2">Up to 8 players can join the urban music battle</p>
              <p className="text-[#00d4ff] text-xs italic">Perfect for block parties or online sessions!</p>
            </Card>
        
            <Card className="bg-[#1a1a1a] border border-[#ff0080]/20 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-gradient-to-br hover:from-[#ff0080]/10 hover:to-[#ff0080]/10 transition-all duration-300 hover:shadow-md hover:shadow-[#ff0080]/20">
              <Zap className="h-8 w-8 text-[#ff0080] mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">Choose Your Sound</h3>
              <p className="text-[#d1d5db] text-xs sm:text-sm mb-2">Curate playlists from street beats to penthouse tracks</p>
              <p className="text-[#ff0080] text-xs italic">From underground hip-hop to mainstream hits!</p>
            </Card>
        
            <Card className="bg-[#1a1a1a] border border-[#39ff14]/20 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-gradient-to-br hover:from-[#39ff14]/10 hover:to-[#39ff14]/10 transition-all duration-300 hover:shadow-md hover:shadow-[#39ff14]/20">
              <Timer className="h-8 w-8 text-[#39ff14] mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">Rapid-Fire Rounds</h3>
              <p className="text-[#d1d5db] text-xs sm:text-sm mb-2">Lightning-fast 30-second rounds keep the energy flowing</p>
              <p className="text-[#39ff14] text-xs italic">Move fast—the city doesn't wait!</p>
            </Card>
        
            <Card className="bg-[#1a1a1a] border border-[#ffff00]/20 p-4 sm:p-6 text-center rounded-xl backdrop-blur-sm hover:bg-gradient-to-br hover:from-[#ffff00]/10 hover:to-[#ffff00]/10 transition-all duration-300 hover:shadow-md hover:shadow-[#ffff00]/20">
              <Trophy className="h-8 w-8 text-[#ffff00] mx-auto mb-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base mb-2">Rule the Streets</h3>
              <p className="text-[#d1d5db] text-xs sm:text-sm mb-2">First to 10 points becomes the urban music legend</p>
              <p className="text-[#ffff00] text-xs italic">Street cred and bragging rights included!</p>
            </Card>
          </div>
        </div>
                
        {/* Testimonials */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1a1a1a]/70 backdrop-blur-sm p-4 rounded-lg border border-[#00d4ff]/30">
              <div className="flex items-center mb-2">
                <Star className="h-3 w-3 text-[#00d4ff]" />
                <Star className="h-3 w-3 text-[#00d4ff]" />
                <Star className="h-3 w-3 text-[#00d4ff]" />
                <Star className="h-3 w-3 text-[#00d4ff]" />
                <Star className="h-3 w-3 text-[#00d4ff]" />
              </div>
              <p className="text-xs text-[#d1d5db] italic">
                "Finally settled the debate about when 'Lose Yourself' dropped. The streets remember everything!"
              </p>
              <p className="text-right text-[#00d4ff] text-xs mt-2">— Underground hip-hop head</p>
            </div>
            
            <div className="bg-[#1a1a1a]/70 backdrop-blur-sm p-4 rounded-lg border border-[#ff0080]/30">
              <div className="flex items-center mb-2">
                <Star className="h-3 w-3 text-[#ff0080]" />
                <Star className="h-3 w-3 text-[#ff0080]" />
                <Star className="h-3 w-3 text-[#ff0080]" />
                <Star className="h-3 w-3 text-[#ff0080]" />
                <Star className="h-3 w-3 text-[#ff0080]" />
              </div>
              <p className="text-xs text-[#d1d5db] italic">
                "My rooftop party got way more lit when we played this. Urban music knowledge is power!"
              </p>
              <p className="text-right text-[#ff0080] text-xs mt-2">— City party legend</p>
            </div>
            
            <div className="bg-[#1a1a1a]/70 backdrop-blur-sm p-4 rounded-lg border border-[#39ff14]/30">
              <div className="flex items-center mb-2">
                <Star className="h-3 w-3 text-[#39ff14]" />
                <Star className="h-3 w-3 text-[#39ff14]" />
                <Star className="h-3 w-3 text-[#39ff14]" />
                <Star className="h-3 w-3 text-[#39ff14]" />
                <Star className="h-3 w-3 text-[#39ff14]" />
              </div>
              <p className="text-xs text-[#d1d5db] italic">
                "From boom bap to trap beats, this game covers it all. My street cred just went through the roof!"
              </p>
              <p className="text-right text-[#39ff14] text-xs mt-2">— Beat digger extraordinaire</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pb-8 sm:pb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <a href="#" className="text-[#39ff14] hover:text-[#d1d5db] transition-colors">
              <Building className="h-4 w-4" />
            </a>
            <a href="#" className="text-[#39ff14] hover:text-[#d1d5db] transition-colors">
              <Headphones className="h-4 w-4" />
            </a>
            <a href="#" className="text-[#39ff14] hover:text-[#d1d5db] transition-colors">
              <Zap className="h-4 w-4" />
            </a>
          </div>
          
          <p className="text-[#d1d5db] text-sm font-medium mb-2">
            Made with ♥ for urban music lovers
          </p>
          
          <p className="text-[#6b7280] text-xs max-w-md mx-auto leading-relaxed">
            Urban Beats doesn't judge your music taste, but the streets might.
          </p>
          
          <p className="text-[#6b7280] text-xs mt-4">
            v0.1.1 • <span className="text-[#00d4ff]">Report bugs to: 97uselobp@mozmail.com!</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
