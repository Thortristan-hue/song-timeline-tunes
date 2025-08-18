import React, { useEffect, useState } from 'react';
import { Song } from '@/types/game';
import { CheckCircle, XCircle } from 'lucide-react';

interface KahootStyleFeedbackProps {
  correct: boolean;
  song: Song | null;
  onComplete?: () => void;
  duration?: number; // in milliseconds
}

export function KahootStyleFeedback({ 
  correct, 
  song, 
  onComplete, 
  duration = 3000 
}: KahootStyleFeedbackProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500); // Allow for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 animate-in fade-in ${
        correct 
          ? 'bg-green-500' 
          : 'bg-red-500'
      }`}
    >
      <div className="text-center text-white animate-in zoom-in-50 duration-700">
        {/* Icon */}
        <div className="mb-8">
          {correct ? (
            <CheckCircle className="h-32 w-32 mx-auto animate-bounce" />
          ) : (
            <XCircle className="h-32 w-32 mx-auto animate-pulse" />
          )}
        </div>

        {/* Correct/Incorrect Text */}
        <h1 className="text-8xl font-bold mb-8 animate-in slide-in-from-bottom-4 duration-500">
          {correct ? 'CORRECT!' : 'INCORRECT!'}
        </h1>

        {/* Song Information */}
        {song && (
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="text-4xl font-bold mb-2">
              {song.deezer_title}
            </div>
            <div className="text-2xl mb-4 opacity-90">
              by {song.deezer_artist}
            </div>
            <div className="text-xl opacity-80">
              Released in {song.release_year}
            </div>
            {song.deezer_album && (
              <div className="text-lg opacity-70 mt-2">
                from "{song.deezer_album}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}