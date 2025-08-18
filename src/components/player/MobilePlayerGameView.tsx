import { useState, useEffect } from 'react';
import { Song, Player, GameState, GamePhase } from '@/types/game';
import { Timeline } from '@/components/Timeline';
import { RecordMysteryCard } from '@/components/RecordMysteryCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, Clock, Users, Trophy, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobilePlayerGameViewProps {
  gameState: GameState;
  currentPlayer: Player;
  players: Player[];
  phase: GamePhase;
  onCardPlacement: (song: Song, position: number) => void;
  onConfirmPlacement: () => void;
  onRejectPlacement: () => void;
  onPlayPause: () => void;
  onNextTurn: () => void;
  onViewportChange?: (viewport: { scale: number; x: number; y: number }) => void;
}

export function MobilePlayerGameView({
  gameState,
  currentPlayer,
  players,
  phase,
  onCardPlacement,
  onConfirmPlacement,
  onRejectPlacement,
  onPlayPause,
  onNextTurn
}: MobilePlayerGameViewProps) {
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSong, setRecordedSong] = useState<Song | null>(null);

  const handleCardSelect = (song: Song, position: number) => {
    onCardPlacement(song, position);
  };

  const handleConfirm = () => {
    onConfirmPlacement();
  };

  const handleReject = () => {
    onRejectPlacement();
  };

  const handleRecordStart = () => {
    setIsRecording(true);
    setRecordedSong(null);
  };

  const handleRecordStop = (song: Song) => {
    setIsRecording(false);
    setRecordedSong(song);
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
            {gameState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">{gameState.timeLeft}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-hidden">
        <Timeline
          songs={currentPlayer.timeline}
          currentTurn={gameState.currentTurn}
          throwingCard={gameState.throwingCard}
          confirmingPlacement={gameState.confirmingPlacement}
          cardResult={gameState.cardResult}
          transitioningTurn={gameState.transitioningTurn}
          currentSong={gameState.currentSong}
          onCardSelect={handleCardSelect}
          mysteryCardRevealed={gameState.mysteryCardRevealed}
          highlightedGapIndex={gameState.highlightedGapIndex}
        />
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-gray-700">
        {gameState.confirmingPlacement ? (
          <div className="flex space-x-4">
            <Button onClick={handleConfirm} className="w-1/2 bg-green-600 hover:bg-green-500">
              Confirm
            </Button>
            <Button onClick={handleReject} className="w-1/2 bg-red-600 hover:bg-red-500">
              Reject
            </Button>
          </div>
        ) : (
          <RecordMysteryCard onRecordStart={handleRecordStart} onRecordStop={handleRecordStop} />
        )}
      </div>
    </div>
  );
}
