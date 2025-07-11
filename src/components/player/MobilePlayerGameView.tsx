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
  
  // Enhanced card dimensions for carousel
  const CARD_WIDTH = 100;
  const GAP_WIDTH = 60;
  const ITEM_SPACING = 140; // Distance between gap centers
  const SIDE_PADDING = 250; // Extra space on both sides for edge selections

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
    const center = scrollLeft + (containerWidth / 2);
    const adjustedCenter = center - SIDE_PADDING;
    const gapIndex = Math.round(adjustedCenter / ITEM_SPACING);
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
    const targetScroll = (centeredGap * ITEM_SPACING) + SIDE_PADDING - (containerWidth / 2);
    
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    });
    
    setSnappedPosition(centeredGap);
  };

  // Calculate carousel transform for items
  const getCarouselTransform = (itemPosition: number) => {
    if (!containerWidth) return { transform: 'scale(1)', opacity: 1, zIndex: 1 };
    
    const itemCenter = SIDE_PADDING + itemPosition;
    const screenCenter = scrollPosition + (containerWidth / 2);
    const distance = Math.abs(itemCenter - screenCenter);
    const maxDistance = containerWidth / 2;
    
    // Calculate scale based on distance from center
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const scale = Math.max(0.6, 1 - (normalizedDistance * 0.4));
    const opacity = Math.max(0.4, 1 - (normalizedDistance * 0.6));
    const translateY = normalizedDistance * 15; // Slight vertical offset
    const rotateY = normalizedDistance * 10; // 3D rotation effect
    
    const zIndex = Math.round((1 - normalizedDistance) * 10);
    
    return {
      transform: `scale(${scale}) translateY(${translateY}px) rotateY(${screenCenter > itemCenter ? rotateY : -rotateY}deg)`,
      opacity,
      zIndex,
      filter: `blur(${normalizedDistance * 1.5}px)`
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

  // Reset state when turn changes
  useEffect(() => {
    if (isMyTurn && !gameEnded) {
      setHasConfirmed(false);
      setSnappedPosition(0);
      if (scrollViewRef.current) {
        // Start at the first gap (position 0) which should be centered
        const initialScroll = SIDE_PADDING - (containerWidth / 2);
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
  }, [isMyTurn, gameEnded, containerWidth]);

  // Kahoot-style result overlay
  if (cardPlacementResult) {
    const isCorrect = cardPlacementResult.correct;
    
    return (
      <div className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-1000 ${
        isCorrect 
          ? 'bg-gradient-to-br from-green-500 via-green-600 to-green-700' 
          : 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
      }`}>
        <div className="text-center space-y-6 p-6 max-w-sm animate-result-bounce">
          {/* Kahoot-style icon */}
          <div className="relative">
            <div className={`text-7xl mb-6 animate-pulse ${
              isCorrect ? 'filter drop-shadow-lg' : 'animate-shake'
            }`}>
              {isCorrect ? '✓' : '✗'}
            </div>
            {/* Animated circles around icon */}
            <div className={`absolute inset-0 rounded-full border-4 animate-ping ${
              isCorrect ? 'border-green-300' : 'border-red-300'
            }`} style={{animationDuration: '2s'}}></div>
          </div>
          
          {/* Kahoot-style text */}
          <div className={`text-5xl font-black mb-4 text-white drop-shadow-2xl ${
            isCorrect ? 'animate-bounce' : 'animate-pulse'
          }`}>
            {isCorrect ? 'CORRECT!' : 'INCORRECT'}
          </div>
          
          {/* Song info card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 border-4 border-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="text-xl font-bold text-gray-900 mb-2 leading-tight">
              {cardPlacementResult.song.deezer_title}
            </div>
            <div className="text-base text-gray-700 mb-4 font-medium">
              by {cardPlacementResult.song.deezer_artist}
            </div>
            <div className={`inline-block text-white px-6 py-3 rounded-full font-black text-2xl shadow-xl ${
              isCorrect 
                ? 'bg-gradient-to-r from-green-600 to-green-700' 
                : 'bg-gradient-to-r from-red-600 to-red-700'
            }`}>
              {cardPlacementResult.song.release_year}
            </div>
          </div>
          
          {/* Points indicator */}
          <div className="text-white text-lg font-bold">
            {isCorrect ? 
              `+1 Point for ${currentPlayer.name}!` : 
              `No points this round`
            }
          </div>
        </div>
        
        <style jsx global>{`
          @keyframes result-bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-20px);
            }
            60% {
              transform: translateY(-10px);
            }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-result-bounce {
            animation: result-bounce 2s ease-in-out infinite;
          }
          .animate-shake {
            animation: shake 0.8s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-32 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/4 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/60 via-transparent to-slate-900/40 pointer-events-none" />
      </div>

      {/* Enhanced Player Header */}
      <div className="relative z-10 pt-8 pb-4 px-4 flex-shrink-0">
        <div className="text-center">
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100 tracking-wide mb-2 drop-shadow-2xl">
            {currentPlayer.name}
          </div>
          <div className="text-white/80 text-sm font-semibold bg-white/10 backdrop-blur-xl rounded-full px-4 py-1 border border-white/20 inline-block shadow-lg">
            {gameEnded ? 'Game Over' : 
             isMyTurn ? 'Your Turn' : `${currentTurnPlayer.name}'s Turn`}
          </div>
        </div>
      </div>

      {/* Enhanced Mystery Song Preview */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-4">
          <div className="text-center space-y-4 max-w-xs">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-400/15 to-red-500/20 rounded-full blur-2xl animate-pulse scale-150"></div>
              <div className={`relative w-32 h-32 mx-auto transition-all duration-500 ${
                isPlaying ? 'animate-spin' : 'hover:scale-110'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-red-500/30 rounded-full blur-xl"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-full shadow-2xl border-4 border-white/40">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-4 border-white/50 shadow-xl"></div>
                  </div>
                  
                  {/* Vinyl grooves effect */}
                  <div className="absolute inset-3 border border-white/10 rounded-full"></div>
                  <div className="absolute inset-6 border border-white/10 rounded-full"></div>
                  <div className="absolute inset-9 border border-white/10 rounded-full"></div>
                </div>
                
                <Button
                  onClick={onPlayPause}
                  className="absolute inset-0 w-full h-full bg-black/20 hover:bg-black/40 border-0 rounded-full transition-all duration-300 group"
                  disabled={!currentSong?.preview_url}
                >
                  <div className="text-white text-3xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </div>
                </Button>
              </div>
            </div>
            <div className="text-white/90 text-base font-semibold bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-2 border border-white/20 shadow-lg">
              Tap vinyl to preview mystery song
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Waiting screen */}
      {!isMyTurn && !gameEnded && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl animate-pulse scale-150"></div>
              <div className="relative w-24 h-24 mx-auto bg-white/15 backdrop-blur-2xl rounded-full flex items-center justify-center border-2 border-white/30 shadow-2xl">
                <Music className="w-12 h-12 text-white/90 animate-pulse" />
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-2">
              {currentTurnPlayer.name} is playing
            </div>
            <div className="text-white/70 text-sm bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-2 border border-white/20">
              Wait for your turn to place cards
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Timeline Placement Interface with Carousel */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-4 pb-4 flex-shrink-0" ref={containerRef}>
          <div className="bg-white/15 backdrop-blur-2xl rounded-3xl p-4 border border-white/25 shadow-2xl">
            {/* Center line indicator */}
            <div className="relative mb-4">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-12 bg-gradient-to-b from-yellow-400 to-orange-400 shadow-lg z-20 rounded-full"></div>
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs font-bold whitespace-nowrap bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                PLACE HERE
              </div>
            </div>

            <div className="text-center text-white/90 text-base font-semibold mb-4">
              Scroll to position the gap at the center
            </div>
            
            {/* Position indicator */}
            <div className="text-center mb-4">
              <div className="inline-block bg-white/20 backdrop-blur-xl rounded-full px-3 py-1 border border-white/30">
                <span className="text-white/80 text-xs font-medium">
                  Position: {snappedPosition === 0 ? 'Before first card' : 
                           snappedPosition === timelineCards.length ? 'After last card' :
                           `Between ${timelineCards[snappedPosition - 1]?.release_year} and ${timelineCards[snappedPosition]?.release_year}`}
                </span>
              </div>
            </div>

            {/* Carousel Timeline */}
            <div 
              ref={scrollViewRef}
              className="overflow-x-auto scrollbar-hide"
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
                className="flex items-center py-6 relative" 
                style={{ 
                  width: `${totalWidth}px`,
                  height: '140px'
                }}
              >
                {/* Render gaps and cards aligned properly */}
                {Array.from({ length: totalItems }, (_, gapIndex) => {
                  const gapPosition = SIDE_PADDING + (gapIndex * ITEM_SPACING);
                  const cardIndex = gapIndex;
                  const hasCard = cardIndex < timelineCards.length;
                  
                  return (
                    <React.Fragment key={`gap-${gapIndex}`}>
                      {/* Gap indicator */}
                      <div
                        className="absolute flex items-center justify-center"
                        style={{
                          left: `${gapPosition - (GAP_WIDTH / 2)}px`,
                          width: `${GAP_WIDTH}px`,
                          height: '100px',
                          ...getCarouselTransform(gapPosition)
                        }}
                      >
                        <div 
                          className={cn(
                            "w-full h-20 rounded-2xl border-3 border-dashed transition-all duration-500 flex items-center justify-center",
                            snappedPosition === gapIndex ? 
                            "border-green-400 bg-green-400/25 shadow-lg shadow-green-400/50 scale-110" : 
                            "border-white/50 bg-white/10",
                          )}
                        >
                          <div className={cn(
                            "w-3 h-3 rounded-full transition-all duration-500",
                            snappedPosition === gapIndex ? "bg-green-400 shadow-lg animate-pulse" : "bg-white/70"
                          )}></div>
                        </div>
                      </div>

                      {/* Card (if exists) - positioned after the gap */}
                      {hasCard && (
                        <div
                          className="absolute flex items-center justify-center cursor-pointer"
                          style={{
                            left: `${gapPosition + (GAP_WIDTH / 2)}px`,
                            width: `${CARD_WIDTH}px`,
                            height: '100px',
                            ...getCarouselTransform(gapPosition + (GAP_WIDTH / 2) + (CARD_WIDTH / 2))
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
                                className="w-full h-full rounded-2xl border-2 border-white/40 flex flex-col items-center justify-between p-2 text-white shadow-2xl transition-all duration-300 hover:shadow-3xl group"
                                style={{ 
                                  backgroundColor: `hsl(${hue}, 70%, 25%)`,
                                  backgroundImage: `linear-gradient(135deg, hsl(${hue}, 70%, 20%), hsl(${hue}, 70%, 35%))`,
                                }}
                              >
                                {/* Artist name with text wrapping */}
                                <div className="text-xs font-bold text-center w-full leading-tight text-shadow-sm">
                                  {wrapText(song.deezer_artist, 14).split('\n').map((line, i) => (
                                    <div key={i} className="mb-0.5">{line}</div>
                                  ))}
                                </div>
                                
                                {/* Year - prominent display */}
                                <div className="text-xl font-black text-center">
                                  {song.release_year}
                                </div>
                                
                                {/* Song title with text wrapping */}
                                <div className="text-xs italic text-center w-full leading-tight text-white/90 text-shadow-sm">
                                  {wrapText(song.deezer_title, 12).split('\n').map((line, i) => (
                                    <div key={i} className="mb-0.5">{line}</div>
                                  ))}
                                </div>
                                
                                {song.preview_url && (
                                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                                    {playingPreviewId === song.id ? (
                                      <Pause className="w-2.5 h-2.5 text-white" />
                                    ) : (
                                      <Play className="w-2.5 h-2.5 text-white ml-0.5" />
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
            
            {/* Enhanced Navigation hints */}
            <div className="flex justify-between items-center mt-3 text-white/70 text-xs bg-white/10 backdrop-blur-xl rounded-2xl px-3 py-2 border border-white/20">
              <div className="flex items-center">
                <MoveLeft className="w-4 h-4 mr-1" />
                <span>Scroll timeline</span>
              </div>
              <div className="flex items-center">
                <span>Center gap to select</span>
                <MoveRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Confirm Placement Button */}
      {isMyTurn && !gameEnded && (
        <div className="relative z-10 px-4 pb-4 flex-shrink-0">
          <Button
            onClick={handleConfirmPlacement}
            disabled={hasConfirmed || isSubmitting}
            className={cn(
              "w-full h-16 text-white font-black text-lg rounded-3xl border-0 shadow-2xl transition-all duration-300 relative overflow-hidden",
              hasConfirmed || isSubmitting ? 
              "bg-gradient-to-r from-gray-600 to-gray-700" :
              "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 hover:scale-105 hover:shadow-3xl active:scale-95"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>PLACING CARD...</span>
              </div>
            ) : hasConfirmed ? (
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5" />
                <span>CARD PLACED!</span>
              </div>
            ) : (
              'CONFIRM PLACEMENT'
            )}
          </Button>
        </div>
      )}

      {/* Enhanced Footer Branding */}
      <div className="relative z-10 pb-4 flex-shrink-0">
        <div className="text-center">
          <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100 tracking-wider drop-shadow-2xl">
            TIMELINER
          </div>
          <div className="text-white/50 text-xs mt-1 font-medium">
            Timeline Music Game
          </div>
        </div>
      </div>

      {/* Enhanced scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .border-3 {
          border-width: 3px;
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.5);
        }
        .text-shadow-sm {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
