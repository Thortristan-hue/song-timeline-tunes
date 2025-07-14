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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-6 flex flex-col relative overflow-hidden">
      {/* Urban background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-32 left-8 w-64 h-64 bg-[#00d4ff]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-8 w-48 h-48 bg-[#ff0080]/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#39ff14]/8 rounded-full blur-3xl" />
        
        {/* City lights pattern */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="absolute animate-float opacity-15"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${12 + Math.random() * 8}s linear infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              <div className="w-1 h-1 bg-[#00d4ff] rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-40 right-8 w-48 h-48 bg-[#ff0080]/8 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="mb-8 relative z-10">
        <Button
          onClick={onBackToMenu}
          className="bg-[#1a1a1a]/80 hover:bg-[#2a2a2a]/80 border border-[#00d4ff]/40 text-white h-12 px-6 text-base font-medium 
                   rounded-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-[#00d4ff]/20"
        >
          <ArrowLeft className="h-4 w-4 mr-3" />
          Back to Streets
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
        {/* Disclaimer */}
        <div className="text-center mb-8">
          <p className="text-sm text-[#d1d5db]/70 leading-relaxed">
            This is just a fun game for the crew! We're not affiliated with any music services. 
            It's a free project made for good vibes and great beats.
          </p>
        </div>

        <div className="bg-[#1a1a1a]/80 backdrop-blur-3xl border border-[#00d4ff]/30 p-8 rounded-3xl shadow-xl shadow-[#00d4ff]/10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-[#1a1a1a]/80 border-2 border-[#ff0080]/60 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-xl shadow-lg shadow-[#ff0080]/20">
                <Smartphone className="h-8 w-8 text-[#ff0080]" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#39ff14] rounded-full flex items-center justify-center shadow-lg">
                <Wifi className="h-3 w-3 text-black" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Join the Crew</h1>
            <p className="text-[#d1d5db] text-base leading-relaxed font-medium">
              Got the street code? Time to show your urban music knowledge!
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Lobby Code Input */}
            <div>
              <label htmlFor="lobbyCode" className="block text-lg font-bold text-white mb-3 tracking-tight">
                Street Code
              </label>
              <Input
                id="lobbyCode"
                type="text"
                placeholder="ABC123"
                value={lobbyCode}
                onChange={handleLobbyCodeChange}
                className="bg-[#2a2a2a]/60 border border-[#00d4ff]/40 text-white placeholder:text-[#d1d5db]/40 h-16 text-xl text-center 
                         font-mono tracking-wider rounded-2xl focus:bg-[#2a2a2a]/80 focus:ring-2 focus:ring-[#00d4ff]/60 focus:border-[#00d4ff] 
                         backdrop-blur-xl shadow-inner transition-all duration-200"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
                inputMode="text"
              />
              <p className="text-[#d1d5db]/60 text-sm mt-2 text-center font-medium">
                Get the 6-character code from your host
              </p>
            </div>

            {/* Player Name Input */}
            <div>
              <label htmlFor="playerName" className="block text-lg font-bold text-white mb-3 tracking-tight">
                Your Street Name
              </label>
              <Input
                id="playerName"
                type="text"
                placeholder="Your urban alias..."
                value={playerName}
                onChange={handleNameChange}
                className="bg-[#2a2a2a]/60 border border-[#ff0080]/40 text-white placeholder:text-[#d1d5db]/40 h-16 text-lg 
                         rounded-2xl focus:bg-[#2a2a2a]/80 focus:ring-2 focus:ring-[#ff0080]/60 focus:border-[#ff0080] 
                         backdrop-blur-xl shadow-inner transition-all duration-200"
                maxLength={20}
                autoCapitalize="words"
                autoCorrect="off"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-2xl p-4 backdrop-blur-xl">
                <p className="text-red-300 text-center font-medium">{error}</p>
              </div>
            )}

            {/* Join Button */}
            <Button
              onClick={handleSubmit}
              disabled={!lobbyCode.trim() || !playerName.trim() || isLoading}
              className="w-full bg-gradient-to-r from-[#00d4ff] to-[#ff0080] text-white hover:from-[#00d4ff]/90 hover:to-[#ff0080]/90 font-bold h-16 text-lg 
                       rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 
                       hover:scale-[1.02] active:scale-[0.98] border-0 tracking-tight shadow-lg shadow-[#00d4ff]/20"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entering the Scene...
                </div>
              ) : (
                <>
                  <Smartphone className="h-5 w-5 mr-3" />
                  Enter the Battle
                </>
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
