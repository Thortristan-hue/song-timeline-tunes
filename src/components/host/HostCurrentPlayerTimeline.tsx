
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
                {/* Song card with enhanced animations - now square and consistent */}
                <div
                  className={`min-w-36 h-36 rounded-2xl flex flex-col items-center justify-between text-white shadow-lg border border-white/20 transform transition-all duration-500 hover:scale-105 relative p-4 ${
                    cardPlacementResult && cardPlacementResult.correct && index === currentTurnPlayer.timeline.length - 1 ? 'animate-epic-card-drop' : ''
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
                  
                  <div className="text-center relative z-10 space-y-0.5 w-full">
                    {/* Artist name - medium, white, wrapped, max 20 letters per line */}
                    <div className="text-sm font-medium text-white">
                      {truncateText(song.deezer_artist, 20)}
                    </div>
                    
                    {/* Song release year - large, white */}
                    <div className="text-4xl font-black text-white my-auto">
                      {song.release_year}
                    </div>
                    
                    {/* Song title - small, italic, white, wrapped, max 20 letters per line */}
                    <div className="text-xs italic text-white opacity-90">
                      {truncateText(song.deezer_title, 20)}
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

      {/* Enhanced CSS animations for turn transitions */}
      <style jsx>{`
        @keyframes epic-card-drop {
          0% {
            transform: scale(0.5) translateY(-120px) rotateZ(-20deg) rotateX(90deg);
            opacity: 0;
            filter: blur(8px);
          }
          25% {
            transform: scale(1.4) translateY(20px) rotateZ(8deg) rotateX(15deg);
            opacity: 0.7;
            filter: blur(3px);
            box-shadow: 0 0 0 25px rgba(255,255,255,0.2), 0 20px 60px rgba(0,0,0,0.7);
          }
          50% {
            transform: scale(0.9) translateY(-12px) rotateZ(-3deg) rotateX(-8deg);
            opacity: 1;
            filter: blur(0px);
            box-shadow: 0 0 0 40px rgba(255,255,255,0.15), 0 25px 70px rgba(0,0,0,0.6);
          }
          75% {
            transform: scale(1.08) translateY(5px) rotateZ(2deg) rotateX(3deg);
            box-shadow: 0 0 0 20px rgba(255,255,255,0.08), 0 15px 45px rgba(0,0,0,0.5);
          }
          100% {
            transform: scale(1) translateY(0) rotateZ(0deg) rotateX(0deg);
            opacity: 1;
            filter: blur(0px);
            box-shadow: 0 0 0 0 rgba(255,255,255,0), 0 12px 35px rgba(0,0,0,0.5);
          }
        }

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

        .animate-timeline-pack-away {
          animation: timeline-pack-away 1s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
        }

        .animate-timeline-scatter-in {
          animation: timeline-scatter-in 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .animate-cards-pack-up {
          animation: cards-pack-up 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
        }

        .animate-epic-card-drop {
          animation: epic-card-drop 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
}
