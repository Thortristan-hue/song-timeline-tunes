import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { GAME_CHARACTERS, getDefaultCharacter } from '@/constants/characters';

interface MobilePlayerSetupProps {
  lobbyCode: string;
  onPlayerSetup: (name: string, character: string) => Promise<boolean>;
  onBackToCodeEntry: () => void;
  isLoading?: boolean;
}

export function MobilePlayerSetup({ 
  lobbyCode, 
  onPlayerSetup, 
  onBackToCodeEntry, 
  isLoading = false 
}: MobilePlayerSetupProps) {
  const [playerName, setPlayerName] = useState('');
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0);
  const [error, setError] = useState('');
  const soundEffects = useSoundEffects();
  const { toast } = useToast();

  const selectedCharacter = GAME_CHARACTERS[selectedCharacterIndex];

  const handlePreviousCharacter = () => {
    setSelectedCharacterIndex(prev => 
      prev === 0 ? GAME_CHARACTERS.length - 1 : prev - 1
    );
    soundEffects.playButtonClick();
  };

  const handleNextCharacter = () => {
    setSelectedCharacterIndex(prev => 
      prev === GAME_CHARACTERS.length - 1 ? 0 : prev + 1
    );
    soundEffects.playButtonClick();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (playerName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (playerName.trim().length > 20) {
      setError('Name must be less than 20 characters');
      return;
    }

    console.log('🎮 Player setup: Joining with name:', playerName.trim(), 'character:', selectedCharacter.id);
    
    try {
      const success = await onPlayerSetup(playerName.trim(), selectedCharacter.id);
      if (success) {
        soundEffects.playPlayerJoin();
      } else {
        setError('Failed to join room. Please try again.');
      }
    } catch (err) {
      console.error('❌ Join room error:', err);
      setError('Failed to join room. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0e0e0e] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#107793]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-[#a53b8b]/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 w-36 h-36 bg-[#4a4f5b]/8 rounded-full blur-2xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#107793] to-[#a53b8b] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Set Up Your Profile
          </h1>
          <p className="text-[#d9e8dd] text-lg mb-2">
            Choose your name and character
          </p>
          <div className="inline-flex items-center px-3 py-1 bg-white/10 rounded-full">
            <span className="text-[#4CC9F0] font-mono font-bold text-sm">Room: {lobbyCode}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="player-name" className="text-white font-medium">
              Your Name
            </Label>
            <Input
              id="player-name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full h-12 px-4 bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-[#107793] focus:border-transparent"
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          {/* Character Selection Carousel */}
          <div className="space-y-4">
            <Label className="text-white font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Choose Your Character
            </Label>
            
            <div className="flex items-center justify-center gap-4">
              {/* Previous Button */}
              <button
                type="button"
                onClick={handlePreviousCharacter}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 disabled:opacity-50"
                disabled={isLoading}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Character Display */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl border-2 border-white shadow-lg overflow-hidden bg-white/5 backdrop-blur-sm">
                  <img 
                    src={selectedCharacter.image} 
                    alt={selectedCharacter.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-white text-sm font-medium mt-2">
                  {selectedCharacter.name}
                </p>
                <p className="text-white/60 text-xs">
                  {selectedCharacterIndex + 1} / {GAME_CHARACTERS.length}
                </p>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNextCharacter}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 disabled:opacity-50"
                disabled={isLoading}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-[#107793] to-[#a53b8b] hover:from-[#a53b8b] hover:to-[#107793] text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            disabled={isLoading || !playerName.trim()}
          >
            {isLoading ? 'Joining...' : 'Join Game'}
          </Button>
        </form>

        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBackToCodeEntry}
          className="mt-8 text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300"
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Change Code
        </Button>
      </div>
    </div>
  );
}