
import React from 'react';
import { Player } from '@/types/game';
import { getCharacterById, getDefaultCharacter } from '@/constants/characters';

interface PlayerCharacterDisplayProps {
  player: Player;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}

export function PlayerCharacterDisplay({ player, size = 'medium', showName = true }: PlayerCharacterDisplayProps) {
  const character = getCharacterById(player.character) || getDefaultCharacter();
  
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };
  
  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <img
          src={character.image}
          alt={character.name}
          className={`${sizeClasses[size]} rounded-full border-2 object-cover`}
          style={{ borderColor: player.color }}
        />
      </div>
      {showName && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-medium text-white`}>
            {player.name}
          </span>
          <span className={`${textSizeClasses[size]} text-white/60`}>
            {character.name}
          </span>
        </div>
      )}
    </div>
  );
}
