
import { useState } from 'react';
import { MobileCodeEntry } from './MobileCodeEntry';
import { MobilePlayerSetup } from './MobilePlayerSetup';
import { GameRoom, Player } from '@/types/game';

interface MobileJoinFlowProps {
  onJoinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  room: GameRoom | null;
  currentPlayer: Player | null;
  players: Player[];
  onUpdatePlayer: (updates: { name?: string; character?: string }) => Promise<boolean>;
}

export function MobileJoinFlow({ 
  onJoinRoom, 
  room,
  currentPlayer,
  players,
  onUpdatePlayer
}: MobileJoinFlowProps) {
  const [currentStep, setCurrentStep] = useState<'code' | 'setup'>('code');
  const [verifiedCode, setVerifiedCode] = useState<string>('');
  
  console.log('🔗 MobileJoinFlow rendered');

  const handleCodeSubmit = (code: string) => {
    console.log('🔗 Code submitted:', code);
    setVerifiedCode(code);
    setCurrentStep('setup');
  };

  const handlePlayerSetup = async (name: string, character: string) => {
    console.log('🔗 Player setup:', { name, character, code: verifiedCode });
    // First join the room with the player name
    const joinSuccess = await onJoinRoom(verifiedCode, name);
    if (joinSuccess) {
      // Store character selection for later update
      localStorage.setItem('pendingCharacter', character);
    }
    return joinSuccess;
  };

  const handleBackToCodeEntry = () => {
    setCurrentStep('code');
    setVerifiedCode('');
  };

  const handleBackToMenu = () => {
    // This would be handled by parent component
    console.log('Back to menu');
  };

  if (currentStep === 'setup') {
    return (
      <MobilePlayerSetup
        lobbyCode={verifiedCode}
        onPlayerSetup={handlePlayerSetup}
        onBackToCodeEntry={handleBackToCodeEntry}
        isLoading={false}
      />
    );
  }

  return (
    <MobileCodeEntry
      onCodeSubmit={handleCodeSubmit}
      onBackToMenu={handleBackToMenu}
      isLoading={false}
      autoJoinCode=""
    />
  );
}
