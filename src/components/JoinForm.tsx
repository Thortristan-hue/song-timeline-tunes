
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Users, Key } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { joinRoomSchema, playerNameSchema } from '@/schemas/validation';
import { ZodError } from 'zod';
import { suppressUnused } from '@/utils/suppressUnused';

type JoinFormVariant = 'mobile' | 'host';

interface JoinFormProps {
  variant: JoinFormVariant;
  onSubmit: (data: { lobbyCode?: string; playerName: string }) => Promise<boolean> | void;
  onBackToMenu?: () => void;
  isLoading?: boolean;
  autoJoinCode?: string;
  isDarkMode?: boolean;
}

export function JoinForm({ 
  variant, 
  onSubmit, 
  onBackToMenu, 
  isLoading, 
  autoJoinCode,
  isDarkMode = false 
}: JoinFormProps) {
  const [lobbyCode, setLobbyCode] = useState(autoJoinCode || '');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const soundEffects = useSoundEffects();

  // Suppress unused warning for development
  suppressUnused(isDarkMode);

  // Update lobbyCode when autoJoinCode changes
  useEffect(() => {
    if (autoJoinCode) {
      console.log('🔗 JoinForm: Setting auto-join code:', autoJoinCode);
      setLobbyCode(autoJoinCode);
    }
  }, [autoJoinCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validate player name in both variants
      playerNameSchema.parse(playerName.trim());

      if (variant === 'mobile') {
        // Validate full join room data for mobile variant
        const validatedData = joinRoomSchema.parse({
          lobbyCode: lobbyCode.trim().toUpperCase(),
          playerName: playerName.trim()
        });

        console.log('🎮 JoinForm (mobile): Attempting to join with code:', validatedData.lobbyCode);
        
        const success = await onSubmit({
          lobbyCode: validatedData.lobbyCode,
          playerName: validatedData.playerName
        });

        if (success) {
          soundEffects.playPlayerJoin();
        } else {
          setError('Failed to join room. Please check your lobby code.');
        }
      } else {
        // Host variant - just name
        const validatedName = playerNameSchema.parse(playerName.trim());
        onSubmit({ playerName: validatedName });
        setPlayerName('');
      }
    } catch (err) {
      if (err instanceof ZodError) {
        const errorMessage = err.issues.map(i => i.message).join(', ');
        setError(errorMessage);
      } else {
        console.error('❌ Join form error:', err);
        setError('Failed to join. Please try again.');
      }
    }
  };

  const handleLobbyCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // Only allow letters and numbers, max 6 characters
    const filtered = value.replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setLobbyCode(filtered);
  };

  if (variant === 'mobile') {
    // Mobile variant - full page join form
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
        {/* Enhanced Dark Background Effects */}
        <div className="absolute inset-0">
          {/* Main glow effects */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-[#4a4f5b]/8 rounded-full blur-2xl animate-pulse" />
          
          {/* Additional scattered glows */}
          <div className="absolute top-16 right-16 w-24 h-24 bg-[#107793]/5 rounded-full blur-xl" />
          <div className="absolute bottom-32 left-16 w-28 h-28 bg-[#a53b8b]/5 rounded-full blur-xl" />
          
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
                  <Key className="h-4 w-4 text-[#107793]" />
                ) : (
                  <Users className="h-3 w-3 text-[#a53b8b]" />
                )}
              </div>
            ))}
          </div>

          {/* Geometric shapes */}
          <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 1200 800" fill="none">
            {/* Music note shapes */}
            <circle cx="200" cy="200" r="4" fill="#107793" opacity="0.4" />
            <circle cx="1000" cy="300" r="6" fill="#a53b8b" opacity="0.4" />
            <circle cx="400" cy="600" r="3" fill="#4a4f5b" opacity="0.4" />
            
            {/* Connecting lines */}
            <path d="M200 200 L400 250 L600 230" stroke="#107793" strokeWidth="1" opacity="0.3" />
            <path d="M1000 300 L800 400 L700 380" stroke="#a53b8b" strokeWidth="1" opacity="0.3" />
            
            {/* Sound waves */}
            <path d="M300 400 Q350 380, 400 400 Q450 420, 500 400" stroke="#4a4f5b" strokeWidth="1" opacity="0.2" />
            <path d="M300 420 Q350 400, 400 420 Q450 440, 500 420" stroke="#4a4f5b" strokeWidth="1" opacity="0.2" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0e1f2f]/60 border-2 border-[#107793] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#107793]/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#107793]/10 to-transparent"></div>
                <Key className="h-8 w-8 text-[#107793] animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                Join the Party
              </h1>
              <p className="text-[#d9e8dd] font-medium">Enter the room code and your name to join</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="lobbyCode" className="text-[#d9e8dd] font-medium">
                  Room Code
                </Label>
                <Input
                  type="text"
                  id="lobbyCode"
                  placeholder="APPLE3"
                  value={lobbyCode}
                  onChange={handleLobbyCodeChange}
                  className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 text-white rounded-xl h-12 shadow-lg transition-all duration-300 hover:bg-[#1A1A2E]/90"
                />
              </div>

              <div>
                <Label htmlFor="playerName" className="text-[#d9e8dd] font-medium">
                  Your Name
                </Label>
                <Input
                  type="text"
                  id="playerName"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="bg-[#1A1A2E]/70 border border-[#4a4f5b]/30 text-white rounded-xl h-12 shadow-lg transition-all duration-300 hover:bg-[#1A1A2E]/90"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#a53b8b] to-[#4a4f5b] text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 border-0 tracking-tight relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#a53b8b]/0 via-[#a53b8b]/10 to-[#a53b8b]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-full group-hover:translate-x-0"></div>
                Join the Game
              </Button>
            </form>

            {onBackToMenu && (
              <Button
                variant="ghost"
                onClick={() => {
                  soundEffects.playButtonClick();
                  onBackToMenu();
                }}
                className="w-full text-white hover:bg-[#0e1f2f]/40 rounded-xl transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Host variant - simple name entry form
  return (
    <div className="space-y-8">
      {/* Disclaimer */}
      <div className="text-center space-y-2 mb-8">
        <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
          This is just a fun game for friends! We're not affiliated with any music streaming services or record labels. 
          It's a free project made for good times and good music.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="playerName" className="block text-lg font-medium text-white tracking-tight">
            What should we call you?
          </label>
          <Input
            id="playerName"
            type="text"
            placeholder="Your name here..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
            className="h-16 text-lg bg-gray-800 border-gray-600 rounded-2xl text-white placeholder:text-gray-500 
                     focus:bg-gray-700 focus:ring-2 focus:ring-gray-500 transition-all duration-300
                     shadow-lg hover:bg-gray-700 hover:scale-[1.02] focus:scale-[1.02]"
            maxLength={20}
          />
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </div>
        
        <Button 
          onClick={handleSubmit}
          className="w-full h-16 bg-white text-black hover:bg-gray-200 
                   font-semibold text-lg rounded-2xl transition-all duration-300 
                   shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                   border-0 tracking-tight"
          disabled={!playerName.trim()}
        >
          <Users className="mr-3 h-5 w-5" />
          Join the Game
        </Button>
      </div>
    </div>
  );
}
