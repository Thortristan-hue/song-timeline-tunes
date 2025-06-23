
import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music, Plus, Timer } from 'lucide-react';
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
  const [showPositionSelector, setShowPositionSelector] = useState(false);

  // Debug logging to help identify issues
  useEffect(() => {
    console.log('PlayerView Debug - isMyTurn:', isMyTurn);
    console.log('PlayerView Debug - gameState.currentSong:', gameState.currentSong);
    console.log('PlayerView Debug - gameState.timeLeft:', gameState.timeLeft);
    console.log('PlayerView Debug - currentPlayer:', currentPlayer.name);
    console.log('PlayerView Debug - currentTurnPlayer:', currentTurnPlayer.name);
    console.log('PlayerView Debug - Should show mystery card:', isMyTurn && gameState.currentSong);
  }, [isMyTurn, gameState.currentSong, gameState.timeLeft, currentPlayer.name, currentTurnPlayer.name]);

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

  const handlePlaceCard = (position: number) => {
    onPlaceCard(position);
    setShowPositionSelector(false);
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

      {/* Mystery Card Section - Show debug info if not visible */}
      {isMyTurn && gameState.currentSong ? (
        <div className="px-4 py-3">
          <Card className="bg-white/10 border-white/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center cursor-pointer transform transition-all hover:scale-105 shadow-lg"
                  onClick={onPlayPause}
                >
                  <Music className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">Mystery Song</div>
                  <div className="text-sm text-purple-200 flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    {gameState.timeLeft}s remaining
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowPositionSelector(!showPositionSelector)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2"
              >
                Place Card
              </Button>
            </div>
            <Progress 
              value={(gameState.timeLeft / 30) * 100} 
              className="h-2"
            />
          </Card>
        </div>
      ) : (
        /* Debug section - remove this after fixing the issue */
        <div className="px-4 py-3">
          <Card className="bg-red-900/20 border-red-400/30 p-4">
            <div className="text-white text-sm">
              <div className="font-bold mb-2">Debug Info - Mystery Card Not Showing:</div>
              <div>• Is My Turn: {isMyTurn ? 'YES' : 'NO'}</div>
              <div>• Current Song: {gameState.currentSong ? 'EXISTS' : 'NULL'}</div>
              <div>• Time Left: {gameState.timeLeft}s</div>
              <div>• Current Player: {currentPlayer.name}</div>
              <div>• Turn Player: {currentTurnPlayer.name}</div>
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
              ? "Empty timeline - place your first song!" 
              : `${currentPlayer.timeline.length} songs placed`
            }
          </p>
        </div>
        
        {/* Centered Timeline Display */}
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
            
            {/* Scrollable Timeline Container - Centered */}
            <div className="overflow-x-auto">
              <div className="flex gap-2 items-center justify-center min-h-[120px] px-4">
                {currentPlayer.timeline.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="h-16 w-16 text-purple-300 mx-auto mb-3 opacity-60" />
                    <p className="text-purple-200 text-base mb-2">Your timeline is empty</p>
                    {isMyTurn && gameState.currentSong && (
                      <p className="text-purple-300 text-sm">Tap the mystery card to hear it, then place it!</p>
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
          <Card className="bg-white/10 border-white/20 p-4 mt-4">
            <div className="text-center mb-4">
              <p className="text-white text-base font-medium">Where should the mystery song go?</p>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {/* Before first card or as first card */}
              <Button
                onClick={() => handlePlaceCard(0)}
                className="w-full justify-center py-3 text-sm font-medium bg-green-500/20 border-green-400 text-green-200 hover:bg-green-500/30 border"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                {currentPlayer.timeline.length > 0 
                  ? `At beginning (before ${currentPlayer.timeline[0]?.release_year})` 
                  : 'As first song'}
              </Button>

              {/* Between cards and at end */}
              {currentPlayer.timeline.map((song, index) => (
                <Button
                  key={index + 1}
                  onClick={() => handlePlaceCard(index + 1)}
                  className="w-full justify-center py-3 text-sm font-medium bg-green-500/20 border-green-400 text-green-200 hover:bg-green-500/30 border"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {index + 1 < currentPlayer.timeline.length
                    ? `After ${song.release_year} (before ${currentPlayer.timeline[index + 1]?.release_year})`
                    : `After ${song.release_year} (at end)`}
                </Button>
              ))}
            </div>
            
            <Button
              onClick={() => setShowPositionSelector(false)}
              variant="outline"
              className="w-full mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
          </Card>
        )}
      </div>

      {/* Turn info for non-turn players */}
      {!isMyTurn && (
        <div className="p-4 bg-black/20 backdrop-blur-sm">
          <div className="text-center text-purple-200">
            Waiting for {currentTurnPlayer.name} to place their card...
          </div>
        </div>
      )}
    </div>
  );
}
