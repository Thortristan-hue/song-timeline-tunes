
import React, { useState, useEffect } from 'react';
import { MobileCodeEntry } from './MobileCodeEntry';
import { MobilePlayerSetup } from './MobilePlayerSetup';
import { Player } from '@/types/game';

interface MobileJoinFlowProps {
  onJoinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  onBackToMenu: () => void;
  isLoading?: boolean;
  autoJoinCode?: string;
  currentPlayer?: Player;
  onUpdatePlayer?: (updates: Partial<Player>) => Promise<boolean>;
}

export function MobileJoinFlow({ 
  onJoinRoom, 
  onBackToMenu, 
  isLoading = false, 
  autoJoinCode = '',
  currentPlayer,
  onUpdatePlayer
}: MobileJoinFlowProps) {
  const [currentStep, setCurrentStep] = useState<'code' | 'setup'>('code');
  const [verifiedCode, setVerifiedCode] = useState<string>('');
  
  console.log('🔗 MobileJoinFlow rendered with autoJoinCode:', autoJoinCode);

  const handleCodeSubmit = (code: string) => {
    console.log('🔗 Code submitted:', code);
    setVerifiedCode(code);
    setCurrentStep('setup');
  };

  const handlePlayerSetup = async (name: string, character: string) => {
    console.log('🔗 Player setup:', { name, character, code: verifiedCode });
    return await onJoinRoom(verifiedCode, name);
  };

  const handleBackToCodeEntry = () => {
    setCurrentStep('code');
    setVerifiedCode('');
  };

  // If we have a current player and onUpdatePlayer function, show setup screen
  if (currentStep === 'setup' && currentPlayer && onUpdatePlayer) {
    return (
      <MobilePlayerSetup
        currentPlayer={currentPlayer}
        onUpdatePlayer={onUpdatePlayer}
      />
    );
  }

  // If we're on setup step but don't have the required props, fall back to code entry
  if (currentStep === 'setup') {
    // This is a fallback for the old flow - you may want to handle this differently
    setCurrentStep('code');
  }

  return (
    <MobileCodeEntry
      onCodeSubmit={handleCodeSubmit}
      onBackToMenu={onBackToMenu}
      isLoading={isLoading}
      autoJoinCode={autoJoinCode}
    />
  );
}
