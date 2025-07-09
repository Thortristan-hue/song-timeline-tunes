import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Music, Check, X, Sparkles, Calendar, Play, Pause, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Song, Player } from "@/types/game";
import { DeezerAudioService } from "@/services/DeezerAudioService";
import { MobilePlayerTimeline } from "./MobilePlayerTimeline";

// Function to generate consistent color from artist name
const getArtistColor = (artist: string): string => {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < artist.length; i++) {
    hash = artist.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert hash to hue (0-360)
  const hue = Math.abs(hash) % 360;
  
  // Return HSL color string with fixed saturation/lightness
  return `hsl(${hue}, 70%, 60%)`;
};

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
  gameEnded = false
}: PlayerTimelineProps) {
  // MOBILE DETECTION: Enhanced mobile/iPhone detection
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // Enhanced mobile detection for iOS specifically
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobileWidth = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window;
    
    return isIOS || isAndroid || (isMobileWidth && isTouchDevice);
  });

  // State to track playing status
  const [playingStatus, setPlayingStatus] = useState<{
    songId: string | null;
    isPlaying: boolean;
  }>({ songId: null, isPlaying: false });

  // Enhanced resize handler for better mobile detection
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
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // MOBILE REDIRECT: Use mobile timeline for touch devices
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
          // Convert position to fake event for compatibility
          const fakeEvent = {
            preventDefault: () => {},
            stopPropagation: () => {}
          } as any;
          handleDrop(fakeEvent, position);
        }}
      />
    );
  }

  const currentlyPlayingAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // ANTI-SPAM: State management for card placement
  const [isPlacingCard, setIsPlacingCard] = useState(false);
  const [lastPlacementTime, setLastPlacementTime] = useState(0);
  const placementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ANTI-SPAM: Debounce settings
  const PLACEMENT_DEBOUNCE_MS = 1000; // 1 second debounce
  const MIN_PLACEMENT_INTERVAL = 500; // Minimum 500ms between attempts

  // Function to toggle play/pause
  const togglePlayPause = (song: Song) => {
    if (playingStatus.songId === song.id && playingStatus.isPlaying) {
      // Pause if same song is playing
      currentlyPlayingAudioRef.current?.pause();
      setPlayingStatus({ songId: song.id, isPlaying: false });
    } else {
      // Play new song
      playTimelineSong(song);
    }
  };

  // Enhanced timeline song playback with spam prevention
  const playTimelineSong = async (song: Song) => {
    if (gameEnded) {
      return;
    }
    
    // Stop any currently playing audio before starting new one
    if (currentlyPlayingAudioRef.current && !currentlyPlayingAudioRef.current.paused) {
      currentlyPlayingAudioRef.current.pause();
      currentlyPlayingAudioRef.current.currentTime = 0;
    }

    // Also stop any other audio elements on the page
    const allAudio = document.querySelectorAll('audio');
    allAudio.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    let previewUrl = song.preview_url;
    
    // Fetch preview just-in-time if not available or if it might be expired
    if (!previewUrl && song.id) {
      try {
        previewUrl = await DeezerAudioService.getPreviewUrl(song.id);
      } catch (error) {
        return;
      }
    }
    
    if (!previewUrl) {
      return;
    }
    
    // Create and manage single audio element
    const audio = new Audio(previewUrl);
    audio.volume = 0.5;
    audio.crossOrigin = 'anonymous';
    currentlyPlayingAudioRef.current = audio;
    
    // Set new playing status
    setPlayingStatus({ songId: song.id, isPlaying: true });
    
    try {
      await audio.play();
      
      // Stop after 30 seconds
      setTimeout(() => {
        if (currentlyPlayingAudioRef.current === audio) {
          audio.pause();
          audio.currentTime = 0;
          currentlyPlayingAudioRef.current = null;
          setPlayingStatus(prev => 
            prev.songId === song.id ? {...prev, isPlaying: false} : prev
          );
        }
      }, 30000);
      
      // Update state when audio ends
      audio.onended = () => {
        setPlayingStatus(prev => 
          prev.songId === song.id ? {...prev, isPlaying: false} : prev
        );
      };
    } catch (error) {
      if (currentlyPlayingAudioRef.current === audio) {
        currentlyPlayingAudioRef.current = null;
      }
    }
  };

  // ANTI-SPAM: Debounced and protected confirm placement
  const handleConfirmClick = async () => {
    if (!placementPending || !onConfirmPlacement || gameEnded) {
      return;
    }
    
    // ANTI-SPAM: Check if already placing a card
    if (isPlacingCard) {
      return;
    }
    
    // ANTI-SPAM: Check minimum time interval
    const now = Date.now();
    if (now - lastPlacementTime < MIN_PLACEMENT_INTERVAL) {
      return;
    }
    
    // ANTI-SPAM: Set placement state and update timestamp
    setIsPlacingCard(true);
    setLastPlacementTime(now);
    
    // Clear any existing timeout
    if (placementTimeoutRef.current) {
      clearTimeout(placementTimeoutRef.current);
    }
    
    try {
      const result = await onConfirmPlacement(placementPending.song, placementPending.position);
    } catch (error) {
    } finally {
      // ANTI-SPAM: Reset state after debounce period
      placementTimeoutRef.current = setTimeout(() => {
        setIsPlacingCard(false);
      }, PLACEMENT_DEBOUNCE_MS);
    }
  };

  const handleTryAgainClick = () => {
    if (!onCancelPlacement || gameEnded || isPlacingCard) return;
    onCancelPlacement();
  };

  // TIMELINE SCROLL: Snap to gap functionality
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activeGapIndex, setActiveGapIndex] = useState<number | null>(null);
  
  // Calculate nearest gap for snapping
  const calculateNearestGap = () => {
    if (!timelineRef.current) return 0;
    
    const timeline = timelineRef.current;
    const scrollLeft = timeline.scrollLeft;
    const containerWidth = timeline.clientWidth;
    const totalWidth = timeline.scrollWidth;
    
    // Calculate gap positions (approximate)
    const cardWidth = 150; // Approximate card width + gap
    const gapPositions = [];
    
    for (let i = 0; i <= player.timeline.length; i++) {
      gapPositions.push(i * cardWidth);
    }
    
    // Find nearest gap
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

  // Throttled scroll handler with snap
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
    const bgColor = getArtistColor(song.deezer_artist);
    const isPlaying = playingStatus.songId === song.id && playingStatus.isPlaying;
    
    return (
      <div
        key={`${player.id}-card-${index}`}
        className={cn(
          "relative w-40 h-52 rounded-xl flex flex-col items-center justify-between p-4 text-white transition-all duration-300 hover:scale-105 cursor-pointer",
          "shadow-lg",
          gameEnded && "opacity-50 pointer-events-none"
        )}
        onClick={() => !gameEnded && togglePlayPause(song)}
        style={{ backgroundColor: bgColor }}
      >
        <div className="text-center w-full">
          <div className="text-lg font-bold truncate">
            {song.deezer_artist}
          </div>
        </div>
        
        <div className="text-5xl font-bold my-2">
          {song.release_year}
        </div>
        
        <div className="text-center w-full italic truncate">
          {song.deezer_title}
        </div>
        
        {isPlaying && (
          <div className="absolute bottom-2 right-2 bg-black/30 rounded-full p-1">
            <Pause className="h-5 w-5" />
          </div>
        )}
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
          "w-12 h-52 rounded-xl transition-all duration-300 mx-3 flex items-center justify-center",
          "touch-manipulation cursor-pointer backdrop-blur-xl border",
          gameEnded ? "opacity-50 pointer-events-none" :
          isPending
            ? 'bg-blue-500/30 border-blue-400/50 shadow-lg shadow-blue-400/25 scale-110'
            : isActiveSnap
            ? 'bg-green-500/20 border-green-400/40 shadow-lg shadow-green-400/20 scale-105'
            : isHovered 
            ? 'bg-white/15 border-white/20 shadow-lg scale-105' 
            : 'bg-white/5 border-white/10 hover:bg-white/10',
          // Highlight centered gap
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

  if (!player) return null;

  return (
    <div 
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl px-4"
      style={{
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: transitioningTurn ? 0.6 : 1
      }}
    >
      {/* ANTI-SPAM: Enhanced confirmation dialog */}
      {placementPending && !gameEnded && (
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="rounded-3xl p-8 max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Music className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Confirm Placement</h2>
              <p className="text-slate-300 mb-4">Are you sure you want to place the card in this position?</p>
              
              {/* ANTI-SPAM: Visual feedback when processing */}
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

      {/* Enhanced timeline with snap functionality */}
      <div 
        ref={timelineRef}
        className="flex items-center justify-center gap-6 p-6 rounded-3xl overflow-x-auto scroll-smooth bg-slate-800/50 backdrop-blur-lg border border-slate-700 shadow-xl"
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
