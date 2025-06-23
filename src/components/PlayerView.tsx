import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';
import { MysteryCard } from './MysteryCard';
import { PlacementConfirmationDialog } from './PlacementConfirmationDialog';

interface PlayerViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  roomCode: string;
  isMyTurn: boolean;
  gameState: {
    currentSong: Song | null;
    isPlaying: boolean;
    timeLeft: number;
    cardPlacementPending?: boolean;
    mysteryCardRevealed?: boolean;
    cardPlacementCorrect?: boolean | null;
  };
  onPlaceCard: (position: number) => void;
  onPlayPause: () => void;
}

export function PlayerView({
  currentPlayer,
  currentTurnPlayer,
  roomCode,
  isMyTurn,
  gameState,
  onPlaceCard,
  onPlayPause
}: PlayerViewProps) {
  const [playingTimelineCard, setPlayingTimelineCard] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<{ [key: string]: HTMLAudioElement }>({});
  const [draggedPosition, setDraggedPosition] = useState<number | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<number | null>(null);

  // Debug logging to help identify issues
  useEffect(() => {
    console.log('PlayerView Debug - isMyTurn:', isMyTurn);
    console.log('PlayerView Debug - gameState.currentSong:', gameState.currentSong);
    console.log('PlayerView Debug - gameState.timeLeft:', gameState.timeLeft);
    console.log('PlayerView Debug - currentPlayer:', currentPlayer.name);
    console.log('PlayerView Debug - currentTurnPlayer:', currentTurnPlayer.name);
    console.log('PlayerView Debug - Should show mystery card:', isMyTurn && gameState.currentSong);
    console.log('PlayerView Debug - Card placement pending:', gameState.cardPlacementPending);
    console.log('PlayerView Debug - Mystery card revealed:', gameState.mysteryCardRevealed);
  }, [isMyTurn, gameState.currentSong, gameState.timeLeft, currentPlayer.name, currentTurnPlayer.name, gameState.cardPlacementPending, gameState.mysteryCardRevealed]);

  const playTimelineCard = (song: Song) => {
    if (!song.preview_url) return;

    // Stop all other timeline cards
    Object.values(audioRefs).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    setPlayingTimelineCard(null);

    // Create or get audio element for this song
    let audio = audioRefs[song.id];
    if (!audio) {
      audio = new Audio(song.preview_url);
      audio.crossOrigin = 'anonymous';
      setAudioRefs(prev => ({ ...prev, [song.id]: audio }));
    }

    if (playingTimelineCard === song.id) {
      audio.pause();
      setPlayingTimelineCard(null);
    } else {
      audio.currentTime = 0;
      audio.play().then(() => {
        setPlayingTimelineCard(song.id);
      }).catch(console.error);

      audio.onended = () => setPlayingTimelineCard(null);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', 'mystery-card');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropZone = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data === 'mystery-card') {
      setPendingPosition(position);
      setShowConfirmationDialog(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleConfirmPlacement = () => {
    if (pendingPosition !== null) {
      onPlaceCard(pendingPosition);
      setShowConfirmationDialog(false);
      setPendingPosition(null);
    }
  };

  const handleCancelPlacement = () => {
    setShowConfirmationDialog(false);
    setPendingPosition(null);
  };

  const renderTimelineCard = (song: Song, index: number) => (
    <div
      key={index}
      className="w-24 h-24 rounded-xl flex flex-col items-center justify-center text-white shadow-lg border border-white/20 transform transition-all hover:scale-105 relative flex-shrink-0 mx-1"
      style={{ backgroundColor: song.cardColor || currentPlayer.color }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
      
      <Button
        onClick={() => playTimelineCard(song)}
        size="sm"
        variant="outline"
        className="absolute top-1 right-1 bg-white/10 border-white/20 text-white hover:bg-white/20 h-4 w-4 p-0"
        disabled={!song.preview_url}
      >
        {playingTimelineCard === song.id ? (
          <Pause className="h-2 w-2" />
        ) : (
          <Play className="h-2 w-2" />
        )}
      </Button>

      <Music className="h-5 w-5 mb-1 opacity-80 relative z-10" />
      <div className="text-center relative z-10 px-1">
        <div className="text-lg font-black mb-1">
          {song.release_year}
        </div>
        <div className="text-xs opacity-90 leading-tight">
          {song.deezer_title?.slice(0, 12)}
          {song.deezer_title && song.deezer_title.length > 12 ? '...' : ''}
        </div>
      </div>
    </div>
  );

  const renderDropZone = (position: number, label: string) => (
    <div
      className="min-h-[100px] border-2 border-dashed border-green-400/50 bg-green-500/10 rounded-lg flex items-center justify-center transition-all hover:border-green-400 hover:bg-green-500/20"
      onDrop={(e) => handleDropZone(e, position)}
      onDragOver={handleDragOver}
    >
      <div className="text-green-300 text-sm font-medium text-center px-4">
        Drop mystery card here<br />
        <span className="text-xs opacity-75">{label}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex flex-col">
      {/* Compact Header */}
      <div className="flex justify-between items-center p-3 bg-black/20 backdrop-blur-sm">
        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400 text-sm px-3 py-1">
          {roomCode}
        </Badge>
        <Badge 
          variant="outline" 
          className={cn(
            "text-white text-sm px-3 py-1",
            isMyTurn ? "bg-green-500/20 border-green-400" : "bg-white/10 border-white/20"
          )}
        >
          {isMyTurn ? "Your Turn!" : `${currentTurnPlayer.name}'s Turn`}
        </Badge>
      </div>

      {/* Mystery Card Section - Only for current player */}
      {isMyTurn && gameState.currentSong ? (
        <div className="px-4 py-3">
          <Card className="bg-white/10 border-white/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center cursor-pointer transform transition-all hover:scale-105 shadow-lg"
                  onClick={onPlayPause}
                >
                  {gameState.isPlaying ? (
                    <Pause className="h-8 w-8 text-white" />
                  ) : (
                    <Play className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <div className="text-lg font-bold text-white">Mystery Song</div>
                  <div className="text-sm text-purple-200 flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    {gameState.timeLeft}s remaining
                  </div>
                </div>
              </div>
              
              {/* Draggable Mystery Card - Always hidden until placement confirmed */}
              <div className="flex items-center gap-4">
                <MysteryCard
                  song={gameState.currentSong}
                  isRevealed={false} // Always hidden for player until placement confirmed
                  isInteractive={!gameState.cardPlacementPending}
                  isDestroyed={gameState.cardPlacementCorrect === false}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              </div>
            </div>
            <Progress 
              value={(gameState.timeLeft / 30) * 100} 
              className="h-2"
            />
          </Card>
        </div>
      ) : isMyTurn ? (
        /* Loading state when it's my turn but no song yet */
        <div className="px-4 py-3">
          <Card className="bg-white/10 border-white/20 p-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center animate-pulse">
                <Music className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">Loading Mystery Song...</div>
                <div className="text-sm text-purple-200">Preparing your next challenge</div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Result display - Show revealed card after placement */}
      {isMyTurn && gameState.mysteryCardRevealed && gameState.currentSong && (
        <div className="px-4 py-2">
          <Card className="bg-white/10 border-white/20 p-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className={`text-lg font-bold mb-2 ${
                  gameState.cardPlacementCorrect ? 'text-green-400' : 'text-red-400'
                }`}>
                  {gameState.cardPlacementCorrect ? '✅ Correct!' : '❌ Incorrect!'}
                </div>
                <MysteryCard
                  song={gameState.currentSong}
                  isRevealed={true} // Now show the revealed card
                  isInteractive={false}
                  isDestroyed={gameState.cardPlacementCorrect === false}
                  className="w-32 h-40"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Timeline Section */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white mb-1">Your Timeline</h2>
          <p className="text-sm text-purple-200">
            {currentPlayer.timeline.length === 0 
              ? isMyTurn ? "Drag the mystery card to a drop zone below!" : "Empty timeline - place your first song!" 
              : `${currentPlayer.timeline.length} songs placed`
            }
          </p>
        </div>
        
        {/* Timeline with Drop Zones - Only show drop zones during my turn */}
        <div className="flex-1 flex items-center justify-center">
          <Card className="bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-6 w-full max-w-full">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: currentPlayer.color }}
              />
              <h3 className="text-lg font-bold text-white">
                {currentPlayer.name}'s Timeline
              </h3>
            </div>
            
            <div className="space-y-4">
              {currentPlayer.timeline.length === 0 ? (
                <div className="text-center py-8">
                  {isMyTurn && gameState.currentSong ? (
                    renderDropZone(0, "Place as your first song")
                  ) : (
                    <>
                      <Music className="h-16 w-16 text-purple-300 mx-auto mb-3 opacity-60" />
                      <p className="text-purple-200 text-base mb-2">Your timeline is empty</p>
                      {isMyTurn && (
                        <p className="text-purple-300 text-sm">Tap the mystery card to hear it, then drag it to a drop zone!</p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Drop zone before first card */}
                  {isMyTurn && gameState.currentSong && !gameState.cardPlacementPending && (
                    renderDropZone(0, `Before ${currentPlayer.timeline[0]?.release_year}`)
                  )}
                  
                  {/* Timeline cards with drop zones between them */}
                  {currentPlayer.timeline.map((song, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-center">
                        {renderTimelineCard(song, index)}
                      </div>
                      
                      {/* Drop zone after each card */}
                      {isMyTurn && gameState.currentSong && !gameState.cardPlacementPending && (
                        index < currentPlayer.timeline.length - 1 ? (
                          renderDropZone(
                            index + 1, 
                            `Between ${song.release_year} and ${currentPlayer.timeline[index + 1]?.release_year}`
                          )
                        ) : (
                          renderDropZone(index + 1, `After ${song.release_year} (at end)`)
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Turn info for non-turn players */}
      {!isMyTurn && (
        <div className="p-4 bg-black/20 backdrop-blur-sm">
          <div className="text-center text-purple-200">
            Waiting for {currentTurnPlayer.name} to place their card...
          </div>
        </div>
      )}

      {/* Placement Confirmation Dialog - Only show mystery card as hidden */}
      <PlacementConfirmationDialog
        isOpen={showConfirmationDialog}
        song={gameState.currentSong}
        position={pendingPosition || 0}
        timeline={currentPlayer.timeline}
        onConfirm={handleConfirmPlacement}
        onCancel={handleCancelPlacement}
      />
    </div>
  );
}
