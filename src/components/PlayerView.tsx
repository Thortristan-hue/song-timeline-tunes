
import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music, Plus, Timer, ArrowLeft, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface PlayerViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  roomCode: string;
  isMyTurn: boolean;
  gameState: {
    currentSong: Song | null;
    isPlaying: boolean;
    timeLeft: number;
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
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [showPositionSelector, setShowPositionSelector] = useState(false);

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

  const handleMysteryCardPlay = () => {
    // Trigger play/pause on host via callback
    onPlayPause();
  };

  const handlePlaceCard = (position: number) => {
    onPlaceCard(position);
    setSelectedPosition(null);
    setShowPositionSelector(false);
  };

  const renderTimelineCard = (song: Song, index: number) => (
    <div
      key={index}
      className="min-w-28 h-28 rounded-xl flex flex-col items-center justify-center text-white shadow-lg border border-white/20 transform transition-all hover:scale-105 relative flex-shrink-0"
      style={{ backgroundColor: song.cardColor || currentPlayer.color }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
      
      <Button
        onClick={() => playTimelineCard(song)}
        size="sm"
        variant="outline"
        className="absolute top-1 right-1 bg-white/10 border-white/20 text-white hover:bg-white/20 h-5 w-5 p-0"
        disabled={!song.preview_url}
      >
        {playingTimelineCard === song.id ? (
          <Pause className="h-2 w-2" />
        ) : (
          <Play className="h-2 w-2" />
        )}
      </Button>

      <Music className="h-6 w-6 mb-1 opacity-80 relative z-10" />
      <div className="text-center relative z-10 px-1">
        <div className="text-xl font-black mb-1">
          {song.release_year}
        </div>
        <div className="text-xs opacity-90 leading-tight">
          {song.deezer_title?.slice(0, 15)}
          {song.deezer_title && song.deezer_title.length > 15 ? '...' : ''}
        </div>
      </div>
    </div>
  );

  const renderPositionButton = (position: number, label: string) => (
    <Button
      key={position}
      onClick={() => handlePlaceCard(position)}
      className={cn(
        "w-full justify-center py-3 text-sm font-medium transition-all",
        selectedPosition === position
          ? "bg-green-500 text-white border-green-600"
          : "bg-green-500/20 border-green-400 text-green-200 hover:bg-green-500/30"
      )}
      variant="outline"
    >
      <Plus className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex flex-col">
      {/* Compact Header */}
      <div className="flex justify-between items-center p-2 bg-black/20 backdrop-blur-sm">
        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400 text-xs px-2 py-1">
          {roomCode}
        </Badge>
        <Badge 
          variant="outline" 
          className={cn(
            "text-white text-xs px-2 py-1",
            isMyTurn ? "bg-green-500/20 border-green-400" : "bg-white/10 border-white/20"
          )}
        >
          {isMyTurn ? "Your Turn!" : `${currentTurnPlayer.name}'s Turn`}
        </Badge>
      </div>

      {/* Mystery Card Section - Compact */}
      {isMyTurn && gameState.currentSong && (
        <div className="px-3 py-2">
          <Card className="bg-white/10 border-white/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center cursor-pointer transform transition-all hover:scale-105"
                  onClick={handleMysteryCardPlay}
                >
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Mystery Song</div>
                  <div className="text-xs text-purple-200 flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {gameState.timeLeft}s
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowPositionSelector(!showPositionSelector)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-xs px-3"
              >
                Place Card
              </Button>
            </div>
            <Progress 
              value={(gameState.timeLeft / 30) * 100} 
              className="mt-2 h-1"
            />
          </Card>
        </div>
      )}

      {/* Main Timeline Section */}
      <div className="flex-1 p-3 flex flex-col">
        <div className="text-center mb-3">
          <h2 className="text-lg font-bold text-white">Your Timeline</h2>
          <p className="text-sm text-purple-200">
            {currentPlayer.timeline.length === 0 
              ? "Empty timeline - place your first song!" 
              : `${currentPlayer.timeline.length} songs placed`
            }
          </p>
        </div>
        
        {/* Centered Timeline Display */}
        <div className="flex-1 flex items-center justify-center">
          <Card className="bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-4 w-full max-w-full">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: currentPlayer.color }}
              />
              <h3 className="text-lg font-bold text-white">
                {currentPlayer.name}'s Timeline
              </h3>
            </div>
            
            {/* Scrollable Timeline Container */}
            <div className="overflow-x-auto">
              <div className="flex gap-3 items-center justify-center min-h-[120px] px-2">
                {currentPlayer.timeline.length === 0 ? (
                  <div className="text-center py-4">
                    <Music className="h-12 w-12 text-purple-300 mx-auto mb-2 opacity-60" />
                    <p className="text-purple-200 text-sm">Your timeline is empty</p>
                    {isMyTurn && gameState.currentSong && (
                      <p className="text-purple-300 text-xs mt-1">Tap the mystery card to hear it, then place it!</p>
                    )}
                  </div>
                ) : (
                  currentPlayer.timeline.map((song, index) => renderTimelineCard(song, index))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Position Selector */}
        {isMyTurn && gameState.currentSong && showPositionSelector && (
          <Card className="bg-white/10 border-white/20 p-4 mt-3">
            <div className="text-center mb-3">
              <p className="text-white text-sm font-medium">Where should the mystery song go?</p>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {/* Before first card or as first card */}
              {renderPositionButton(
                0,
                currentPlayer.timeline.length > 0 
                  ? `At beginning (before ${currentPlayer.timeline[0]?.release_year})` 
                  : 'As first song'
              )}

              {/* Between cards and at end */}
              {currentPlayer.timeline.map((song, index) => 
                renderPositionButton(
                  index + 1,
                  index + 1 < currentPlayer.timeline.length
                    ? `After ${song.release_year} (before ${currentPlayer.timeline[index + 1]?.release_year})`
                    : `After ${song.release_year} (at end)`
                )
              )}
            </div>
            
            <Button
              onClick={() => setShowPositionSelector(false)}
              variant="outline"
              className="w-full mt-3 bg-white/10 border-white/20 text-white"
            >
              Cancel
            </Button>
          </Card>
        )}
      </div>

      {/* Turn info for non-turn players */}
      {!isMyTurn && (
        <div className="p-3 bg-black/20 backdrop-blur-sm">
          <div className="text-center text-purple-200 text-sm">
            Waiting for {currentTurnPlayer.name} to place their card...
          </div>
        </div>
      )}
    </div>
  );
}
