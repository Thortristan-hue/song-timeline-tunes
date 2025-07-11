import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, Check, MoveRight, MoveLeft } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface MobilePlayerGameViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  currentSong: Song;
  roomCode: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  gameEnded: boolean;
}

export default function MobilePlayerGameView({
  currentPlayer,
  currentTurnPlayer,
  currentSong,
  roomCode,
  isMyTurn,
  isPlaying,
  onPlayPause,
  onPlaceCard,
  mysteryCardRevealed,
  cardPlacementResult,
  gameEnded
}: MobilePlayerGameViewProps) {
  const [snappedPosition, setSnappedPosition] = useState<number>(0);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Enhanced card dimensions for carousel - larger and square
  const CARD_WIDTH = 110; // Square cards, larger
  const CARD_HEIGHT = 110; // Square cards
  const GAP_WIDTH = 25; // 2x thinner gaps
  const ITEM_SPACING = 145; // Adjusted to prevent overlap
  const SIDE_PADDING = 200; // Extra space on both sides for edge selections

  // Create timeline from player's existing songs
  const timelineCards = currentPlayer.timeline
    .filter(song => song !== null)
    .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));

  // Calculate positions for gaps and cards
  const totalItems = timelineCards.length + 1; // +1 for final gap
  const totalWidth = (totalItems * ITEM_SPACING) + (2 * SIDE_PADDING);

  // Handle container resize
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, []);

  // Calculate which gap is centered
  const calculateCenteredGap = (scrollLeft: number) => {
    const screenCenter = scrollLeft + (containerWidth / 2);
    const relativeCenter = screenCenter - SIDE_PADDING;
    const gapIndex = Math.round(relativeCenter / ITEM_SPACING);
    return Math.max(0, Math.min(gapIndex, timelineCards.length));
  };

  // Enhanced scroll handling with carousel effect
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollViewRef.current) return;
    
    const scrollLeft = scrollViewRef.current.scrollLeft;
    setScrollPosition(scrollLeft);
    setIsScrolling(true);
    
    // Update centered position immediately
    const centeredGap = calculateCenteredGap(scrollLeft);
    setSnappedPosition(centeredGap);
    
    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    // Set timeout for smooth snap after scrolling stops
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
      snapToNearestGap();
    }, 150);
  };

  // Handle touch events
  const handleTouchStart = () => {
    setIsDragging(true);
    setIsScrolling(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Enhanced snap function
  const snapToNearestGap = () => {
    if (!scrollViewRef.current) return;
    
    const scrollLeft = scrollViewRef.current.scrollLeft;
    const centeredGap = calculateCenteredGap(scrollLeft);
    
    // Calculate target scroll position to center this gap
    const gapCenter = SIDE_PADDING + (centeredGap * ITEM_SPACING);
    const targetScroll = gapCenter - (containerWidth / 2);
    
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    });
    
    setSnappedPosition(centeredGap);
  };

  // Calculate carousel transform for items
  const getCarouselTransform = (itemX: number) => {
    if (!containerWidth) return { transform: 'scale(1)', opacity: 1, zIndex: 1 };
    
    const screenCenter = scrollPosition + (containerWidth / 2);
    const distance = Math.abs(itemX - screenCenter);
    const maxDistance = containerWidth / 2;
    
    // Calculate scale based on distance from center
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const scale = Math.max(0.7, 1 - (normalizedDistance * 0.3));
    const opacity = Math.max(0.5, 1 - (normalizedDistance * 0.5));
    const translateY = normalizedDistance * 10;
    const rotateY = normalizedDistance * 8;
    
    const zIndex = Math.round((1 - normalizedDistance) * 10);
    
    return {
      transform: `scale(${scale}) translateY(${translateY}px) rotateY(${itemX < screenCenter ? rotateY : -rotateY}deg)`,
      opacity,
      zIndex,
      filter: `blur(${normalizedDistance * 1}px)`
    };
  };

  // Text wrapping function for card text
  const wrapText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    
    // Try to break at word boundaries
    const words = text.split(' ');
    let currentLine = '';
    const lines = [];
    
    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxLength) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    // If still too long, truncate
    if (lines.length > 2) {
      return [lines[0], lines[1].substring(0, maxLength - 3) + '...'].join('\n');
    }
    
    return lines.join('\n');
  };

  // Play song preview
  const playPreview = (url: string, songId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (playingPreviewId === songId) {
      setPlayingPreviewId(null);
      return;
    }
    
    const audio = new Audio(url);
    audio.play();
    audioRef.current = audio;
    setPlayingPreviewId(songId);
    
    audio.onended = () => setPlayingPreviewId(null);
  };

  // Handle confirm placement
  const handleConfirmPlacement = async () => {
    if (hasConfirmed || isSubmitting || !isMyTurn || gameEnded) return;

    setIsSubmitting(true);
    setHasConfirmed(true);

    try {
      await onPlaceCard(currentSong, snappedPosition);
    } catch (error) {
      console.error('Failed to place card:', error);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setHasConfirmed(false), 2000);
    }
  };

  // Reset state when turn changes - center the middle gap
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      setHasConfirmed(false);
      
      // Calculate which gap should be in the center (middle of all gaps)
      const middleGapIndex = Math.floor(timelineCards.length / 2);
      setSnappedPosition(middleGapIndex);
      
      if (scrollViewRef.current && containerWidth > 0) {
        // Start at the middle gap which should be centered
        const middleGapCenter = SIDE_PADDING + (middleGapIndex * ITEM_SPACING);
        const initialScroll = middleGapCenter - (containerWidth / 2);
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ 
            left: initialScroll,
            behavior: 'smooth' 
          });
        }, 100);
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [isMyTurn, gameEnded, containerWidth, timelineCards.length]);

  // Kahoot-style result overlay
  if (cardPlacementResult) {
    const isCorrect = cardPlacementResult.correct;
    
    return (
      <div className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-1000 ${
        isCorrect 
          ? 'bg-gradient-to-br from-green-500 via-green-600 to-green-700' 
          : 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
      }`}>
        <div className="text-center space-y-4 p-4 max-w-xs">
          {/* Kahoot-style icon */}
          <div className="relative">
            <div className={`text-6xl mb-4 ${
              isCorrect ? 'animate-bounce' : 'animate-shake'
            }`}>
              {isCorrect ? '✓' : '✗'}
            </div>
            {/* Animated circles around icon */}
            <div className={`absolute inset-0 rounded-full border-4 animate-ping ${
              isCorrect ? 'border-green-300' : 'border-red-300'
            }`} style={{animationDuration: '2s'}}></div>
          </div>
          
          {/* Kahoot-style text */}
          <div className={`text-4xl font-black mb-4 text-white drop-shadow-2xl ${
            isCorrect ? 'animate-bounce' : 'animate-pulse'
          }`}>
            {isCorrect ? 'CORRECT!' : 'INCORRECT'}
          </div>
          
          {/* Song info card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-4 border-4 border-white shadow-2xl">
            <div className="text-lg font-bold text-gray-900 mb-2 leading-tight">
              {cardPlacementResult.song.deezer_title}
            </div>
            <div className="text-sm text-gray-700 mb-3 font-medium">
              by {cardPlacementResult.song.deezer_artist}
            </div>
            <div className={`inline-block text-white px-4 py-2 rounded-full font-black text-xl shadow-xl ${
              isCorrect 
                ? 'bg-gradient-to-r from-green-600 to-green-700' 
                : 'bg-gradient-to-r from-red-600 to-red-700'
            }`}>
              {cardPlacementResult.song.release_year}
            </div>
          </div>
          
          {/* Points indicator */}
          <div className="text-white text-base font-bold">
            {isCorrect ? 
              `+1 Point for ${currentPlayer.name}!` : 
              `No points this round`
            }
          </div>
        </div>
        
        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.8s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-32 w-48 h-48 bg-purple-500/6 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/4 rounded-full blur-3xl" />
      </div>

      {/* Player Header */}
      <div className="relative z-10 pt-4 pb-2 px-4 flex-shrink-0">
        <div className="text-center">
          <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100 tracking-wide mb-1">
            {currentPlayer.name}
          </div>
          <div className="text-white/80 text-xs font-semibold bg-white/10 backdrop-blur-xl rounded-full px-3 py-1 border border-white/20 inline-block">
            {gameEnded ? 'Game Over' : 
             isMyTurn ? 'Your Turn' : `${currentTurnPlayer.name}'s Turn`}
          </div>
        </div>
      </div>

      {/* Mystery Song Preview */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 flex items-center justify-center px-4 py-3 flex-shrink-0">
          <div className="text-center space-y-3">
            <div className="relative">
              <div className={`relative w-24 h-24 mx-auto transition-all duration-500 ${
                isPlaying ? 'animate-spin' : 'hover:scale-110'
              }`}>
                <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-2 border-white/40">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-2 border-white/50"></div>
                  </div>
                  
                  {/* Vinyl grooves effect */}
                  <div className="absolute inset-2 border border-white/10 rounded-full"></div>
                  <div className="absolute inset-4 border border-white/10 rounded-full"></div>
                </div>
                
                <Button
                  onClick={onPlayPause}
                  className="absolute inset-0 w-full h-full bg-black/20 hover:bg-black/40 border-0 rounded-full transition-all duration-300 group"
                  disabled={!currentSong?.preview_url}
                >
                  <div className="text-white text-xl group-hover:scale-125 transition-transform duration-300">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </div>
                </Button>
              </div>
            </div>
            <div className="text-white/90 text-sm font-semibold bg-white/10 backdrop-blur-xl rounded-xl px-3 py-1 border border-white/20">
              Tap vinyl to preview
            </div>
          </div>
        </div>
      )}

      {/* Waiting screen */}
      {!isMyTurn && !gameEnded && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-white/15 backdrop-blur-2xl rounded-full flex items-center justify-center border-2 border-white/30">
              <Music className="w-8 h-8 text-white/90 animate-pulse" />
            </div>
            <div className="text-lg font-bold text-white">
              {currentTurnPlayer.name} is playing
            </div>
            <div className="text-white/70 text-sm bg-white/10 backdrop-blur-xl rounded-xl px-3 py-1 border border-white/20">
              Wait for your turn
            </div>
          </div>
        </div>
      )}

      {/* Timeline Placement Interface */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-3 flex-1 flex flex-col" ref={containerRef}>
          <div className="bg-white/15 backdrop-blur-2xl rounded-3xl p-3 border border-white/25 flex-1 flex flex-col">
            {/* Center line indicator */}
            <div className="relative mb-3">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-yellow-400 to-orange-400 shadow-lg z-20 rounded-full"></div>
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs font-bold whitespace-nowrap bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                PLACE HERE
              </div>
            </div>

            <div className="text-center text-white/90 text-sm font-semibold mb-3">
              Scroll to position the gap at center
            </div>
            
            {/* Position indicator */}
            <div className="text-center mb-3">
              <div className="inline-block bg-white/20 backdrop-blur-xl rounded-full px-2 py-1 border border-white/30">
                <span className="text-white/80 text-xs">
                  Position: {snappedPosition === 0 ? 'Before first' : 
                           snappedPosition === timelineCards.length ? 'After last' :
                           `Between ${timelineCards[snappedPosition - 1]?.release_year} & ${timelineCards[snappedPosition]?.release_year}`}
                </span>
              </div>
            </div>

            {/* Carousel Timeline */}
            <div className="flex-1 flex items-center">
              <div 
                ref={scrollViewRef}
                className="overflow-x-auto scrollbar-hide w-full"
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: isScrolling ? 'auto' : 'smooth',
                  perspective: '1000px'
                }}
              >
                <div 
                  className="flex items-center py-4 relative" 
                  style={{ 
                    width: `${totalWidth}px`,
                    height: '130px'
                  }}
                >
                  {/* Render gaps and cards */}
                  {Array.from({ length: totalItems }, (_, gapIndex) => {
                    const gapX = SIDE_PADDING + (gapIndex * ITEM_SPACING);
                    const cardIndex = gapIndex;
                    const hasCard = cardIndex < timelineCards.length;
                    
                    return (
                      <React.Fragment key={`gap-${gapIndex}`}>
                        {/* Gap indicator */}
                        <div
                          className="absolute flex items-center justify-center"
                          style={{
                            left: `${gapX - (GAP_WIDTH / 2)}px`,
                            width: `${GAP_WIDTH}px`,
                            height: '110px',
                            ...getCarouselTransform(gapX)
                          }}
                        >
                          <div 
                            className={cn(
                              "w-full h-20 rounded-xl border-2 border-dashed transition-all duration-500 flex items-center justify-center",
                              snappedPosition === gapIndex ? 
                              "border-green-400 bg-green-400/25 shadow-lg scale-110" : 
                              "border-white/50 bg-white/10",
                            )}
                          >
                            <div className={cn(
                              "w-2 h-2 rounded-full transition-all duration-500",
                              snappedPosition === gapIndex ? "bg-green-400 shadow-lg animate-pulse" : "bg-white/70"
                            )}></div>
                          </div>
                        </div>

                        {/* Card (if exists) - Square cards */}
                        {hasCard && (
                          <div
                            className="absolute flex items-center justify-center cursor-pointer"
                            style={{
                              left: `${gapX + (GAP_WIDTH / 2) + 5}px`,
                              width: `${CARD_WIDTH}px`,
                              height: `${CARD_HEIGHT}px`,
                              ...getCarouselTransform(gapX + (GAP_WIDTH / 2) + 5 + (CARD_WIDTH / 2))
                            }}
                            onClick={() => timelineCards[cardIndex].preview_url && playPreview(timelineCards[cardIndex].preview_url, timelineCards[cardIndex].id)}
                          >
                            {(() => {
                              const song = timelineCards[cardIndex];
                              const artistHash = Array.from(song.deezer_artist).reduce(
                                (acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0
                              );
                              const hue = Math.abs(artistHash) % 360;
                              
                              return (
                                <div 
                                  className="w-full h-full rounded-xl border border-white/40 flex flex-col items-center justify-between p-2 text-white shadow-xl"
                                  style={{ 
                                    backgroundColor: `hsl(${hue}, 70%, 25%)`,
                                    backgroundImage: `linear-gradient(135deg, hsl(${hue}, 70%, 20%), hsl(${hue}, 70%, 35%))`,
                                  }}
                                >
                                  {/* Artist name */}
                                  <div className="text-sm font-bold text-center w-full leading-tight">
                                    {wrapText(song.deezer_artist, 16).split('\n').map((line, i) => (
                                      <div key={i}>{line}</div>
                                    ))}
                                  </div>
                                  
                                  {/* Year - larger for square cards */}
                                  <div className="text-2xl font-black text-center">
                                    {song.release_year}
                                  </div>
                                  
                                  {/* Song title */}
                                  <div className="text-sm italic text-center w-full leading-tight text-white/90">
                                    {wrapText(song.deezer_title, 14).split('\n').map((line, i) => (
                                      <div key={i}>{line}</div>
                                    ))}
                                  </div>
                                  
                                  {song.preview_url && (
                                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center">
                                      {playingPreviewId === song.id ? (
                                        <Pause className="w-2.5 h-2.5 text-white" />
                                      ) : (
                                        <Play className="w-2.5 h-2.5 text-white" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Navigation hints */}
            <div className="flex justify-between items-center mt-2 text-white/70 text-xs bg-white/10 backdrop-blur-xl rounded-xl px-2 py-1">
              <div className="flex items-center">
                <MoveLeft className="w-3 h-3 mr-1" />
                <span>Scroll</span>
              </div>
              <div className="flex items-center">
                <span>Center to select</span>
                <MoveRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-3 pb-3 flex-shrink-0">
          <Button
            onClick={handleConfirmPlacement}
            disabled={hasConfirmed || isSubmitting}
            className={cn(
              "w-full h-12 text-white font-black text-base rounded-2xl border-0 shadow-2xl transition-all duration-300",
              hasConfirmed || isSubmitting ? 
              "bg-gradient-to-r from-gray-600 to-gray-700" :
              "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:scale-105 active:scale-95"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>PLACING...</span>
              </div>
            ) : hasConfirmed ? (
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-4 h-4" />
                <span>PLACED!</span>
              </div>
            ) : (
              'CONFIRM PLACEMENT'
            )}
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 pb-2 flex-shrink-0">
        <div className="text-center">
          <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100">
            TIMELINER
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
