
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Users, TestTube } from 'lucide-react';

interface TestingUtilsProps {
  onCreateTestRoom: () => Promise<string | null>;
}

export function TestingUtils({ onCreateTestRoom }: TestingUtilsProps) {
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [testRoomCode, setTestRoomCode] = useState<string | null>(null);

  const createTestGame = async () => {
    setIsCreatingTest(true);
    
    try {
      // Create a new room for testing
      const roomCode = await onCreateTestRoom();
      if (!roomCode) {
        throw new Error('Failed to create test room');
      }
      
      setTestRoomCode(roomCode);
      
      // Open two new windows with different player names
      const baseUrl = window.location.origin;
      
      // Window 1 - Player 1
      const player1Window = window.open(
        `${baseUrl}?testMode=true&roomCode=${roomCode}&playerName=TestPlayer1`,
        'TestPlayer1',
        'width=800,height=600,left=100,top=100'
      );
      
      // Window 2 - Player 2  
      setTimeout(() => {
        const player2Window = window.open(
          `${baseUrl}?testMode=true&roomCode=${roomCode}&playerName=TestPlayer2`,
          'TestPlayer2',
          'width=800,height=600,left=950,top=100'
        );
      }, 1000);
      
      // Auto-start game after a delay
      setTimeout(() => {
        console.log('Test game should auto-start now');
      }, 3000);
      
    } catch (error) {
      console.error('Failed to create test game:', error);
    } finally {
      setIsCreatingTest(false);
    }
  };

  return (
    <Card className="p-6 bg-orange-500/10 border-orange-400/30 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <TestTube className="h-6 w-6 text-orange-400" />
          <h3 className="text-xl font-bold text-white">Testing Mode</h3>
          <Badge variant="outline" className="bg-orange-500/20 text-orange-300 border-orange-400">
            Development Only
          </Badge>
        </div>
        
        <p className="text-orange-200/80 text-sm">
          Launch a test game with two players in separate windows for quick testing.
        </p>
        
        <div className="flex gap-3">
          <Button
            onClick={createTestGame}
            disabled={isCreatingTest}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            {isCreatingTest ? 'Creating Test Game...' : 'Launch Test Game'}
          </Button>
          
          {testRoomCode && (
            <div className="flex items-center gap-2 text-sm text-orange-200">
              <Users className="h-4 w-4" />
              Test Room: {testRoomCode}
            </div>
          )}
        </div>
        
        <div className="text-xs text-orange-300/70">
          This will open two browser windows with test players that automatically join the room.
        </div>
      </div>
    </Card>
  );
}
