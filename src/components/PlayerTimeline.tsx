import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Music, Check, X, Sparkles, Calendar, Play, Pause, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Song, Player } from "@/types/game";
import { DeezerAudioService } from "@/services/DeezerAudioService";
import { MobilePlayerTimeline } from "./MobilePlayerTimeline";

interface PlayerTimelineProps {
  player: Player;
  isCurrent: boolean;
  isDarkMode: boolean;
  draggedSong: Song | null;
  hoveredPosition: number | null;
  placementPending: { song: Song; position: number } | null;
  handleDragOver: (e: React.DragEvent, position: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent | React.MouseEvent | React.TouchEvent, position: number) => void;
  transitioningTurn?: boolean;
  onConfirmPlacement?: (song: Song, position: number) => Promise<{ success: boolean }>;
  onCancelPlacement?: () => void;
  gameEnded?: boolean;
  isPlaying?: boolean;
  onToggleAudio?: () => void;
  hasPlayedAudio?: boolean;
}

export function PlayerTimeline({
  player,
  isCurrent,
  isDarkMode,
  draggedSong,
  hoveredPosition,
  placementPending,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  transitioningTurn = false,
  onConfirmPlacement,
  onCancelPlacement,
  gameEnded = false,
  isPlaying = false,
  onToggleAudio,
  hasPlayedAudio = false
}: PlayerTimelineProps) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobileWidth = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window;
    return isIOS || isAndroid || (isMobileWidth && isTouchDevice);
  });

  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const currentlyPlayingAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlacingCard, setIsPlacingCard] = useState(false);
  const [lastPlacementTime, setLastPlacementTime] = useState(0);
  const placementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activeGapIndex, setActiveGapIndex] = useState<number | null>(null);

  React.useEffect(() => {
    const handleResize = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isMobileWidth = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window;
      const mobile = isIOS || isAndroid || (isMobileWidth && isTouchDevice);
      setIsMobile(mobile);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playTimelineSong = async (song: Song) => {
    if (gameEnded) return;

    if (currentlyPlayingAudioRef.current?.src === song.preview_url) {
      if (currentlyPlayingAudioRef.current.paused) {
        await currentlyPlayingAudioRef.current.play();
        setPlayingSongId(song.id);
      } else {
        currentlyPlayingAudioRef.current.pause();
        setPlayingSongId(null);
      }
      return;
    }

    if (currentlyPlayingAudioRef.current && !currentlyPlayingAudioRef.current.paused) {
      currentlyPlayingAudioRef.current.pause();
      currentlyPlayingAudioRef.current.currentTime = 0;
    }

    const allAudio = document.querySelectorAll('audio');
    allAudio.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    let previewUrl = song.preview_url;
    
    if (!previewUrl && song.id) {
      try {
        previewUrl = await DeezerAudioService.getPreviewUrl(song.id);
      } catch (error) {
        console.error('Failed to fetch preview URL:', error);
        return;
      }
    }
    
    if (!previewUrl) return;
    
    const audio = new Audio(previewUrl);
    audio.volume = 0.5;
    audio.crossOrigin = 'anonymous';
    currentlyPlayingAudioRef.current = audio;
    setPlayingSongId(song.id);
    
    try {
      await audio.play();
      setTimeout(() => {
        if (currentlyPlayingAudioRef.current === audio) {
          audio.pause();
          audio.currentTime = 0;
          currentlyPlayingAudioRef.current = null;
          setPlayingSongId(null);
        }
      }, 30000);
    } catch (error) {
      console.error('Failed to play:', error);
      if (currentlyPlayingAudioRef.current === audio) {
        currentlyPlayingAudioRef.current = null;
        setPlayingSongId(null);
      }
    }
  };

  const handleConfirmClick = async () => {
    if (!placementPending || !onConfirmPlacement || gameEnded) return;
    if (isPlacingCard) return;
    
    const now = Date.now();
    if (now - lastPlacementTime < 500) return;
    
    setIsPlacingCard(true);
    setLastPlacementTime(now);
    
    if (placementTimeoutRef.current) {
      clearTimeout(placementTimeoutRef.current);
    }
    
    try {
      await onConfirmPlacement(placementPending.song, placementPending.position);
    } catch (error) {
      console.error('Failed to confirm placement:', error);
    } finally {
      placementTimeoutRef.current = setTimeout(() => {
        setIsPlacingCard(false);
      }, 1000);
    }
  };

  const handleTryAgainClick = () => {
    if (!onCancelPlacement || gameEnded || isPlacingCard) return;
    onCancelPlacement();
  };

  const calculateNearestGap = () => {
    if (!timelineRef.current) return 0;
    const timeline = timelineRef.current;
    const scrollLeft = timeline.scrollLeft;
    const containerWidth = timeline.clientWidth;
    const cardWidth = 150;
    const gapPositions = [];
    
    for (let i = 0; i <= player.timeline.length; i++) {
      gapPositions.push(i * cardWidth);
    }
    
    let nearestGap = 0;
    let minDistance = Infinity;
    let nearestIndex = 0;
    
    gapPositions.forEach((gapPos, index) => {
      const distance = Math.abs(scrollLeft + containerWidth / 2 - gapPos);
      if (distance < minDistance) {
        minDistance = distance;
        nearestGap = Math.max(0, gapPos - containerWidth / 2);
        nearestIndex = index;
      }
    });
    
    setActiveGapIndex(nearestIndex);
    return nearestGap;
  };

  const handleTimelineScroll = React.useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (!gameEnded && isCurrent) {
            const nearestGap = calculateNearestGap();
            if (timelineRef.current) {
              timelineRef.current.scrollTo({ 
                left: nearestGap, 
                behavior: 'smooth' 
              });
            }
          }
        }, 100);
      };
    },
    [gameEnded, isCurrent, player.timeline.length]
  );

  const renderCard = (song: Song, index: number) => {
    const isPendingPosition = placementPending?.position === index;
    
    return (
      <div
        key={`${player.id}-card-${index}`}
        className={cn(
          "relative w-32 h-40 rounded-3xl flex flex-col items-center justify-center p-4 text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer group",
          "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-2xl",
          isPendingPosition && "ring-2 ring-blue-400 ring-opacity-50",
          gameEnded && "opacity-50 pointer-events-none"
        )}
        onClick={() => !gameEnded && playTimelineSong(song)}
      >
        <div className="absolute inset-0 rounded-3xl" />
        
        {!gameEnded && (
          <div className="absolute inset-0 rounded-3xl flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity duration-200">
            {playingSongId === song.id && !currentlyPlayingAudioRef.current?.paused ? (
              <Pause className="h-8 w-8 text-white" />
            ) : (
              <Play className="h-8 w-8 text-white" />
            )}
          </div>
        )}
        
        <Music className="h-8 w-8 mb-3" />
        <div className="text-center relative space-y-1">
          <div className="font-semibold text-sm leading-tight tracking-tight">
            {song.deezer_title.length > 14 ? song.deezer_title.substring(0, 14) + '...' : song.deezer_title}
          </div>
          <div className="text-xs font-medium">
            {song.deezer_artist.length > 12 ? song.deezer_artist.substring(0, 12) + '...' : song.deezer_artist}
          </div>
          <div className="text-xl font-bold mt-2 rounded-full px-2 py-1">
            {song.release_year}
          </div>
        </div>
      </div>
    );
  };

  const renderDropZone = (position: number) => {
    const isHovered = hoveredPosition === position;
    const isPending = placementPending?.position === position;
    const isActiveSnap = activeGapIndex === position && isCurrent && !gameEnded;
    
    return (
      <div
        key={`drop-zone-${position}`}
        className={cn(
          "w-20 h-36 rounded-3xl transition-all duration-300 mx-3 flex items-center justify-center",
          "touch-manipulation cursor-pointer backdrop-blur-xl border",
          gameEnded ? "opacity-50 pointer-events-none" :
          isPending
            ? 'bg-blue-500/30 border-blue-400/50 shadow-lg shadow-blue-400/25 scale-110'
            : isActiveSnap
            ? 'bg-green-500/20 border-green-400/40 shadow-lg shadow-green-400/20 scale-105'
            : isHovered 
            ? 'bg-white/15 border-white/20 shadow-lg scale-105' 
            : 'bg-white/5 border-white/10 hover:bg-white/10',
          isActiveSnap && 'ring-2 ring-green-400/50'
        )}
        onDragOver={(e) => !gameEnded && handleDragOver(e, position)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => !gameEnded && handleDrop(e, position)}
        onClick={(e) => {
          if (draggedSong && isCurrent && !gameEnded) {
            handleDrop(e, position);
          }
        }}
        onTouchStart={(e) => {
          if (draggedSong && isCurrent && !gameEnded) {
            e.preventDefault();
            handleDrop(e, position);
          }
        }}
      >
        {draggedSong && isCurrent && !isPending && !gameEnded && (
          <div className="text-white/80 text-xs font-medium text-center leading-tight">
            {isActiveSnap ? 'Centered\nGap' : 'Drop\nhere'}
          </div>
        )}
        {isPending && !gameEnded && (
          <div className="text-blue-200 text-xs font-medium text-center leading-tight">
            Confirm<br />placement
          </div>
        )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <MobilePlayerTimeline
        player={player}
        isCurrent={isCurrent}
        isDarkMode={isDarkMode}
        draggedSong={draggedSong}
        placementPending={placementPending}
        onConfirmPlacement={onConfirmPlacement}
        onCancelPlacement={onCancelPlacement}
        gameEnded={gameEnded}
        onDrop={(position) => {
          const fakeEvent = {
            preventDefault: () => {},
            stopPropagation: () => {}
          } as any;
          handleDrop(fakeEvent, position);
        }}
      />
    );
  }

  if (!player) return null;

  return (
    <div 
      className="fixed bottom-8 left-1/2 w-full max-w-7xl px-6"
      style={{
        transform: `translateX(-50%)`,
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: transitioningTurn ? 0.6 : 1
      }}
    >
      {placementPending && !gameEnded && (
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="rounded-3xl p-8 max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Music className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Confirm Placement</h2>
              <p className="text-slate-300 mb-4">Are you sure you want to place the card in this position?</p>
              
              {isPlacingCard && (
                <div className="flex items-center justify-center gap-2 text-blue-400 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing placement...</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmClick();
                }}
                disabled={isPlacingCard}
                className={cn(
                  "flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg hover:shadow-green-500/25 transition-all duration-200 transform hover:scale-105",
                  isPlacingCard && "opacity-50 cursor-not-allowed"
                )}
                size="lg"
              >
                {isPlacingCard ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTryAgainClick();
                }}
                disabled={isPlacingCard}
                variant="outline"
                className={cn(
                  "flex-1 border-2 border-slate-500 text-white hover:bg-slate-700/50 font-bold py-4 px-6 rounded-xl text-lg shadow-lg transition-all duration-200 transform hover:scale-105",
                  isPlacingCard && "opacity-50 cursor-not-allowed"
                )}
                size="lg"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      <div 
        ref={timelineRef}
        className="flex items-center gap-4 p-8 rounded-3xl overflow-x-auto scroll-smooth"
        onScroll={handleTimelineScroll}
        style={{
          scrollBehavior: 'smooth',
          scrollSnapType: 'x mandatory'
        }}
      >
        {player.timeline.map((song, index) => (
          <React.Fragment key={`${song.deezer_title}-${index}`}>
            <div style={{ scrollSnapAlign: 'center' }}>
              {renderDropZone(index)}
            </div>
            {renderCard(song, index)}
          </React.Fragment>
        ))}
        
        <div style={{ scrollSnapAlign: 'center' }}>
          {renderDropZone(player.timeline.length)}
        </div>
        
        {player.timeline.length === 0 && (
          <div className="text-center py-12 px-20 flex-1">
            <Music className="h-16 w-16 text-white/30 mx-auto mb-6" />
            <p className="text-white/70 text-lg font-medium mb-2">
              {gameEnded ? "Game Over" : isCurrent ? "Your timeline starts here" : "Building timeline..."}
            </p>
            {isCurrent && !gameEnded && (
              <p className="text-white/50 text-sm font-normal">
                Drag the mystery card to create your chronological timeline. Scroll to snap gaps to center.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
