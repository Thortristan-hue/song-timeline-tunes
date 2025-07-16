
import React, { useState, useEffect } from 'react';
import { MobileJoin } from './MobileJoin';

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
  console.log('🔗 MobileJoinFlow rendered with autoJoinCode:', autoJoinCode);
  
  return (
    <MobileJoin
      onJoinRoom={onJoinRoom}
      onBackToMenu={onBackToMenu}
      isLoading={isLoading}
      autoJoinCode={autoJoinCode}
    />
  );
}
