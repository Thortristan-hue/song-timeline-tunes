
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface CharacterSelectProps {
  onSelect: (character: string) => void;
}

const characters = [
  { id: 'char_dave', name: 'Dave' },
  { id: 'char_fiona', name: 'Fiona' },
  { id: 'char_jessica', name: 'Jessica' },
  { id: 'char_maria', name: 'Maria' },
  { id: 'char_mike', name: 'Mike' },
  { id: 'char_pd', name: 'PD' },
  { id: 'char_rebecca', name: 'Rebecca' },
  { id: 'char_rob', name: 'Rob' },
  { id: 'char_steve', name: 'Steve' },
  { id: 'char_vanessa', name: 'Vanessa' },
  { id: 'char_villudrillu', name: 'Villudrillu' }
];

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelect }) => {
  const [selectedCharacter, setSelectedCharacter] = React.useState('char_dave');

  const handleSelect = (characterId: string) => {
    setSelectedCharacter(characterId);
    onSelect(characterId);
  };

  return (
    <div className="grid gap-2">
      <Label>Choose Your Character</Label>
      <div className="grid grid-cols-3 gap-2">
        {characters.map((character) => (
          <Button
            key={character.id}
            variant={selectedCharacter === character.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelect(character.id)}
          >
            {character.name}
          </Button>
        ))}
      </div>
    </div>
  );
};
