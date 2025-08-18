
import { useState } from 'react';
import { Song, Player } from '@/types/game';
import { Timeline } from '@/components/Timeline';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { Button } from '@/components/ui/button';
import { Play, Pause, Clock } from 'lucide-react';

interface MobilePlayerGameViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  currentSong: Song;
  roomCode: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  onPlayPause: () => Promise<void>;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean; }>;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  gameEnded: boolean;
}

export function MobilePlayerGameView({
  currentPlayer,
  currentTurnPlayer,
  currentSong,
  isMyTurn,
  isPlaying,
  onPlayPause,
  onPlaceCard,
}: MobilePlayerGameViewProps) {
  const [confirmingPlacement, setConfirmingPlacement] = useState<{ song: Song; position: number } | null>(null);

  const handleCardSelect = async (song: Song, position: number) => {
    const result = await onPlaceCard(song, position);
    if (result.success) {
      console.log('Card placed successfully');
    }
  };

  const handleConfirm = () => {
    setConfirmingPlacement(null);
  };

  const handleReject = () => {
    setConfirmingPlacement(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">
            {currentPlayer.name}
          </div>
          <div className="text-sm text-gray-400">
            Score: {currentPlayer.score}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={onPlayPause}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">30s</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-hidden">
        <Timeline
          songs={currentPlayer.timeline}
          onCardSelect={handleCardSelect}
          currentSong={currentSong}
        />
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-gray-700">
        {confirmingPlacement ? (
          <div className="flex space-x-4">
            <Button onClick={handleConfirm} className="w-1/2 bg-green-600 hover:bg-green-500">
              Confirm
            </Button>
            <Button onClick={handleReject} className="w-1/2 bg-red-600 hover:bg-red-500">
              Reject
            </Button>
          </div>
        ) : (
          <RecordMysteryCard />
        )}
      </div>
    </div>
  );
}
