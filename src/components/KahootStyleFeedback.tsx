import React, { useEffect, useState } from 'react';
import { Song } from '@/types/game';
import { CheckCircle, XCircle } from 'lucide-react';

interface KahootStyleFeedbackProps {
  correct: boolean;
  song: Song | null;
  onComplete?: () => void;
  duration?: number; // in milliseconds
  showSongInfo?: boolean;
}

export function KahootStyleFeedback({ 
  correct, 
  song, 
  onComplete, 
  duration = 3000,
  showSongInfo = true
}: KahootStyleFeedbackProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showSong, setShowSong] = useState(false);

  useEffect(() => {
    // Show song info after a brief delay
    const songTimer = setTimeout(() => {
      setShowSong(true);
    }, 800);

    // Hide the feedback after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500); // Allow for fade-out animation
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(songTimer);
    };
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-300 ${
        correct 
          ? 'bg-gradient-to-br from-green-400 via-green-500 to-green-600' 
          : 'bg-gradient-to-br from-red-400 via-red-500 to-red-600'
      }`}
      style={{
        backgroundImage: correct 
          ? 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)'
          : 'radial-gradient(circle at 30% 20%, rgba(0,0,0,0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.15) 0%, transparent 50%)'
      }}
    >
      {/* Main feedback content */}
      <div className="text-center text-white animate-in zoom-in-50 duration-700">
        {/* Icon */}
        <div className="mb-6 md:mb-8">
          {correct ? (
            <CheckCircle className="h-24 w-24 md:h-32 md:w-32 mx-auto animate-bounce drop-shadow-2xl" />
          ) : (
            <XCircle className="h-24 w-24 md:h-32 md:w-32 mx-auto animate-pulse drop-shadow-2xl" />
          )}
        </div>

        {/* Correct/Incorrect Text */}
        <h1 className="text-4xl md:text-8xl font-black mb-6 md:mb-8 animate-in slide-in-from-bottom-4 duration-500 drop-shadow-2xl tracking-wider">
          {correct ? 'CORRECT!' : 'INCORRECT!'}
        </h1>
      </div>

      {/* Song Information - Positioned at bottom and animated in */}
      {song && showSongInfo && showSong && (
        <div className="absolute bottom-8 left-8 right-8 md:bottom-16 md:left-16 md:right-16 animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-black/30 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
            <div className="text-center text-white">
              <div className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 leading-tight">
                "{song.deezer_title}"
              </div>
              <div className="text-lg md:text-2xl mb-2 md:mb-3 opacity-90 font-medium">
                by {song.deezer_artist}
              </div>
              <div className="text-base md:text-xl opacity-80">
                Released in {song.release_year}
              </div>
              {song.deezer_album && (
                <div className="text-sm md:text-lg opacity-70 mt-1 md:mt-2 italic">
                  from "{song.deezer_album}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 left-10 w-32 h-32 rounded-full opacity-20 animate-ping ${correct ? 'bg-green-200' : 'bg-red-200'}`} style={{ animationDelay: '0.5s' }}></div>
        <div className={`absolute top-1/3 right-16 w-24 h-24 rounded-full opacity-15 animate-ping ${correct ? 'bg-green-300' : 'bg-red-300'}`} style={{ animationDelay: '1s' }}></div>
        <div className={`absolute bottom-1/4 left-1/4 w-20 h-20 rounded-full opacity-10 animate-ping ${correct ? 'bg-green-100' : 'bg-red-100'}`} style={{ animationDelay: '1.5s' }}></div>
      </div>
    </div>
  );
}