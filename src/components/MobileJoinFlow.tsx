import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Smartphone, Wifi, Palette, Users, Clock, Music, Volume2 } from 'lucide-react';

interface MobileJoinFlowProps {
  onJoinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  onBackToMenu: () => void;
  isLoading?: boolean;
  autoJoinCode?: string;
}

const PLAYER_COLORS = [
  '#107793', // Teal blue
  '#a53b8b', // Pink/magenta
  '#4a4f5b', // Gray blue
  '#F72585', // Hot pink
  '#4CC9F0', // Light blue
  '#7209B7', // Purple
  '#A8DADC', // Light teal
  '#E6F4F1', // Light green
];

type JoinState = 'enterCode' | 'enterDetails' | 'joiningRoom';

export function MobileJoinFlow({ onJoinRoom, onBackToMenu, isLoading = false, autoJoinCode }: MobileJoinFlowProps) {
  const [joinState, setJoinState] = useState<JoinState>('enterCode');
  const [lobbyCode, setLobbyCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0]);
  const [error, setError] = useState('');

  // If there's an auto-join code, skip directly to the details screen
  useEffect(() => {
    if (autoJoinCode) {
      setLobbyCode(autoJoinCode.toUpperCase());
      setJoinState('enterDetails');
    }
  }, [autoJoinCode]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lobbyCode.trim()) return;
    
    setError('');
    setJoinState('enterDetails');
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !selectedColor) return;
    
    setError('');
    setJoinState('joiningRoom');
    
    try {
      const success = await onJoinRoom(lobbyCode.trim().toUpperCase(), playerName.trim());
      if (!success) {
        setError('Hmm, that didn\'t work. Double-check the code?');
        setJoinState('enterCode');
      }
    } catch (err) {
      setError('Something went wrong. Give it another try!');
      setJoinState('enterCode');
    }
  };

  const handleLobbyCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setLobbyCode(value);
      setError('');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
    setError('');
  };

  const handleBackFromDetails = () => {
    if (autoJoinCode) {
      onBackToMenu();
    } else {
      setJoinState('enterCode');
    }
  };

  if (joinState === 'joiningRoom') {
    return (
      <div className="mobile-container bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden"
           style={{ minHeight: 'var(--mobile-safe-height)' }}>
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-[#4a4f5b]/8 rounded-full blur-2xl animate-pulse" />
          
          {/* Floating music notes */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className="absolute animate-float opacity-20"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float ${8 + Math.random() * 12}s linear infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              >
                {i % 2 === 0 ? (
                  <Music className="h-3 w-3 text-[#107793]" />
                ) : (
                  <Volume2 className="h-3 w-3 text-[#a53b8b]" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center p-6"
             style={{ minHeight: 'var(--mobile-safe-height)' }}>
          <div className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-8 rounded-3xl text-center max-w-sm w-full shadow-lg shadow-[#107793]/10">
            <div className="w-16 h-16 bg-[#0e1f2f]/60 border-2 border-[#107793] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#107793]/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#107793]/10 to-transparent"></div>
              <Users className="h-8 w-8 text-[#107793] animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Joining game...</h1>
            <p className="text-[#d9e8dd] mb-6">Setting up your player profile</p>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-[#107793] rounded-full animate-bounce"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '1.2s'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (joinState === 'enterDetails') {
    return (
      <div className="mobile-container bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden"
           style={{ minHeight: 'var(--mobile-safe-height)' }}>
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-[#4a4f5b]/8 rounded-full blur-2xl animate-pulse" />
          
          {/* Additional scattered glows */}
          <div className="absolute top-16 right-16 w-24 h-24 bg-[#107793]/5 rounded-full blur-xl" />
          <div className="absolute bottom-32 left-16 w-28 h-28 bg-[#a53b8b]/5 rounded-full blur-xl" />
          
          {/* Floating music notes */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className="absolute animate-float opacity-20"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float ${10 + Math.random() * 15}s linear infinite`,
                  animationDelay: `${Math.random() * 4}s`,
                }}
              >
                {i % 3 === 0 ? (
                  <Music className="h-3 w-3 text-[#107793]" />
                ) : i % 3 === 1 ? (
                  <Palette className="h-4 w-4 text-[#a53b8b]" />
                ) : (
                  <Volume2 className="h-3 w-3 text-[#4a4f5b]" />
                )}
              </div>
            ))}
          </div>

          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.015] bg-gradient-to-r from-transparent via-white to-transparent mix-blend-overlay" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3Ccircle cx='17' cy='37' r='1'/%3E%3Ccircle cx='37' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative z-10 flex flex-col p-6"
             style={{ minHeight: 'var(--mobile-safe-height)' }}>
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={handleBackFromDetails}
              className="bg-[#0e1f2f]/60 hover:bg-[#0e1f2f]/80 border border-[#107793]/30 text-white h-12 px-6 text-base font-medium 
                       rounded-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-[#107793]/10"
            >
              <ArrowLeft className="h-4 w-4 mr-3" />
              Back
            </Button>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <div className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-8 rounded-3xl shadow-lg shadow-[#107793]/10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-12 h-12 relative overflow-hidden mx-auto mb-6">
                  <img 
                    src="/Vinyl_rythm.png" 
                    alt="Rythmy Logo" 
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Set up your player</h1>
                <p className="text-[#d9e8dd] text-base leading-relaxed font-medium">
                  Joining room: <span className="font-mono text-[#4CC9F0]">{lobbyCode}</span>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                {/* Player Name Input */}
                <div>
                  <Label htmlFor="playerName" className="block text-lg font-semibold text-white mb-3 tracking-tight">
                    What should we call you?
                  </Label>
                  <Input
                    id="playerName"
                    type="text"
                    placeholder="Your name here..."
                    value={playerName}
                    onChange={handleNameChange}
                    className="bg-[#1A1A2E]/50 border border-[#4a4f5b]/30 text-white placeholder:text-[#d9e8dd]/40 h-16 text-lg 
                             rounded-xl focus:bg-[#1A1A2E]/70 focus:ring-2 focus:ring-[#107793]/50 focus:border-[#107793]/50
                             backdrop-blur-xl shadow-inner transition-all duration-200"
                    maxLength={20}
                    autoCapitalize="words"
                    autoCorrect="off"
                    autoFocus
                  />
                </div>

                {/* Color Selection */}
                <div>
                  <Label className="block text-lg font-semibold text-white mb-3 tracking-tight">
                    Pick your color
                  </Label>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {PLAYER_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-full aspect-square rounded-xl transition-all duration-200 ${
                          selectedColor === color 
                            ? 'ring-4 ring-white/50 scale-95 shadow-lg' 
                            : 'hover:scale-105 active:scale-95'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && (
                          <div className="w-full h-full rounded-xl flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Preview */}
                  <div className="bg-[#1A1A2E]/50 rounded-xl p-4 border border-[#4a4f5b]/30 backdrop-blur-sm">
                    <p className="text-[#d9e8dd] text-sm mb-3">Preview</p>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-sm"
                        style={{ backgroundColor: selectedColor }}
                      >
                        {playerName.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {playerName.trim() || 'Your name'}
                        </p>
                        <p className="text-sm text-[#d9e8dd]">
                          Ready to play
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-[#F72585]/10 border border-[#F72585]/30 rounded-xl p-4 backdrop-blur-xl">
                    <p className="text-[#F72585] text-center font-medium">{error}</p>
                  </div>
                )}

                {/* Join Button */}
                <Button
                  type="submit"
                  disabled={!playerName.trim() || !selectedColor || isLoading}
                  className="w-full bg-gradient-to-r from-[#107793] to-[#0e1f2f] text-white font-semibold h-16 text-lg 
                           rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 
                           hover:scale-[1.02] active:scale-[0.98] border-0 tracking-tight shadow-lg 
                           disabled:hover:scale-100 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#107793]/0 via-[#107793]/10 to-[#107793]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
                  Join Game
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default state: enterCode
  return (
    <div className="mobile-container bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden"
         style={{ minHeight: 'var(--mobile-safe-height)' }}>
      {/* Enhanced Dark Background Effects */}
      <div className="absolute inset-0">
        {/* Main glow effects */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-[#4a4f5b]/8 rounded-full blur-2xl animate-pulse" />
        
        {/* Additional scattered glows */}
        <div className="absolute top-16 right-16 w-24 h-24 bg-[#107793]/5 rounded-full blur-xl" />
        <div className="absolute bottom-32 left-16 w-28 h-28 bg-[#a53b8b]/5 rounded-full blur-xl" />
        <div className="absolute top-1/3 left-1/6 w-20 h-20 bg-[#4a4f5b]/4 rounded-full blur-lg" />
        <div className="absolute bottom-1/3 right-1/6 w-32 h-32 bg-[#107793]/4 rounded-full blur-lg" />
        
        {/* New ambient lighting */}
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-[#a53b8b]/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/6 right-1/3 w-72 h-72 bg-[#0e1f2f]/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-[#4a4f5b]/20 rounded-full blur-3xl" />
        
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
          
          {/* Sound waves */}
          <path d="M300 300 Q350 280, 400 300 Q450 320, 500 300" stroke="#4a4f5b" strokeWidth="1" opacity="0.1" />
          <path d="M300 320 Q350 300, 400 320 Q450 340, 500 320" stroke="#4a4f5b" strokeWidth="1" opacity="0.1" />
          <path d="M300 340 Q350 320, 400 340 Q450 360, 500 340" stroke="#4a4f5b" strokeWidth="1" opacity="0.1" />
        </svg>
        
        {/* Floating music notes */}
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
              {i % 3 === 0 ? (
                <Music className="h-3 w-3 text-[#107793]" />
              ) : i % 3 === 1 ? (
                <Smartphone className="h-4 w-4 text-[#a53b8b]" />
              ) : (
                <Volume2 className="h-3 w-3 text-[#4a4f5b]" />
              )}
            </div>
          ))}
        </div>
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-gradient-to-r from-transparent via-white to-transparent mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3Ccircle cx='17' cy='37' r='1'/%3E%3Ccircle cx='37' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative z-10 flex flex-col p-6"
           style={{ minHeight: 'var(--mobile-safe-height)' }}>
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={onBackToMenu}
            className="bg-[#0e1f2f]/60 hover:bg-[#0e1f2f]/80 border border-[#107793]/30 text-white h-12 px-6 text-base font-medium 
                     rounded-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-[#107793]/10"
          >
            <ArrowLeft className="h-4 w-4 mr-3" />
            Back
          </Button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          {/* Disclaimer */}
          <div className="text-center mb-8">
            <p className="text-sm text-[#d9e8dd]/70 leading-relaxed">
              This is just a fun game for friends! We're not affiliated with any music services. 
              It's a free project made for good times and great music.
            </p>
          </div>

          <div className="bg-[#0e1f2f]/60 backdrop-blur-3xl border border-[#107793]/30 p-8 rounded-3xl shadow-lg shadow-[#107793]/10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="relative mb-6">
                <div className="w-12 h-12 relative overflow-hidden mx-auto">
                  <img 
                    src="/Vinyl_rythm.png" 
                    alt="Rythmy Logo" 
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#4CC9F0] rounded-full flex items-center justify-center shadow-lg">
                  <Wifi className="h-3 w-3 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Join the fun</h1>
              <p className="text-[#d9e8dd] text-base leading-relaxed font-medium">
                Got a code from your friend? Let's get you in!
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              {/* Lobby Code Input */}
              <div>
                <label htmlFor="lobbyCode" className="block text-lg font-semibold text-white mb-3 tracking-tight">
                  Game Code
                </label>
                <Input
                  id="lobbyCode"
                  type="text"
                  placeholder="ABC123"
                  value={lobbyCode}
                  onChange={handleLobbyCodeChange}
                  className="bg-[#1A1A2E]/50 border border-[#4a4f5b]/30 text-white placeholder:text-[#d9e8dd]/40 h-16 text-xl text-center 
                           font-mono tracking-wider rounded-xl focus:bg-[#1A1A2E]/70 focus:ring-2 focus:ring-[#107793]/50 focus:border-[#107793]/50
                           backdrop-blur-xl shadow-inner transition-all duration-200"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="text"
                  autoFocus
                />
                <p className="text-[#d9e8dd]/60 text-sm mt-2 text-center font-medium">
                  Ask your friend for the 6-character code
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-[#F72585]/10 border border-[#F72585]/30 rounded-xl p-4 backdrop-blur-xl">
                  <p className="text-[#F72585] text-center font-medium">{error}</p>
                </div>
              )}

              {/* Continue Button */}
              <Button
                type="submit"
                disabled={!lobbyCode.trim() || isLoading}
                className="w-full bg-gradient-to-r from-[#107793] to-[#0e1f2f] text-white font-semibold h-16 text-lg 
                         rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 
                         hover:scale-[1.02] active:scale-[0.98] border-0 tracking-tight shadow-lg 
                         disabled:hover:scale-100 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#107793]/0 via-[#107793]/10 to-[#107793]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
                Continue
              </Button>
            </form>

            {/* Help text */}
            <div className="mt-8 pt-6 border-t border-[#4a4f5b]/30">
              <p className="text-[#d9e8dd]/60 text-sm text-center leading-relaxed">
                Make sure you're connected to the internet and have the right code from your host.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
