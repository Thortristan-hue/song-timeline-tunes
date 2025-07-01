
import React, { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Music, Check, X, Sparkles, Calendar, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Song, Player } from "@/types/game";
import { DeezerAudioService } from "@/services/DeezerAudioService";

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
  // FIX 5: Single audio ref to prevent spam and overlapping audio
  const currentlyPlayingAudioRef = useRef<HTMLAudioElement | null>(null);

  // FIX 5: Improved timeline song playback with spam prevention
  const playTimelineSong = async (song: Song) => {
    // FIX 4: Prevent interactions if game has ended
    if (gameEnded) {
      console.log('🚫 Game ended - no timeline audio allowed');
      return;
    }

    console.log('🎵 Playing timeline song:', song.deezer_title);
    
    // FIX 5: Stop any currently playing audio before starting new one
    if (currentlyPlayingAudioRef.current && !currentlyPlayingAudioRef.current.paused) {
      console.log('🔇 Stopping currently playing timeline audio');
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
        console.log('🔍 Fetching preview URL just-in-time for timeline song');
        previewUrl = await DeezerAudioService.getPreviewUrl(song.id);
      } catch (error) {
        console.error('❌ Failed to fetch preview URL for timeline song:', error);
        return;
      }
    }
    
    if (!previewUrl) {
      console.log('❌ No preview URL available for this song');
      return;
    }
    
    // FIX 5: Create and manage single audio element
    const audio = new Audio(previewUrl);
    audio.volume = 0.5;
    audio.crossOrigin = 'anonymous';
    currentlyPlayingAudioRef.current = audio;
    
    try {
      await audio.play();
      console.log(`✅ Playing timeline song: ${song.deezer_title}`);
      
      // Stop after 30 seconds
      setTimeout(() => {
        if (currentlyPlayingAudioRef.current === audio) {
          audio.pause();
          audio.currentTime = 0;
          currentlyPlayingAudioRef.current = null;
        }
      }, 30000);
    } catch (error) {
      console.error('❌ Failed to play timeline song:', error);
      if (currentlyPlayingAudioRef.current === audio) {
        currentlyPlayingAudioRef.current = null;
      }
    }
  };

  const handleConfirmClick = async () => {
    if (!placementPending || !onConfirmPlacement || gameEnded) return;
    
    try {
      console.log('🎯 Confirming placement');
      const result = await onConfirmPlacement(placementPending.song, placementPending.position);
      console.log('🎯 Placement confirmed, result:', result);
    } catch (error) {
      console.error('Failed to confirm placement:', error);
    }
  };

  const handleTryAgainClick = () => {
    if (!onCancelPlacement || gameEnded) return;
    console.log('🔄 Player choosing to try again with placement');
    onCancelPlacement();
  };

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
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl" />
        
        {/* Play button overlay - hide when game ended */}
        {!gameEnded && (
          <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Play className="h-8 w-8 text-white" />
          </div>
        )}
        
        <Music className="h-8 w-8 mb-3 opacity-70" />
        <div className="text-center relative z-10 space-y-1">
          <div className="font-semibold text-sm leading-tight tracking-tight">
            {song.deezer_title.length > 14 ? song.deezer_title.substring(0, 14) + '...' : song.deezer_title}
          </div>
          <div className="text-xs opacity-60 font-medium">
            {song.deezer_artist.length > 12 ? song.deezer_artist.substring(0, 12) + '...' : song.deezer_artist}
          </div>
          <div className="text-xl font-bold mt-2 bg-white/10 rounded-full px-2 py-1">
            {song.release_year}
          </div>
        </div>
      </div>
    );
  };

  const renderDropZone = (position: number) => {
    const isHovered = hoveredPosition === position;
    const isPending = placementPending?.position === position;
    
    return (
      <div
        key={`drop-zone-${position}`}
        className={cn(
          "w-20 h-36 rounded-3xl transition-all duration-300 mx-3 flex items-center justify-center",
          "touch-manipulation cursor-pointer backdrop-blur-xl border",
          gameEnded ? "opacity-50 pointer-events-none" :
          isPending
            ? 'bg-blue-500/30 border-blue-400/50 shadow-lg shadow-blue-400/25 scale-110'
            : isHovered 
            ? 'bg-white/15 border-white/20 shadow-lg scale-105' 
            : 'bg-white/5 border-white/10 hover:bg-white/10'
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
            Drop<br />here
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
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-25 w-full max-w-7xl px-6"
      style={{
        transform: `translateX(-50%)`,
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: transitioningTurn ? 0.6 : 1
      }}
    >
      {/* FIX 3: Confirmation dialog without song information leakage */}
      {placementPending && !gameEnded && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-600/50 max-w-md w-full mx-4 transform scale-100 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Music className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Confirm Placement</h2>
              {/* FIX 3: Generic confirmation without song details */}
              <p className="text-slate-300 mb-4">Are you sure you want to place the card in this position?</p>
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmClick();
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg hover:shadow-green-500/25 transition-all duration-200 transform hover:scale-105"
                size="lg"
              >
                <Check className="h-5 w-5 mr-2" />
                Confirm
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTryAgainClick();
                }}
                variant="outline"
                className="flex-1 border-2 border-slate-500 text-white hover:bg-slate-700/50 font-bold py-4 px-6 rounded-xl text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                size="lg"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 p-8 bg-black/20 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl overflow-x-auto">
        {player.timeline.map((song, index) => (
          <React.Fragment key={`${song.deezer_title}-${index}`}>
            {renderDropZone(index)}
            {renderCard(song, index)}
          </React.Fragment>
        ))}
        
        {renderDropZone(player.timeline.length)}
        
        {player.timeline.length === 0 && (
          <div className="text-center py-12 px-20 flex-1">
            <Music className="h-16 w-16 text-white/30 mx-auto mb-6" />
            <p className="text-white/70 text-lg font-medium mb-2">
              {gameEnded ? "Game Over" : isCurrent ? "Your timeline starts here" : "Building timeline..."}
            </p>
            {isCurrent && !gameEnded && (
              <p className="text-white/50 text-sm font-normal">
                Drag the mystery card to create your chronological timeline
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
