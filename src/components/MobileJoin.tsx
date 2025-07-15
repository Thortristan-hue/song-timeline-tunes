import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Smartphone, Wifi } from 'lucide-react';

interface MobileJoinProps {
  onJoinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  onBackToMenu: () => void;
  isLoading?: boolean;
}

export function MobileJoin({ onJoinRoom, onBackToMenu, isLoading = false }: MobileJoinProps) {
  const [lobbyCode, setLobbyCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lobbyCode.trim() || !playerName.trim()) return;
    
    setError('');
    
    try {
      const success = await onJoinRoom(lobbyCode.trim().toUpperCase(), playerName.trim());
      if (!success) {
        setError('Hmm, that didn\'t work. Double-check the code?');
      }
    } catch (err) {
      setError('Something went wrong. Give it another try!');
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

  return (
    <div className="mobile-container bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 flex flex-col"
         style={{ 
           minHeight: 'var(--mobile-safe-height)'
         }}>
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
          <div className="space-y-6">
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
              />
              <p className="text-white/40 text-sm mt-2 text-center font-medium">
                Ask your friend for the 6-character code
              </p>
            </div>

            {/* Player Name Input */}
            <div>
              <label htmlFor="playerName" className="block text-lg font-semibold text-white mb-3 tracking-tight">
                What should we call you?
              </label>
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
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-400/20 rounded-2xl p-4 backdrop-blur-xl">
                <p className="text-red-300 text-center font-medium">{error}</p>
              </div>
            )}

            {/* Join Button */}
            <Button
              onClick={handleSubmit}
              disabled={!lobbyCode.trim() || !playerName.trim() || isLoading}
              className="w-full bg-white text-black hover:bg-white/90 font-semibold h-16 text-lg 
                       rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 
                       hover:scale-[1.02] active:scale-[0.98] border-0 tracking-tight"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Connecting...
                </div>
              ) : (
                'Join Game'
              )}
            </Button>
          </div>

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
