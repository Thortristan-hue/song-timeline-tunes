
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Music, Star, Calendar } from 'lucide-react';
import { Player, Song } from '@/types/game';

interface HostCurrentPlayerTimelineProps {
  currentTurnPlayer: Player;
  previousTurnPlayer?: Player;
  cardPlacementResult?: { correct: boolean; song: Song } | null;
  highlightedGapIndex?: number | null;
  isTransitioning?: boolean;
}

export function HostCurrentPlayerTimeline({ 
  currentTurnPlayer, 
  previousTurnPlayer,
  cardPlacementResult, 
  highlightedGapIndex,
  isTransitioning = false
}: HostCurrentPlayerTimelineProps) {
  const [feedbackAnimation, setFeedbackAnimation] = useState<string>('');
  const [timelineState, setTimelineState] = useState<'entering' | 'stable' | 'exiting'>('stable');
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

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
    <div className="absolute bottom-6 left-6 right-6 z-20">
      <div className={`bg-white/12 backdrop-blur-2xl rounded-3xl p-4 shadow-xl border border-white/10 transition-all duration-500 ${feedbackAnimation} ${
        timelineState === 'exiting' ? 'animate-timeline-pack-away' :
        timelineState === 'entering' ? 'animate-timeline-scatter-in' :
        'opacity-100 transform-none'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-4 h-4 rounded-full shadow-sm"
            style={{ backgroundColor: currentTurnPlayer.color }}
          />
          <h3 className="text-white text-xl font-semibold">
            {currentTurnPlayer.name}'s Timeline
          </h3>
          <Star className="h-5 w-5 text-yellow-400" />
          <div className="text-white/60 text-sm">
            {currentTurnPlayer.timeline.length}/10 cards
          </div>
        </div>
        
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
                className={`w-2 h-24 flex items-center justify-center transition-all duration-300 rounded-xl ${
                  highlightedGapIndex === 0 ? 'bg-green-400/30 border-2 border-green-400/60 animate-pulse' : ''
                }`}
              />
              
              {currentTurnPlayer.timeline.map((song, index) => (
                <React.Fragment key={`${song.deezer_title}-${index}`}>
                  {/* Song card with enhanced animations */}
                  <div
                    className={`min-w-32 h-24 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg border border-white/20 transform transition-all duration-500 hover:scale-105 relative bg-white/10 backdrop-blur-xl ${
                      cardPlacementResult && cardPlacementResult.correct && index === currentTurnPlayer.timeline.length - 1 ? 'animate-card-place-correct' : ''
                    } ${
                      !visibleCards.includes(index) ? 'opacity-0 scale-50 translate-y-8' : 'opacity-100 scale-100 translate-y-0'
                    } ${
                      timelineState === 'exiting' ? 'animate-cards-pack-up' : ''
                    }`}
                    style={{
                      animationDelay: timelineState === 'entering' ? `${index * 0.1}s` : 
                                     timelineState === 'exiting' ? `${(currentTurnPlayer.timeline.length - index) * 0.05}s` : 
                                     '0s',
                      transitionDelay: timelineState === 'entering' ? `${index * 0.1}s` : '0s'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
                    <Calendar className="h-4 w-4 mb-1 opacity-70 relative z-10" />
                    <div className="text-center relative z-10 space-y-0.5">
                      <div className="text-lg font-bold">
                        {song.release_year}
                      </div>
                      <div className="text-xs px-2 opacity-80 leading-tight max-w-28">
                        {song.deezer_title.length > 14 ? song.deezer_title.substring(0, 14) + '...' : song.deezer_title}
                      </div>
                      <div className="text-xs px-2 opacity-60 leading-tight max-w-28">
                        {song.deezer_artist.length > 10 ? song.deezer_artist.substring(0, 10) + '...' : song.deezer_artist}
                      </div>
                    </div>
                  </div>
                  
                  {/* Gap after this card */}
                  <div 
                    className={`w-2 h-24 flex items-center justify-center transition-all duration-300 rounded-xl ${
                      highlightedGapIndex === index + 1 ? 'bg-green-400/30 border-2 border-green-400/60 animate-pulse' : ''
                    }`}
                  />
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Enhanced CSS animations for turn transitions */}
      <style jsx>{`
        @keyframes timeline-pack-away {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translateY(-20px) scale(0.95);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) scale(0.3);
          }
        }

        @keyframes timeline-scatter-in {
          0% {
            opacity: 0;
            transform: translateY(200px) scale(0.3);
          }
          50% {
            opacity: 0.7;
            transform: translateY(20px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes cards-pack-up {
          0% {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translateX(-10px) translateY(-10px) scale(0.9);
          }
          100% {
            opacity: 0;
            transform: translateX(-50px) translateY(-100px) scale(0.5);
          }
        }

        @keyframes card-place-correct {
          0% {
            transform: translateY(-50px) scale(0.8);
            opacity: 0;
          }
          25% {
            transform: translateY(10px) scale(1.1);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-5px) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .animate-timeline-pack-away {
          animation: timeline-pack-away 1s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
        }

        .animate-timeline-scatter-in {
          animation: timeline-scatter-in 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .animate-cards-pack-up {
          animation: cards-pack-up 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
        }

        .animate-card-place-correct {
          animation: card-place-correct 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
}
