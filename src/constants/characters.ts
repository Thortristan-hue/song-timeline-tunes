// Character constants for the game
import charDave from '@/assets/char_dave.png';
import charFiona from '@/assets/char_fiona.png';
import charJessica from '@/assets/char_jessica.png';
import charMaria from '@/assets/char_maria.png';
import charMike from '@/assets/char_mike.png';
import charPd from '@/assets/char_pd.png';
import charRebecca from '@/assets/char_rebecca.png';
import charRob from '@/assets/char_rob.png';
import charSteve from '@/assets/char_steve.png';
import charVanessa from '@/assets/char_vanessa.png';
import charVilludrillu from '@/assets/char_villudrillu.png';

export interface Character {
  id: string;
  name: string;
  image: string;
  color: string; // Associated timeline color for compatibility
}

export const GAME_CHARACTERS: Character[] = [
  { id: 'char_dave', name: 'Dave', image: charDave, color: '#007AFF' },
  { id: 'char_fiona', name: 'Fiona', image: charFiona, color: '#FF3B30' },
  { id: 'char_jessica', name: 'Jessica', image: charJessica, color: '#34C759' },
  { id: 'char_maria', name: 'Maria', image: charMaria, color: '#FF9500' },
  { id: 'char_mike', name: 'Mike', image: charMike, color: '#AF52DE' },
  { id: 'char_pd', name: 'PD', image: charPd, color: '#FF2D92' },
  { id: 'char_rebecca', name: 'Rebecca', image: charRebecca, color: '#00D4FF' },
  { id: 'char_rob', name: 'Rob', image: charRob, color: '#30D158' },
  { id: 'char_steve', name: 'Steve', image: charSteve, color: '#FFD60A' },
  { id: 'char_vanessa', name: 'Vanessa', image: charVanessa, color: '#BF5AF2' },
  { id: 'char_villudrillu', name: 'Villudrillu', image: charVilludrillu, color: '#FF6B35' }
];

export const getCharacterById = (id: string): Character | undefined => {
  return GAME_CHARACTERS.find(char => char.id === id);
};

export const getDefaultCharacter = (): Character => {
  return GAME_CHARACTERS[0];
};