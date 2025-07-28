/**
 * Character Selection System
 * Manages player character selection and persistence
 */

export interface Character {
  id: string;
  name: string;
  displayName: string;
  imagePath: string;
  description: string;
}

export const AVAILABLE_CHARACTERS: Character[] = [
  {
    id: 'mike',
    name: 'mike',
    displayName: 'Mike',
    imagePath: '/char_mike.png',
    description: 'The music maestro'
  },
  {
    id: 'steve',
    name: 'steve', 
    displayName: 'Steve',
    imagePath: '/char_steve.png',
    description: 'The rhythm rebel'
  },
  {
    id: 'villudrillu',
    name: 'villudrillu',
    displayName: 'Villudrillu', 
    imagePath: '/char_villudrillu.png',
    description: 'The beat boss'
  }
];

export class CharacterManager {
  private static instance: CharacterManager;
  private selectedCharacter: Character | null = null;
  private sessionCharacters: Map<string, Character> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): CharacterManager {
    if (!CharacterManager.instance) {
      CharacterManager.instance = new CharacterManager();
    }
    return CharacterManager.instance;
  }

  /**
   * Get all available characters
   */
  getAvailableCharacters(): Character[] {
    return AVAILABLE_CHARACTERS;
  }

  /**
   * Get currently selected character
   */
  getSelectedCharacter(): Character | null {
    return this.selectedCharacter;
  }

  /**
   * Select a character for the current player
   */
  selectCharacter(characterId: string): Character | null {
    const character = AVAILABLE_CHARACTERS.find(c => c.id === characterId);
    if (character) {
      this.selectedCharacter = character;
      this.saveToStorage();
      return character;
    }
    return null;
  }

  /**
   * Get character by ID
   */
  getCharacterById(characterId: string): Character | null {
    return AVAILABLE_CHARACTERS.find(c => c.id === characterId) || null;
  }

  /**
   * Set character for a specific session/room
   */
  setSessionCharacter(playerId: string, character: Character): void {
    this.sessionCharacters.set(playerId, character);
  }

  /**
   * Get character for a specific session/room
   */
  getSessionCharacter(playerId: string): Character | null {
    return this.sessionCharacters.get(playerId) || null;
  }

  /**
   * Get a random character (fallback)
   */
  getRandomCharacter(): Character {
    const randomIndex = Math.floor(Math.random() * AVAILABLE_CHARACTERS.length);
    return AVAILABLE_CHARACTERS[randomIndex];
  }

  /**
   * Get character image path
   */
  getCharacterImagePath(characterId: string): string {
    const character = this.getCharacterById(characterId);
    return character?.imagePath || '/char_mike.png'; // Default fallback
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    this.sessionCharacters.clear();
  }

  /**
   * Save to local storage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined' && this.selectedCharacter) {
      localStorage.setItem('rythmy-selected-character', JSON.stringify(this.selectedCharacter));
    }
  }

  /**
   * Load from local storage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rythmy-selected-character');
      if (stored) {
        try {
          const character = JSON.parse(stored);
          // Validate the character still exists
          if (AVAILABLE_CHARACTERS.find(c => c.id === character.id)) {
            this.selectedCharacter = character;
          }
        } catch (error) {
          console.warn('Failed to load character from storage:', error);
        }
      }
    }
  }
}

// Singleton instance
export const characterManager = CharacterManager.getInstance();

// Character selection hook for React components
export const useCharacterSelection = () => {
  const [selectedCharacter, setSelectedCharacter] = React.useState<Character | null>(
    characterManager.getSelectedCharacter()
  );

  const selectCharacter = (characterId: string) => {
    const character = characterManager.selectCharacter(characterId);
    setSelectedCharacter(character);
    return character;
  };

  const getAvailableCharacters = () => characterManager.getAvailableCharacters();

  return {
    selectedCharacter,
    selectCharacter,
    getAvailableCharacters,
    getCharacterById: characterManager.getCharacterById.bind(characterManager),
    getCharacterImagePath: characterManager.getCharacterImagePath.bind(characterManager),
  };
};

// Import React for the hook
import React from 'react';