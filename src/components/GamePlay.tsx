
import React, { useState, useEffect, useCallback } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { useGameRoom } from '@/hooks/useGameRoom';
import { Timeline } from '@/components/Timeline';
import { CardGrid } from '@/components/CardGrid';
import { GameService } from '@/services/gameService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Shuffle, CheckCircle, XCircle } from 'lucide-react';
import { GameLogic } from '@/services/gameLogic';
import { Feedback } from '@/components/Feedback';
import { VictoryScreen } from '@/components/VictoryScreen';
import { useConfettiStore } from '@/stores/useConfettiStore';
import { SongCard } from './SongCard';

export function GamePlay() {
  const { toast } = useToast();
  const { room, players, currentPlayer, isHost, placeCard, setCurrentSong } = useGameRoom();
  const [gameLogic, setGameLogic] = useState<GameLogic | null>(null);
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean; song: Song | null }>({ show: false, correct: false, song: null });
  const [winner, setWinner] = useState<Player | null>(null);
  const [showVictoryScreen, setShowVictoryScreen] = useState(false);
  const { fire } = useConfettiStore();

  useEffect(() => {
    if (room && currentPlayer && players) {
      const newGameLogic = new GameLogic(room, players, currentPlayer);
      setGameLogic(newGameLogic);
    }
  }, [room, players, currentPlayer]);

  useEffect(() => {
    if (winner) {
      fire();
    }
  }, [winner, fire]);

  const handleCardPlacement = async (song: Song, position: number) => {
    if (!currentPlayer || !room || gameLogic?.isGameOver) return;

    setIsProcessingMove(true);
    
    try {
      console.log('🃏 Card placement attempted:', { song: song.deezer_title, position });
      
      const result = await placeCard(song, position, gameLogic.availableSongs);
      
      if (result.success) {
        console.log('✅ Card placed successfully');
        
        if (result.correct !== undefined) {
          setFeedback({
            show: true,
            correct: result.correct,
            song: song
          });
          
          // Auto-hide feedback after delay
          setTimeout(() => {
            setFeedback({ show: false, correct: false, song: null });
          }, 2000);
        }
        
        // Check for game end - the result should now include these properties
        if (result.gameEnded && result.winner) {
          console.log('🎉 Game ended with winner:', result.winner.name);
          setWinner(result.winner);
          setShowVictoryScreen(true);
        }
      }
    } catch (error) {
      console.error('❌ Card placement failed:', error);
      toast({
        title: "Card placement failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessingMove(false);
    }
  };

  const handleSetMysteryCard = async () => {
    if (!isHost || !gameLogic) return;

    setIsProcessingMove(true);
    try {
      const song = gameLogic.getRandomAvailableSong();
      if (song) {
        console.log('🎵 Setting mystery card:', song.deezer_title);
        await setCurrentSong(song);
      } else {
        console.warn('No available songs to set as mystery card');
        toast({
          title: "No songs available",
          description: "Please add more songs to the playlist",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Failed to set mystery card:', error);
      toast({
        title: "Failed to set mystery card",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessingMove(false);
    }
  };

  const handleBackToMenu = () => {
    setShowVictoryScreen(false);
    // Navigate back to menu - this would need proper routing implementation
    window.location.reload();
  };

  const handlePlayAgain = () => {
    setShowVictoryScreen(false);
    setWinner(null);
    // Reset game state - this would need proper implementation
  };

  if (!gameLogic) {
    return <div>Loading game...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {feedback.show && (
        <Feedback correct={feedback.correct} song={feedback.song} />
      )}

      {showVictoryScreen && winner && (
        <VictoryScreen 
          winner={winner} 
          players={players || []}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}

      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-bold">
          Turn: {room?.current_turn}
        </h2>
        {isHost && (
          <Button
            onClick={handleSetMysteryCard}
            disabled={isProcessingMove}
            className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Set Mystery Card
          </Button>
        )}
      </div>

      {room?.current_song && (
        <div className="p-4">
          <h3 className="text-lg font-semibold">Mystery Card</h3>
          <SongCard song={room.current_song} />
        </div>
      )}

      <div className="flex-grow">
        <Timeline
          songs={currentPlayer?.timeline || []}
          onCardClick={handleCardPlacement}
          isProcessingMove={isProcessingMove}
        />
      </div>

      <div className="p-4">
        <CardGrid
          availableSongs={gameLogic.availableSongs}
          onCardClick={handleCardPlacement}
          isProcessingMove={isProcessingMove}
        />
      </div>
    </div>
  );
}
