
import React, { useState, useEffect } from 'react';
import { MobileCodeEntry } from './MobileCodeEntry';
import { MobilePlayerSetup } from './MobilePlayerSetup';

interface MobileJoinFlowProps {
  onJoinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  onBackToMenu: () => void;
  isLoading?: boolean;
  autoJoinCode?: string;
}

export function MobileJoinFlow({ 
  onJoinRoom, 
  onBackToMenu, 
  isLoading = false, 
  autoJoinCode = '' 
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

  if (currentStep === 'setup') {
    return (
      <MobilePlayerSetup
        lobbyCode={verifiedCode}
        onPlayerSetup={handlePlayerSetup}
        onBackToCodeEntry={handleBackToCodeEntry}
        isLoading={isLoading}
      />
    );
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
