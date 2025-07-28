import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useCharacterSelection, Character } from '@/lib/CharacterManager';
import { cn } from '@/lib/utils';

interface CharacterSelectionProps {
  onCharacterSelect?: (character: Character) => void;
  showLabel?: boolean;
  className?: string;
  compact?: boolean;
}

export function CharacterSelection({
  onCharacterSelect,
  showLabel = true,
  className = '',
  compact = false
}: CharacterSelectionProps) {
  const { selectedCharacter, selectCharacter, getAvailableCharacters } = useCharacterSelection();
  const [isAnimating, setIsAnimating] = useState<string | null>(null);

  const handleCharacterSelect = (characterId: string) => {
    const character = selectCharacter(characterId);
    if (character) {
      setIsAnimating(characterId);
      onCharacterSelect?.(character);
      
      // Reset animation after a delay
      setTimeout(() => {
        setIsAnimating(null);
      }, 300);
    }
  };

  const availableCharacters = getAvailableCharacters();

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <span className="text-white/80 text-sm font-medium">Character:</span>
        )}
        <div className="flex gap-2">
          {availableCharacters.map((character) => {
            const isSelected = selectedCharacter?.id === character.id;
            const animating = isAnimating === character.id;
            
            return (
              <button
                key={character.id}
                onClick={() => handleCharacterSelect(character.id)}
                className={cn(
                  "relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-110",
                  isSelected 
                    ? "border-green-400 shadow-lg shadow-green-400/50" 
                    : "border-white/30 hover:border-white/60",
                  animating && "animate-pulse scale-110"
                )}
              >
                <img 
                  src={character.imagePath}
                  alt={character.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/char_mike.png';
                  }}
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showLabel && (
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">Choose Your Character</h3>
          <p className="text-white/70 text-sm">
            Select a character to represent you in the game
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        {availableCharacters.map((character) => {
          const isSelected = selectedCharacter?.id === character.id;
          const animating = isAnimating === character.id;
          
          return (
            <div
              key={character.id}
              className={cn(
                "relative bg-white/10 backdrop-blur-xl rounded-2xl p-4 border transition-all duration-300 cursor-pointer hover:scale-105",
                isSelected 
                  ? "border-green-400 shadow-lg shadow-green-400/20 bg-green-400/10" 
                  : "border-white/20 hover:border-white/40 hover:bg-white/15",
                animating && "animate-pulse scale-105"
              )}
              onClick={() => handleCharacterSelect(character.id)}
            >
              {/* Character Image */}
              <div className="relative w-20 h-20 mx-auto mb-3">
                <div className={cn(
                  "w-full h-full rounded-full overflow-hidden border-2 transition-all duration-200",
                  isSelected ? "border-green-400" : "border-white/30"
                )}>
                  <img 
                    src={character.imagePath}
                    alt={character.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/char_mike.png';
                    }}
                  />
                </div>
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              {/* Character Info */}
              <div className="text-center">
                <div className="text-white font-semibold text-sm mb-1">
                  {character.displayName}
                </div>
                <div className="text-white/60 text-xs">
                  {character.description}
                </div>
              </div>
              
              {/* Hover glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-2xl transition-opacity duration-200 pointer-events-none",
                isSelected 
                  ? "bg-green-400/5 opacity-100" 
                  : "bg-white/5 opacity-0 group-hover:opacity-100"
              )} />
            </div>
          );
        })}
      </div>
      
      {selectedCharacter && (
        <div className="text-center mt-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20 inline-block">
            <span className="text-white/80 text-sm">
              Selected: <span className="font-semibold text-white">{selectedCharacter.displayName}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterSelection;