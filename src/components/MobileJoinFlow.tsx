
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Smartphone, Wifi, Palette, Users, Clock } from 'lucide-react';

interface MobileJoinFlowProps {
  onJoinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  onBackToMenu: () => void;
  isLoading?: boolean;
  autoJoinCode?: string;
}

const PLAYER_COLORS = [
  '#007AFF', // iOS blue
  '#FF3B30', // iOS red
  '#34C759', // iOS green
  '#FF9500', // iOS orange
  '#AF52DE', // iOS purple
  '#FF2D92', // iOS pink
  '#5AC8FA', // iOS light blue
  '#FFCC00', // iOS yellow
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 flex flex-col items-center justify-center">
        <div className="bg-black/20 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl">
            <Users className="h-8 w-8 text-white/80 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Joining game...</h1>
          <p className="text-white/60 mb-6">Setting up your player profile</p>
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
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
    );
  }

  if (joinState === 'enterDetails') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 flex flex-col">
        {/* Header */}
        <div className="mb-8 relative z-10">
          <Button
            onClick={handleBackFromDetails}
            className="bg-white/10 hover:bg-white/20 border-0 text-white h-12 px-6 text-base font-medium 
                     rounded-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-3" />
            Back
          </Button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
          <div className="bg-black/20 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl">
                <Palette className="h-8 w-8 text-white/80" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Set up your player</h1>
              <p className="text-white/60 text-base leading-relaxed font-medium">
                Joining room: <span className="font-mono text-blue-300">{lobbyCode}</span>
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
                  className="bg-white/5 border-0 text-white placeholder:text-white/40 h-16 text-lg 
                           rounded-2xl focus:bg-white/10 focus:ring-2 focus:ring-white/20 
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
                      className={`w-full aspect-square rounded-2xl transition-all duration-200 ${
                        selectedColor === color 
                          ? 'ring-4 ring-white/50 scale-95 shadow-lg' 
                          : 'hover:scale-105 active:scale-95'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && (
                        <div className="w-full h-full rounded-2xl flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-white/60 text-sm mb-3">Preview</p>
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
                      <p className="text-sm text-white/60">
                        Ready to play
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-400/20 rounded-2xl p-4 backdrop-blur-xl">
                  <p className="text-red-300 text-center font-medium">{error}</p>
                </div>
              )}

              {/* Join Button */}
              <Button
                type="submit"
                disabled={!playerName.trim() || !selectedColor || isLoading}
                className="w-full bg-white text-black hover:bg-white/90 font-semibold h-16 text-lg 
                         rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 
                         hover:scale-[1.02] active:scale-[0.98] border-0 tracking-tight"
              >
                Join Game
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Default state: enterCode
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 flex flex-col">
      {/* Subtle background elements */}
      <div className="absolute top-32 left-8 w-64 h-64 bg-blue-500/3 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-8 w-48 h-48 bg-purple-500/2 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="mb-8 relative z-10">
        <Button
          onClick={onBackToMenu}
          className="bg-white/10 hover:bg-white/20 border-0 text-white h-12 px-6 text-base font-medium 
                   rounded-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-3" />
          Back
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
        {/* Disclaimer */}
        <div className="text-center mb-8">
          <p className="text-sm text-white/50 leading-relaxed">
            This is just a fun game for friends! We're not affiliated with any music services. 
            It's a free project made for good times and great music.
          </p>
        </div>

        <div className="bg-black/20 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-xl">
                <Smartphone className="h-8 w-8 text-white/80" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Wifi className="h-3 w-3 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Join the fun</h1>
            <p className="text-white/60 text-base leading-relaxed font-medium">
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
                className="bg-white/5 border-0 text-white placeholder:text-white/40 h-16 text-xl text-center 
                         font-mono tracking-wider rounded-2xl focus:bg-white/10 focus:ring-2 focus:ring-white/20 
                         backdrop-blur-xl shadow-inner transition-all duration-200"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
                inputMode="text"
                autoFocus
              />
              <p className="text-white/40 text-sm mt-2 text-center font-medium">
                Ask your friend for the 6-character code
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-400/20 rounded-2xl p-4 backdrop-blur-xl">
                <p className="text-red-300 text-center font-medium">{error}</p>
              </div>
            )}

            {/* Continue Button */}
            <Button
              type="submit"
              disabled={!lobbyCode.trim() || isLoading}
              className="w-full bg-white text-black hover:bg-white/90 font-semibold h-16 text-lg 
                       rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 
                       hover:scale-[1.02] active:scale-[0.98] border-0 tracking-tight"
            >
              Continue
            </Button>
          </form>

          {/* Help text */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/50 text-sm text-center leading-relaxed">
              Make sure you're connected to the internet and have the right code from your host.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
