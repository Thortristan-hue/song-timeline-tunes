import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock types based on the original component
interface Song {
  deezer_title: string;
  release_year: number;
}

interface Player {
  name: string;
  score: number;
  timeline: (Song | null)[];
}

interface MobilePlayerGameViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  gameEnded?: boolean;
}

export default function MobilePlayerGameView({
  currentPlayer = { name: "Player 1", score: 3, timeline: [null, { deezer_title: "Hey Jude", release_year: 1968 }, null, { deezer_title: "Billie Jean", release_year: 1983 }, null, { deezer_title: "Smells Like Teen Spirit", release_year: 1991 }, null, { deezer_title: "Crazy", release_year: 2006 }, null] },
  currentTurnPlayer = { name: "Player 1", score: 3, timeline: [] },
  currentSong = { deezer_title: "Wonderwall", release_year: 1995 },
  roomCode = "ABC123",
  isMyTurn = true,
  isPlaying = false,
  onPlayPause = () => {},
  onPlaceCard = async (song, position) => ({ success: true }),
  mysteryCardRevealed = false,
  cardPlacementResult = null,
  gameEnded = false
}: MobilePlayerGameViewProps) {
  const [snappedPosition, setSnappedPosition] = useState<number | null>(null);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track audio playback
  useEffect(() => {
    if (isPlaying) {
      setHasPlayedAudio(true);
    }
  }, [isPlaying]);

  // Handle vinyl record play/pause
  const handleVinylPress = () => {
    if (!isMyTurn || !currentSong || gameEnded) return;
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    onPlayPause();
  };

  // Handle scroll snapping to gaps between cards
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = 100; // Width of each card + gap
    const gapWidth = 20; // Width of the gap between cards
    
    // Calculate which gap we're closest to
    const totalWidth = cardWidth + gapWidth;
    const position = Math.round(scrollLeft / totalWidth);
    
    setSnappedPosition(position);
  };

  // Auto-snap on scroll end
  useEffect(() => {
    if (!scrollRef.current) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const handleScrollEnd = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!scrollRef.current || !isMyTurn || gameEnded) return;
        
        const scrollLeft = scrollRef.current.scrollLeft;
        const cardWidth = 100;
        const gapWidth = 20;
        const totalWidth = cardWidth + gapWidth;
        
        // Calculate nearest gap position
        const nearestPosition = Math.round(scrollLeft / totalWidth);
        const targetScrollLeft = nearestPosition * totalWidth;
        
        // Snap to the gap
        scrollRef.current.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
        
        setSnappedPosition(nearestPosition);
        
        // Haptic feedback for snapping
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      }, 100);
    };
    
    const scrollElement = scrollRef.current;
    scrollElement.addEventListener('scroll', handleScrollEnd);
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScrollEnd);
      clearTimeout(timeoutId);
    };
  }, [isMyTurn, gameEnded]);

  // Handle confirmation
  const handleConfirm = async () => {
    if (!currentSong || snappedPosition === null || !isMyTurn || isConfirming || gameEnded || hasConfirmed) return;
    
    setIsConfirming(true);
    setHasConfirmed(true);
    
    // Strong haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    try {
      await onPlaceCard(currentSong, snappedPosition);
    } finally {
      setTimeout(() => {
        setIsConfirming(false);
        setSnappedPosition(null);
        setHasPlayedAudio(false);
        setHasConfirmed(false);
      }, 2000);
    }
  };

  // Get placed songs for timeline display
  const getPlacedSongs = () => {
    const songs: (Song | null)[] = [];
    for (let i = 0; i < 10; i++) {
      songs.push(currentPlayer.timeline[i] || null);
    }
    return songs;
  };

  // Render timeline cards and gaps
  const renderTimelineContent = () => {
    const placedSongs = getPlacedSongs();
    const content = [];
    
    // Add initial gap (position 0)
    content.push(
      <div key="gap-0" className="flex-shrink-0 w-5 flex items-center justify-center">
        <div className={cn(
          "w-1 h-16 rounded-full transition-all duration-300",
          snappedPosition === 0 
            ? "bg-yellow-400 shadow-lg shadow-yellow-400/50" 
            : "bg-white/20"
        )}>
        </div>
      </div>
    );
    
    // Add cards and gaps
    placedSongs.forEach((song, index) => {
      // Add card
      if (song) {
        content.push(
          <div key={`card-${index}`} className="flex-shrink-0 w-20 h-20">
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex flex-col items-center justify-center text-white font-bold text-sm shadow-lg border border-white/20">
              <Music className="h-4 w-4 mb-1" />
              <div className="text-xs text-center leading-tight">
                {song.release_year}
              </div>
            </div>
          </div>
        );
      } else {
        content.push(
          <div key={`empty-${index}`} className="flex-shrink-0 w-20 h-20">
            <div className="w-full h-full bg-white/5 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/20">
              <div className="text-white/30 text-2xl">?</div>
            </div>
          </div>
        );
      }
      
      // Add gap after card (except for last card)
      if (index < placedSongs.length - 1) {
        content.push(
          <div key={`gap-${index + 1}`} className="flex-shrink-0 w-5 flex items-center justify-center">
            <div className={cn(
              "w-1 h-16 rounded-full transition-all duration-300",
              snappedPosition === index + 1 
                ? "bg-yellow-400 shadow-lg shadow-yellow-400/50" 
                : "bg-white/20"
            )}>
            </div>
          </div>
        );
      }
    });
    
    return content;
  };

  if (gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🏆</div>
          <div className="text-2xl font-bold mb-2">Game Complete!</div>
          <div className="text-white/60">Thanks for playing Timeline Tunes!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex flex-col">
      {/* 1. Player Header */}
      <div className="pt-8 pb-6 text-center">
        <div className="text-white text-2xl font-bold tracking-wider">
          {currentPlayer.name.toUpperCase()}
        </div>
        <div className="text-white/60 text-sm mt-2">
          Room {roomCode} • {currentPlayer.score}/10 cards
        </div>
        <div className="text-white/40 text-xs mt-1">
          {isMyTurn ? "YOUR TURN" : `${currentTurnPlayer.name}'s Turn`}
        </div>
      </div>

      {/* 2. Mystery Song Preview Button */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="text-center">
          <button
            onClick={handleVinylPress}
            disabled={!isMyTurn || !currentSong || gameEnded}
            className={cn(
              "w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 relative",
              "bg-gradient-to-br from-red-800 via-red-700 to-red-900 border-4 border-red-600/50 shadow-2xl",
              isMyTurn && currentSong && !gameEnded
                ? "hover:scale-105 active:scale-95 shadow-red-500/30"
                : "opacity-50",
              isPlaying && "animate-spin"
            )}
            style={{ 
              touchAction: 'manipulation',
              minWidth: '144px',
              minHeight: '144px'
            }}
            aria-label={isPlaying ? 'Pause mystery song' : 'Play mystery song'}
          >
            {/* Vinyl record rings */}
            <div className="absolute inset-6 rounded-full border-2 border-red-500/40"></div>
            <div className="absolute inset-10 rounded-full border border-red-400/30"></div>
            <div className="absolute inset-14 rounded-full bg-red-950/60"></div>
            
            {/* Center hole */}
            <div className="absolute inset-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-red-950 rounded-full"></div>
            
            {/* Play/Pause icon */}
            <div className="relative z-10">
              {isPlaying ? (
                <Pause className="h-10 w-10 text-white" />
              ) : (
                <Play className="h-10 w-10 text-white ml-1" />
              )}
            </div>
          </button>
          
          {/* Audio status indicator */}
          <div className="mt-6">
            <div className={cn(
              "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-2",
              hasPlayedAudio 
                ? "bg-green-500/20 border-green-400 text-green-200" 
                : "bg-white/10 border-white/30 text-white/60"
            )}>
              {hasPlayedAudio ? '✅ Preview played' : '🎵 Tap to preview'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Timeline Placement Interface */}
      <div className="px-6 pb-4">
        <div className="mb-6">
          <h3 className="text-white text-lg font-bold text-center mb-2">
            Choose Timeline Position
          </h3>
          <p className="text-white/60 text-sm text-center">
            Scroll to place the mystery song between existing songs
          </p>
          {snappedPosition !== null && (
            <p className="text-yellow-400 text-sm text-center mt-2 font-medium">
              Position {snappedPosition + 1} selected
            </p>
          )}
        </div>
        
        {/* Scrollable Timeline */}
        <div 
          ref={scrollRef}
          className="flex gap-0 overflow-x-auto pb-4"
          onScroll={handleScroll}
          style={{
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {renderTimelineContent()}
        </div>
        
        {/* Timeline ruler */}
        <div className="relative">
          <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          <div className="absolute left-0 right-0 top-0 flex justify-between text-white/30 text-xs mt-2">
            <span>Earlier</span>
            <span>Later</span>
          </div>
        </div>
      </div>

      {/* 4. Confirm Placement Button */}
      <div className="px-6 pb-6">
        <Button
          onClick={handleConfirm}
          disabled={!isMyTurn || snappedPosition === null || !currentSong || isConfirming || gameEnded || hasConfirmed}
          className={cn(
            "w-full h-16 text-xl font-bold rounded-2xl transition-all duration-300",
            "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
            "text-white shadow-lg active:scale-95 border-2 border-green-400/50",
            (!isMyTurn || snappedPosition === null || !currentSong || gameEnded || hasConfirmed) && "opacity-50"
          )}
          style={{ 
            touchAction: 'manipulation',
            minHeight: '64px'
          }}
        >
          {isConfirming ? 'CONFIRMING...' : 'CONFIRM'}
        </Button>
      </div>

      {/* 5. Footer Branding */}
      <div className="text-center pb-6">
        <div className="text-white/40 text-lg font-bold tracking-[0.3em]">
          TIMELINER
        </div>
      </div>

      {/* Results overlay */}
      {cardPlacementResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center border border-white/20 mx-6">
            <div className="text-6xl mb-4">
              {cardPlacementResult.correct ? '🎉' : '❌'}
            </div>
            <div className="text-white text-2xl font-bold mb-2">
              {cardPlacementResult.correct ? 'Correct!' : 'Not quite!'}
            </div>
            <div className="text-white/60">
              {cardPlacementResult.song.deezer_title} ({cardPlacementResult.song.release_year})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
