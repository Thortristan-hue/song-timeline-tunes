import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Music, Users, Trophy, Timer, Play, Smartphone, 
  Headphones, Star, Radio, Coffee, Zap, Volume2, Monitor
} from 'lucide-react';

interface MainMenuProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function MainMenu({ onCreateRoom, onJoinRoom }: MainMenuProps) {
  const [currentTip, setCurrentTip] = useState(0);
  const [tipChanging, setTipChanging] = useState(false);
  const [shuffledTips, setShuffledTips] = useState<string[]>([]);
  const [animationsApplied, setAnimationsApplied] = useState(false);
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const tips = [
    "Life is short. Eat kebab.",
    "Don't trust a fart after shwarma.",
    "If you can't be good, at least be good at being bad.",
    "Some days you're the dog, some days you're the hydrant.",
    "Remember that a hangover is just punishment for getting sober.",
    "Don't let Monday ruin your weekend bender.",
    "You can't fix stupid, but you can laugh at it.",
    "Your bed is calling. Answer it.",
    "Don't be afraid to be a hot mess. At least you're hot.",
    "Monsu first, bullshit later.",
    "Being an adult is hard, laudur helps",
    "You can't buy happiness, but you can buy Jägermeister. Same thing",
    "Never argue when you're naked, you'll lose every time",
    "Save water, drink longero",
    "Flirting with the bartender may not get you a free drink, but it's worth a shot.",
    "Check the Hesburger app for new coupons.",
    "Sleep is a poor substitute for caffeine.",
    "I put the 'pro' in procrastination.",
    "I'm not an alcoholic—alcoholics go to meetings. I go to bars.",
    "I drink because I'm a people person, and people are the worst."
  ];

  // Initialize shuffled tips on component mount only once
  useEffect(() => {
    const shuffled = [...tips].sort(() => Math.random() - 0.5);
    setShuffledTips(shuffled);
    
    // Apply animations only once after mount
    setTimeout(() => {
      setAnimationsApplied(true);
    }, 100);

    return () => {
      if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current);
      }
    };
  }, []);

  // Enhanced tip cycling with smooth transitions and random order
  useEffect(() => {
    if (shuffledTips.length === 0) return;
    
    // Clear any existing interval when dependencies change
    if (tipIntervalRef.current) {
      clearInterval(tipIntervalRef.current);
    }
    
    tipIntervalRef.current = setInterval(() => {
      setTipChanging(true);
      setTimeout(() => {
        setCurrentTip((prev) => (prev + 1) % shuffledTips.length);
        setTipChanging(false);
      }, 400);
    }, 10000); // Increased from 5000ms to 10000ms (10 seconds)
    
    return () => {
      if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current);
      }
    };
  }, [shuffledTips.length]);

  // Generate animation classes conditionally based on whether initial animations are done
  const getAnimationClass = (baseClass: string, staggerClass?: string) => {
    return animationsApplied ? `${baseClass} ${staggerClass || ''}` : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
      {/* Enhanced Dark Background Effects */}
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
        
        {/* Geometric shapes */}
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
          <path d="M480 720 L600 600 L750 650" stroke="#107793" strokeWidth="1" opacity="0.2" />
          <path d="M250 200 L400 280 L600 240" stroke="#a53b8b" strokeWidth="1" opacity="0.2" />
          
          {/* Abstract rectangles */}
          <rect x="800" y="100" width="60" height="20" rx="10" fill="#107793" opacity="0.1" transform="rotate(15 830 110)" />
          <rect x="200" y="400" width="80" height="15" rx="8" fill="#a53b8b" opacity="0.1" transform="rotate(-10 240 408)" />
          <rect x="600" y="700" width="50" height="25" rx="12" fill="#4a4f5b" opacity="0.1" transform="rotate(25 625 713)" />
          <rect x="900" y="300" width="70" height="20" rx="10" fill="#107793" opacity="0.1" transform="rotate(-25 900 300)" />
          <rect x="350" y="600" width="60" height="15" rx="8" fill="#a53b8b" opacity="0.1" transform="rotate(10 350 600)" />
          
          {/* Dotted patterns */}
          <g opacity="0.15">
            <circle cx="400" cy="120" r="2" fill="#107793" />
            <circle cx="420" cy="125" r="1.5" fill="#107793" />
            <circle cx="440" cy="130" r="2" fill="#107793" />
            <circle cx="460" cy="135" r="1.5" fill="#107793" />
            <circle cx="480" cy="140" r="2" fill="#107793" />
            <circle cx="500" cy="145" r="1.5" fill="#107793" />
          </g>
          
          <g opacity="0.15">
            <circle cx="700" cy="350" r="2" fill="#a53b8b" />
            <circle cx="720" cy="355" r="1.5" fill="#a53b8b" />
            <circle cx="740" cy="360" r="2" fill="#a53b8b" />
            <circle cx="760" cy="365" r="1.5" fill="#a53b8b" />
            <circle cx="780" cy="370" r="2" fill="#a53b8b" />
            <circle cx="800" cy="375" r="1.5" fill="#a53b8b" />
          </g>
          
          <g opacity="0.15">
            <circle cx="200" cy="650" r="2" fill="#4a4f5b" />
            <circle cx="220" cy="645" r="1.5" fill="#4a4f5b" />
            <circle cx="240" cy="640" r="2" fill="#4a4f5b" />
            <circle cx="260" cy="635" r="1.5" fill="#4a4f5b" />
          </g>
          
          {/* Music-themed elements */}
          <path d="M100 250 C150 230, 180 260, 150 300" stroke="#107793" strokeWidth="1" opacity="0.2" />
          <path d="M150 300 L150 380" stroke="#107793" strokeWidth="1" opacity="0.2" />
          <circle cx="140" cy="380" r="10" fill="#107793" opacity="0.1" />
          
          <path d="M850 450 C900 430, 930 460, 900 500" stroke="#a53b8b" strokeWidth="1" opacity="0.2" />
          <path d="M900 500 L900 580" stroke="#a53b8b" strokeWidth="1" opacity="0.2" />
          <circle cx="890" cy="580" r="10" fill="#a53b8b" opacity="0.1" />
          
          {/* Sound waves */}
          <path d="M300 300 Q350 280, 400 300 Q450 320, 500 300" stroke="#4a4f5b" strokeWidth="1" opacity="0.1" />
          <path d="M300 320 Q350 300, 400 320 Q450 340, 500 320" stroke="#4a4f5b" strokeWidth="1" opacity="0.1" />
          <path d="M300 340 Q350 320, 400 340 Q450 360, 500 340" stroke="#4a4f5b" strokeWidth="1" opacity="0.1" />
          
          <path d="M800 200 Q850 180, 900 200 Q950 220, 1000 200" stroke="#107793" strokeWidth="1" opacity="0.1" />
          <path d="M800 220 Q850 200, 900 220 Q950 240, 1000 220" stroke="#107793" strokeWidth="1" opacity="0.1" />
        </svg>
        
        {/* Floating music notes with enhanced animations */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
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
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-gradient-to-r from-transparent via-white to-transparent mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3Ccircle cx='17' cy='37' r='1'/%3E%3Ccircle cx='37' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center pt-12 sm:pt-16 mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className={`w-32 h-32 sm:w-40 sm:h-40 relative overflow-hidden ${getAnimationClass('logo-bounce')}`}>
              <img 
                src="/Vinyl_rythm.png" 
                alt="Rythmy Logo" 
                className="w-full h-full object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight relative inline-block ${getAnimationClass('menu-entrance')}`}>
            RYTHMY
            <span className="absolute -top-1 -right-2 text-xs text-[#107793] font-mono animate-pulse">BETA</span>
          </h1>
          
          <p className={`text-base sm:text-lg text-[#d9e8dd] max-w-2xl mx-auto leading-relaxed mb-6 ${getAnimationClass('menu-entrance', 'stagger-1')}`}>
            Dive into the ultimate music timeline challenge! Guess when songs hit the charts, arrange tracks in perfect chronological order, and discover just how well you know your favorite tunes through the decades.
          </p>
          
          <div className={`bg-gradient-to-r from-[#a53b8b]/40 to-[#4a4f5b]/40 backdrop-blur-sm p-4 rounded-xl max-w-xl mx-auto border border-[#a53b8b]/30 ${getAnimationClass('menu-entrance', 'stagger-2')} transition-all duration-500 ${tipChanging ? 'opacity-50 transform scale-95' : 'opacity-100 transform scale-100'}`}>
            <p className="text-sm text-[#d9e8dd] italic">
              <span className="text-[#a53b8b] font-semibold mr-2">♪ Tip:</span>
              {shuffledTips.length > 0 ? shuffledTips[currentTip] : tips[0]}
            </p>
          </div>
        </div>

        {/* Main Buttons */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full mb-8">
          <div className="space-y-4">
            <Button
              onClick={onCreateRoom}
              className={`w-full bg-gradient-to-r from-[#107793] to-[#0e1f2f] text-white h-16 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg border-0 relative overflow-hidden group interactive-button hover-glow ${getAnimationClass('menu-entrance', 'stagger-3')}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#107793]/0 via-[#107793]/10 to-[#107793]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
              <Play className="h-5 w-5 mr-3 group-hover:animate-pulse" />
              Start a Game
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 text-xs group-hover:animate-bounce">host</div>
            </Button>
            
            <Button
              onClick={onJoinRoom}
              className={`w-full bg-gradient-to-r from-[#a53b8b] to-[#4a4f5b] text-white h-16 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg border-0 relative overflow-hidden group interactive-button hover-glow ${getAnimationClass('menu-entrance', 'stagger-4')}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#a53b8b]/0 via-[#a53b8b]/10 to-[#a53b8b]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
              <Smartphone className="h-5 w-5 mr-3 group-hover:animate-wiggle" />
              Join Lobby
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 text-xs group-hover:animate-bounce">player</div>
            </Button>
          </div>
        </div>

        {/* How to Play Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className={`text-3xl sm:text-4xl font-bold text-white text-center mb-3 ${getAnimationClass('menu-entrance', 'stagger-5')}`}>
            How to Play
          </h2>
          <p className={`text-center text-[#d9e8dd] text-base mb-10 ${getAnimationClass('menu-entrance', 'stagger-6')}`}>
            Build the perfect music timeline! Listen to songs and arrange them chronologically to create a 10-card timeline and win the game.
          </p>
          
          {/* What You Need Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-[#4CC9F0] mb-6 text-center">🎵 What You Need</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className={`bg-[#1A1A2E] border border-[#4CC9F0]/20 p-4 text-center rounded-xl backdrop-blur-sm hover-lift transition-all duration-300 ${getAnimationClass('stagger-fade-in', 'stagger-1')}`}>
                <Monitor className="h-8 w-8 text-[#4CC9F0] mx-auto mb-3 animate-pulse" />
                <h4 className="text-white font-semibold text-sm mb-2">Host PC</h4>
                <p className="text-[#4CC9F0] text-xs">Computer or laptop to host the game and display the main screen</p>
              </Card>
              
              <Card className={`bg-[#1A1A2E] border border-[#F72585]/20 p-4 text-center rounded-xl backdrop-blur-sm hover-lift transition-all duration-300 ${getAnimationClass('stagger-fade-in', 'stagger-2')}`}>
                <Smartphone className="h-8 w-8 text-[#F72585] mx-auto mb-3 animate-pulse" />
                <h4 className="text-white font-semibold text-sm mb-2">Mobile Device</h4>
                <p className="text-[#F72585] text-xs">Smartphone or tablet for each player to join and play</p>
              </Card>
              
              <Card className={`bg-[#1A1A2E] border border-[#7209B7]/20 p-4 text-center rounded-xl backdrop-blur-sm hover-lift transition-all duration-300 ${getAnimationClass('stagger-fade-in', 'stagger-3')}`}>
                <Radio className="h-8 w-8 text-[#7209B7] mx-auto mb-3 animate-bounce" />
                <h4 className="text-white font-semibold text-sm mb-2">Spotify Playlist</h4>
                <p className="text-[#7209B7] text-xs">Public playlist with diverse songs from different decades</p>
              </Card>
              
              <Card className={`bg-[#1A1A2E] border border-[#FF6B35]/20 p-4 text-center rounded-xl backdrop-blur-sm hover-lift transition-all duration-300 ${getAnimationClass('stagger-fade-in', 'stagger-4')}`}>
                <Users className="h-8 w-8 text-[#FF6B35] mx-auto mb-3 animate-wiggle" />
                <h4 className="text-white font-semibold text-sm mb-2">2-8 Players</h4>
                <p className="text-[#FF6B35] text-xs">Friends ready for an epic music timeline challenge</p>
              </Card>
            </div>
          </div>

          {/* Game Flow Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-[#A8DADC] mb-6 text-center">🎮 Game Flow</h3>
            
            {/* Step by step process */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#107793] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Setup & Join</h4>
                    <p className="text-[#d9e8dd] text-sm">Host creates room with Spotify playlist. Players scan QR code or enter room code to join.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#a53b8b] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Listen & Place</h4>
                    <p className="text-[#d9e8dd] text-sm">Each turn, a song plays for 30 seconds. Place it on your timeline where you think it was released.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#4a4f5b] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Build Timeline</h4>
                    <p className="text-[#d9e8dd] text-sm">Correctly placed songs stay in your timeline. Wrong placements get discarded.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#107793] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">4</div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Win the Game</h4>
                    <p className="text-[#d9e8dd] text-sm">First player to build a complete timeline with 10 songs wins!</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center items-center">
                <div className="bg-gradient-to-r from-[#1A1A2E] to-[#0e1f2f] border border-[#F72585]/20 p-6 rounded-xl backdrop-blur-sm">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center space-x-2">
                      <Music className="h-6 w-6 text-[#107793]" />
                      <span className="text-white text-sm font-medium">Song Plays</span>
                    </div>
                    <div className="text-[#F72585] text-xl">↓</div>
                    <div className="flex items-center space-x-2">
                      <Timer className="h-6 w-6 text-[#a53b8b]" />
                      <span className="text-white text-sm font-medium">30s to Decide</span>
                    </div>
                    <div className="text-[#F72585] text-xl">↓</div>
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-6 w-6 text-[#4a4f5b]" />
                      <span className="text-white text-sm font-medium">Place on Timeline</span>
                    </div>
                    <div className="text-[#F72585] text-xl">↓</div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-6 w-6 text-[#7209B7]" />
                      <span className="text-white text-sm font-medium">10 Cards = Win!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-[#107793]/20 to-[#a53b8b]/20 backdrop-blur-sm p-4 rounded-xl border border-[#107793]/30">
                <p className="text-[#d9e8dd] text-sm italic">
                  <span className="text-[#4CC9F0] font-semibold">💡 Pro Tip:</span> The closer your guess, the better your chances of keeping the song in your timeline!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
