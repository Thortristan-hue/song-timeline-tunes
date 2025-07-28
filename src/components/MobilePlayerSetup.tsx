import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { CharacterSelection } from '@/components/CharacterSelection';
import { useCharacterSelection, Character } from '@/lib/CharacterManager';

interface MobilePlayerSetupProps {
  lobbyCode: string;
  onPlayerSetup: (name: string, character: Character) => Promise<boolean>;
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
  const [error, setError] = useState('');
  const soundEffects = useSoundEffects();
  const { toast } = useToast();
  const { selectedCharacter, selectCharacter } = useCharacterSelection();

  const handleCharacterSelect = (character: Character) => {
    selectCharacter(character.id);
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

    if (!selectedCharacter) {
      setError('Please select a character');
      return;
    }

    console.log('🎮 Player setup: Joining with name:', playerName.trim(), 'character:', selectedCharacter.displayName);
    
    try {
      const success = await onPlayerSetup(playerName.trim(), selectedCharacter);
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

          {/* Character Selection */}
          <div className="space-y-2">
            <Label className="text-white font-medium">
              Choose Your Character
            </Label>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <CharacterSelection
                onCharacterSelect={handleCharacterSelect}
                showLabel={false}
                compact={true}
                className="justify-center"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-[#107793] to-[#a53b8b] hover:from-[#a53b8b] hover:to-[#107793] text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            disabled={isLoading || !playerName.trim() || !selectedCharacter}
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