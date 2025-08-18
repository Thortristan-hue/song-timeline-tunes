
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Music, Star, Calendar } from 'lucide-react';
import { Player, Song } from '@/types/game';
import { getArtistColor, truncateText } from '@/lib/utils';

interface HostCurrentPlayerTimelineProps {
  currentTurnPlayer: Player;
  previousTurnPlayer?: Player;
  cardPlacementResult?: { correct: boolean; song: Song } | null;
  highlightedGapIndex?: number | null;
  mobileViewport?: { startIndex: number; endIndex: number; totalCards: number } | null;
  isTransitioning?: boolean;
}

export function HostCurrentPlayerTimeline({ 
  currentTurnPlayer, 
  previousTurnPlayer,
  cardPlacementResult, 
  highlightedGapIndex,
  mobileViewport,
  isTransitioning = false
}: HostCurrentPlayerTimelineProps) {
  const [feedbackAnimation, setFeedbackAnimation] = useState<string>('');
  const [timelineState, setTimelineState] = useState<'entering' | 'stable' | 'exiting'>('stable');
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [newlyPlacedCardIndex, setNewlyPlacedCardIndex] = useState<number | null>(null);
  const [cardsShifting, setCardsShifting] = useState<boolean>(false);

  // Handle turn transitions with enhanced animations
  useEffect(() => {
    if (isTransitioning) {
      // Start exit animation for previous player
      setTimelineState('exiting');
      
      // After exit completes, switch to new player and enter
      setTimeout(() => {
        setTimelineState('entering');
        
        // Animate cards appearing one by one
        const cardIndices = currentTurnPlayer.timeline.map((_, index) => index);
        setVisibleCards([]);
        
        cardIndices.forEach((index, i) => {
          setTimeout(() => {
            setVisibleCards(prev => [...prev, index]);
          }, i * 150);
        });
        
        setTimeout(() => {
          setTimelineState('stable');
        }, cardIndices.length * 150 + 500);
      }, 1000);
    } else {
      // Normal stable state
      setTimelineState('stable');
      setVisibleCards(currentTurnPlayer.timeline.map((_, index) => index));
    }
  }, [isTransitioning, currentTurnPlayer]);

  // Handle new card placement animation
  useEffect(() => {
    if (cardPlacementResult && cardPlacementResult.correct) {
      const newCardIndex = currentTurnPlayer.timeline.length - 1;
      setNewlyPlacedCardIndex(newCardIndex);
      setCardsShifting(true);
      
      // First animate existing cards making room
      setTimeout(() => {
        // Then animate the new card sliding in
        setTimeout(() => {
          setCardsShifting(false);
          setNewlyPlacedCardIndex(null);
        }, 800);
      }, 300);
    }
  }, [cardPlacementResult, currentTurnPlayer.timeline.length]);

  // Trigger feedback animation when placement result changes
  useEffect(() => {
    if (cardPlacementResult) {
      const animationClass = cardPlacementResult.correct 
        ? 'animate-host-feedback-correct' 
        : 'animate-host-feedback-incorrect';
      
      setFeedbackAnimation(animationClass);
      
      // Clear animation after it completes
      setTimeout(() => {
        setFeedbackAnimation('');
      }, 1000);
    }
  }, [cardPlacementResult]);

  return (
    <div className="flex justify-center items-center w-full z-20">
      <div className="flex gap-2 items-center overflow-x-auto pb-2">
        {currentTurnPlayer.timeline.length === 0 ? (
          <div className="text-white/60 text-lg italic py-8 text-center w-full flex items-center justify-center gap-3">
            <Music className="h-8 w-8 opacity-50" />
            <span>Waiting for {currentTurnPlayer.name} to place their first card...</span>
          </div>
        ) : (
          <>
            {/* Gap before first card */}
            <div 
              className={`w-2 h-36 flex items-center justify-center transition-all duration-300 rounded-xl ${
                highlightedGapIndex === 0 ? 'bg-green-400/30 border-2 border-green-400/60 animate-pulse' : ''
              }`}
            />
            
            {currentTurnPlayer.timeline.map((song, index) => (
              <React.Fragment key={`${song.deezer_title}-${index}`}>
                {/* Song card with enhanced animations */}
                <div
                  className={`min-w-36 h-36 rounded-2xl flex flex-col items-center justify-between text-white shadow-lg border border-white/20 transform transition-all duration-500 hover:scale-105 relative p-4 ${
                    newlyPlacedCardIndex === index ? 'animate-card-slide-in' : ''
                  } ${
                    cardsShifting && index < (newlyPlacedCardIndex || 0) ? 'animate-card-shift-left' : ''
                  } ${
                    cardsShifting && index > (newlyPlacedCardIndex || 0) ? 'animate-card-shift-right' : ''
                  } ${
                    !visibleCards.includes(index) ? 'opacity-0 scale-50 translate-y-8' : 'opacity-100 scale-100 translate-y-0'
                  } ${
                    timelineState === 'exiting' ? 'animate-cards-pack-up' : ''
                  } ${
                    mobileViewport && index >= mobileViewport.startIndex && index <= mobileViewport.endIndex ? 'ring-2 ring-blue-400/60 shadow-blue-400/30' : ''
                  }`}
                  style={{
                    backgroundColor: getArtistColor(song.deezer_artist).backgroundColor,
                    backgroundImage: getArtistColor(song.deezer_artist).backgroundImage,
                    animationDelay: timelineState === 'entering' ? `${index * 0.1}s` : 
                                   timelineState === 'exiting' ? `${(currentTurnPlayer.timeline.length - index) * 0.05}s` : 
                                   '0s',
                    transitionDelay: timelineState === 'entering' ? `${index * 0.1}s` : '0s'
                  }}
                >
                  {/* Mobile viewport indicator badge */}
                  {mobileViewport && index >= mobileViewport.startIndex && index <= mobileViewport.endIndex && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse border border-blue-300">
                      👀
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
                  
                  <div className="text-center relative z-10 space-y-1 w-full flex flex-col justify-between h-full py-2">
                    {/* Artist name - medium, white, wrapped, max 20 letters per line */}
                    <div className="text-sm font-medium text-white leading-tight overflow-hidden">
                      <div className="break-words">
                        {truncateText(song.deezer_artist, 20)}
                      </div>
                    </div>
                    
                    {/* Song release year - large, white */}
                    <div className="text-4xl font-black text-white flex-1 flex items-center justify-center">
                      {song.release_year}
                    </div>
                    
                    {/* Song title - small, italic, white, wrapped, max 20 letters per line */}
                    <div className="text-xs italic text-white opacity-90 leading-tight overflow-hidden">
                      <div className="break-words">
                        {truncateText(song.deezer_title, 20)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Gap after this card */}
                <div 
                  className={`w-2 h-36 flex items-center justify-center transition-all duration-300 rounded-xl ${
                    highlightedGapIndex === index + 1 ? 'bg-green-400/30 border-2 border-green-400/60 animate-pulse' : ''
                  }`}
                />
              </React.Fragment>
            ))}
          </>
        )}
      </div>

      {/* Mobile Viewport Indicator */}
      {mobileViewport && (
        <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-500/20 backdrop-blur-md rounded-xl px-4 py-2 border border-blue-400/30">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Mobile viewing: Cards {mobileViewport.startIndex + 1}-{mobileViewport.endIndex + 1} of {mobileViewport.totalCards}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
