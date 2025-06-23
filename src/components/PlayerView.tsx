
import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music, Check, X } from 'lucide-react';
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
  const timelineRef = useRef<HTMLDivElement>(null);
  const [playingTimelineCard, setPlayingTimelineCard] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<{ [key: string]: HTMLAudioElement }>({});
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [showPlacementConfirm, setShowPlacementConfirm] = useState<boolean>(false);

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

  const handlePositionSelect = (position: number) => {
    setSelectedPosition(position);
    setShowPlacementConfirm(true);
  };

  const confirmPlacement = () => {
    if (selectedPosition !== null) {
      onPlaceCard(selectedPosition);
      setSelectedPosition(null);
      setShowPlacementConfirm(false);
    }
  };

  const cancelPlacement = () => {
    setSelectedPosition(null);
    setShowPlacementConfirm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 z-10">
        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400">
          Room: {roomCode}
        </Badge>
        <Badge 
          variant="outline" 
          className={cn(
            "text-white",
            isMyTurn ? "bg-green-500/20 border-green-400" : "bg-white/10 border-white/20"
          )}
        >
          {isMyTurn ? "Your Turn!" : `${currentTurnPlayer.name}'s Turn`}
        </Badge>
      </div>

      {/* Mystery Card Section - Only when it's player's turn */}
      {isMyTurn && gameState.currentSong && (
        <div className="px-4 mb-4">
          <Card className="bg-white/10 border-white/20 p-4">
            <div className="text-center mb-4">
              <Music className="h-8 w-8 mx-auto text-purple-300 mb-2" />
              <div className="text-lg font-bold text-white mb-1">Mystery Song</div>
              <div className="text-purple-200 text-sm">Listen and place it on your timeline!</div>
            </div>
            
            <Button
              onClick={onPlayPause}
              className="w-full mb-3 bg-gradient-to-r from-green-500 to-emerald-500"
            >
              {gameState.isPlaying ? (
                <Pause className="h-5 w-5 mr-2" />
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              {gameState.isPlaying ? 'Pause' : 'Play'} Mystery Song
            </Button>
            
            <Progress 
              value={(gameState.timeLeft / 30) * 100} 
              className="mb-2"
            />
            <div className="text-center text-purple-200 text-sm">
              {gameState.timeLeft} seconds remaining
            </div>
          </Card>
        </div>
      )}

      {/* Timeline Section */}
      <div className="flex-1 flex flex-col justify-center px-4">
        <div className="text-xl font-bold text-white mb-4 text-center">
          Your Timeline
        </div>
        
        {/* Timeline Cards - Centered */}
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 max-w-full">
            {/* Placement button at start */}
            {isMyTurn && gameState.currentSong && (
              <Button
                onClick={() => handlePositionSelect(0)}
                size="sm"
                className={cn(
                  "bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg whitespace-nowrap flex-shrink-0",
                  selectedPosition === 0 && "ring-2 ring-green-300"
                )}
              >
                Place Here
              </Button>
            )}
            
            {currentPlayer.timeline.map((song, index) => (
              <React.Fragment key={index}>
                <Card className="bg-white/10 border-white/20 p-3 flex-shrink-0 w-32">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-bold text-white">
                      '{song.release_year.slice(-2)}
                    </div>
                    <Button
                      onClick={() => playTimelineCard(song)}
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-6 w-6 p-0"
                      disabled={!song.preview_url}
                    >
                      {playingTimelineCard === song.id ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-sm font-semibold text-purple-200 mb-1 line-clamp-2">
                    {song.deezer_title}
                  </div>
                  <div className="text-purple-200/60 text-xs line-clamp-1">
                    {song.deezer_artist}
                  </div>
                </Card>
                
                {/* Placement button between cards */}
                {isMyTurn && gameState.currentSong && (
                  <Button
                    onClick={() => handlePositionSelect(index + 1)}
                    size="sm"
                    className={cn(
                      "bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg whitespace-nowrap flex-shrink-0",
                      selectedPosition === index + 1 && "ring-2 ring-green-300"
                    )}
                  >
                    Place Here
                  </Button>
                )}
              </React.Fragment>
            ))}
            
            {/* Placement button at end if timeline is empty */}
            {isMyTurn && gameState.currentSong && currentPlayer.timeline.length === 0 && (
              <Button
                onClick={() => handlePositionSelect(0)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg"
              >
                Place First Song Here
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Placement Confirmation */}
      {showPlacementConfirm && selectedPosition !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white/90 p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <Music className="h-12 w-12 mx-auto text-purple-600 mb-2" />
              <div className="text-lg font-bold text-gray-900 mb-2">
                Place Mystery Song?
              </div>
              <div className="text-gray-600 text-sm">
                Position {selectedPosition + 1} in your timeline
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={confirmPlacement}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm
              </Button>
              <Button
                onClick={cancelPlacement}
                variant="outline"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Turn info */}
      {!isMyTurn && (
        <div className="p-4">
          <Card className="bg-white/10 border-white/20 p-4">
            <div className="text-center text-purple-200">
              Waiting for {currentTurnPlayer.name} to place their card...
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
