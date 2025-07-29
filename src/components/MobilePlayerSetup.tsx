
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GAME_CHARACTERS, Character } from '@/constants/characters';
import { Player } from '@/types/game';

interface MobilePlayerSetupProps {
  onUpdatePlayer: (updates: Partial<Player>) => Promise<boolean>;
  currentPlayer: Player;
}

export function MobilePlayerSetup({ onUpdatePlayer, currentPlayer }: MobilePlayerSetupProps) {
  const [name, setName] = useState(currentPlayer.name);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(
    GAME_CHARACTERS.find(char => char.id === currentPlayer.character) || GAME_CHARACTERS[0]
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsUpdating(true);
    try {
      const success = await onUpdatePlayer({
        name: name.trim(),
        character: selectedCharacter.id
      });
      
      if (success) {
        console.log('✅ Player setup saved successfully');
      } else {
        console.error('❌ Failed to save player setup');
      }
    } catch (error) {
      console.error('Error saving player setup:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Setup Your Profile</h2>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="player-name" className="text-white mb-2 block">Your Name</Label>
            <Input
              id="player-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
              maxLength={20}
            />
          </div>

          <div>
            <Label className="text-white mb-4 block">Choose Your Character</Label>
            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {GAME_CHARACTERS.map((character) => (
                <button
                  key={character.id}
                  onClick={() => setSelectedCharacter(character)}
                  className={`
                    relative p-2 rounded-xl transition-all duration-200 
                    ${selectedCharacter.id === character.id
                      ? 'ring-2 ring-yellow-400 bg-white/20'
                      : 'bg-white/10 hover:bg-white/15'
                    }
                  `}
                >
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-full h-16 object-contain"
                  />
                  <p className="text-white text-xs mt-1 font-medium">{character.name}</p>
                  {selectedCharacter.id === character.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-black text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!name.trim() || isUpdating}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isUpdating ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
