
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Music, Star, Calendar } from 'lucide-react';
import { Player } from '@/types/game';

interface HostCurrentPlayerTimelineProps {
  currentTurnPlayer: Player;
  cardPlacementResult?: { correct: boolean; song: any } | null;
  highlightedGapIndex?: number | null;
}

export function HostCurrentPlayerTimeline({ currentTurnPlayer, cardPlacementResult, highlightedGapIndex }: HostCurrentPlayerTimelineProps) {
  const [feedbackAnimation, setFeedbackAnimation] = useState<string>('');

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
      <div className={`bg-white/12 backdrop-blur-2xl rounded-3xl p-4 shadow-xl border border-white/10 transition-all duration-300 ${feedbackAnimation}`}>
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
            {currentTurnPlayer.score}/10 points
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
                  highlightedGapIndex === 0 ? 'bg-green-400/30 border-2 border-green-400/60' : ''
                }`}
              />
              
              {currentTurnPlayer.timeline.map((song, index) => (
                <React.Fragment key={`${song.deezer_title}-${index}`}>
                  {/* Song card - reduced height to match mobile */}
                  <div
                    className={`min-w-32 h-24 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg border border-white/20 transform transition-all hover:scale-105 relative bg-white/10 backdrop-blur-xl ${
                      cardPlacementResult && cardPlacementResult.correct ? 'animate-cards-make-room' : ''
                    }`}
                    style={{
                      animationDelay: `${index * 0.1}s`
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
                      highlightedGapIndex === index + 1 ? 'bg-green-400/30 border-2 border-green-400/60' : ''
                    }`}
                  />
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
